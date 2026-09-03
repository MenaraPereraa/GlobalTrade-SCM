package lk.menara.globaltrade.scm.bean.coordinator;

import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.dto.ShipmentRequestDTO;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Stateless
public class LogisticsCoordinatorBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private NotificationService notificationService;

    public List<Shipment> getAllShipments() {
        return em.createQuery("SELECT s FROM Shipment s LEFT JOIN FETCH s.purchaseOrder", Shipment.class).getResultList();
    }

    public List<SystemExceptionLog> getSystemExceptions() {
        return em.createQuery("SELECT e FROM SystemExceptionLog e", SystemExceptionLog.class).getResultList();
    }

    public List<CustomsDocument> getCustomsStatus() {
        return em.createQuery("SELECT c FROM CustomsDocument c", CustomsDocument.class).getResultList();
    }

    public List<ReplenishmentRequest> getReplenishmentRequests() {
        return em.createQuery("SELECT r FROM ReplenishmentRequest r LEFT JOIN FETCH r.warehouse LEFT JOIN FETCH r.vendor LEFT JOIN FETCH r.product", ReplenishmentRequest.class)
                .getResultList();
    }

    public void startProcurementRfq(Integer requestId, Integer recommendedQty) {
        startProcurementRfq(requestId, recommendedQty, 1L);
    }

    public void startProcurementRfq(Integer requestId, Integer recommendedQty, Long coordinatorUserId) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request == null) {
            throw new IllegalArgumentException("Replenishment request not found for ID: " + requestId);
        }

        Product product = request.getProduct();
        if (product == null) {
            throw new IllegalArgumentException("Product not found for replenishment request ID: " + requestId);
        }

        User coordinatorUser = em.find(User.class, coordinatorUserId);
        if (coordinatorUser == null) {
            coordinatorUser = em.find(User.class, 1L);
        }

        RFQ rfq = new RFQ();
        rfq.setProduct(product);
        rfq.setRequestedQuantity(recommendedQty != null ? recommendedQty : request.getQuantity());
        rfq.setTargetDeliveryDate(Date.valueOf(LocalDate.now().plusDays(7)));
        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(coordinatorUser);

        em.persist(rfq);

        request.setStatus(RequestStatus.IN_PROGRESS);
        em.merge(request);
        em.flush();
    }

    public void confirmVendorQuotation(Long rfqResponseId) {
        RfqResponse response = em.find(RfqResponse.class, rfqResponseId);
        if (response != null) {
            response.setStatus("CONFIRMED");
            em.merge(response);
            em.flush();
        } else {
            throw new IllegalArgumentException("RFQ Response / Quotation not found for ID: " + rfqResponseId);
        }
    }

    public void dispatchReplenishmentRequest(Integer requestId) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request != null) {
            request.setStatus(RequestStatus.FULFILLED);
            em.merge(request);
            em.flush();
        }
    }

    public void updateTransportModeAndStatus(Long rfqId, String transportMode) {
        RFQ rfq = em.find(RFQ.class, rfqId);
        if (rfq != null) {
            rfq.setTransportMode(transportMode);
            rfq.setStatus(RFQStatus.CONFIRMED);
            em.merge(rfq);
            em.flush();
        } else {
            throw new IllegalArgumentException("RFQ not found for ID: " + rfqId);
        }
    }

    public Shipment createShipment(ShipmentRequestDTO dto) {
        Shipment shipment = new Shipment();

        if (dto.getOrderId() != null) {
            PurchaseOrder purchaseOrder = em.find(PurchaseOrder.class, dto.getOrderId());
            shipment.setPurchaseOrder(purchaseOrder);
        }

        String carrier = (dto.getCarrierName() != null && !dto.getCarrierName().isEmpty())
                ? dto.getCarrierName()
                : (dto.getCarrierId() != null ? "Carrier #" + dto.getCarrierId() : "Unknown");
        shipment.setCarrierName(carrier);

        shipment.setTrackingNumber("TRK-" + System.currentTimeMillis());
        shipment.setCurrentStatus(ShipmentStatus.IN_TRANSIT);

        String originName = "Main Hub";
        if (dto.getOrigin() != null && !dto.getOrigin().isEmpty()) {
            originName = dto.getOrigin();
        } else if (dto.getOriginWarehouseId() != null) {
            Warehouse originWarehouse = em.find(Warehouse.class, dto.getOriginWarehouseId());
            if (originWarehouse != null && originWarehouse.getName() != null) {
                originName = originWarehouse.getName();
            } else {
                originName = "Warehouse #" + dto.getOriginWarehouseId();
            }
        }

        String destinationName = "Destination Hub";
        if (dto.getDestination() != null && !dto.getDestination().isEmpty()) {
            destinationName = dto.getDestination();
        } else if (dto.getDestinationWarehouseId() != null) {
            Warehouse destWarehouse = em.find(Warehouse.class, dto.getDestinationWarehouseId());
            if (destWarehouse != null && destWarehouse.getName() != null) {
                destinationName = destWarehouse.getName();
            } else {
                destinationName = "Warehouse #" + dto.getDestinationWarehouseId();
            }
        }

        shipment.setOriginHub(originName);
        shipment.setDestinationHub(destinationName);
        shipment.setShipmentType(dto.getShipmentType() != null ? dto.getShipmentType() : "STANDARD");

        if (dto.getEta() != null && !dto.getEta().isEmpty()) {
            shipment.setEta(LocalDate.parse(dto.getEta()).atStartOfDay());
        } else {
            shipment.setEta(LocalDateTime.now().plusDays(5));
        }

        em.persist(shipment);
        return shipment;
    }

    public void updateShipment(Long id, String status, String carrierName) {
        Shipment shipment = em.find(Shipment.class, id);
        if (shipment != null) {
            if (status != null && !status.isEmpty()) {
                shipment.setCurrentStatus(ShipmentStatus.valueOf(status));
            }
            if (carrierName != null && !carrierName.isEmpty()) {
                shipment.setCarrierName(carrierName);
            }
            em.merge(shipment);
            em.flush();
        }
    }

    public void deliverShipment(Long shipmentId) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment != null) {
            shipment.setCurrentStatus(ShipmentStatus.DELIVERED);
            em.merge(shipment);
            em.flush();
        }
    }

    public Map<String, Object> getShipmentDocumentStatusByRfq(Long rfqId) {
        Map<String, Object> map = new HashMap<>();

        RFQ rfq = em.find(RFQ.class, rfqId);
        if (rfq == null) {
            map.put("isDispatched", false);
            map.put("hasInvoice", false);
            map.put("invoicePath", "");
            return map;
        }

        List<PurchaseOrder> pos = em.createQuery(
                        "SELECT po FROM PurchaseOrder po JOIN RfqResponse r ON po.rfqResponseId = r.responseId WHERE r.rfq.rfqId = :rfqId", PurchaseOrder.class)
                .setParameter("rfqId", rfqId)
                .getResultList();

        PurchaseOrder po = pos.isEmpty() ? null : pos.get(0);

        String poStatus = (po != null && po.getStatus() != null) ? po.getStatus().trim() : "";
        boolean isDispatched = po != null && (
                "DISPATCHED".equalsIgnoreCase(poStatus) ||
                        "TRACKING_UPDATED".equalsIgnoreCase(poStatus) ||
                        "IN_TRANSIT".equalsIgnoreCase(poStatus) ||
                        "COMPLETED".equalsIgnoreCase(poStatus)
        );

        boolean hasInvoice = isDispatched && rfq.getCustomsDocPath() != null && !rfq.getCustomsDocPath().trim().isEmpty();

        map.put("isDispatched", isDispatched);
        map.put("hasInvoice", hasInvoice);
        map.put("invoicePath", hasInvoice ? rfq.getCustomsDocPath() : "");
        map.put("poRef", po != null ? "PO-" + String.format("%08d", po.getPoId()) : "N/A");

        return map;
    }
}