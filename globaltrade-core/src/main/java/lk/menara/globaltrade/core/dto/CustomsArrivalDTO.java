package lk.menara.globaltrade.core.dto;

/**
 * Projection used by the Customs Arrivals screen. Carries the vendor and
 * product details resolved from purchase_order -> vendor and
 * rfq_response -> rfq -> product, so the frontend never has to fall back
 * to placeholder text or localStorage guesses for this data.
 */
public class CustomsArrivalDTO {

    private Integer shipmentId;
    private Integer poId;
    private String vendorName;
    private String productName;
    private Integer quantity;
    private String originHub;
    private String destinationHub;
    private String trackingNumber;
    private String status;

    public CustomsArrivalDTO(Integer shipmentId, Integer poId, String vendorName, String productName,
                             Integer quantity, String originHub, String destinationHub,
                             String trackingNumber, String status) {
        this.shipmentId = shipmentId;
        this.poId = poId;
        this.vendorName = vendorName;
        this.productName = productName;
        this.quantity = quantity;
        this.originHub = originHub;
        this.destinationHub = destinationHub;
        this.trackingNumber = trackingNumber;
        this.status = status;
    }

    public Integer getShipmentId() { return shipmentId; }
    public Integer getPoId() { return poId; }
    public String getVendorName() { return vendorName; }
    public String getProductName() { return productName; }
    public Integer getQuantity() { return quantity; }
    public String getOriginHub() { return originHub; }
    public String getDestinationHub() { return destinationHub; }
    public String getTrackingNumber() { return trackingNumber; }
    public String getStatus() { return status; }
}