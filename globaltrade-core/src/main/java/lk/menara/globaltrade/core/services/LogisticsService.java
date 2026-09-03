package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.CustomsDocument;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import java.util.List;

public interface LogisticsService {
    List<Shipment> findAllShipments();
    List<Shipment> findShipmentsByType(String shipmentType);
    List<Shipment> findShipmentsByStatus(ShipmentStatus status);
    Shipment verifyInbound(Integer shipmentId, String notes);
    Shipment dispatchOutbound(Integer shipmentId, String carrierName, String trackingNumber);
    Shipment updateShipmentStatus(Integer shipmentId, ShipmentStatus status, String notes);

    List<CustomsDocument> findDocumentsByShipmentId(Integer shipmentId);
    CustomsDocument createCustomsDocument(Integer shipmentId, String declarationType);
    CustomsDocument updateDocumentStatus(Integer documentId, String status, String reason);
    List<CustomsDocument> findAllCustomsDocuments();
    void updateTransportModeAndStatus(Integer requestId, String transportMode);
}