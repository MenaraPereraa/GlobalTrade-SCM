package lk.menara.globaltrade.scm.bean.warehouse;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.StockTransfer;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.enums.TransferStatus;
import lk.menara.globaltrade.core.exception.InsufficientStockException;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.core.services.InventoryService;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.sql.Timestamp;
import java.util.List;

@Stateless
public class InventoryBean implements InventoryService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @EJB
    private NotificationService notificationService;

    @Override
    public List<Inventory> findAllInventory() {
        return em.createQuery("SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse", Inventory.class)
                .getResultList();
    }

    @Override
    public List<Inventory> findInventoryForUser(String username) {
        if (username != null && (username.equalsIgnoreCase("admin") ||
                username.equalsIgnoreCase("superadmin@menara.lk") ||
                username.equalsIgnoreCase("Main Warehouse"))) {
            return findAllInventory();
        }

        String jpql = "SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse w " +
                "WHERE w IN (SELECT mw FROM User u JOIN u.managedWarehouses mw WHERE u.email = :username OR u.username = :username)";

        try {
            TypedQuery<Inventory> query = em.createQuery(jpql, Inventory.class);
            query.setParameter("username", username);
            List<Inventory> results = query.getResultList();
            return results != null ? results : List.of();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Override
    public List<Inventory> findStockAcrossWarehouses(Integer productId) {
        return em.createQuery("SELECT i FROM Inventory i JOIN FETCH i.warehouse WHERE i.product.productId = :productId", Inventory.class)
                .setParameter("productId", productId.longValue())
                .getResultList();
    }

    @Override
    public Inventory findByProductAndWarehouse(Integer productId, Integer warehouseId) {
        TypedQuery<Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse " +
                        "WHERE i.warehouse.warehouseId = :warehouseId AND i.product.productId = :productId",
                Inventory.class
        );
        query.setParameter("warehouseId", warehouseId);
        query.setParameter("productId", productId.longValue());

        List<Inventory> results = query.getResultList();
        if (results.isEmpty()) {
            throw new ResourceNotFoundException("Inventory not found for Warehouse ID: " + warehouseId + " and Product ID: " + productId);
        }
        return results.get(0);
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Inventory receiveStock(Integer warehouseId, Integer productId, Integer quantity) {
        Warehouse warehouse = em.find(Warehouse.class, warehouseId);
        if (warehouse == null) {
            throw new ResourceNotFoundException("Warehouse not found: " + warehouseId);
        }

        Product product = em.find(Product.class, productId.longValue());
        if (product == null) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }

        TypedQuery<Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.warehouse.warehouseId = :wId AND i.product.productId = :pId", Inventory.class);
        query.setParameter("wId", warehouseId);
        query.setParameter("pId", productId.longValue());
        query.setLockMode(LockModeType.PESSIMISTIC_WRITE);

        List<Inventory> list = query.getResultList();
        Inventory inventory;

        if (list.isEmpty()) {
            inventory = new Inventory();
            inventory.setWarehouse(warehouse);
            inventory.setProduct(product);
            inventory.setQuantityOnHand(quantity);
            inventory.setMinStockLevel(0);
            inventory.setReorderThreshold(10);
            em.persist(inventory);
            em.flush();
        } else {
            inventory = list.get(0);
            inventory.setQuantityOnHand(inventory.getQuantityOnHand() + quantity);
            em.merge(inventory);
        }

        return inventory;
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Inventory dispatchStock(Integer warehouseId, Integer productId, Integer quantity) throws InsufficientStockException {
        Inventory inventory = findByProductAndWarehouse(productId, warehouseId);

        if (inventory.getQuantityOnHand() < quantity) {
            throw new InsufficientStockException("Insufficient stock in Warehouse ID " + warehouseId +
                    ": available " + inventory.getQuantityOnHand() + ", requested " + quantity);
        }

        inventory.setQuantityOnHand(inventory.getQuantityOnHand() - quantity);
        em.merge(inventory);

        return inventory;
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transferStock(Integer sourceWarehouseId, Integer targetWarehouseId, Integer productId, Integer quantity) throws InsufficientStockException {
        transferStock(sourceWarehouseId, targetWarehouseId, productId, quantity, null, null);
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transferStock(Integer sourceWarehouseId, Integer targetWarehouseId, Integer productId, Integer quantity, User user, String remarks) throws InsufficientStockException {
        Inventory sourceInventory = findByProductAndWarehouse(productId, sourceWarehouseId);

        if (sourceInventory.getQuantityOnHand() < quantity) {
            throw new InsufficientStockException("Insufficient stock for transfer in source Warehouse ID " + sourceWarehouseId);
        }

        sourceInventory.setQuantityOnHand(sourceInventory.getQuantityOnHand() - quantity);
        em.merge(sourceInventory);

        Warehouse sourceWh = em.find(Warehouse.class, sourceWarehouseId);
        Warehouse targetWh = em.find(Warehouse.class, targetWarehouseId);
        Product product = em.find(Product.class, productId.longValue());

        StockTransfer transfer = new StockTransfer();
        transfer.setSourceWarehouse(sourceWh);
        transfer.setDestinationWarehouse(targetWh);
        transfer.setProduct(product);
        transfer.setQuantity(quantity);
        transfer.setStatus(TransferStatus.IN_TRANSIT);
        transfer.setDispatchedBy(user);
        transfer.setDispatchedAt(new Timestamp(System.currentTimeMillis()));
        transfer.setRemarks(remarks);
        em.persist(transfer);
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void receiveTransferStock(Long transferId, Integer targetWarehouseId, User user) {
        StockTransfer transfer = em.find(StockTransfer.class, transferId);
        if (transfer == null) {
            throw new ResourceNotFoundException("Stock transfer record not found for ID: " + transferId);
        }

        if (TransferStatus.RECEIVED.equals(transfer.getStatus())) {
            throw new IllegalStateException("This stock transfer has already been received.");
        }

        receiveStock(targetWarehouseId, transfer.getProduct().getProductId().intValue(), transfer.getQuantity());

        transfer.setStatus(TransferStatus.RECEIVED);
        transfer.setReceivedAt(new Timestamp(System.currentTimeMillis()));
        transfer.setReceivedBy(user);
        em.merge(transfer);
    }

    @Override
    public List<Inventory> findLowStockItems() {
        return em.createQuery(
                        "SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse " +
                                "WHERE i.quantityOnHand <= i.reorderThreshold", Inventory.class)
                .getResultList();
    }

    @Override
    public List<Inventory> findLowStockItemsForUser(String username) {
        if (username != null && (username.equalsIgnoreCase("admin") ||
                username.equalsIgnoreCase("superadmin@menara.lk") ||
                username.toLowerCase().contains("coordinator") ||
                username.equalsIgnoreCase("Coordinator no 1"))) {
            return findLowStockItems();
        }

        String jpql = "SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse w " +
                "WHERE i.quantityOnHand <= i.reorderThreshold AND w IN " +
                "(SELECT mw FROM User u JOIN u.managedWarehouses mw WHERE u.email = :username OR u.username = :username)";

        try {
            return em.createQuery(jpql, Inventory.class)
                    .setParameter("username", username)
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Override
    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Inventory updateReorderThreshold(Integer inventoryId, Integer threshold) {
        Inventory inventory = em.find(Inventory.class, inventoryId.longValue());
        if (inventory == null) {
            throw new ResourceNotFoundException("Inventory not found with ID: " + inventoryId);
        }
        inventory.setReorderThreshold(threshold);
        em.merge(inventory);
        return inventory;
    }
}