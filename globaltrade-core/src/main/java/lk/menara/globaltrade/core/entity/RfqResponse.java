package lk.menara.globaltrade.core.entity;

import jakarta.persistence.*;
import jakarta.json.bind.annotation.JsonbTransient; // මෙය ඉම්පෝට් කරගන්න
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(name = "rfq_response")
public class RfqResponse implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long responseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    @JsonbTransient // JSON සර්විස් එක මඟින් මෙම ෆීල්ඩ් එක serialization කරන විට මඟහරිනු ලැබේ (Infinite loop වැළැක්වීමට)
    private RFQ rfq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "offered_unit_price", nullable = false)
    private BigDecimal offeredUnitPrice;

    @Column(name = "estimated_lead_time_days", nullable = false)
    private Integer estimatedLeadTimeDays;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "quotation_pdf_path")
    private String quotationPdfPath;

    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "submitted_at", insertable = false, updatable = false)
    private Timestamp submittedAt;

    // Getters and Setters यथावत තබා ගන්න
    public Long getResponseId() {
        return responseId;
    }

    public void setResponseId(Long responseId) {
        this.responseId = responseId;
    }

    public RFQ getRfq() {
        return rfq;
    }

    public void setRfq(RFQ rfq) {
        this.rfq = rfq;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public BigDecimal getOfferedUnitPrice() {
        return offeredUnitPrice;
    }

    public void setOfferedUnitPrice(BigDecimal offeredUnitPrice) {
        this.offeredUnitPrice = offeredUnitPrice;
    }

    public Integer getEstimatedLeadTimeDays() {
        return estimatedLeadTimeDays;
    }

    public void setEstimatedLeadTimeDays(Integer estimatedLeadTimeDays) {
        this.estimatedLeadTimeDays = estimatedLeadTimeDays;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getQuotationPdfPath() {
        return quotationPdfPath;
    }

    public void setQuotationPdfPath(String quotationPdfPath) {
        this.quotationPdfPath = quotationPdfPath;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Timestamp submittedAt) {
        this.submittedAt = submittedAt;
    }
}