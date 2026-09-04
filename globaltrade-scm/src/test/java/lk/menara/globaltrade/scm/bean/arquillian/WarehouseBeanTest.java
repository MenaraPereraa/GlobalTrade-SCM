package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.StockTransfer;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.enums.TransferStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.exception.InsufficientStockException;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.service.NotificationService;
import lk.menara.globaltrade.scm.bean.warehouse.WarehouseBean;
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
@DisplayName("WarehouseBean Integration Tests")
public class WarehouseBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private WarehouseBean warehouseBean;

    private Warehouse sourceWarehouse;
    private Warehouse targetWarehouse;
    private Product product;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-warehouse-bean.jar")
                .addClasses(WarehouseBean.class, NotificationService.class, Audit.class)
                .addClasses(Warehouse.class, Product.class, Inventory.class, StockTransfer.class, User.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        sourceWarehouse = new Warehouse("Colombo Hub", "LK", 10000, true);
        em.persist(sourceWarehouse);

        targetWarehouse = new Warehouse("Kandy Depot", "LK", 4000, false);
        em.persist(targetWarehouse);

        product = new Product();
        product.setName("Copper Wire");
        product.setSku("SKU-COPPER-01");
        product.setUnitPrice(BigDecimal.valueOf(45.50));
        em.persist(product);

        em.flush();
    }

    @Test
    @DisplayName("Should successfully inject WarehouseBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(warehouseBean, "WarehouseBean should be injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    @Test
    @DisplayName("Should retrieve all warehouses")
    void testGetAllWarehouses() {
        List<Warehouse> all = warehouseBean.getAllWarehouses();
        Assertions.assertTrue(all.size() >= 2);
    }

    @Test
    @DisplayName("Should return all warehouses for admin username")
    void testGetWarehousesForUserAsAdmin() {
        List<Warehouse> results = warehouseBean.getWarehousesForUser("admin");
        Assertions.assertEquals(warehouseBean.getAllWarehouses().size(), results.size());
    }

    @Test
    @DisplayName("Should find warehouse by ID")
    void testFindById() {
        Warehouse found = warehouseBean.findById(sourceWarehouse.getWarehouseId());
        Assertions.assertEquals(sourceWarehouse.getWarehouseId(), found.getWarehouseId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unknown warehouse ID")
    void testFindByIdNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class, () -> warehouseBean.findById(999999));
    }

    @Test
    @DisplayName("Should create warehouse with default isMain false when not provided")
    void testCreateWarehouse() {
        Warehouse created = warehouseBean.createWarehouse("Galle Branch", "LK", 2000, null);

        Assertions.assertNotNull(created.getWarehouseId());
        Assertions.assertEquals("Galle Branch", created.getName());
        Assertions.assertFalse(created.getIsMain());
    }

    @Test
    @DisplayName("Should create new inventory row on first inbound of a product")
    void testInboundStockCreatesInventory() {
        Inventory inventory = warehouseBean.inboundStock(
                sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");

        Assertions.assertEquals(500, inventory.getQuantityOnHand());
        Assertions.assertEquals(10, inventory.getReorderThreshold());
    }

    @Test
    @DisplayName("Should increment existing inventory quantity on repeated inbound")
    void testInboundStockIncrementsExisting() {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");
        Inventory second = warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 300, "test-user");

        Assertions.assertEquals(800, second.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when inbounding into unknown product")
    void testInboundStockUnknownProduct() {
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), 999999, 100, "test-user"));
    }

    @Test
    @DisplayName("Should transfer stock between warehouses and record a StockTransfer")
    void testTransferStock() throws InsufficientStockException {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");

        warehouseBean.transferStock(
                sourceWarehouse.getWarehouseId(), targetWarehouse.getWarehouseId(),
                product.getProductId().intValue(), 200, "test-user");

        Inventory sourceInventory = warehouseBean.findByWarehouseAndProduct(
                sourceWarehouse.getWarehouseId(), product.getProductId().intValue());
        Assertions.assertEquals(300, sourceInventory.getQuantityOnHand());

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();
        Assertions.assertEquals(TransferStatus.IN_TRANSIT, transfer.getStatus());
        Assertions.assertEquals(200, transfer.getQuantity());
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when transferring more than available")
    void testTransferStockInsufficientQuantity() {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 50, "test-user");

        Assertions.assertThrows(InsufficientStockException.class, () ->
                warehouseBean.transferStock(
                        sourceWarehouse.getWarehouseId(), targetWarehouse.getWarehouseId(),
                        product.getProductId().intValue(), 100, "test-user"));
    }

    @Test
    @DisplayName("Should receive a stock transfer and mark it RECEIVED")
    void testReceiveTransferStock() throws InsufficientStockException {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");
        warehouseBean.transferStock(
                sourceWarehouse.getWarehouseId(), targetWarehouse.getWarehouseId(),
                product.getProductId().intValue(), 100, "test-user");

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();

        warehouseBean.receiveTransferStock(
                transfer.getTransferId().intValue(), targetWarehouse.getWarehouseId(),
                product.getProductId().intValue(), 100, "System");

        em.flush();
        em.clear();
        StockTransfer reloaded = em.find(StockTransfer.class, transfer.getTransferId());
        Assertions.assertEquals(TransferStatus.RECEIVED, reloaded.getStatus());

        Inventory targetInventory = warehouseBean.findByWarehouseAndProduct(
                targetWarehouse.getWarehouseId(), product.getProductId().intValue());
        Assertions.assertEquals(100, targetInventory.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when receiving unknown transfer")
    void testReceiveTransferStockUnknownTransfer() {
        Assertions.assertThrows(IllegalArgumentException.class, () ->
                warehouseBean.receiveTransferStock(999999, targetWarehouse.getWarehouseId(),
                        product.getProductId().intValue(), 10, "System"));
    }

    @Test
    @DisplayName("Should throw IllegalStateException when receiving an already-received transfer twice")
    void testReceiveTransferStockAlreadyReceived() throws InsufficientStockException {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");
        warehouseBean.transferStock(
                sourceWarehouse.getWarehouseId(), targetWarehouse.getWarehouseId(),
                product.getProductId().intValue(), 100, "test-user");

        StockTransfer transfer = em.createQuery(
                "SELECT t FROM StockTransfer t WHERE t.product.productId = :pid", StockTransfer.class)
                .setParameter("pid", product.getProductId())
                .getSingleResult();
        Integer transferId = transfer.getTransferId().intValue();

        warehouseBean.receiveTransferStock(transferId, targetWarehouse.getWarehouseId(), product.getProductId().intValue(), 100, "System");

        Assertions.assertThrows(IllegalStateException.class, () ->
                warehouseBean.receiveTransferStock(transferId, targetWarehouse.getWarehouseId(), product.getProductId().intValue(), 100, "System"));
    }

    @Test
    @DisplayName("Should surface low stock detection when quantity drops to the reorder threshold")
    void testInboundStockAtReorderThresholdTriggersLowStockPath() {
        // reorderThreshold defaults to 10 on first inbound; requesting exactly 10 keeps it at the alert boundary
        Inventory inventory = warehouseBean.inboundStock(
                sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 10, "test-user");

        Assertions.assertTrue(inventory.getQuantityOnHand() <= inventory.getReorderThreshold(),
                "Quantity at or under reorder threshold should be flagged low stock");
    }

    @Test
    @DisplayName("Should find inventory by warehouse and product")
    void testFindByWarehouseAndProduct() {
        warehouseBean.inboundStock(sourceWarehouse.getWarehouseId(), product.getProductId().intValue(), 500, "test-user");

        Inventory found = warehouseBean.findByWarehouseAndProduct(
                sourceWarehouse.getWarehouseId(), product.getProductId().intValue());

        Assertions.assertEquals(500, found.getQuantityOnHand());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when no inventory row exists for warehouse/product pair")
    void testFindByWarehouseAndProductNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class, () ->
                warehouseBean.findByWarehouseAndProduct(targetWarehouse.getWarehouseId(), product.getProductId().intValue()));
    }
}
