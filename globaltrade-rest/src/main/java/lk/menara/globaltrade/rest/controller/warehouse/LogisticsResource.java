package lk.menara.globaltrade.rest.controller.warehouse;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.services.LogisticsService;

import java.util.List;

@Path("/shipments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LogisticsResource {

    @Inject
    private LogisticsService logisticsService;

    @GET
    @Path("/inbound")
    public Response getInboundShipments() {
        try {
            List<Shipment> shipments = logisticsService.findShipmentsByType("INBOUND");
            return Response.ok(shipments).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }

    @GET
    @Path("/outbound")
    public Response getOutboundShipments() {
        try {
            List<Shipment> shipments = logisticsService.findShipmentsByType("OUTBOUND");
            return Response.ok(shipments).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }

    @GET
    @Path("/customs")
    public Response getCustomsShipments() {
        try {
            List<Shipment> shipments = logisticsService.findShipmentsByStatus(ShipmentStatus.CUSTOMS);
            return Response.ok(shipments).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }

    @PUT
    @Path("/{id}/clearance")
    public Response updateCustomsClearance(@PathParam("id") Integer id, @QueryParam("status") String statusStr) {
        try {
            ShipmentStatus newStatus = ShipmentStatus.valueOf(statusStr);
            Shipment updated = logisticsService.updateShipmentStatus(id, newStatus, "Customs clearance updated");
            return Response.ok(updated).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}