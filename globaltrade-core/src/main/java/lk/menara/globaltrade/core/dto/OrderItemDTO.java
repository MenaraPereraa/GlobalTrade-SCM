package lk.menara.globaltrade.core.dto;
import java.io.Serializable;
import java.math.BigDecimal;

public class OrderItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;

    public OrderItemDTO() {
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}