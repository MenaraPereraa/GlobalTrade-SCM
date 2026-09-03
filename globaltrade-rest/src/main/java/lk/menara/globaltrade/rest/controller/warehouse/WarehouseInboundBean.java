//package lk.menara.globaltrade.scm.bean.warehouse;
//
//import jakarta.ejb.EJB;
//import jakarta.ejb.Stateless;
//import jakarta.ejb.TransactionAttribute;
//import jakarta.ejb.TransactionAttributeType;
//import jakarta.persistence.EntityManager;
//import jakarta.persistence.PersistenceContext;
//import jakarta.persistence.TypedQuery;
//import lk.menara.globaltrade.core.entity.*;
//import lk.menara.globaltrade.core.enums.ShipmentStatus;
//import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
//import lk.menara.globaltrade.logs.annotations.Audit;
//import lk.menara.globaltrade.scm.bean.service.NotificationService;
//
//import java.time.LocalDateTime;
//import java.time.format.DateTimeFormatter;
//import java.util.List;
//
//@Stateless
//public class WarehouseInboundBean {
//
//    @PersistenceContext(unitName = "globaltradePU")
//    private EntityManager em;
//
//    @EJB
//    private WarehouseBean warehouseBean;
//
//    @EJB
//    private NotificationService notificationService;
//
//    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
//
//    /**
//     * Notify the warehouse system about an incoming shipment from customs
//     */
//    @Audit
//    @TransactionAttribute(TransactionAttributeType.REQUIRED)
//    public void notifyIncomingShipment(Shipment shipment, Long warehouseId) {
//        if (shipment == null) {
//            throw new IllegalArgumentException("Shipment cannot be null");
//        }
//
//        // Check if already notified
//        if (isShipmentNotified(shipment.getShipmentId())) {
//            System.out.println("Shipment " + shipment.getShipmentId() + " already notified to warehouse");
//            return;
//        }
//
//        // Get the warehouse
//        Warehouse warehouse = warehouseBean.findById(warehouseId != null ? warehouseId.intValue() : 1);
//
//        // Create an inbound record
//        WarehouseInbound inbound = new WarehouseInbound();
//        inbound.setShipmentId(shipment.getShipmentId());
//        inbound.setWarehouseId(warehouse.getWarehouseId().longValue());
//        inbound.setPoId(shipment.getOrderId());
//        inbound.setTrackingNumber(shipment.getTrackingNumber());
//        inbound.setExpectedArrival(shipment.getEta() != null ? shipment.getEta() : LocalDateTime.now().plusDays(3));
//        inbound.setStatus("PENDING_RECEIPT");
//        inbound.setNotifiedAt(LocalDateTime.now());
//        inbound.setShipmentStatus(shipment.getCurrentStatus().name());
//
//        em.persist(inbound);
//        em.flush();
//
//        // Log the notification
//        System.out.println("=== WAREHOUSE NOTIFICATION ===");
//        System.out.println("Shipment ID: " + shipment.getShipmentId());
//        System.out.println("PO ID: " + shipment.getOrderId());
//        System.out.println("Tracking: " + shipment.getTrackingNumber());
//        System.out.println("Warehouse: " + warehouse.getName());
//        System.out.println("Expected Arrival: " + shipment.getEta());
//        System.out.println("================================");
//
//        // Send notification to warehouse manager
//        try {
//            notificationService.sendWarehouseInboundNotification(
//                    warehouse,
//                    shipment,
//                    inbound
//            );
//        } catch (Exception e) {
//            System.err.println("Failed to send warehouse notification email: " + e.getMessage());
//        }
//
//        // Create a checkpoint in shipment history
//        createWarehouseCheckpoint(shipment, "WAREHOUSE_NOTIFIED",
//                "Shipment notified to warehouse: " + warehouse.getName() + " (ID: " + warehouse.getWarehouseId() + ")");
//    }
//
//    /**
//     * Get all pending inbound shipments for a warehouse
//     */
//    public List<WarehouseInbound> getPendingInboundsForWarehouse(Long warehouseId) {
//        TypedQuery<WarehouseInbound> query = em.createQuery(
//                "SELECT wi FROM WarehouseInbound wi WHERE wi.warehouseId = :warehouseId AND wi.status = 'PENDING_RECEIPT' ORDER BY wi.notifiedAt DESC",
//                WarehouseInbound.class);
//        query.setParameter("warehouseId", warehouseId);
//        return query.getResultList();
//    }
//
//    /**
//     * Get all pending inbound shipments (for admin/supervisor view)
//     */
//    public List<WarehouseInbound> getAllPendingInbounds() {
//        return em.createQuery(
//                        "SELECT wi FROM WarehouseInbound wi WHERE wi.status = 'PENDING_RECEIPT' ORDER BY wi.notifiedAt DESC",
//                        WarehouseInbound.class)
//                .getResultList();
//    }
//
//    /**
//     * Get all inbound records for a shipment
//     */
//    public List<WarehouseInbound> getInboundsByShipment(Long shipmentId) {
//        TypedQuery<WarehouseInbound> query = em.createQuery(
//                "SELECT wi FROM WarehouseInbound wi WHERE wi.shipmentId = :shipmentId ORDER BY wi.notifiedAt DESC",
//                WarehouseInbound.class);
//        query.setParameter("shipmentId", shipmentId);
//        return query.getResultList();
//    }
//
//    /**
//     * Get inbound record by ID
//     */
//    public WarehouseInbound getInboundById(Long inboundId) {
//        WarehouseInbound inbound = em.find(WarehouseInbound.class, inboundId);
//        if (inbound == null) {
//            throw new ResourceNotFoundException("Inbound record not found: " + inboundId);
//        }
//        return inbound;
//    }
//
//    /**
//     * Mark a shipment as received in the warehouse
//     */
//    @Audit
//    @TransactionAttribute(TransactionAttributeType.REQUIRED)
//    public void markAsReceived(Long inboundId, String receivedBy) {
//        WarehouseInbound inbound = getInboundById(inboundId);
//
//        if ("RECEIVED".equals(inbound.getStatus())) {
//            throw new IllegalStateException("Shipment already marked as received");
//        }
//
//        inbound.setStatus("RECEIVED");
//        inbound.setReceivedAt(LocalDateTime.now());
//        inbound.setReceivedBy(receivedBy);
//
//        // Update the shipment status
//        Shipment shipment = em.find(Shipment.class, inbound.getShipmentId());
//        if (shipment != null) {
//            shipment.setCurrentStatus(ShipmentStatus.DELIVERED);
//            em.merge(shipment);
//
//            // Create checkpoint
//            createWarehouseCheckpoint(shipment, "WAREHOUSE_RECEIVED",
//                    "Shipment received at warehouse by: " + receivedBy);
//        }
//
//        em.merge(inbound);
//        em.flush();
//
//        System.out.println("Shipment " + inbound.getShipmentId() + " marked as received at warehouse");
//    }
//
//    /**
//     * Mark a shipment as received using shipment ID and warehouse ID
//     */
//    @Audit
//    @TransactionAttribute(TransactionAttributeType.REQUIRED)
//    public void markShipmentAsReceived(Long shipmentId, Long warehouseId, String receivedBy) {
//        try {
//            WarehouseInbound inbound = em.createQuery(
//                            "SELECT wi FROM WarehouseInbound wi WHERE wi.shipmentId = :shipmentId AND wi.warehouseId = :warehouseId AND wi.status = 'PENDING_RECEIPT'",
//                            WarehouseInbound.class)
//                    .setParameter("shipmentId", shipmentId)
//                    .setParameter("warehouseId", warehouseId)
//                    .setMaxResults(1)
//                    .getSingleResult();
//
//            markAsReceived(inbound.getInboundId(), receivedBy);
//        } catch (Exception e) {
//            // If no pending inbound found, create one and mark as received
//            Shipment shipment = em.find(Shipment.class, shipmentId);
//            if (shipment != null) {
//                // Create an inbound record
//                WarehouseInbound inbound = new WarehouseInbound();
//                inbound.setShipmentId(shipmentId);
//                inbound.setWarehouseId(warehouseId);
//                inbound.setPoId(shipment.getOrderId());
//                inbound.setTrackingNumber(shipment.getTrackingNumber());
//                inbound.setStatus("RECEIVED");
//                inbound.setNotifiedAt(LocalDateTime.now());
//                inbound.setReceivedAt(LocalDateTime.now());
//                inbound.setReceivedBy(receivedBy);
//                em.persist(inbound);
//                em.flush();
//
//                // Update shipment status
//                shipment.setCurrentStatus(ShipmentStatus.DELIVERED);
//                em.merge(shipment);
//            }
//        }
//    }
//
//    /**
//     * Check if a shipment has already been notified
//     */
//    public boolean isShipmentNotified(Long shipmentId) {
//        Long count = em.createQuery(
//                        "SELECT COUNT(wi) FROM WarehouseInbound wi WHERE wi.shipmentId = :shipmentId",
//                        Long.class)
//                .setParameter("shipmentId", shipmentId)
//                .getSingleResult();
//        return count > 0;
//    }
//
//    /**
//     * Get the current status of a shipment at warehouse
//     */
//    public String getShipmentWarehouseStatus(Long shipmentId) {
//        try {
//            WarehouseInbound inbound = em.createQuery(
//                            "SELECT wi FROM WarehouseInbound wi WHERE wi.shipmentId = :shipmentId ORDER BY wi.notifiedAt DESC",
//                            WarehouseInbound.class)
//                    .setParameter("shipmentId", shipmentId)
//                    .setMaxResults(1)
//                    .getSingleResult();
//            return inbound.getStatus();
//        } catch (Exception e) {
//            return "NOT_NOTIFIED";
//        }
//    }
//
//    /**
//     * Get statistics for warehouse dashboard
//     */
//    public WarehouseStats getWarehouseStats(Long warehouseId) {
//        WarehouseStats stats = new WarehouseStats();
//
//        // Pending count
//        Long pendingCount = em.createQuery(
//                        "SELECT COUNT(wi) FROM WarehouseInbound wi WHERE wi.warehouseId = :warehouseId AND wi.status = 'PENDING_RECEIPT'",
//                        Long.class)
//                .setParameter("warehouseId", warehouseId)
//                .getSingleResult();
//        stats.setPendingCount(pendingCount);
//
//        // Received today count
//        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
//        Long receivedToday = em.createQuery(
//                        "SELECT COUNT(wi) FROM WarehouseInbound wi WHERE wi.warehouseId = :warehouseId AND wi.status = 'RECEIVED' AND wi.receivedAt >= :startOfDay",
//                        Long.class)
//                .setParameter("warehouseId", warehouseId)
//                .setParameter("startOfDay", startOfDay)
//                .getSingleResult();
//        stats.setReceivedToday(receivedToday);
//
//        // Total received
//        Long totalReceived = em.createQuery(
//                        "SELECT COUNT(wi) FROM WarehouseInbound wi WHERE wi.warehouseId = :warehouseId AND wi.status = 'RECEIVED'",
//                        Long.class)
//                .setParameter("warehouseId", warehouseId)
//                .getSingleResult();
//        stats.setTotalReceived(totalReceived);
//
//        return stats;
//    }
//
//    /**
//     * Create a warehouse checkpoint in shipment history
//     */
//    private void createWarehouseCheckpoint(Shipment shipment, String statusUpdate, String remarks) {
//        ShipmentCheckpoint checkpoint = new ShipmentCheckpoint();
//        checkpoint.setShipment(shipment);
//        checkpoint.setLocation("Warehouse");
//        checkpoint.setStatusUpdate(statusUpdate);
//        checkpoint.setRemarks(remarks);
//        checkpoint.setUpdateTime(LocalDateTime.now());
//        em.persist(checkpoint);
//    }
//
//    /**
//     * Inner class for warehouse statistics
//     */
//    public static class WarehouseStats {
//        private Long pendingCount;
//        private Long receivedToday;
//        private Long totalReceived;
//
//        public Long getPendingCount() { return pendingCount; }
//        public void setPendingCount(Long pendingCount) { this.pendingCount = pendingCount; }
//
//        public Long getReceivedToday() { return receivedToday; }
//        public void setReceivedToday(Long receivedToday) { this.receivedToday = receivedToday; }
//
//        public Long getTotalReceived() { return totalReceived; }
//        public void setTotalReceived(Long totalReceived) { this.totalReceived = totalReceived; }
//    }
//}