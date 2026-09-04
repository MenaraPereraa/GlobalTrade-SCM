package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.dto.RFQDTO;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.enums.VendorStatus;
import lk.menara.globaltrade.scm.bean.coordinator.RFQBean;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ExtendWith(ArquillianExtension.class)
@DisplayName("RFQBean Coordinator Integration Tests")
public class RFQBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private RFQBean rfqBean;

    private Product product;
    private User createdByUser;
    private Vendor vendor;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-rfq-bean.jar")
                .addClasses(RFQBean.class, NotificationService.class)
                .addClasses(RFQ.class, RfqResponse.class, Product.class, Category.class, User.class,
                        Role.class, Vendor.class, Warehouse.class, ReplenishmentRequest.class,
                        PurchaseOrder.class, PurchaseOrderItem.class)
                .addClasses(RFQDTO.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addPackage("lk.menara.globaltrade.core.services")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        product = new Product();
        product.setSku("SKU-RFQ-" + System.nanoTime());
        product.setName("Steel Coils");
        product.setUnitPrice(BigDecimal.valueOf(250.00));
        em.persist(product);

        createdByUser = new User("coordinator1", "hash", "coordinator1@globaltrade.com", UserStatus.ACTIVE);
        em.persist(createdByUser);

        User vendorUser = new User("vendoruser1", "hash", "vendor1@globaltrade.com", UserStatus.ACTIVE);
        em.persist(vendorUser);

        vendor = new Vendor(vendorUser, "Steel Traders Ltd", "steel@vendors.com", "General", "US", VendorStatus.APPROVED);
        em.persist(vendor);

        em.flush();
    }

    @Test
    @DisplayName("Should inject RFQBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(rfqBean);
        Assertions.assertNotNull(em);
    }

    @Test
    @DisplayName("Should create RFQ with OPEN status when product and user are valid")
    void testCreateRfqHappyPath() throws Exception {
        RFQDTO dto = new RFQDTO();
        dto.setProductId(product.getProductId());
        dto.setRequestedQuantity(50);
        dto.setUserId(createdByUser.getUserId().longValue());

        RFQ createdRfq = rfqBean.createRFQ(dto);

        Assertions.assertNotNull(createdRfq.getRfqId());
        Assertions.assertEquals(RFQStatus.OPEN, createdRfq.getStatus());
        Assertions.assertEquals(50, createdRfq.getRequestedQuantity());
        Assertions.assertEquals(product.getProductId(), createdRfq.getProduct().getProductId());
        Assertions.assertNotNull(createdRfq.getTargetDeliveryDate(), "Default target delivery date should be auto-set");
    }

    @Test
    @DisplayName("Should reject RFQ creation when required fields are missing")
    void testCreateRfqMissingFields() {
        RFQDTO dto = new RFQDTO();
        dto.setProductId(product.getProductId());
        // requestedQuantity and userId intentionally left null

        Assertions.assertThrows(IllegalArgumentException.class, () -> rfqBean.createRFQ(dto));
    }

    @Test
    @DisplayName("Should reject RFQ creation for an unknown product")
    void testCreateRfqInvalidProduct() {
        RFQDTO dto = new RFQDTO();
        dto.setProductId(999999L);
        dto.setRequestedQuantity(10);
        dto.setUserId(createdByUser.getUserId().longValue());

        Assertions.assertThrows(IllegalArgumentException.class, () -> rfqBean.createRFQ(dto));
    }

    @Test
    @DisplayName("Should reject RFQ creation for an unknown user")
    void testCreateRfqInvalidUser() {
        RFQDTO dto = new RFQDTO();
        dto.setProductId(product.getProductId());
        dto.setRequestedQuantity(10);
        dto.setUserId(999999L);

        Assertions.assertThrows(IllegalArgumentException.class, () -> rfqBean.createRFQ(dto));
    }

    @Test
    @DisplayName("Should link RFQ creation to a replenishment request and flip it to IN_PROGRESS")
    void testCreateRfqLinkedToReplenishmentRequest() throws Exception {
        Warehouse warehouse = new Warehouse("Colombo Hub", "LK", 5000, true);
        em.persist(warehouse);

        ReplenishmentRequest request = new ReplenishmentRequest(warehouse, product, vendor, 30, RequestStatus.PENDING, false);
        em.persist(request);
        em.flush();

        RFQDTO dto = new RFQDTO();
        dto.setProductId(product.getProductId());
        dto.setRequestedQuantity(30);
        dto.setUserId(createdByUser.getUserId().longValue());
        dto.setReqId(request.getRequestId().longValue());

        rfqBean.createRFQ(dto);

        ReplenishmentRequest updated = em.find(ReplenishmentRequest.class, request.getRequestId());
        Assertions.assertEquals(RequestStatus.IN_PROGRESS, updated.getStatus());
    }

    @Test
    @DisplayName("Should list all RFQs sorted descending")
    void testGetAllRFQs() throws Exception {
        RFQDTO dto = new RFQDTO();
        dto.setProductId(product.getProductId());
        dto.setRequestedQuantity(10);
        dto.setUserId(createdByUser.getUserId().longValue());
        rfqBean.createRFQ(dto);

        List<RFQ> rfqs = rfqBean.getAllRFQs();
        Assertions.assertFalse(rfqs.isEmpty());
        for (int i = 0; i < rfqs.size() - 1; i++) {
            Assertions.assertTrue(rfqs.get(i).getRfqId() >= rfqs.get(i + 1).getRfqId());
        }
    }

    @Test
    @DisplayName("Should list pending replenishment requests")
    void testGetAllPendingReplenishmentRequests() {
        Warehouse warehouse = new Warehouse("Kandy Hub", "LK", 2000, false);
        em.persist(warehouse);

        ReplenishmentRequest request = new ReplenishmentRequest(warehouse, product, vendor, 15, RequestStatus.PENDING, false);
        em.persist(request);
        em.flush();

        List<ReplenishmentRequest> pending = rfqBean.getAllPendingReplenishmentRequests();
        Assertions.assertTrue(pending.stream().anyMatch(r -> r.getRequestId().equals(request.getRequestId())));
    }

    private RFQ persistOpenRfq(Integer quantity) {
        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(quantity);
        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(createdByUser);
        rfq.setTargetDeliveryDate(java.sql.Date.valueOf(java.time.LocalDate.now().plusDays(7)));
        em.persist(rfq);
        em.flush();
        return rfq;
    }

    private RfqResponse persistBid(RFQ rfq, Vendor bidVendor, BigDecimal unitPrice) {
        RfqResponse response = new RfqResponse();
        response.setRfq(rfq);
        response.setVendor(bidVendor);
        response.setOfferedUnitPrice(unitPrice);
        response.setEstimatedLeadTimeDays(7);
        response.setRemarks("Standard lead time");
        response.setStatus("PENDING");
        em.persist(response);
        em.flush();
        return response;
    }

    @Test
    @DisplayName("Should list bids submitted for an RFQ")
    void testGetBidsByRfqId() {
        RFQ rfq = persistOpenRfq(20);
        persistBid(rfq, vendor, BigDecimal.valueOf(15.50));

        List<RfqResponse> bids = rfqBean.getBidsByRfqId(rfq.getRfqId());
        Assertions.assertEquals(1, bids.size());
    }

    @Test
    @DisplayName("Should accept a bid, reject the rest, confirm the RFQ, and generate a purchase order")
    void testAcceptBidHappyPath() throws Exception {
        RFQ rfq = persistOpenRfq(20);

        User secondVendorUser = new User("vendoruser2", "hash", "vendor2@globaltrade.com", UserStatus.ACTIVE);
        em.persist(secondVendorUser);
        Vendor secondVendor = new Vendor(secondVendorUser, "Other Traders", "other@vendors.com", "General", "US", VendorStatus.APPROVED);
        em.persist(secondVendor);
        em.flush();

        RfqResponse winningBid = persistBid(rfq, vendor, BigDecimal.valueOf(10.00));
        RfqResponse losingBid = persistBid(rfq, secondVendor, BigDecimal.valueOf(12.00));

        PurchaseOrder po = rfqBean.acceptBid(winningBid.getResponseId());

        Assertions.assertNotNull(po.getPoId());
        Assertions.assertEquals(0, BigDecimal.valueOf(200.00).compareTo(po.getTotalAmount()));
        Assertions.assertEquals("ISSUED", po.getStatus());
        Assertions.assertEquals(vendor.getVendorId().longValue(), po.getVendorId());

        RfqResponse acceptedRefreshed = em.find(RfqResponse.class, winningBid.getResponseId());
        RfqResponse rejectedRefreshed = em.find(RfqResponse.class, losingBid.getResponseId());
        RFQ rfqRefreshed = em.find(RFQ.class, rfq.getRfqId());

        Assertions.assertEquals("ACCEPTED", acceptedRefreshed.getStatus());
        Assertions.assertEquals("REJECTED", rejectedRefreshed.getStatus());
        Assertions.assertEquals(RFQStatus.CONFIRMED, rfqRefreshed.getStatus());

        List<PurchaseOrderItem> items = em.createQuery(
                        "SELECT i FROM PurchaseOrderItem i WHERE i.poId = :poId", PurchaseOrderItem.class)
                .setParameter("poId", po.getPoId())
                .getResultList();
        Assertions.assertEquals(1, items.size());
        Assertions.assertEquals(product.getProductId(), items.get(0).getProductId());
    }

    @Test
    @DisplayName("Should reject acceptBid for an unknown bid response")
    void testAcceptBidInvalidResponseId() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> rfqBean.acceptBid(999999L));
    }

    @Test
    @DisplayName("Should save route info and confirm the RFQ")
    void testSaveRoute() throws Exception {
        RFQ rfq = persistOpenRfq(10);

        Map<String, Object> routeData = new HashMap<>();
        routeData.put("mode", "SEA_FREIGHT");
        routeData.put("carrierName", "Maersk");

        rfqBean.saveRoute(rfq.getRfqId(), routeData);

        RFQ updated = em.find(RFQ.class, rfq.getRfqId());
        Assertions.assertEquals(RFQStatus.CONFIRMED, updated.getStatus());
        Assertions.assertEquals("SEA_FREIGHT", updated.getTransportMode());
        Assertions.assertEquals("Maersk", updated.getCarrier());
    }

    @Test
    @DisplayName("Should reject saveRoute for an unknown RFQ")
    void testSaveRouteInvalidRfq() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> rfqBean.saveRoute(999999L, new HashMap<>()));
    }

    @Test
    @DisplayName("Should report fulfillment details with defaults before a PO exists")
    void testGetRfqFulfillmentDetailsBeforePo() {
        RFQ rfq = persistOpenRfq(10);

        Map<String, Object> details = rfqBean.getRfqFulfillmentDetails(rfq.getRfqId());

        Assertions.assertEquals(rfq.getRfqId(), details.get("rfqId"));
        Assertions.assertEquals("PENDING", details.get("poStatus"));
        Assertions.assertEquals(false, details.get("isDispatched"));
        Assertions.assertEquals(BigDecimal.ZERO, details.get("unitPrice"));
    }

    @Test
    @DisplayName("Should report fulfillment details once a PO has been generated")
    void testGetRfqFulfillmentDetailsAfterPo() throws Exception {
        RFQ rfq = persistOpenRfq(20);
        RfqResponse bid = persistBid(rfq, vendor, BigDecimal.valueOf(9.00));
        PurchaseOrder po = rfqBean.acceptBid(bid.getResponseId());

        Map<String, Object> details = rfqBean.getRfqFulfillmentDetails(rfq.getRfqId());

        Assertions.assertEquals("PO-" + (8550000 + po.getPoId()), details.get("poRef"));
        Assertions.assertEquals(vendor.getVendorName(), details.get("vendorName"));
    }
}
