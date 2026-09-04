package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.StockTransfer;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.exception.InsufficientStockException;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.service.NotificationService;
import lk.menara.globaltrade.scm.bean.warehouse.InventoryBean;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit5.ArquillianExtension;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.asset.EmptyAsset;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.math.BigDecimal;
import java.util.List;

@ExtendWith(ArquillianExtension.class)
@DisplayName("InventoryBean Integration Tests")
public class InventoryBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private InventoryBean inventoryBean;

    private Warehouse warehouseA;
    private Warehouse warehouseB;
    private Product product;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-inventory-bean.jar")
                .addClasses(InventoryBean.class, NotificationService.class, Audit.class)
                .addClasses(Warehouse.class, Product.class, Inventory.class, StockTransfer.class, User.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addPackage("lk.menara.globaltrade.core.services")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        warehouseA = new Warehouse("Warehouse A", "LK", 8000, true);
        em.persist(warehouseA);

        warehouseB = new Warehouse("Warehouse B", "LK", 3000, false);
        em.persist(warehouseB);

        product = new Product();
        product.setName("Aluminium Sheets");
        product.setSku("SKU-ALU-01");
        product.setUnitPrice(BigDecimal.valueOf(75.00));
        em.persist(product);

        em.flush();
    }

    @Test
    @DisplayName("Should successfully inject InventoryBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(inventoryBean, "InventoryBean should be injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    @Test
    @DisplayName("Should receive stock and create a new inventory row")
    void testReceiveStockCreatesInventory() {
        Inventory inventory = inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);

        Assertions.assertEquals(400, inventory.getQuantityOnHand());
        Assertions.assertEquals(10, inventory.getReorderThreshold());
    }

    @Test
    @DisplayName("Should increment existing quantity on repeated receiveStock calls")
    void testReceiveStockIncrementsExisting() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);
        Inventory second = inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 100);

        Assertions.assertEquals(500, second.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when receiving stock into unknown warehouse")
    void testReceiveStockUnknownWarehouse() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> inventoryBean.receiveStock(999999, product.getProductId().intValue(), 100));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when receiving stock for unknown product")
    void testReceiveStockUnknownProduct() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> inventoryBean.receiveStock(warehouseA.getWarehouseId(), 999999, 100));
    }

    @Test
    @DisplayName("Should dispatch stock and reduce quantity on hand")
    void testDispatchStock() throws InsufficientStockException {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);

        Inventory afterDispatch = inventoryBean.dispatchStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 150);

        Assertions.assertEquals(250, afterDispatch.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when dispatching more than available")
    void testDispatchStockInsufficientQuantity() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 50);

        Assertions.assertThrows(InsufficientStockException.class, () ->
                inventoryBean.dispatchStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 100));
    }

    @Test
    @DisplayName("Should transfer stock between warehouses")
    void testTransferStock() throws InsufficientStockException {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);

        inventoryBean.transferStock(warehouseA.getWarehouseId(), warehouseB.getWarehouseId(), product.getProductId().intValue(), 150);

        Inventory sourceInventory = inventoryBean.findByProductAndWarehouse(product.getProductId().intValue(), warehouseA.getWarehouseId());
        Assertions.assertEquals(250, sourceInventory.getQuantityOnHand());

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();
        Assertions.assertEquals(150, transfer.getQuantity());
    }

    @Test
    @DisplayName("Should throw InsufficientStockException transferring more than the source warehouse holds")
    void testTransferStockInsufficientQuantity() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 50);

        Assertions.assertThrows(InsufficientStockException.class, () ->
                inventoryBean.transferStock(warehouseA.getWarehouseId(), warehouseB.getWarehouseId(), product.getProductId().intValue(), 100));
    }

    @Test
    @DisplayName("Should receive a transfer and mark it RECEIVED")
    void testReceiveTransferStock() throws InsufficientStockException {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);
        inventoryBean.transferStock(warehouseA.getWarehouseId(), warehouseB.getWarehouseId(), product.getProductId().intValue(), 100);

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();

        inventoryBean.receiveTransferStock(transfer.getTransferId(), warehouseB.getWarehouseId(), null);

        Inventory targetInventory = inventoryBean.findByProductAndWarehouse(product.getProductId().intValue(), warehouseB.getWarehouseId());
        Assertions.assertEquals(100, targetInventory.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when receiving an unknown transfer")
    void testReceiveTransferStockUnknown() {
        Assertions.assertThrows(ResourceNotFoundException.class, () ->
                inventoryBean.receiveTransferStock(999999L, warehouseB.getWarehouseId(), null));
    }

    @Test
    @DisplayName("Should throw IllegalStateException receiving an already-received transfer twice")
    void testReceiveTransferStockAlreadyReceived() throws InsufficientStockException {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 400);
        inventoryBean.transferStock(warehouseA.getWarehouseId(), warehouseB.getWarehouseId(), product.getProductId().intValue(), 100);

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();
        Long transferId = transfer.getTransferId();

        inventoryBean.receiveTransferStock(transferId, warehouseB.getWarehouseId(), null);

        Assertions.assertThrows(IllegalStateException.class, () ->
                inventoryBean.receiveTransferStock(transferId, warehouseB.getWarehouseId(), null));
    }

    @Test
    @DisplayName("Should list all inventory rows across warehouses")
    void testFindAllInventory() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 100);

        List<Inventory> all = inventoryBean.findAllInventory();

        Assertions.assertFalse(all.isEmpty());
    }

    @Test
    @DisplayName("Should list stock across warehouses for a given product")
    void testFindStockAcrossWarehouses() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 100);
        inventoryBean.receiveStock(warehouseB.getWarehouseId(), product.getProductId().intValue(), 50);

        List<Inventory> stock = inventoryBean.findStockAcrossWarehouses(product.getProductId().intValue());

        Assertions.assertEquals(2, stock.size());
    }

    @Test
    @DisplayName("Should only return items at or under reorder threshold from findLowStockItems")
    void testFindLowStockItems() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 5); // under default threshold of 10

        List<Inventory> lowStock = inventoryBean.findLowStockItems();

        Assertions.assertTrue(lowStock.stream()
                .anyMatch(i -> i.getProduct().getProductId().equals(product.getProductId())));
        Assertions.assertTrue(lowStock.stream()
                .allMatch(i -> i.getQuantityOnHand() <= i.getReorderThreshold()));
    }

    @Test
    @DisplayName("Should not flag comfortably-stocked inventory as low stock")
    void testFindLowStockItemsExcludesHealthyStock() {
        inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 500);

        List<Inventory> lowStock = inventoryBean.findLowStockItems();

        Assertions.assertFalse(lowStock.stream()
                .anyMatch(i -> i.getProduct().getProductId().equals(product.getProductId())));
    }

    @Test
    @DisplayName("Should update reorder threshold on an inventory row")
    void testUpdateReorderThreshold() {
        Inventory inventory = inventoryBean.receiveStock(warehouseA.getWarehouseId(), product.getProductId().intValue(), 200);

        Inventory updated = inventoryBean.updateReorderThreshold(inventory.getInventoryId(), 25);

        Assertions.assertEquals(25, updated.getReorderThreshold());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException updating threshold on unknown inventory row")
    void testUpdateReorderThresholdNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> inventoryBean.updateReorderThreshold(999999, 25));
    }
}
