package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.Warehouse;
import java.util.List;

public interface WarehouseService {

    List<Warehouse> findAllWarehouses();

    List<Warehouse> findWarehousesForUser(String username);

    Warehouse findWarehouseById(Integer warehouseId);
}