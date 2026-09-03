package lk.menara.globaltrade.rest.controller.warehouse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.exception.InsufficientStockException;
import lk.menara.globaltrade.core.services.InventoryService;
import lk.menara.globaltrade.scm.bean.warehouse.WarehouseBean;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/inventory")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InventoryResource {

    @Inject
    private InventoryService inventoryService;

    @Inject
    private WarehouseBean warehouseBean;

    @GET
    @RolesAllowed({"ADMIN", "COORDINATOR", "WAREHOUSE_MANAGER", "VENDOR_REP"})
    public Response getAllInventory(@Context SecurityContext securityContext) {
        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : null;

        List<Inventory> inventory = inventoryService.findInventoryForUser(username);
        return Response.ok(inventory).build();
    }

    @GET
    @Path("/warehouses")
    @RolesAllowed({"ADMIN", "COORDINATOR", "WAREHOUSE_MANAGER", "VENDOR_REP"})
    public Response getAssignedWarehouses(@Context SecurityContext securityContext) {
        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : null;

        List<Warehouse> warehouses = warehouseBean.getWarehousesForUser(username);
        return Response.ok(warehouses).build();
    }

    @GET
    @Path("/low-stock")
    @RolesAllowed({"ADMIN", "COORDINATOR", "WAREHOUSE_MANAGER"})
    public Response getLowStockItems(@Context SecurityContext securityContext) {
        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : null;

        List<Inventory> inventory = inventoryService.findLowStockItemsForUser(username);
        return Response.ok(inventory).build();
    }

    @POST
    @Path("/receive")
    @RolesAllowed({"ADMIN", "WAREHOUSE_MANAGER"})
    public Response receiveStock(@QueryParam("warehouseId") Integer warehouseId,
                                 @QueryParam("productId") Integer productId,
                                 @QueryParam("quantity") Integer quantity) {
        if (warehouseId == null || productId == null || quantity == null || quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Valid Warehouse ID, Product ID and quantity are required.")
                    .build();
        }

        Inventory updated = inventoryService.receiveStock(warehouseId, productId, quantity);
        return Response.ok(updated).build();
    }

    @POST
    @Path("/dispatch")
    @RolesAllowed({"ADMIN", "WAREHOUSE_MANAGER"})
    public Response dispatchStock(@QueryParam("warehouseId") Integer warehouseId,
                                  @QueryParam("productId") Integer productId,
                                  @QueryParam("quantity") Integer quantity) throws InsufficientStockException {
        if (warehouseId == null || productId == null || quantity == null || quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Valid WarehouseId, Product ID and quantity are required.")
                    .build();
        }

        Inventory updated = inventoryService.dispatchStock(warehouseId, productId, quantity);
        return Response.ok(updated).build();
    }

    @POST
    @Path("/adjust")
    @RolesAllowed({"ADMIN", "WAREHOUSE_MANAGER"})
    public Response adjustStock(@QueryParam("warehouseId") Integer warehouseId,
                                @QueryParam("productId") Integer productId,
                                @QueryParam("quantity") Integer quantity,
                                @QueryParam("reason") String reason) throws InsufficientStockException {
        if (warehouseId == null || productId == null || quantity == null || quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Valid Warehouse ID, Product ID and quantity are required.")
                    .build();
        }

        Inventory updated = inventoryService.dispatchStock(warehouseId, productId, quantity);
        return Response.ok(updated).build();
    }

    @GET
    @Path("/{warehouseId}/alerts")
    @RolesAllowed({"WAREHOUSE_MANAGER", "ADMIN", "SUPERADMIN"})
    public Response getLowStockAlerts(@PathParam("warehouseId") Long warehouseId) {
        try {
            List<Inventory> allInventory = inventoryService.findAllInventory();
            List<Map<String, Object>> alerts = new ArrayList<>();

            for (Inventory i : allInventory) {
                if (i.getWarehouse() != null && i.getWarehouse().getWarehouseId().equals(warehouseId.intValue())) {
                    if (i.getQuantityOnHand() <= i.getReorderThreshold()) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("sku", i.getProduct().getSku());
                        map.put("name", i.getProduct().getName());
                        map.put("currentStock", i.getQuantityOnHand());
                        map.put("threshold", i.getReorderThreshold());
                        alerts.add(map);
                    }
                }
            }
            return Response.ok(alerts).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity("{\"error\":\"" + e.getMessage() + "\"}").build();
        }
    }
}