package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.enums.VendorStatus;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.scm.bean.vendor.VendorBean;
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
@DisplayName("VendorBean Integration Tests")
public class VendorBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private VendorBean vendorBean;

    private Warehouse warehouse;
    private Product product;
    private Vendor vendor;
    private User vendorUser;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-vendor-bean.jar")
                .addClasses(VendorBean.class)
                .addClasses(Vendor.class, User.class, Role.class, Warehouse.class, Product.class, Category.class,
                        ReplenishmentRequest.class, VendorEvaluation.class, RFQ.class, RfqResponse.class,
                        PurchaseOrder.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addPackage("lk.menara.globaltrade.core.services")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        warehouse = new Warehouse("Vendor Test Hub", "LK", 1000, false);
        em.persist(warehouse);

        product = new Product();
        product.setSku("SKU-VB-" + System.nanoTime());
        product.setName("Aluminium Sheets");
        product.setUnitPrice(BigDecimal.valueOf(45.00));
        em.persist(product);

        vendorUser = new User("vb_vendor_user", "hash", "vbvendor@globaltrade.com", UserStatus.ACTIVE);
        em.persist(vendorUser);

        vendor = new Vendor(vendorUser, "Aluminium Traders", "aluminium@vendors.com", "General", "US", VendorStatus.APPROVED);
        em.persist(vendor);

        em.flush();
    }

    @Test
    @DisplayName("Should inject VendorBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(vendorBean);
    }

    @Test
    @DisplayName("Should find vendor by their linked user's username")
    void testFindVendorByUsernameHappyPath() {
        Vendor found = vendorBean.findVendorByUsername("vb_vendor_user");
        Assertions.assertNotNull(found);
        Assertions.assertEquals(vendor.getVendorId(), found.getVendorId());
    }

    @Test
    @DisplayName("Should return null, not throw, for an unknown username")
    void testFindVendorByUsernameNotFound() {
        Vendor found = vendorBean.findVendorByUsername("does_not_exist");
        Assertions.assertNull(found);
    }

    @Test
    @DisplayName("Should fetch a vendor profile by id")
    void testGetVendorProfileHappyPath() {
        Vendor found = vendorBean.getVendorProfile(vendor.getVendorId());
        Assertions.assertEquals("Aluminium Traders", found.getVendorName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for an unknown vendor id")
    void testGetVendorProfileNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class, () -> vendorBean.getVendorProfile(999999));
    }

    @Test
    @DisplayName("Should list all vendors")
    void testGetAllVendors() {
        List<Vendor> vendors = vendorBean.getAllVendors();
        Assertions.assertTrue(vendors.stream().anyMatch(v -> v.getVendorId().equals(vendor.getVendorId())));
    }

    @Test
    @DisplayName("Should create a replenishment request applying defaults for quantity, status, and timer flag")
    void testCreateReplenishmentRequestAppliesDefaults() {
        ReplenishmentRequest request = new ReplenishmentRequest();
        request.setWarehouse(warehouse);
        request.setProduct(product);
        request.setVendor(vendor);
        request.setQuantity(0);

        ReplenishmentRequest created = vendorBean.createReplenishmentRequest(request);

        Assertions.assertEquals(1, created.getQuantity());
        Assertions.assertEquals(RequestStatus.PENDING, created.getStatus());
        Assertions.assertFalse(created.getCreatedByTimer());
        Assertions.assertNotNull(created.getCreatedAt());
    }

    @Test
    @DisplayName("Should reject replenishment request creation when product is missing")
    void testCreateReplenishmentRequestMissingProduct() {
        ReplenishmentRequest request = new ReplenishmentRequest();
        request.setWarehouse(warehouse);
        request.setVendor(vendor);
        request.setQuantity(5);

        Assertions.assertThrows(IllegalArgumentException.class, () -> vendorBean.createReplenishmentRequest(request));
    }

    private ReplenishmentRequest persistPendingRequest() {
        ReplenishmentRequest request = new ReplenishmentRequest(warehouse, product, vendor, 20, RequestStatus.PENDING, false);
        em.persist(request);
        em.flush();
        return request;
    }

    @Test
    @DisplayName("Should fulfill a replenishment request that belongs to the vendor")
    void testFulfillReplenishmentRequestHappyPath() {
        ReplenishmentRequest request = persistPendingRequest();

        ReplenishmentRequest updated = vendorBean.fulfillReplenishmentRequest(request.getRequestId(), vendor.getVendorId());

        Assertions.assertEquals(RequestStatus.FULFILLED, updated.getStatus());
    }

    @Test
    @DisplayName("Should reject fulfilling a request that belongs to a different vendor")
    void testFulfillReplenishmentRequestWrongVendor() {
        ReplenishmentRequest request = persistPendingRequest();

        Assertions.assertThrows(SecurityException.class,
                () -> vendorBean.fulfillReplenishmentRequest(request.getRequestId(), vendor.getVendorId() + 999));
    }

    @Test
    @DisplayName("Should reject fulfilling an unknown request")
    void testFulfillReplenishmentRequestUnknown() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> vendorBean.fulfillReplenishmentRequest(999999, vendor.getVendorId()));
    }

    @Test
    @DisplayName("Should update a replenishment request's status when owned by the vendor")
    void testUpdateRequestStatus() {
        ReplenishmentRequest request = persistPendingRequest();

        ReplenishmentRequest updated = vendorBean.updateRequestStatus(request.getRequestId(), vendor.getVendorId(), RequestStatus.APPROVED);

        Assertions.assertEquals(RequestStatus.APPROVED, updated.getStatus());
    }

    @Test
    @DisplayName("Should reject a replenishment request when owned by the vendor")
    void testRejectReplenishmentRequestHappyPath() {
        ReplenishmentRequest request = persistPendingRequest();

        ReplenishmentRequest updated = vendorBean.rejectReplenishmentRequest(request.getRequestId(), vendor.getVendorId());

        Assertions.assertEquals(RequestStatus.REJECTED, updated.getStatus());
    }

    @Test
    @DisplayName("Should reject rejecting a request that belongs to a different vendor")
    void testRejectReplenishmentRequestWrongVendor() {
        ReplenishmentRequest request = persistPendingRequest();

        Assertions.assertThrows(SecurityException.class,
                () -> vendorBean.rejectReplenishmentRequest(request.getRequestId(), vendor.getVendorId() + 999));
    }

    @Test
    @DisplayName("Should list vendor evaluations ordered by date")
    void testGetEvaluations() {
        VendorEvaluation evaluation = new VendorEvaluation(vendor, 0.95, 0.9, 0.98, LocalDateTime.now());
        em.persist(evaluation);
        em.flush();

        List<VendorEvaluation> evaluations = vendorBean.getEvaluations(vendor.getVendorId());
        Assertions.assertEquals(1, evaluations.size());
    }

    @Test
    @DisplayName("Should update vendor status")
    void testUpdateVendorStatus() {
        Vendor updated = vendorBean.updateVendorStatus(vendor.getVendorId(), VendorStatus.SUSPENDED);
        Assertions.assertEquals(VendorStatus.SUSPENDED, updated.getStatus());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException updating status for an unknown vendor")
    void testUpdateVendorStatusNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> vendorBean.updateVendorStatus(999999, VendorStatus.SUSPENDED));
    }

    private RFQ persistOpenRfq() {
        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(10);
        rfq.setCreatedBy(vendorUser);
        rfq.setTargetDeliveryDate(java.sql.Date.valueOf(java.time.LocalDate.now().plusDays(7)));
        em.persist(rfq);
        em.flush();
        return rfq;
    }

    @Test
    @DisplayName("Should submit an RFQ response for a known vendor and RFQ")
    void testSubmitRfqResponseHappyPath() {
        RFQ rfq = persistOpenRfq();

        RfqResponse response = vendorBean.submitRfqResponse(rfq.getRfqId(), "vb_vendor_user",
                BigDecimal.valueOf(30.00), 10, "Fast turnaround", null);

        Assertions.assertNotNull(response.getResponseId());
        Assertions.assertEquals("PENDING", response.getStatus());
        Assertions.assertEquals(vendor.getVendorId(), response.getVendor().getVendorId());
    }

    @Test
    @DisplayName("Should reject submitting a quotation for an unknown vendor username")
    void testSubmitRfqResponseUnknownVendor() {
        RFQ rfq = persistOpenRfq();

        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> vendorBean.submitRfqResponse(rfq.getRfqId(), "ghost_user", BigDecimal.TEN, 5, "n/a", null));
    }

    @Test
    @DisplayName("Should reject submitting a quotation for an unknown RFQ")
    void testSubmitRfqResponseUnknownRfq() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> vendorBean.submitRfqResponse(999999L, "vb_vendor_user", BigDecimal.TEN, 5, "n/a", null));
    }

    @Test
    @DisplayName("Should list active RFQs not yet bid on by the vendor")
    void testGetActiveRfqs() {
        persistOpenRfq();

        List<RFQ> activeRfqs = vendorBean.getActiveRfqs(vendor.getVendorId());
        Assertions.assertFalse(activeRfqs.isEmpty());
    }

    @Test
    @DisplayName("Should list quotations submitted by the vendor")
    void testGetVendorQuotations() {
        RFQ rfq = persistOpenRfq();
        vendorBean.submitRfqResponse(rfq.getRfqId(), "vb_vendor_user", BigDecimal.valueOf(20.00), 5, "n/a", null);

        List<RfqResponse> quotations = vendorBean.getVendorQuotations(vendor.getVendorId());
        Assertions.assertEquals(1, quotations.size());
    }

    @Test
    @DisplayName("Should register a new vendor with a generated username and pending statuses")
    void testRegisterVendorHappyPath() throws Exception {
        Vendor newVendor = vendorBean.registerVendor("Global Steel Co", "global.steel@vendors.com", "Steel", "US");

        Assertions.assertNotNull(newVendor.getVendorId());
        Assertions.assertEquals(VendorStatus.PENDING, newVendor.getStatus());
        Assertions.assertEquals(UserStatus.PENDING_APPROVAL, newVendor.getUser().getStatus());
        Assertions.assertEquals("globalsteel", newVendor.getUser().getUsername());
        Assertions.assertTrue(newVendor.getUser().getRoles().stream().anyMatch(r -> "VENDOR".equals(r.getRoleName())));
    }

    @Test
    @DisplayName("Should reject registering a vendor with a duplicate contact email")
    void testRegisterVendorDuplicateEmail() throws Exception {
        vendorBean.registerVendor("First Co", "dup.contact@vendors.com", "General", "US");

        Assertions.assertThrows(IllegalArgumentException.class,
                () -> vendorBean.registerVendor("Second Co", "dup.contact@vendors.com", "General", "US"));
    }

    @Test
    @DisplayName("Should reject registering a vendor with a blank required field")
    void testRegisterVendorBlankField() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> vendorBean.registerVendor("", "blank@vendors.com", "General", "US"));
    }
}
