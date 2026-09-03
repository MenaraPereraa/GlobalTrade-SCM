package lk.menara.globaltrade.rest.controller.customs;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.dto.CustomsArrivalDTO;
import lk.menara.globaltrade.core.entity.CustomsDocument;
import lk.menara.globaltrade.core.entity.Shipment;
import lk.menara.globaltrade.core.entity.ShipmentCheckpoint;
import lk.menara.globaltrade.core.enums.DeclarationType;
import lk.menara.globaltrade.core.enums.ShipmentStatus;
import lk.menara.globaltrade.core.exception.InvalidShipmentTransitionException;
import lk.menara.globaltrade.scm.bean.customs.CustomsClearanceBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Path("/customs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomsResource {

    @Inject
    private CustomsClearanceBean customsClearanceBean;

    // ==================== SHIPMENT ENDPOINTS ====================

    @POST
    @Path("/shipments")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "SUPER_ADMIN", "CUSTOM_AGENT", "CUSTOMS_AGENT"})
    public Response createShipment(Map<String, Object> request) {
        try {
            Long orderId = request.get("orderId") != null ? Long.valueOf(request.get("orderId").toString()) : null;
            String carrierName = (String) request.get("carrierName");
            String trackingNumber = (String) request.get("trackingNumber");
            String originHub = (String) request.get("originHub");
            String destinationHub = (String) request.get("destinationHub");

            LocalDateTime eta = request.get("eta") != null
                    ? LocalDateTime.parse(request.get("eta").toString())
                    : LocalDateTime.now().plusDays(7);

            String shipmentType = (String) request.get("shipmentType");

            Shipment created = customsClearanceBean.createShipment(
                    orderId,
                    carrierName,
                    trackingNumber,
                    originHub,
                    destinationHub,
                    eta,
                    shipmentType
            );

            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/purchase-orders/{id}/dispatch")
    @RolesAllowed({"ADMIN", "Admin", "VENDOR", "Vendor", "COORDINATOR", "Coordinator", "SUPER_ADMIN"})
    public Response dispatchPurchaseOrder(
            @PathParam("id") Long orderId,
            Map<String, Object> request) {
        try {
            String carrierName = (String) request.get("carrierName");
            String trackingNumber = (String) request.get("trackingNumber");
            String originHub = (String) request.get("originHub");
            String destinationHub = (String) request.get("destinationHub");

            customsClearanceBean.dispatchPurchaseOrder(
                    orderId,
                    carrierName,
                    trackingNumber,
                    originHub,
                    destinationHub
            );

            return Response.ok(Map.of("message", "Purchase order dispatched and shipment created successfully")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/shipments")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getAllShipments() {
        try {
            List<Shipment> shipments = customsClearanceBean.getAllShipments();
            return Response.ok(shipments).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/shipments/in-customs")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getCustomsShipments() {
        try {
            List<CustomsArrivalDTO> shipments = customsClearanceBean.getShipmentsInCustoms();
            return Response.ok(shipments).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/history")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getCustomsHistory() {
        try {
            List<Map<String, Object>> history = customsClearanceBean.getCustomsHistory();
            return Response.ok(history).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/shipments/{id}")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getShipmentById(@PathParam("id") Long id) {
        try {
            Shipment shipment = customsClearanceBean.getShipmentById(id);
            return Response.ok(shipment).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/shipments/{id}/events")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getShipmentEvents(@PathParam("id") Long id) {
        try {
            List<ShipmentCheckpoint> events = customsClearanceBean.getShipmentEvents(id);
            return Response.ok(events).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/shipments/{id}/status")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response updateStatus(@PathParam("id") Long id,
                                 @QueryParam("status") ShipmentStatus status,
                                 @QueryParam("notes") String notes) {
        try {
            Shipment updated = customsClearanceBean.updateShipmentStatus(id, status, notes);
            return Response.ok(updated).build();
        } catch (InvalidShipmentTransitionException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    // PUT /globaltrade/api/customs/shipments/{shipmentId}/forward-warehouse
    // Forwards a cleared shipment to the main warehouse: performs stock inbound
    // and flips the shipment status to IN_TRANSIT. This was previously defined
    // (with @PUT/@Path) directly on CustomsClearanceBean, which has no class-level
    // @Path and is therefore never scanned as a JAX-RS resource -- so it 404'd.
    // Moved here, onto the resource class that's actually registered.
    @PUT
    @Path("/shipments/{shipmentId}/forward-warehouse")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response forwardToMainWarehouse(@PathParam("shipmentId") Long shipmentId) {
        try {
            customsClearanceBean.forwardToMainWarehouse(shipmentId);
            return Response.ok(Map.of("message", "Shipment successfully forwarded to warehouse")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    // ==================== CUSTOMS DOCUMENTS ENDPOINTS ====================

    @GET
    @Path("/documents")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getAllDocuments() {
        try {
            List<CustomsDocument> documents = customsClearanceBean.getAllDocuments();
            return Response.ok(documents).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/shipments/{shipmentId}/documents")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response getShipmentDocuments(@PathParam("shipmentId") Long shipmentId) {
        try {
            List<CustomsDocument> documents = customsClearanceBean.getDocumentsForShipment(shipmentId);
            return Response.ok(documents).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/documents/{documentId}/view")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "WAREHOUSE_MANAGER", "Warehouse Manager", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response viewDocument(@PathParam("documentId") Long documentId) {
        try {
            CustomsDocument doc = customsClearanceBean.getDocumentById(documentId);
            if (doc == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Document not found"))
                        .build();
            }
            return Response.ok(doc).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/shipments/{shipmentId}/documents")
    @RolesAllowed({"ADMIN", "Admin", "COORDINATOR", "Coordinator", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response createDocument(
            @PathParam("shipmentId") Long shipmentId,
            Map<String, String> payload) {
        try {
            String typeStr = payload.get("declarationType");
            if (typeStr == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Declaration type is missing"))
                        .build();
            }
            DeclarationType declarationType = DeclarationType.valueOf(typeStr);

            CustomsDocument doc = customsClearanceBean.createDocument(shipmentId, declarationType);
            return Response.ok(doc).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/documents/{documentId}/approve")
    @RolesAllowed({"ADMIN", "Admin", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response approveDocument(
            @PathParam("documentId") Long documentId,
            @QueryParam("userId") @DefaultValue("1") Long userId,
            @QueryParam("warehouseId") Long warehouseId) { // Main Warehouse ID එක ලබාගැනීමට එකතු කරන ලදී
        try {
            CustomsDocument doc = customsClearanceBean.approveDocumentWithWarehouse(documentId, userId, warehouseId);
            return Response.ok(doc).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/documents/{documentId}/reject")
    @RolesAllowed({"ADMIN", "Admin", "CUSTOMS_AGENT", "CUSTOM_AGENT", "Custom Agent", "SUPER_ADMIN"})
    public Response rejectDocument(
            @PathParam("documentId") Long documentId,
            @QueryParam("userId") @DefaultValue("1") Long userId,
            @QueryParam("reason") String reason) {
        try {
            CustomsDocument doc = customsClearanceBean.rejectDocument(documentId, userId, reason);
            return Response.ok(doc).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}