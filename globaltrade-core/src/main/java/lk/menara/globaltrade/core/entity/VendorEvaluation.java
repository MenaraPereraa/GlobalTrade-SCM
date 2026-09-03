package lk.menara.globaltrade.core.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_evaluation")
public class VendorEvaluation implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer evaluationId;

    @ManyToOne(optional = false)
    @JsonbTransient
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;


    @Column(nullable = false)
    private Double onTimeDeliveryRate;

    @Column(nullable = false)
    private Double qualityScore;

    @Column(nullable = false)
    private Double fulfillmentAccuracy;

    @Column(nullable = false)
    private LocalDateTime evaluationDate;

    public VendorEvaluation() {
    }

    public VendorEvaluation(Vendor vendor, Double onTimeDeliveryRate, Double qualityScore, Double fulfillmentAccuracy, LocalDateTime evaluationDate) {
        this.vendor = vendor;
        this.onTimeDeliveryRate = onTimeDeliveryRate;
        this.qualityScore = qualityScore;
        this.fulfillmentAccuracy = fulfillmentAccuracy;
        this.evaluationDate = evaluationDate;
    }

    public Integer getEvaluationId() {
        return evaluationId;
    }

    public void setEvaluationId(Integer evaluationId) {
        this.evaluationId = evaluationId;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public Double getOnTimeDeliveryRate() {
        return onTimeDeliveryRate;
    }

    public void setOnTimeDeliveryRate(Double onTimeDeliveryRate) {
        this.onTimeDeliveryRate = onTimeDeliveryRate;
    }

    public Double getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(Double qualityScore) {
        this.qualityScore = qualityScore;
    }

    public Double getFulfillmentAccuracy() {
        return fulfillmentAccuracy;
    }

    public void setFulfillmentAccuracy(Double fulfillmentAccuracy) {
        this.fulfillmentAccuracy = fulfillmentAccuracy;
    }

    public LocalDateTime getEvaluationDate() {
        return evaluationDate;
    }

    public void setEvaluationDate(LocalDateTime evaluationDate) {
        this.evaluationDate = evaluationDate;
    }
}