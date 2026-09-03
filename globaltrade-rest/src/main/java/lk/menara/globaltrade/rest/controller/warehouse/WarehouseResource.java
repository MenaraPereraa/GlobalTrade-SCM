package lk.menara.globaltrade.rest.controller.warehouse;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.services.InventoryService;
import lk.menara.globaltrade.scm.bean.warehouse.WarehouseBean;

import java.security.Principal;
import java.util.List;

@Path("/warehouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WarehouseResource {

    @Inject
    private WarehouseBean warehouseBean;

    @Inject
    private InventoryService inventoryService;

    @GET
    @PermitAll
    public Response getAllWarehouses(@Context SecurityContext securityContext) {
        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : null;

        List<Warehouse> warehouses = warehouseBean.getWarehousesForUser(username);
        return Response.ok(warehouses).build();
    }

    @GET
    @Path("/{id}")
    @PermitAll
    public Response getWarehouseById(@PathParam("id") Integer id) {
        Warehouse warehouse = warehouseBean.findById(id);
        return Response.ok(warehouse).build();
    }

    @GET
    @Path("/transfers/pending")
    @RolesAllowed({"WAREHOUSE_MANAGER", "ADMIN"})
    public Response getPendingTransfers(@Context SecurityContext securityContext) {
        try {
            Principal principal = securityContext.getUserPrincipal();
            String username = (principal != null) ? principal.getName() : null;

            boolean isAdmin = securityContext.isUserInRole("ADMIN");
            List<?> pendingTransfers = warehouseBean.getPendingTransfersForUser(username, isAdmin);

            return Response.ok(pendingTransfers).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error fetching pending transfers: " + e.getMessage()).build();
        }
    }

    @POST
    @Path("/receive-transfer")
    @RolesAllowed({"WAREHOUSE_MANAGER", "ADMIN"})
    public Response receiveTransferStock(@QueryParam("transferId") Integer transferId,
                                         @QueryParam("targetWarehouseId") Integer targetWarehouseId,
                                         @QueryParam("productId") Integer productId,
                                         @QueryParam("quantity") Integer quantity,
                                         @Context SecurityContext securityContext) {
        if (transferId == null || targetWarehouseId == null || productId == null || quantity == null || quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Transfer ID, Target Warehouse ID, Product ID, and a valid quantity are required.")
                    .build();
        }

        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : "System";

        try {
            warehouseBean.receiveTransferStock(transferId, targetWarehouseId, productId, quantity, username);
            return Response.ok("Transfer stock successfully received and inventory updated.").build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Failed to receive transfer stock: " + e.getMessage()).build();
        }
    }

    @POST
    @Path("/{id}/transfer")
    @RolesAllowed({"WAREHOUSE_MANAGER", "ADMIN"})
    public Response transferStock(@PathParam("id") Integer sourceWarehouseId,
                                  @QueryParam("targetWarehouseId") Integer targetWarehouseId,
                                  @QueryParam("productId") Integer productId,
                                  @QueryParam("quantity") Integer quantity,
                                  @Context SecurityContext securityContext) {
        if (targetWarehouseId == null || productId == null || quantity == null || quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Target Warehouse ID, Product ID and valid quantity are required.")
                    .build();
        }

        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : "System";

        try {
            warehouseBean.transferStock(sourceWarehouseId, targetWarehouseId, productId, quantity, username);
            return Response.ok("Stock successfully transferred from Warehouse " + sourceWarehouseId + " to Target Warehouse " + targetWarehouseId).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Transfer failed: " + e.getMessage()).build();
        }
    }

    @POST
    @Path("/{id}/receive")
    @RolesAllowed({"WAREHOUSE_MANAGER", "ADMIN"})
    public Response receiveStock(@PathParam("id") Integer warehouseId,
                                 @QueryParam("productId") Integer productId,
                                 @QueryParam("quantity") Integer quantity,
                                 @QueryParam("poReference") String poReference,
                                 @Context SecurityContext securityContext) {
        Principal principal = securityContext.getUserPrincipal();
        String username = (principal != null) ? principal.getName() : "System";

        try {
            Inventory updatedInventory;
            if (poReference != null && !poReference.trim().isEmpty()) {
                updatedInventory = warehouseBean.receiveFromVendor(warehouseId, productId, quantity, poReference, username);
            } else {
                updatedInventory = warehouseBean.inboundStock(warehouseId, productId, quantity, username);
            }
            return Response.ok(updatedInventory).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }
}