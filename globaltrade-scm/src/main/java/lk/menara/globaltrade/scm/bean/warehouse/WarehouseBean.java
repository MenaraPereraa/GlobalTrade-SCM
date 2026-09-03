package lk.menara.globaltrade.scm.bean.warehouse;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
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
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.sql.Timestamp;
import java.util.List;

@Stateless
public class WarehouseBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @EJB
    private NotificationService notificationService;

    public List<Warehouse> getAllWarehouses() {
        return em.createQuery("SELECT w FROM Warehouse w", Warehouse.class).getResultList();
    }

    public List<Warehouse> getWarehousesForUser(String username) {
        if (username != null && (username.equalsIgnoreCase("admin") || username.equalsIgnoreCase("superadmin@menara.lk") || username.equalsIgnoreCase("Main Warehouse"))) {
            return getAllWarehouses();
        }

        String jpql = "SELECT w FROM User u JOIN u.managedWarehouses w WHERE u.email = :username OR u.username = :username";

        try {
            TypedQuery<Warehouse> query = em.createQuery(jpql, Warehouse.class);
            query.setParameter("username", username);
            List<Warehouse> results = query.getResultList();

            return results != null ? results : List.of();

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public List<StockTransfer> getPendingTransfersForUser(String username, boolean isAdmin) {
        try {
            List<StockTransfer> transfers;

            if (isAdmin || (username != null && (
                    username.equalsIgnoreCase("admin") ||
                            username.equalsIgnoreCase("superadmin@menara.lk")))) {

                transfers = em.createQuery(
                                "SELECT t FROM StockTransfer t JOIN FETCH t.product JOIN FETCH t.sourceWarehouse JOIN FETCH t.destinationWarehouse WHERE t.status = :status",
                                StockTransfer.class)
                        .setParameter("status", TransferStatus.IN_TRANSIT)
                        .getResultList();
            } else {
                String jpql = "SELECT t FROM StockTransfer t JOIN FETCH t.product JOIN FETCH t.sourceWarehouse JOIN FETCH t.destinationWarehouse WHERE t.status = :status AND t.destinationWarehouse IN (SELECT w FROM User u JOIN u.managedWarehouses w WHERE u.email = :username OR u.username = :username)";
                TypedQuery<StockTransfer> transferQuery = em.createQuery(jpql, StockTransfer.class);
                transferQuery.setParameter("status", TransferStatus.IN_TRANSIT);
                transferQuery.setParameter("username", username);
                transfers = transferQuery.getResultList();
            }

            if (transfers != null) {
                for (StockTransfer t : transfers) {
                    if (t.getProduct() != null) { t.getProduct().getName(); }
                    if (t.getSourceWarehouse() != null) { t.getSourceWarehouse().getName(); }
                    if (t.getDestinationWarehouse() != null) { t.getDestinationWarehouse().getName(); }
                }
            }

            return transfers != null ? transfers : List.of();

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public Warehouse findById(Integer id) {
        Warehouse warehouse = em.find(Warehouse.class, id);
        if (warehouse == null) {
            throw new ResourceNotFoundException("Warehouse not found with ID: " + id);
        }
        return warehouse;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Warehouse createWarehouse(String name, String countryCode, Integer capacity, Boolean isMain) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(name);
        warehouse.setCountryCode(countryCode);
        warehouse.setCapacity(capacity);
        warehouse.setIsMain(isMain != null ? isMain : false);

        em.persist(warehouse);
        em.flush();
        return warehouse;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Inventory inboundStock(Integer warehouseId, Integer productId, Integer quantity, String triggeredBy) {
        Warehouse warehouse = findById(warehouseId);

        Product product = em.find(Product.class, productId != null ? productId.longValue() : null);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }

        TypedQuery<Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.warehouse.warehouseId = :wId AND i.product.productId = :pId", Inventory.class);
        query.setParameter("wId", warehouseId);
        query.setParameter("pId", productId);
        query.setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

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

        checkAndTriggerLowStock(inventory);
        return inventory;
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transferStock(Integer sourceWarehouseId, Integer targetWarehouseId, Integer productId, Integer quantity, String triggeredBy) throws InsufficientStockException {
        transferStock(sourceWarehouseId, targetWarehouseId, productId, quantity, null, triggeredBy);
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transferStock(Integer sourceWarehouseId, Integer targetWarehouseId, Integer productId, Integer quantity, String remarks, String triggeredBy) throws InsufficientStockException {
        Inventory sourceInventory = findByWarehouseAndProduct(sourceWarehouseId, productId);

        if (sourceInventory.getQuantityOnHand() < quantity) {
            throw new InsufficientStockException("Insufficient stock in Warehouse ID " + sourceWarehouseId +
                    ": available " + sourceInventory.getQuantityOnHand() + ", requested to transfer " + quantity);
        }

        sourceInventory.setQuantityOnHand(sourceInventory.getQuantityOnHand() - quantity);
        em.merge(sourceInventory);
        checkAndTriggerLowStock(sourceInventory);

        Warehouse sourceWh = findById(sourceWarehouseId);
        Warehouse targetWh = findById(targetWarehouseId);
        Product product = em.find(Product.class, productId.longValue());

        User dispatchingUser = em.createQuery("SELECT u FROM User u WHERE u.username = :username OR u.email = :username", User.class)
                .setParameter("username", triggeredBy)
                .getResultStream()
                .findFirst()
                .orElse(null);

        StockTransfer transfer = new StockTransfer();
        transfer.setSourceWarehouse(sourceWh);
        transfer.setDestinationWarehouse(targetWh);
        transfer.setProduct(product);
        transfer.setQuantity(quantity);
        transfer.setStatus(TransferStatus.IN_TRANSIT);
        transfer.setDispatchedBy(dispatchingUser);
        transfer.setDispatchedAt(new Timestamp(System.currentTimeMillis()));
        transfer.setRemarks(remarks);
        em.persist(transfer);
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void receiveTransferStock(Integer transferId, Integer targetWarehouseId, Integer productId, Integer quantity, String username) {
        if (transferId == null) {
            throw new IllegalArgumentException("Transfer ID cannot be null.");
        }

        StockTransfer transfer = em.find(StockTransfer.class, transferId.longValue());
        if (transfer == null) {
            throw new IllegalArgumentException("Stock transfer record not found for ID: " + transferId);
        }

        if (TransferStatus.RECEIVED.equals(transfer.getStatus())) {
            throw new IllegalStateException("This stock transfer has already been received.");
        }

        inboundStock(targetWarehouseId, productId, quantity, "Received Transfer ID " + transferId + " by " + username);

        transfer.setStatus(TransferStatus.RECEIVED);
        transfer.setReceivedAt(new Timestamp(System.currentTimeMillis()));

        if (username != null && !username.equals("System")) {
            User receivingUser = em.createQuery(
                            "SELECT u FROM User u WHERE u.username = :username OR u.email = :username", User.class)
                    .setParameter("username", username)
                    .getResultStream()
                    .findFirst()
                    .orElse(null);
            transfer.setReceivedBy(receivingUser);
        }

        em.merge(transfer);
    }

    @Audit
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Inventory receiveFromVendor(Integer warehouseId, Integer productId, Integer quantity, String poReference, String triggeredBy) {
        return inboundStock(warehouseId, productId, quantity, triggeredBy + " [PO Reference: " + poReference + "]");
    }

    private void checkAndTriggerLowStock(Inventory inventory) {
        int threshold = inventory.getReorderThreshold();
        if (inventory.getQuantityOnHand() <= threshold) {
            System.out.println("ALERT: Low stock detected! Warehouse: " + inventory.getWarehouse().getWarehouseId()
                    + ", Product: " + inventory.getProduct().getName()
                    + ". Remaining quantity: " + inventory.getQuantityOnHand());

            try {
                notificationService.sendLowStockAlert(
                        inventory.getWarehouse(),
                        inventory.getProduct(),
                        inventory.getQuantityOnHand(),
                        threshold
                );
            } catch (Exception e) {
                System.err.println("Failed to trigger low stock email: " + e.getMessage());
            }
        }
    }

    public Inventory findByWarehouseAndProduct(Integer warehouseId, Integer productId) {
        TypedQuery<Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.warehouse.warehouseId = :warehouseId AND i.product.productId = :productId",
                Inventory.class
        );
        query.setParameter("warehouseId", warehouseId);
        query.setParameter("productId", productId);

        List<Inventory> results = query.getResultList();
        if (results.isEmpty()) {
            throw new ResourceNotFoundException("Inventory not found for Warehouse ID: " + warehouseId + " and Product ID: " + productId);
        }
        return results.get(0);
    }
}