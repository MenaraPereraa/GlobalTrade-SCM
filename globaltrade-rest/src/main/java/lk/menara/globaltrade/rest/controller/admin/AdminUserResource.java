package lk.menara.globaltrade.rest.controller.admin;

import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.scm.bean.admin.AdminUserBean;

import java.util.List;

@Path("/admin/staff")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminUserResource {

    @EJB
    private AdminUserBean adminUserBean;

    public record CreateStaffRequest(String username, String email, String password, String role) {}
    public record UpdateStaffRequest(String username, String role) {}
    public record AssignWarehousesRequest(List<Integer> warehouseIds) {}

    @POST
    @Path("/ensure-role")
    public Response ensureAdminRole(@QueryParam("userId") Integer userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"userId query parameter is required.\"}")
                    .build();
        }

        try {
            User updated = adminUserBean.ensureAdminRole(userId);
            return Response.ok(updated).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @POST
    public Response createStaff(CreateStaffRequest request) {
        if (request.username() == null || request.username().isBlank() ||
                request.email() == null || request.email().isBlank() ||
                request.password() == null || request.password().isBlank() ||
                request.role() == null || request.role().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid input parameters or validation failed.\"}")
                    .build();
        }

        try {
            User created = adminUserBean.createStaffUser(request.username(), request.email(), request.password(), request.role());
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @GET
    public Response getAllStaff() {
        try {
            List<User> staff = adminUserBean.getAllStaff();
            return Response.ok(staff).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response updateStaff(@PathParam("id") Integer userId, UpdateStaffRequest request) {
        if (request.username() == null || request.username().isBlank() ||
                request.role() == null || request.role().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid input parameters.\"}")
                    .build();
        }

        try {
            User updated = adminUserBean.updateStaffUser(userId, request.username(), request.role());
            return Response.ok(updated).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @PUT
    @Path("/{id}/warehouses")
    public Response assignWarehouses(@PathParam("id") Integer userId, AssignWarehousesRequest request) {
        if (request.warehouseIds() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Warehouse IDs list cannot be null.\"}")
                    .build();
        }

        try {
            User updated = adminUserBean.assignWarehouses(userId, request.warehouseIds());
            return Response.ok(updated).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @GET
    @Path("/{id}/warehouses")
    public Response getAssignedWarehouses(@PathParam("id") Integer userId) {
        try {
            List<Warehouse> warehouses = adminUserBean.getAssignedWarehouses(userId);
            return Response.ok(warehouses).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}