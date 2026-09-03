package lk.menara.globaltrade.core.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_checkpoint")
public class ShipmentCheckpoint implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer checkpointId;

    @ManyToOne(optional = false)
    @JsonbTransient
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, length = 255)
    private String statusUpdate;

    @Column(length = 1000)
    private String remarks;

    @Column(nullable = false)
    private LocalDateTime updateTime;

    public ShipmentCheckpoint() {
    }

    public ShipmentCheckpoint(Shipment shipment, String location, String statusUpdate, String remarks) {
        this.shipment = shipment;
        this.location = location;
        this.statusUpdate = statusUpdate;
        this.remarks = remarks;
        this.updateTime = LocalDateTime.now();
    }

    public Integer getCheckpointId() {
        return checkpointId;
    }

    public void setCheckpointId(Integer checkpointId) {
        this.checkpointId = checkpointId;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatusUpdate() {
        return statusUpdate;
    }

    public void setStatusUpdate(String statusUpdate) {
        this.statusUpdate = statusUpdate;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}