package lk.menara.globaltrade.scm.bean.customs;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lk.menara.globaltrade.core.dto.CustomsArrivalDTO;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.CustomsDocumentStatus;
import lk.menara.globaltrade.core.enums.DeclarationType;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.exception.InvalidShipmentTransitionException;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.warehouse.WarehouseBean;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Stateless
public class CustomsClearanceBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @EJB
    private WarehouseBean warehouseBean;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ==================== SHIPMENT METHODS ====================

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Shipment createShipment(Long orderId, String carrierName, String trackingNumber,
                                   String originHub, String destinationHub, LocalDateTime eta,
                                   String shipmentType) {
        Shipment shipment = new Shipment();
        shipment.setOrderId(orderId);
        shipment.setCarrierName(carrierName);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setOriginHub(originHub);
        shipment.setDestinationHub(destinationHub);
        shipment.setEta(eta);
        shipment.setShipmentType(shipmentType);
        shipment.setCurrentStatus(ShipmentStatus.PENDING);

        em.persist(shipment);
        em.flush();
        return shipment;
    }

    public List<Shipment> getAllShipments() {
        return em.createQuery("SELECT s FROM Shipment s ORDER BY s.shipmentId DESC", Shipment.class)
                .getResultList();
    }

    public Shipment getShipmentById(Long shipmentId) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment == null) {
            throw new ResourceNotFoundException("Shipment not found: " + shipmentId);
        }
        return shipment;
    }

    public List<ShipmentCheckpoint> getShipmentEvents(Long shipmentId) {
        return em.createQuery(
                        "SELECT c FROM ShipmentCheckpoint c WHERE c.shipment.shipmentId = :shipmentId ORDER BY c.checkpointId DESC",
                        ShipmentCheckpoint.class)
                .setParameter("shipmentId", shipmentId)
                .getResultList();
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Shipment updateShipmentStatus(Long shipmentId, ShipmentStatus newStatus, String notes)
            throws InvalidShipmentTransitionException {
        Shipment shipment = getShipmentById(shipmentId);

        shipment.setCurrentStatus(newStatus);
        logCheckpoint(shipment, newStatus.name(), notes != null ? notes : "Status updated to " + newStatus.name());

        em.merge(shipment);
        em.flush();
        return shipment;
    }

    public List<CustomsArrivalDTO> getShipmentsInCustoms() {
        try {
            String sql =
                    "SELECT " +
                            "    s.shipmentid, " +
                            "    po.po_id, " +
                            "    v.vendorname, " +
                            "    p.name as product_name, " +
                            "    r.requested_quantity, " +
                            "    s.originhub, " +
                            "    s.destinationhub, " +
                            "    s.trackingnumber, " +
                            "    s.currentstatus " +
                            "FROM shipment s " +
                            "LEFT JOIN purchase_order po ON po.po_id = s.po_id " +
                            "LEFT JOIN vendor v ON v.vendorid = po.vendor_id " +
                            "LEFT JOIN rfq_response rr ON rr.response_id = po.rfq_response_id " +
                            "LEFT JOIN rfq r ON r.rfq_id = rr.rfq_id " +
                            "LEFT JOIN product p ON p.product_id = r.product_id " +
                            "WHERE s.currentstatus IN ('ARRIVED_AT_PORT', 'CUSTOMS', 'PENDING_CUSTOMS', 'IN_TRANSIT')";

            @SuppressWarnings("unchecked")
            List<Object[]> rows = em.createNativeQuery(sql).getResultList();

            if (rows == null || rows.isEmpty()) {
                return Collections.emptyList();
            }

            List<CustomsArrivalDTO> result = new ArrayList<>();
            for (Object[] row : rows) {
                result.add(new CustomsArrivalDTO(
                        row[0] != null ? ((Number) row[0]).intValue() : null,
                        row[1] != null ? ((Number) row[1]).intValue() : null,
                        row[2] != null ? (String) row[2] : "Unknown Vendor",
                        row[3] != null ? (String) row[3] : "Unknown Product",
                        row[4] != null ? ((Number) row[4]).intValue() : 0,
                        row[5] != null ? (String) row[5] : "Unknown Origin",
                        row[6] != null ? (String) row[6] : "Unknown Destination",
                        row[7] != null ? (String) row[7] : "N/A",
                        row[8] != null ? (String) row[8] : "CUSTOMS"
                ));
            }
            return result;

        } catch (Exception e) {
            System.err.println("Error fetching shipments in customs: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<Map<String, Object>> getCustomsHistory() {
        try {
            String sql =
                    "SELECT " +
                            "    s.shipmentid, " +
                            "    po.po_id, " +
                            "    v.vendorname, " +
                            "    p.name as product_name, " +
                            "    s.originhub, " +
                            "    s.destinationhub, " +
                            "    s.trackingnumber, " +
                            "    s.currentstatus, " +
                            "    po.created_at, " +
                            "    po.created_at " +
                            "FROM shipment s " +
                            "LEFT JOIN purchase_order po ON po.po_id = s.po_id " +
                            "LEFT JOIN vendor v ON v.vendorid = po.vendor_id " +
                            "LEFT JOIN rfq_response rr ON rr.response_id = po.rfq_response_id " +
                            "LEFT JOIN rfq r ON r.rfq_id = rr.rfq_id " +
                            "LEFT JOIN product p ON p.product_id = r.product_id " +
                            "ORDER BY s.shipmentid DESC";

            @SuppressWarnings("unchecked")
            List<Object[]> rows = em.createNativeQuery(sql).getResultList();

            if (rows == null || rows.isEmpty()) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> historyList = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> map = new LinkedHashMap<>();

                Long shipmentId = row[0] != null ? ((Number) row[0]).longValue() : null;
                Long poId = row[1] != null ? ((Number) row[1]).longValue() : null;
                String vendorName = row[2] != null ? (String) row[2] : "Unknown Vendor";
                String productName = row[3] != null ? (String) row[3] : "Unknown Product";
                String originHub = row[4] != null ? (String) row[4] : "Unknown Origin";
                String destinationHub = row[5] != null ? (String) row[5] : "Unknown Destination";
                String trackingNumber = row[6] != null ? (String) row[6] : "N/A";
                String status = row[7] != null ? (String) row[7] : "PENDING";

                LocalDateTime createdAt = LocalDateTime.now();
                if (row[8] instanceof java.sql.Timestamp) {
                    createdAt = ((java.sql.Timestamp) row[8]).toLocalDateTime();
                } else if (row[8] instanceof LocalDateTime) {
                    createdAt = (LocalDateTime) row[8];
                }

                LocalDateTime updatedAt = createdAt;
                if (row[9] instanceof java.sql.Timestamp) {
                    updatedAt = ((java.sql.Timestamp) row[9]).toLocalDateTime();
                } else if (row[9] instanceof LocalDateTime) {
                    updatedAt = (LocalDateTime) row[9];
                }

                String poReference = poId != null ? String.format("PO-%08d", poId) : "PO-—";

                String clearanceId;
                if (trackingNumber != null && !trackingNumber.equals("N/A") && trackingNumber.length() >= 6) {
                    String shortTracking = trackingNumber.substring(0, Math.min(8, trackingNumber.length())).toUpperCase();
                    clearanceId = "CLR-" + shortTracking;
                } else if (shipmentId != null) {
                    clearanceId = "CLR-" + String.format("%08X", shipmentId);
                } else {
                    clearanceId = "CLR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                }

                map.put("poReference", poReference);
                map.put("clearanceId", clearanceId);
                map.put("vendorName", vendorName);
                map.put("productName", productName);
                map.put("route", originHub + " → " + destinationHub);
                map.put("submittedDate", createdAt.format(DATE_FORMATTER));
                map.put("reviewedDate", updatedAt.format(DATE_FORMATTER));
                map.put("status", status);
                map.put("outcome", getOutcomeFromStatus(status));

                historyList.add(map);
            }
            return historyList;

        } catch (Exception e) {
            System.err.println("Error fetching customs history: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    // ==================== DOCUMENT METHODS ====================

    public List<CustomsDocument> getAllDocuments() {
        try {
            return em.createQuery(
                            "SELECT d FROM CustomsDocument d JOIN FETCH d.shipment s ORDER BY d.documentId DESC",
                            CustomsDocument.class)
                    .getResultList();
        } catch (Exception e) {
            System.err.println("Error fetching documents: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<CustomsDocument> getDocumentsForShipment(Long shipmentId) {
        try {
            return em.createQuery(
                            "SELECT d FROM CustomsDocument d WHERE d.shipment.shipmentId = :shipmentId ORDER BY d.documentId DESC",
                            CustomsDocument.class)
                    .setParameter("shipmentId", shipmentId)
                    .getResultList();
        } catch (Exception e) {
            System.err.println("Error fetching documents for shipment " + shipmentId + ": " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public CustomsDocument getDocumentById(Long documentId) {
        CustomsDocument document = em.find(CustomsDocument.class, documentId);
        if (document == null) {
            throw new ResourceNotFoundException("Customs document not found: " + documentId);
        }
        return document;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public CustomsDocument createDocument(Long shipmentId, DeclarationType declarationType) {
        Shipment shipment = getShipmentById(shipmentId);

        CustomsDocument document = new CustomsDocument();
        document.setShipment(shipment);
        document.setDeclarationType(declarationType);
        document.setStatus(CustomsDocumentStatus.PENDING);

        em.persist(document);
        em.flush();

        logCheckpoint(shipment, "DOCUMENT_CREATED",
                "Customs document created with type " + declarationType);

        return document;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public CustomsDocument approveDocument(Long documentId, Long reviewedByUserId)
            throws InvalidShipmentTransitionException {
        return approveDocumentWithWarehouse(documentId, reviewedByUserId, null);
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public CustomsDocument approveDocumentWithWarehouse(Long documentId, Long reviewedByUserId, Long mainWarehouseId)
            throws InvalidShipmentTransitionException {
        CustomsDocument document = getDocumentById(documentId);

        document.setStatus(CustomsDocumentStatus.APPROVED);
        document.setClearanceDate(LocalDateTime.now());
        document.setReviewedBy(reviewedByUserId);

        Shipment shipment = document.getShipment();
        if (shipment != null) {
            shipment.setCurrentStatus(ShipmentStatus.CUSTOMS_CLEARED);

            if (mainWarehouseId != null) {
                shipment.setDestinationHub("Main Warehouse - ID: " + mainWarehouseId);
            } else {
                shipment.setDestinationHub("Main Warehouse");
            }

            logCheckpoint(shipment, "CUSTOMS_CLEARED",
                    "Document " + document.getDocumentId() + " approved and custom cleared");

            em.merge(shipment);
        }

        em.merge(document);
        em.flush();

        return document;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public CustomsDocument rejectDocument(Long documentId, Long reviewedByUserId, String reason) {
        CustomsDocument document = getDocumentById(documentId);

        document.setStatus(CustomsDocumentStatus.REJECTED);
        document.setReviewedBy(reviewedByUserId);

        Shipment shipment = document.getShipment();
        logCheckpoint(shipment, "CUSTOMS_REJECTED",
                reason != null ? "Document rejected: " + reason : "Declaration rejected");

        em.merge(document);
        em.flush();

        return document;
    }

    private void logCheckpoint(Shipment shipment, String statusUpdate, String remarks) {
        ShipmentCheckpoint checkpoint = new ShipmentCheckpoint();
        checkpoint.setShipment(shipment);
        checkpoint.setLocation("Customs");
        checkpoint.setStatusUpdate(statusUpdate);
        checkpoint.setRemarks(remarks);
        checkpoint.setUpdateTime(LocalDateTime.now());
        em.persist(checkpoint);
    }

    private String getOutcomeFromStatus(String status) {
        if (status == null) return "Pending";

        String upperStatus = status.toUpperCase();
        if (upperStatus.contains("CLEAR") || upperStatus.contains("APPROVED") ||
                upperStatus.contains("IN_TRANSIT") || upperStatus.contains("DELIVERED")) {
            return "Cleared";
        } else if (upperStatus.contains("REJECT") || upperStatus.contains("CANCELLED")) {
            return "Rejected";
        } else if (upperStatus.contains("PENDING") || upperStatus.contains("PROCESSING") ||
                upperStatus.contains("CUSTOMS") || upperStatus.contains("ARRIVED")) {
            return "Pending";
        }
        return "In Progress";
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void dispatchPurchaseOrder(Long poId, String carrierName, String trackingNumber, String originHub, String destinationHub) {
        PurchaseOrder po = em.find(PurchaseOrder.class, poId);
        if (po != null) {
            po.setStatus("DISPATCHED");
            po.setTrackingNumber(trackingNumber);
            em.merge(po);
        }

        LocalDateTime eta = LocalDateTime.now().plusDays(7);
        String shipmentType = "SEA";

        Shipment shipment = createShipment(
                poId,
                carrierName,
                trackingNumber,
                originHub,
                destinationHub,
                eta,
                shipmentType
        );

        shipment.setCurrentStatus(ShipmentStatus.ARRIVED_AT_PORT);
        em.merge(shipment);
        em.flush();
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void forwardToMainWarehouse(Long shipmentId) {
        Shipment shipment = getShipmentById(shipmentId);

        Integer warehouseId = 1;
        String warehouseName = "Main Warehouse (Central Hub)";

        try {
            String warehouseQuery = "SELECT warehouse_id, warehouse_name FROM warehouse WHERE is_main = 1 LIMIT 1";
            Query wQuery = em.createNativeQuery(warehouseQuery);
            List<?> wResultList = wQuery.getResultList();

            if (wResultList != null && !wResultList.isEmpty()) {
                Object[] wRow = (Object[]) wResultList.get(0);
                if (wRow != null) {
                    warehouseId = wRow[0] != null ? ((Number) wRow[0]).intValue() : 1;
                    warehouseName = wRow[1] != null ? (String) wRow[1] : "Main Warehouse (Central Hub)";
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not fetch main warehouse via native query, using defaults. Error: " + e.getMessage());
        }

        try {
            String productQuery =
                    "SELECT r.product_id, r.requested_quantity " +
                            "FROM shipment s " +
                            "LEFT JOIN purchase_order po ON po.po_id = s.order_id " +
                            "LEFT JOIN rfq_response rr ON rr.response_id = po.rfq_response_id " +
                            "LEFT JOIN rfq r ON r.rfq_id = rr.rfq_id " +
                            "WHERE s.shipmentid = :shipmentId";

            Query query = em.createNativeQuery(productQuery);
            query.setParameter("shipmentId", shipmentId);

            List<?> resultList = query.getResultList();
            if (resultList != null && !resultList.isEmpty()) {
                Object[] result = (Object[]) resultList.get(0);
                if (result != null) {
                    Integer productId = result[0] != null ? ((Number) result[0]).intValue() : null;
                    Integer quantity = result[1] != null ? ((Number) result[1]).intValue() : null;

                    if (productId != null && quantity != null && quantity > 0 && warehouseBean != null) {
                        warehouseBean.inboundStock(
                                warehouseId,
                                productId,
                                quantity,
                                "Customs Clearance - Shipment ID: " + shipmentId
                        );
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not automatically add stock to warehouse for shipment " + shipmentId + ": " + e.getMessage());
        }

        shipment.setDestinationHub(warehouseName);
        shipment.setCurrentStatus(ShipmentStatus.IN_TRANSIT);

        logCheckpoint(shipment, "FORWARDED_TO_MAIN_WAREHOUSE",
                "Shipment forwarded to Main Warehouse: " + warehouseName);

        em.merge(shipment);
        em.flush();
    }
}