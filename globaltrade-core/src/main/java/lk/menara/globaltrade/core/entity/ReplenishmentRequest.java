package lk.menara.globaltrade.core.entity;

import jakarta.persistence.*;
import lk.menara.globaltrade.core.enums.RequestStatus;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "replenishment_request")
public class ReplenishmentRequest implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "requested_qty", nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status;


    @Column(name = "created_by_timer", nullable = false)
    private Boolean createdByTimer;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ReplenishmentRequest() {
    }

    public ReplenishmentRequest(Warehouse warehouse, Product product, Vendor vendor, Integer quantity, RequestStatus status, Boolean createdByTimer) {
        this.warehouse = warehouse;
        this.product = product;
        this.vendor = vendor;
        this.quantity = quantity;
        this.status = status;
        this.createdByTimer = createdByTimer;
        this.createdAt = LocalDateTime.now();
    }

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public Boolean getCreatedByTimer() {
        return createdByTimer;
    }

    public void setCreatedByTimer(Boolean createdByTimer) {
        this.createdByTimer = createdByTimer;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}