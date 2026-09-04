package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.CustomsDocument;
import lk.menara.globaltrade.core.entity.PurchaseOrder;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.entity.ShipmentCheckpoint;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.enums.CustomsDocumentStatus;
import lk.menara.globaltrade.core.enums.DeclarationType;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.exception.InvalidShipmentTransitionException;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.customs.CustomsClearanceBean;
import lk.menara.globaltrade.scm.bean.service.NotificationService;
import lk.menara.globaltrade.scm.bean.warehouse.WarehouseBean;
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

import java.time.LocalDateTime;
import java.util.List;

@ExtendWith(ArquillianExtension.class)
@DisplayName("CustomsClearanceBean Integration Tests")
public class CustomsClearanceBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private CustomsClearanceBean customsClearanceBean;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-customs-clearance.jar")
                .addClasses(CustomsClearanceBean.class, WarehouseBean.class, NotificationService.class, Audit.class)
                .addClasses(Shipment.class, ShipmentCheckpoint.class, CustomsDocument.class,
                        PurchaseOrder.class, Product.class, Warehouse.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    private PurchaseOrder testPo;

    @BeforeEach
    void setupTestData() {
        testPo = new PurchaseOrder();
        testPo.setVendorId(1L);
        testPo.setDestinationWarehouseId(1L);
        testPo.setTotalAmount(java.math.BigDecimal.valueOf(2500.00));
        testPo.setStatus("ISSUED");
        testPo.setCreatedBy(1L);
        em.persist(testPo);
        em.flush();
    }

    private Shipment newShipment() {
        return customsClearanceBean.createShipment(
                testPo.getPoId(), "DHL Freight", "TRK-" + System.nanoTime(),
                "Colombo Port", "Main Warehouse", LocalDateTime.now().plusDays(10), "SEA");
    }

    @Test
    @DisplayName("Should inject CustomsClearanceBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(customsClearanceBean);
        Assertions.assertNotNull(em);
    }

    @Test
    @DisplayName("Should create shipment with PENDING status by default")
    void testCreateShipment() {
        Shipment shipment = newShipment();

        Assertions.assertNotNull(shipment.getShipmentId());
        Assertions.assertEquals(ShipmentStatus.PENDING, shipment.getCurrentStatus());
        Assertions.assertEquals(testPo.getPoId(), shipment.getOrderId());
        Assertions.assertEquals("DHL Freight", shipment.getCarrierName());
    }

    @Test
    @DisplayName("Should list all shipments and find one by ID")
    void testGetAllShipmentsAndFindById() {
        Shipment shipment = newShipment();

        List<Shipment> all = customsClearanceBean.getAllShipments();
        Assertions.assertTrue(all.stream().anyMatch(s -> s.getShipmentId().equals(shipment.getShipmentId())));

        Shipment found = customsClearanceBean.getShipmentById(shipment.getShipmentId());
        Assertions.assertEquals(shipment.getShipmentId(), found.getShipmentId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for an unknown shipment ID")
    void testGetShipmentByIdNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> customsClearanceBean.getShipmentById(999999L));
    }

    @Test
    @DisplayName("Should update shipment status and log a checkpoint")
    void testUpdateShipmentStatusLogsCheckpoint() throws InvalidShipmentTransitionException {
        Shipment shipment = newShipment();

        customsClearanceBean.updateShipmentStatus(shipment.getShipmentId(), ShipmentStatus.IN_TRANSIT, "Departed origin hub");

        Shipment updated = customsClearanceBean.getShipmentById(shipment.getShipmentId());
        Assertions.assertEquals(ShipmentStatus.IN_TRANSIT, updated.getCurrentStatus());

        List<ShipmentCheckpoint> events = customsClearanceBean.getShipmentEvents(shipment.getShipmentId());
        Assertions.assertFalse(events.isEmpty());
        Assertions.assertEquals("Departed origin hub", events.get(0).getRemarks());
        Assertions.assertEquals("IN_TRANSIT", events.get(0).getStatusUpdate());
    }

    @Test
    @DisplayName("Should order shipment checkpoints by descending checkpoint ID")
    void testGetShipmentEventsOrdering() throws InvalidShipmentTransitionException {
        Shipment shipment = newShipment();

        customsClearanceBean.updateShipmentStatus(shipment.getShipmentId(), ShipmentStatus.IN_TRANSIT, "first");
        customsClearanceBean.updateShipmentStatus(shipment.getShipmentId(), ShipmentStatus.ARRIVED_AT_PORT, "second");

        List<ShipmentCheckpoint> events = customsClearanceBean.getShipmentEvents(shipment.getShipmentId());
        Assertions.assertTrue(events.size() >= 2);
        for (int i = 0; i < events.size() - 1; i++) {
            Assertions.assertTrue(events.get(i).getCheckpointId() >= events.get(i + 1).getCheckpointId());
        }
    }

    @Test
    @DisplayName("Should create a customs document in PENDING status")
    void testCreateDocument() {
        Shipment shipment = newShipment();

        CustomsDocument document = customsClearanceBean.createDocument(shipment.getShipmentId(), DeclarationType.IMPORT);

        Assertions.assertNotNull(document.getDocumentId());
        Assertions.assertEquals(CustomsDocumentStatus.PENDING, document.getStatus());
        Assertions.assertEquals(DeclarationType.IMPORT, document.getDeclarationType());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException creating a document for an unknown shipment")
    void testCreateDocumentUnknownShipment() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> customsClearanceBean.createDocument(999999L, DeclarationType.EXPORT));
    }

    @Test
    @DisplayName("Should retrieve documents by ID, by shipment, and across all shipments")
    void testDocumentRetrieval() {
        Shipment shipment = newShipment();
        CustomsDocument document = customsClearanceBean.createDocument(shipment.getShipmentId(), DeclarationType.IMPORT);

        CustomsDocument byId = customsClearanceBean.getDocumentById(document.getDocumentId());
        Assertions.assertEquals(document.getDocumentId(), byId.getDocumentId());

        List<CustomsDocument> forShipment = customsClearanceBean.getDocumentsForShipment(shipment.getShipmentId());
        Assertions.assertTrue(forShipment.stream().anyMatch(d -> d.getDocumentId().equals(document.getDocumentId())));

        List<CustomsDocument> all = customsClearanceBean.getAllDocuments();
        Assertions.assertTrue(all.stream().anyMatch(d -> d.getDocumentId().equals(document.getDocumentId())));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for an unknown document ID")
    void testGetDocumentByIdNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> customsClearanceBean.getDocumentById(999999L));
    }

    @Test
    @DisplayName("Should approve a document, clear customs and mark shipment CUSTOMS_CLEARED")
    void testApproveDocument() throws InvalidShipmentTransitionException {
        Shipment shipment = newShipment();
        CustomsDocument document = customsClearanceBean.createDocument(shipment.getShipmentId(), DeclarationType.IMPORT);

        CustomsDocument approved = customsClearanceBean.approveDocument(document.getDocumentId(), 42L);

        Assertions.assertEquals(CustomsDocumentStatus.APPROVED, approved.getStatus());
        Assertions.assertNotNull(approved.getClearanceDate());
        Assertions.assertEquals(42L, approved.getReviewedBy());

        Shipment updatedShipment = customsClearanceBean.getShipmentById(shipment.getShipmentId());
        Assertions.assertEquals(ShipmentStatus.CUSTOMS_CLEARED, updatedShipment.getCurrentStatus());
        Assertions.assertEquals("Main Warehouse", updatedShipment.getDestinationHub());

        List<ShipmentCheckpoint> events = customsClearanceBean.getShipmentEvents(shipment.getShipmentId());
        Assertions.assertTrue(events.stream().anyMatch(e -> "CUSTOMS_CLEARED".equals(e.getStatusUpdate())));
    }

    @Test
    @DisplayName("Should approve with warehouse ID and tag the destination hub with that ID")
    void testApproveDocumentWithWarehouse() throws InvalidShipmentTransitionException {
        Shipment shipment = newShipment();
        CustomsDocument document = customsClearanceBean.createDocument(shipment.getShipmentId(), DeclarationType.IMPORT);

        customsClearanceBean.approveDocumentWithWarehouse(document.getDocumentId(), 42L, 7L);

        Shipment updatedShipment = customsClearanceBean.getShipmentById(shipment.getShipmentId());
        Assertions.assertEquals("Main Warehouse - ID: 7", updatedShipment.getDestinationHub());
    }

    @Test
    @DisplayName("Should reject a document and log the reason on the checkpoint")
    void testRejectDocument() {
        Shipment shipment = newShipment();
        CustomsDocument document = customsClearanceBean.createDocument(shipment.getShipmentId(), DeclarationType.IMPORT);

        CustomsDocument rejected = customsClearanceBean.rejectDocument(document.getDocumentId(), 42L, "Missing invoice");

        Assertions.assertEquals(CustomsDocumentStatus.REJECTED, rejected.getStatus());
        Assertions.assertEquals(42L, rejected.getReviewedBy());

        List<ShipmentCheckpoint> events = customsClearanceBean.getShipmentEvents(shipment.getShipmentId());
        Assertions.assertTrue(events.stream().anyMatch(e ->
                "CUSTOMS_REJECTED".equals(e.getStatusUpdate()) && e.getRemarks().contains("Missing invoice")));
    }

    @Test
    @DisplayName("Should dispatch a purchase order and create an ARRIVED_AT_PORT shipment")
    void testDispatchPurchaseOrder() {
        customsClearanceBean.dispatchPurchaseOrder(testPo.getPoId(), "Maersk", "TRK-DISPATCH-1", "Shanghai", "Colombo Port");

        PurchaseOrder updatedPo = em.find(PurchaseOrder.class, testPo.getPoId());
        Assertions.assertEquals("DISPATCHED", updatedPo.getStatus());
        Assertions.assertEquals("TRK-DISPATCH-1", updatedPo.getTrackingNumber());

        List<Shipment> shipments = customsClearanceBean.getAllShipments();
        Assertions.assertTrue(shipments.stream().anyMatch(s ->
                testPo.getPoId().equals(s.getOrderId()) && s.getCurrentStatus() == ShipmentStatus.ARRIVED_AT_PORT));
    }
}
