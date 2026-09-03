package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.Warehouse;

import java.util.List;

public interface AdminService {
    List<Warehouse> getAllWarehouses();
    Warehouse createWarehouse(Warehouse warehouse) throws Exception;
    void assignManager(Integer warehouseId, Integer userId) throws Exception;
}