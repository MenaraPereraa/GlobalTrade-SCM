package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.CustomsDocument;
import lk.menara.globaltrade.core.entity.PurchaseOrder;
import lk.menara.globaltrade.core.entity.RFQ;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.enums.CustomsDocumentStatus;
import lk.menara.globaltrade.core.enums.DeclarationType;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.warehouse.LogisticsBean;
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
import java.time.LocalDateTime;
import java.util.List;

@ExtendWith(ArquillianExtension.class)
@DisplayName("LogisticsBean Integration Tests")
public class LogisticsBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private LogisticsBean logisticsBean;

    private PurchaseOrder purchaseOrder;
    private Shipment shipment;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-logistics-bean.jar")
                .addClasses(LogisticsBean.class, Audit.class)
                .addClasses(Shipment.class, PurchaseOrder.class, CustomsDocument.class, RFQ.class, Product.class, User.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addPackage("lk.menara.globaltrade.core.services")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        purchaseOrder = new PurchaseOrder();
        purchaseOrder.setVendorId(1L);
        purchaseOrder.setDestinationWarehouseId(1L);
        purchaseOrder.setTotalAmount(BigDecimal.valueOf(5000.00));
        purchaseOrder.setStatus("ISSUED");
        purchaseOrder.setCreatedBy(1L);
        em.persist(purchaseOrder);
        em.flush();

        shipment = new Shipment();
        shipment.setOrderId(purchaseOrder.getPoId());
        shipment.setCarrierName("Ocean Freight Co");
        shipment.setTrackingNumber("TRK-0001");
        shipment.setCurrentStatus(ShipmentStatus.PENDING);
        shipment.setOriginHub("Colombo Port");
        shipment.setDestinationHub("Kandy Depot");
        shipment.setEta(LocalDateTime.now().plusDays(7));
        shipment.setShipmentType("SEA");
        em.persist(shipment);

        em.flush();
    }

    @Test
    @DisplayName("Should successfully inject LogisticsBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(logisticsBean, "LogisticsBean should be injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    @Test
    @DisplayName("Should retrieve all shipments")
    void testFindAllShipments() {
        List<Shipment> all = logisticsBean.findAllShipments();
        Assertions.assertFalse(all.isEmpty());
    }

    @Test
    @DisplayName("Should filter shipments by type")
    void testFindShipmentsByType() {
        List<Shipment> seaShipments = logisticsBean.findShipmentsByType("SEA");
        Assertions.assertTrue(seaShipments.stream().allMatch(s -> "SEA".equals(s.getShipmentType())));
    }

    @Test
    @DisplayName("Should filter shipments by status")
    void testFindShipmentsByStatus() {
        List<Shipment> pending = logisticsBean.findShipmentsByStatus(ShipmentStatus.PENDING);
        Assertions.assertTrue(pending.stream().allMatch(s -> s.getCurrentStatus() == ShipmentStatus.PENDING));
    }

    @Test
    @DisplayName("Should verify inbound shipment and mark it DELIVERED")
    void testVerifyInbound() {
        Shipment updated = logisticsBean.verifyInbound(shipment.getShipmentId().intValue(), "Received in good condition");

        Assertions.assertEquals(ShipmentStatus.DELIVERED, updated.getCurrentStatus());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException verifying an unknown shipment")
    void testVerifyInboundNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> logisticsBean.verifyInbound(999999, "notes"));
    }

    @Test
    @DisplayName("Should dispatch outbound shipment with carrier and tracking details")
    void testDispatchOutbound() {
        Shipment updated = logisticsBean.dispatchOutbound(shipment.getShipmentId().intValue(), "Global Carriers Ltd", "TRK-9999");

        Assertions.assertEquals("Global Carriers Ltd", updated.getCarrierName());
        Assertions.assertEquals("TRK-9999", updated.getTrackingNumber());
        Assertions.assertEquals(ShipmentStatus.IN_TRANSIT, updated.getCurrentStatus());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException dispatching an unknown shipment")
    void testDispatchOutboundNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> logisticsBean.dispatchOutbound(999999, "Carrier", "TRK-1"));
    }

    @Test
    @DisplayName("Should update shipment status directly")
    void testUpdateShipmentStatus() {
        Shipment updated = logisticsBean.updateShipmentStatus(shipment.getShipmentId().intValue(), ShipmentStatus.DELAYED, "Weather delay");

        Assertions.assertEquals(ShipmentStatus.DELAYED, updated.getCurrentStatus());
    }

    @Test
    @DisplayName("Should create a customs document for a shipment")
    void testCreateCustomsDocument() {
        CustomsDocument document = logisticsBean.createCustomsDocument(shipment.getShipmentId().intValue(), DeclarationType.IMPORT.name());

        Assertions.assertNotNull(document.getDocumentId());
        Assertions.assertEquals(DeclarationType.IMPORT, document.getDeclarationType());
        Assertions.assertEquals(CustomsDocumentStatus.PENDING, document.getStatus());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException creating a document for an unknown shipment")
    void testCreateCustomsDocumentShipmentNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> logisticsBean.createCustomsDocument(999999, DeclarationType.IMPORT.name()));
    }

    @Test
    @DisplayName("Should update customs document status and set clearance date")
    void testUpdateDocumentStatus() {
        CustomsDocument document = logisticsBean.createCustomsDocument(shipment.getShipmentId().intValue(), DeclarationType.EXPORT.name());

        CustomsDocument updated = logisticsBean.updateDocumentStatus(
                document.getDocumentId().intValue(), CustomsDocumentStatus.APPROVED.name(), "All checks passed");

        Assertions.assertEquals(CustomsDocumentStatus.APPROVED, updated.getStatus());
        Assertions.assertNotNull(updated.getClearanceDate());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException updating an unknown document")
    void testUpdateDocumentStatusNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> logisticsBean.updateDocumentStatus(999999, CustomsDocumentStatus.APPROVED.name(), "notes"));
    }

    @Test
    @DisplayName("Should list documents for a shipment and across all shipments")
    void testFindDocuments() {
        logisticsBean.createCustomsDocument(shipment.getShipmentId().intValue(), DeclarationType.IMPORT.name());

        List<CustomsDocument> forShipment = logisticsBean.findDocumentsByShipmentId(shipment.getShipmentId().intValue());
        List<CustomsDocument> all = logisticsBean.findAllCustomsDocuments();

        Assertions.assertEquals(1, forShipment.size());
        Assertions.assertFalse(all.isEmpty());
    }

    @Test
    @DisplayName("Should confirm RFQ and set transport mode for sea freight")
    void testUpdateTransportModeAndStatus() {
        User creator = new User("logistics_user", "hash", "logistics@globaltrade.com", UserStatus.ACTIVE);
        em.persist(creator);

        Product product = new Product();
        product.setName("Freight Cargo");
        product.setSku("SKU-CARGO-01");
        product.setUnitPrice(BigDecimal.valueOf(10.00));
        em.persist(product);
        em.flush();

        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(100);
        rfq.setTargetDeliveryDate(java.sql.Date.valueOf(java.time.LocalDate.now().plusDays(10)));
        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(creator);
        em.persist(rfq);
        em.flush();

        logisticsBean.updateTransportModeAndStatus(rfq.getRfqId().intValue(), "SEA_FREIGHT");

        em.clear();
        RFQ reloaded = em.find(RFQ.class, rfq.getRfqId());
        Assertions.assertEquals("SEA_FREIGHT", reloaded.getTransportMode());
        Assertions.assertEquals(RFQStatus.CONFIRMED, reloaded.getStatus());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException updating transport mode for unknown RFQ")
    void testUpdateTransportModeAndStatusNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> logisticsBean.updateTransportModeAndStatus(999999, "AIR_FREIGHT"));
    }
}
