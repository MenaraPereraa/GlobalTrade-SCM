package lk.menara.globaltrade.core.entity;

import jakarta.persistence.*;
import lk.menara.globaltrade.core.enums.RFQStatus;

import java.io.Serializable;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rfq")
public class RFQ implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rfq_id")
    private Long rfqId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Column(name = "target_delivery_date")
    private Date targetDeliveryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RFQStatus status = RFQStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Timestamp createdAt;

    // Transport Mode සහ Carrier fields
    @Column(name = "transport_mode")
    private String transportMode;

    @Column(name = "carrier")
    private String carrier;

    // Document Paths සහ Dispatched At fields
    @Column(name = "customs_doc_path")
    private String customsDocPath;

    @Column(name = "invoice_path")
    private String invoicePath;

    @Column(name = "bol_path")
    private String bolPath;

    @Column(name = "import_permit_path")
    private String importPermitPath;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @OneToMany(mappedBy = "rfq", fetch = FetchType.LAZY)
    private List<RfqResponse> rfqResponses;

    // Getters and Setters
    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Integer getRequestedQuantity() { return requestedQuantity; }
    public void setRequestedQuantity(Integer requestedQuantity) { this.requestedQuantity = requestedQuantity; }

    public Date getTargetDeliveryDate() { return targetDeliveryDate; }
    public void setTargetDeliveryDate(Date targetDeliveryDate) { this.targetDeliveryDate = targetDeliveryDate; }

    public RFQStatus getStatus() { return status; }
    public void setStatus(RFQStatus status) { this.status = status; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }

    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }

    public String getCustomsDocPath() { return customsDocPath; }
    public void setCustomsDocPath(String customsDocPath) { this.customsDocPath = customsDocPath; }

    public String getInvoicePath() { return invoicePath; }
    public void setInvoicePath(String invoicePath) { this.invoicePath = invoicePath; }

    public String getBolPath() { return bolPath; }
    public void setBolPath(String bolPath) { this.bolPath = bolPath; }

    public String getImportPermitPath() { return importPermitPath; }
    public void setImportPermitPath(String importPermitPath) { this.importPermitPath = importPermitPath; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public List<RfqResponse> getRfqResponses() { return rfqResponses; }
    public void setRfqResponses(List<RfqResponse> rfqResponses) { this.rfqResponses = rfqResponses; }
}