package lk.menara.globaltrade.core.dto;

import java.math.BigDecimal;
import java.sql.Date;

public class RFQDTO {
    private Long rfqId;
    private Long reqId; // Replenishment Request ID එක සඳහා එකතු කරන ලදී
    private Long productId;
    private Integer requestedQuantity;
    private Date targetDeliveryDate;
    private Long userId;
    String vendorEmail;

    private BigDecimal unitPrice;
    private Integer leadTime;
    private String remarks;
    private String origin;

    public RFQDTO() {}

    public RFQDTO(Long rfqId, Long reqId, Long productId, Integer requestedQuantity, Date targetDeliveryDate, Long userId, String vendorEmail, BigDecimal unitPrice, Integer leadTime, String remarks, String origin) {
        this.rfqId = rfqId;
        this.reqId = reqId;
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.targetDeliveryDate = targetDeliveryDate;
        this.userId = userId;
        this.vendorEmail = vendorEmail;
        this.unitPrice = unitPrice;
        this.leadTime = leadTime;
        this.remarks = remarks;
        this.origin = origin;
    }

    public Long getRfqId() {
        return rfqId;
    }

    public void setRfqId(Long rfqId) {
        this.rfqId = rfqId;
    }

    public Long getReqId() {
        return reqId;
    }

    public void setReqId(Long reqId) {
        this.reqId = reqId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public Date getTargetDeliveryDate() {
        return targetDeliveryDate;
    }

    public void setTargetDeliveryDate(Date targetDeliveryDate) {
        this.targetDeliveryDate = targetDeliveryDate;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getVendorEmail() {
        return vendorEmail;
    }

    public void setVendorEmail(String vendorEmail) {
        this.vendorEmail = vendorEmail;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Integer getLeadTime() {
        return leadTime;
    }

    public void setLeadTime(Integer leadTime) {
        this.leadTime = leadTime;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }
}