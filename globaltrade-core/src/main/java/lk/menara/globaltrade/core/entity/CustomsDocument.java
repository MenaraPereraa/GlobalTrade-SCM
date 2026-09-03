package lk.menara.globaltrade.core.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;
import lk.menara.globaltrade.core.enums.CustomsDocumentStatus;
import lk.menara.globaltrade.core.enums.DeclarationType;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "customs_document")
public class CustomsDocument implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "documentid")
    private Long documentId;

    @ManyToOne(optional = false)
    @JsonbTransient
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Enumerated(EnumType.STRING)
    @Column(name = "declarationtype", nullable = false)
    private DeclarationType declarationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomsDocumentStatus status;

    @Column(name = "clearancedate")
    private LocalDateTime clearanceDate;

    @Column(name = "reviewedby")
    private Long reviewedBy;

    public CustomsDocument() {
    }

    public CustomsDocument(Shipment shipment, DeclarationType declarationType, CustomsDocumentStatus status) {
        this.shipment = shipment;
        this.declarationType = declarationType;
        this.status = status;
    }

    // Getters and Setters
    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
    }

    public Long getShipmentId() {
        return shipment != null ? shipment.getShipmentId() : null;
    }

    public DeclarationType getDeclarationType() {
        return declarationType;
    }

    public void setDeclarationType(DeclarationType declarationType) {
        this.declarationType = declarationType;
    }

    public CustomsDocumentStatus getStatus() {
        return status;
    }

    public void setStatus(CustomsDocumentStatus status) {
        this.status = status;
    }

    public LocalDateTime getClearanceDate() {
        return clearanceDate;
    }

    public void setClearanceDate(LocalDateTime clearanceDate) {
        this.clearanceDate = clearanceDate;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
}