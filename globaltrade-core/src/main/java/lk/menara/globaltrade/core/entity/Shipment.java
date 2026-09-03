package lk.menara.globaltrade.core.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;
import lk.menara.globaltrade.core.enums.ShipmentStatus;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shipment")
@NamedQuery(name = "Shipment.findActive", query = "SELECT s FROM Shipment s WHERE s.currentStatus <> lk.menara.globaltrade.core.enums.ShipmentStatus.DELIVERED")
public class Shipment implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shipmentid")
    private Long shipmentId;

    @Column(name = "po_id", nullable = false)
    private Long orderId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "po_id", nullable = false, insertable = false, updatable = false)
    @JsonbTransient
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false, length = 100)
    private String carrierName;

    @Column(nullable = false, length = 100)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus currentStatus;

    @Column(nullable = false, length = 100)
    private String originHub;

    @Column(nullable = false, length = 100)
    private String destinationHub;

    @Column(nullable = false)
    private LocalDateTime eta;

    @Column(name = "shipment_type")
    private String shipmentType;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ShipmentCheckpoint> checkpoints;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonbTransient
    private List<CustomsDocument> customsDocuments;

    public Shipment() {
    }

    public Shipment(PurchaseOrder purchaseOrder, Long orderId, String carrierName, String trackingNumber, ShipmentStatus currentStatus,
                    String originHub, String destinationHub, LocalDateTime eta, String shipmentType) {
        this.purchaseOrder = purchaseOrder;
        this.orderId = orderId;
        this.carrierName = carrierName;
        this.trackingNumber = trackingNumber;
        this.currentStatus = currentStatus;
        this.originHub = originHub;
        this.destinationHub = destinationHub;
        this.eta = eta;
        this.shipmentType = shipmentType;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(Long shipmentId) {
        this.shipmentId = shipmentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(PurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
        if (purchaseOrder != null) {
            this.orderId = purchaseOrder.getPoId();
        }
    }

    public String getCarrierName() {
        return carrierName;
    }

    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public ShipmentStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(ShipmentStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getOriginHub() {
        return originHub;
    }

    public void setOriginHub(String originHub) {
        this.originHub = originHub;
    }

    public String getDestinationHub() {
        return destinationHub;
    }

    public void setDestinationHub(String destinationHub) {
        this.destinationHub = destinationHub;
    }

    public LocalDateTime getEta() {
        return eta;
    }

    public void setEta(LocalDateTime eta) {
        this.eta = eta;
    }

    public String getShipmentType() {
        return shipmentType;
    }

    public void setShipmentType(String shipmentType) {
        this.shipmentType = shipmentType;
    }

    public List<ShipmentCheckpoint> getCheckpoints() {
        return checkpoints;
    }

    public void setCheckpoints(List<ShipmentCheckpoint> checkpoints) {
        this.checkpoints = checkpoints;
    }

    public List<CustomsDocument> getCustomsDocuments() {
        return customsDocuments;
    }

    public void setCustomsDocuments(List<CustomsDocument> customsDocuments) {
        this.customsDocuments = customsDocuments;
    }
}