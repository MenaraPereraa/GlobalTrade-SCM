package lk.menara.globaltrade.rest.controller.coordinator;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.dto.ShipmentRequestDTO;
import lk.menara.globaltrade.core.entity.ReplenishmentRequest;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.scm.bean.coordinator.LogisticsCoordinatorBean;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.util.List;
import java.util.Map;

@Path("/coordinator")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "COORDINATOR"})
public class LogisticsCoordinatorResource {

    @Inject
    private LogisticsCoordinatorBean coordinatorBean;

    @Inject
    private NotificationService notificationService;

    @GET
    @Path("/shipments")
    public Response getShipments() {
        try {
            return Response.ok(coordinatorBean.getAllShipments()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/exceptions")
    public Response getSystemExceptions() {
        try {
            return Response.ok(coordinatorBean.getSystemExceptions()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/customs")
    public Response getCustomsStatus() {
        try {
            return Response.ok(coordinatorBean.getCustomsStatus()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/replenishment-requests")
    public Response getReplenishmentRequests() {
        try {
            return Response.ok(coordinatorBean.getReplenishmentRequests()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/procurement/start-rfq")
    public Response startProcurementRfq(@QueryParam("requestId") Integer requestId,
                                        @QueryParam("recommendedQty") Integer recommendedQty) {
        try {
            coordinatorBean.startProcurementRfq(requestId, recommendedQty);
            return Response.ok(Map.of("message", "Procurement RFQ process started and emails sent to vendors successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/procurement/confirm-quotation")
    public Response confirmVendorQuotation(@QueryParam("quotationId") Long quotationId) {
        try {
            coordinatorBean.confirmVendorQuotation(quotationId);
            return Response.ok(Map.of("message", "Vendor quotation confirmed and status updated to preparing dispatch")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/replenishment-requests/{id}/dispatch")
    public Response dispatchReplenishmentRequest(@PathParam("id") Integer id) {
        try {
            coordinatorBean.dispatchReplenishmentRequest(id);

            try {
                List<ReplenishmentRequest> requests = coordinatorBean.getReplenishmentRequests();
                if (requests != null) {
                    ReplenishmentRequest targetReq = requests.stream()
                            .filter(r -> r.getRequestId() != null && r.getRequestId().equals(id))
                            .findFirst()
                            .orElse(null);

                    if (targetReq != null && targetReq.getWarehouse() != null) {
                        int qty = targetReq.getQuantity() != null ? targetReq.getQuantity() : 10;
                        notificationService.sendReminderEmail(
                                targetReq.getWarehouse(),
                                targetReq.getProduct(),
                                qty / 2,
                                qty
                        );
                    }
                }
            } catch (Exception mailEx) {
                System.err.println("Failed to send reminder email during dispatch: " + mailEx.getMessage());
            }

            return Response.ok(Map.of("message", "Replenishment request dispatched and reminder email sent successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/replenishment-requests/{id}/transport-mode")
    public Response updateTransportModeAndStatus(@PathParam("id") Integer id, @QueryParam("transportMode") String transportMode) {
        try {
            coordinatorBean.updateTransportModeAndStatus(Long.valueOf(id), transportMode);
            return Response.ok(Map.of("message", "Transport mode and request status updated successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/shipments")
    public Response createShipment(ShipmentRequestDTO dto) {
        try {
            Shipment created = coordinatorBean.createShipment(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/shipments/{id}")
    public Response updateShipment(@PathParam("id") Long id, Shipment data) {
        try {
            String statusStr = data.getCurrentStatus() != null ? data.getCurrentStatus().name() : null;
            coordinatorBean.updateShipment(id, statusStr, data.getCarrierName());
            return Response.ok(Map.of("message", "Shipment updated successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/shipments/{id}/deliver")
    public Response deliverShipment(@PathParam("id") Long id) {
        try {
            coordinatorBean.deliverShipment(id);
            return Response.ok(Map.of("message", "Shipment delivered successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}