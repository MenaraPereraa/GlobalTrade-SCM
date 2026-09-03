package lk.menara.globaltrade.core.entity;

import jakarta.persistence.*;
import jakarta.json.bind.annotation.JsonbTransient;
import java.io.Serializable;

@Entity
@Table(name = "inventory",
        uniqueConstraints = @UniqueConstraint(columnNames = {"warehouse_id", "product_id"}))
@NamedQueries({
        @NamedQuery(name = "Inventory.findLowStock", query = "SELECT i FROM Inventory i WHERE i.quantityOnHand <= i.reorderThreshold"),
        @NamedQuery(name = "Inventory.findByProduct", query = "SELECT i FROM Inventory i WHERE i.product.productId = :productId"),
        @NamedQuery(name = "Inventory.findByProductAndWarehouse", query = "SELECT i FROM Inventory i WHERE i.product.productId = :productId AND i.warehouse.warehouseId = :warehouseId")
})
public class Inventory implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Integer inventoryId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity_on_hand", nullable = false)
    private Integer quantityOnHand;

    @Column(name = "reorder_threshold", nullable = false)
    private Integer reorderThreshold;

    @Column(name = "min_stock_level", nullable = false)
    private Integer minStockLevel;

    public Inventory() {
    }

    public Inventory(Warehouse warehouse, Product product, Integer quantityOnHand, Integer reorderThreshold, Integer minStockLevel) {
        this.warehouse = warehouse;
        this.product = product;
        this.quantityOnHand = quantityOnHand;
        this.reorderThreshold = reorderThreshold;
        this.minStockLevel = minStockLevel;
    }

    public Integer getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Integer inventoryId) {
        this.inventoryId = inventoryId;
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

    public Integer getQuantityOnHand() {
        return quantityOnHand;
    }

    public void setQuantityOnHand(Integer quantityOnHand) {
        this.quantityOnHand = quantityOnHand;
    }

    public Integer getReorderThreshold() {
        return reorderThreshold;
    }

    public void setReorderThreshold(Integer reorderThreshold) {
        this.reorderThreshold = reorderThreshold;
    }

    public Integer getMinStockLevel() {
        return minStockLevel;
    }

    public void setMinStockLevel(Integer minStockLevel) {
        this.minStockLevel = minStockLevel;
    }
}