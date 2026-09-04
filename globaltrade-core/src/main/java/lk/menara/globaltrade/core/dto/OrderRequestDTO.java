package lk.menara.globaltrade.core.dto;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

public class OrderRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long customerId;
    private Long vendorId;
    private String destinationAddress;
    private List<OrderItemDTO> orderItems;

    public OrderRequestDTO() {
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String destinationAddress() {
        return destinationAddress;
    }

    public void setDestinationAddress(String destinationAddress) {
        this.destinationAddress = destinationAddress;
    }

    public List<OrderItemDTO> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItemDTO> orderItems) {
        this.orderItems = orderItems;
    }
}