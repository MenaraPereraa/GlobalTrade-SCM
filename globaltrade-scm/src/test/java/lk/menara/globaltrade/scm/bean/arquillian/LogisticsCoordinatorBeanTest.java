package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.dto.ShipmentRequestDTO;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.enums.VendorStatus;
import lk.menara.globaltrade.scm.bean.coordinator.LogisticsCoordinatorBean;
import lk.menara.globaltrade.scm.bean.service.NotificationService;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit5.ArquillianExtension;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.asset.EmptyAsset;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@ExtendWith(ArquillianExtension.class)
@DisplayName("LogisticsCoordinatorBean Integration Tests")
public class LogisticsCoordinatorBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private LogisticsCoordinatorBean coordinatorBean;

    private Warehouse originWarehouse;
    private Warehouse destinationWarehouse;
    private Product product;
    private Vendor vendor;
    private User coordinatorUser;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-logistics-coordinator.jar")
                .addClasses(LogisticsCoordinatorBean.class, NotificationService.class)
                .addClasses(Shipment.class, SystemExceptionLog.class, CustomsDocument.class,
                        ReplenishmentRequest.class, RFQ.class, RfqResponse.class, PurchaseOrder.class,
                        Product.class, Category.class, Vendor.class, User.class, Role.class, Warehouse.class)
                .addClasses(ShipmentRequestDTO.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        originWarehouse = new Warehouse("Origin Hub", "LK", 3000, false);
        em.persist(originWarehouse);

        destinationWarehouse = new Warehouse("Destination Hub", "LK", 3000, true);
        em.persist(destinationWarehouse);

        product = new Product();
        product.setSku("SKU-LC-" + System.nanoTime());
        product.setName("Copper Wire");
        product.setUnitPrice(BigDecimal.valueOf(80.00));
        em.persist(product);

        User vendorUser = new User("lc_vendor_user", "hash", "lcvendor@globaltrade.com", UserStatus.ACTIVE);
        em.persist(vendorUser);
        vendor = new Vendor(vendorUser, "Copper Supplies Co", "copper@vendors.com", "General", "US", VendorStatus.APPROVED);
        em.persist(vendor);

        coordinatorUser = new User("coordinator_lc", "hash", "coordinatorlc@globaltrade.com", UserStatus.ACTIVE);
        em.persist(coordinatorUser);

        em.flush();
    }

    @Test
    @DisplayName("Should inject LogisticsCoordinatorBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(coordinatorBean);
    }

    private ReplenishmentRequest persistReplenishmentRequest(RequestStatus status) {
        ReplenishmentRequest request = new ReplenishmentRequest(originWarehouse, product, vendor, 25, status, false);
        em.persist(request);
        em.flush();
        return request;
    }

    @Test
    @DisplayName("Should start procurement RFQ from a replenishment request using default coordinator")
    void testStartProcurementRfqDefaultOverload() {
        ReplenishmentRequest request = persistReplenishmentRequest(RequestStatus.PENDING);

        coordinatorBean.startProcurementRfq(request.getRequestId(), 40);

        ReplenishmentRequest updated = em.find(ReplenishmentRequest.class, request.getRequestId());
        Assertions.assertEquals(RequestStatus.IN_PROGRESS, updated.getStatus());

        List<RFQ> rfqs = em.createQuery("SELECT r FROM RFQ r WHERE r.product.productId = :pid", RFQ.class)
                .setParameter("pid", product.getProductId())
                .getResultList();
        Assertions.assertFalse(rfqs.isEmpty());
        Assertions.assertEquals(40, rfqs.get(0).getRequestedQuantity());
        Assertions.assertEquals(RFQStatus.OPEN, rfqs.get(0).getStatus());
    }

    @Test
    @DisplayName("Should start procurement RFQ with an explicit coordinator user id")
    void testStartProcurementRfqWithCoordinator() {
        ReplenishmentRequest request = persistReplenishmentRequest(RequestStatus.PENDING);

        coordinatorBean.startProcurementRfq(request.getRequestId(), 15, coordinatorUser.getUserId().longValue());

        List<RFQ> rfqs = em.createQuery("SELECT r FROM RFQ r WHERE r.product.productId = :pid", RFQ.class)
                .setParameter("pid", product.getProductId())
                .getResultList();
        Assertions.assertTrue(rfqs.stream().anyMatch(r -> coordinatorUser.getUserId().equals(r.getCreatedBy().getUserId())));
    }

    @Test
    @DisplayName("Should reject starting procurement for an unknown replenishment request")
    void testStartProcurementRfqInvalidRequest() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> coordinatorBean.startProcurementRfq(999999, 10));
    }

    @Test
    @DisplayName("Should confirm a vendor quotation")
    void testConfirmVendorQuotation() {
        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(10);
        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(coordinatorUser);
        rfq.setTargetDeliveryDate(java.sql.Date.valueOf(LocalDate.now().plusDays(7)));
        em.persist(rfq);

        RfqResponse response = new RfqResponse();
        response.setRfq(rfq);
        response.setVendor(vendor);
        response.setOfferedUnitPrice(BigDecimal.valueOf(20.00));
        response.setEstimatedLeadTimeDays(5);
        response.setStatus("PENDING");
        em.persist(response);
        em.flush();

        coordinatorBean.confirmVendorQuotation(response.getResponseId());

        RfqResponse updated = em.find(RfqResponse.class, response.getResponseId());
        Assertions.assertEquals("CONFIRMED", updated.getStatus());
    }

    @Test
    @DisplayName("Should reject confirming an unknown vendor quotation")
    void testConfirmVendorQuotationInvalidId() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> coordinatorBean.confirmVendorQuotation(999999L));
    }

    @Test
    @DisplayName("Should mark a replenishment request as fulfilled on dispatch")
    void testDispatchReplenishmentRequest() {
        ReplenishmentRequest request = persistReplenishmentRequest(RequestStatus.IN_PROGRESS);

        coordinatorBean.dispatchReplenishmentRequest(request.getRequestId());

        ReplenishmentRequest updated = em.find(ReplenishmentRequest.class, request.getRequestId());
        Assertions.assertEquals(RequestStatus.FULFILLED, updated.getStatus());
    }

    @Test
    @DisplayName("Should update transport mode and confirm the RFQ")
    void testUpdateTransportModeAndStatus() {
        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(10);
        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(coordinatorUser);
        rfq.setTargetDeliveryDate(java.sql.Date.valueOf(LocalDate.now().plusDays(7)));
        em.persist(rfq);
        em.flush();

        coordinatorBean.updateTransportModeAndStatus(rfq.getRfqId(), "AIR_FREIGHT");

        RFQ updated = em.find(RFQ.class, rfq.getRfqId());
        Assertions.assertEquals("AIR_FREIGHT", updated.getTransportMode());
        Assertions.assertEquals(RFQStatus.CONFIRMED, updated.getStatus());
    }

    @Test
    @DisplayName("Should reject transport mode update for an unknown RFQ")
    void testUpdateTransportModeAndStatusInvalidRfq() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> coordinatorBean.updateTransportModeAndStatus(999999L, "SEA_FREIGHT"));
    }

    @Test
    @DisplayName("Should create a shipment falling back to warehouse names and default eta")
    void testCreateShipmentWithWarehouseFallback() {
        ShipmentRequestDTO dto = new ShipmentRequestDTO();
        dto.setOriginWarehouseId(originWarehouse.getWarehouseId());
        dto.setDestinationWarehouseId(destinationWarehouse.getWarehouseId());

        Shipment shipment = coordinatorBean.createShipment(dto);

        Assertions.assertNotNull(shipment.getShipmentId());
        Assertions.assertEquals("Unknown", shipment.getCarrierName());
        Assertions.assertEquals(originWarehouse.getName(), shipment.getOriginHub());
        Assertions.assertEquals(destinationWarehouse.getName(), shipment.getDestinationHub());
        Assertions.assertEquals(ShipmentStatus.IN_TRANSIT, shipment.getCurrentStatus());
        Assertions.assertEquals("STANDARD", shipment.getShipmentType());
        Assertions.assertNotNull(shipment.getEta());
    }

    @Test
    @DisplayName("Should create a shipment using explicit carrier, origin, destination, and eta")
    void testCreateShipmentWithExplicitFields() {
        ShipmentRequestDTO dto = new ShipmentRequestDTO();
        dto.setCarrierName("DHL Express");
        dto.setOrigin("Colombo Port");
        dto.setDestination("Singapore Port");
        dto.setShipmentType("EXPRESS");
        dto.setEta(LocalDate.now().plusDays(3).toString());

        Shipment shipment = coordinatorBean.createShipment(dto);

        Assertions.assertEquals("DHL Express", shipment.getCarrierName());
        Assertions.assertEquals("Colombo Port", shipment.getOriginHub());
        Assertions.assertEquals("Singapore Port", shipment.getDestinationHub());
        Assertions.assertEquals("EXPRESS", shipment.getShipmentType());
        Assertions.assertEquals(LocalDate.now().plusDays(3), shipment.getEta().toLocalDate());
    }

    @Test
    @DisplayName("Should fall back to a carrier-id label when no carrier name is given")
    void testCreateShipmentCarrierIdFallback() {
        ShipmentRequestDTO dto = new ShipmentRequestDTO();
        dto.setCarrierId(42);

        Shipment shipment = coordinatorBean.createShipment(dto);

        Assertions.assertEquals("Carrier #42", shipment.getCarrierName());
    }

    @Test
    @DisplayName("Should update shipment status and carrier")
    void testUpdateShipment() {
        ShipmentRequestDTO dto = new ShipmentRequestDTO();
        dto.setCarrierName("FedEx");
        Shipment shipment = coordinatorBean.createShipment(dto);

        coordinatorBean.updateShipment(shipment.getShipmentId(), "ARRIVED_AT_PORT", "UPS");

        Shipment updated = em.find(Shipment.class, shipment.getShipmentId());
        Assertions.assertEquals(ShipmentStatus.ARRIVED_AT_PORT, updated.getCurrentStatus());
        Assertions.assertEquals("UPS", updated.getCarrierName());
    }

    @Test
    @DisplayName("Should mark a shipment as delivered")
    void testDeliverShipment() {
        ShipmentRequestDTO dto = new ShipmentRequestDTO();
        dto.setCarrierName("FedEx");
        Shipment shipment = coordinatorBean.createShipment(dto);

        coordinatorBean.deliverShipment(shipment.getShipmentId());

        Shipment updated = em.find(Shipment.class, shipment.getShipmentId());
        Assertions.assertEquals(ShipmentStatus.DELIVERED, updated.getCurrentStatus());
    }

    @Test
    @DisplayName("Should report document status defaults when the RFQ does not exist")
    void testGetShipmentDocumentStatusByRfqUnknown() {
        Map<String, Object> status = coordinatorBean.getShipmentDocumentStatusByRfq(999999L);

        Assertions.assertEquals(false, status.get("isDispatched"));
        Assertions.assertEquals(false, status.get("hasInvoice"));
        Assertions.assertEquals("", status.get("invoicePath"));
    }

    @Test
    @DisplayName("Should list shipments, exceptions, customs status, and replenishment requests without error")
    void testReadOnlyListingMethods() {
        Assertions.assertNotNull(coordinatorBean.getAllShipments());
        Assertions.assertNotNull(coordinatorBean.getSystemExceptions());
        Assertions.assertNotNull(coordinatorBean.getCustomsStatus());
        Assertions.assertNotNull(coordinatorBean.getReplenishmentRequests());
    }
}
