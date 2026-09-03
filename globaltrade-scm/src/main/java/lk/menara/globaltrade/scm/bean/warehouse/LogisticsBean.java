package lk.menara.globaltrade.scm.bean.warehouse;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.CustomsDocument;
import lk.menara.globaltrade.core.entity.RFQ;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.enums.CustomsDocumentStatus;
import lk.menara.globaltrade.core.enums.DeclarationType;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.core.services.LogisticsService;
import lk.menara.globaltrade.logs.annotations.Audit;

import java.time.LocalDateTime;
import java.util.List;

@Stateless
public class LogisticsBean implements LogisticsService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Override
    public List<Shipment> findAllShipments() {
        return em.createQuery("SELECT s FROM Shipment s", Shipment.class).getResultList();
    }

    @Override
    public List<Shipment> findShipmentsByType(String shipmentType) {
        return em.createQuery("SELECT s FROM Shipment s WHERE s.shipmentType = :type", Shipment.class)
                .setParameter("type", shipmentType)
                .getResultList();
    }

    @Override
    public List<Shipment> findShipmentsByStatus(ShipmentStatus status) {
        return em.createQuery("SELECT s FROM Shipment s WHERE s.currentStatus = :status", Shipment.class)
                .setParameter("status", status)
                .getResultList();
    }

    @Override
    @Audit
    public Shipment verifyInbound(Integer shipmentId, String notes) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment == null) {
            throw new ResourceNotFoundException("Shipment not found: " + shipmentId);
        }
        shipment.setCurrentStatus(ShipmentStatus.DELIVERED);
        return shipment;
    }

    @Override
    @Audit
    public Shipment dispatchOutbound(Integer shipmentId, String carrierName, String trackingNumber) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment == null) {
            throw new ResourceNotFoundException("Shipment not found: " + shipmentId);
        }
        shipment.setCarrierName(carrierName);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setCurrentStatus(ShipmentStatus.IN_TRANSIT);
        return shipment;
    }

    @Override
    @Audit
    public Shipment updateShipmentStatus(Integer shipmentId, ShipmentStatus status, String notes) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment == null) {
            throw new ResourceNotFoundException("Shipment not found: " + shipmentId);
        }
        shipment.setCurrentStatus(status);
        return shipment;
    }

    @Override
    public List<CustomsDocument> findDocumentsByShipmentId(Integer shipmentId) {
        return em.createQuery("SELECT d FROM CustomsDocument d WHERE d.shipment.shipmentId = :shipmentId", CustomsDocument.class)
                .setParameter("shipmentId", shipmentId)
                .getResultList();
    }

    @Override
    @Audit
    public CustomsDocument createCustomsDocument(Integer shipmentId, String declarationTypeStr) {
        Shipment shipment = em.find(Shipment.class, shipmentId);
        if (shipment == null) {
            throw new ResourceNotFoundException("Shipment not found: " + shipmentId);
        }

        DeclarationType dtype = DeclarationType.valueOf(declarationTypeStr);

        CustomsDocument doc = new CustomsDocument();
        doc.setShipment(shipment);
        doc.setDeclarationType(dtype);
        doc.setStatus(CustomsDocumentStatus.PENDING);
        em.persist(doc);
        return doc;
    }

    @Override
    @Audit
    public CustomsDocument updateDocumentStatus(Integer documentId, String statusStr, String reason) {
        CustomsDocument doc = em.find(CustomsDocument.class, documentId);
        if (doc == null) {
            throw new ResourceNotFoundException("Document not found: " + documentId);
        }

        CustomsDocumentStatus newStatus = CustomsDocumentStatus.valueOf(statusStr);
        doc.setStatus(newStatus);
        doc.setClearanceDate(LocalDateTime.now());

        return doc;
    }

    @Override
    public List<CustomsDocument> findAllCustomsDocuments() {
        return em.createQuery("SELECT d FROM CustomsDocument d", CustomsDocument.class)
                .getResultList();
    }

    @Override
    @Audit
    public void updateTransportModeAndStatus(Integer requestId, String transportMode) {
        RFQ rfq = em.find(RFQ.class, Long.valueOf(requestId));
        if (rfq != null) {
            rfq.setTransportMode(transportMode);
            if ("SEA_FREIGHT".equals(transportMode)) {
                rfq.setStatus(RFQStatus.CONFIRMED);
            } else if ("AIR_FREIGHT".equals(transportMode)) {
                rfq.setStatus(RFQStatus.CONFIRMED);
            }
            em.merge(rfq);
            em.flush();
        } else {
            throw new ResourceNotFoundException("RFQ not found for ID: " + requestId);
        }
    }
}