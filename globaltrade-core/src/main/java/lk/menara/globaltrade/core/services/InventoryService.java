package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.exception.InsufficientStockException;

import java.util.List;

public interface InventoryService {

    List<Inventory> findAllInventory();

    List<Inventory> findInventoryForUser(String username);

    List<Inventory> findStockAcrossWarehouses(Integer productId);

    Inventory findByProductAndWarehouse(
            Integer productId,
            Integer warehouseId
    );

    Inventory receiveStock(
            Integer warehouseId,
            Integer productId,
            Integer quantity
    );

    Inventory dispatchStock(
            Integer warehouseId,
            Integer productId,
            Integer quantity
    ) throws InsufficientStockException;

    void transferStock(
            Integer sourceWarehouseId,
            Integer targetWarehouseId,
            Integer productId,
            Integer quantity
    ) throws InsufficientStockException;

    void transferStock(
            Integer sourceWarehouseId,
            Integer targetWarehouseId,
            Integer productId,
            Integer quantity,
            User user,
            String remarks
    ) throws InsufficientStockException;

    void receiveTransferStock(
            Long transferId,
            Integer targetWarehouseId,
            User user
    );

    List<Inventory> findLowStockItems();

    List<Inventory> findLowStockItemsForUser(String username);

    Inventory updateReorderThreshold(Integer inventoryId, Integer threshold);
}