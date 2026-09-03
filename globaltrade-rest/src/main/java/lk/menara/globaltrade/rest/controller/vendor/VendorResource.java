package lk.menara.globaltrade.rest.controller.vendor;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import lk.menara.globaltrade.core.entity.RFQ;
import lk.menara.globaltrade.core.entity.ReplenishmentRequest;
import lk.menara.globaltrade.core.entity.RfqResponse;
import lk.menara.globaltrade.core.entity.Vendor;
import lk.menara.globaltrade.core.entity.VendorEvaluation;
import lk.menara.globaltrade.core.enums.VendorStatus;
import lk.menara.globaltrade.core.services.VendorService;
import lk.menara.globaltrade.scm.bean.service.NotificationService;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@Path("/vendors")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VendorResource {

    private static final Logger LOGGER = Logger.getLogger(VendorResource.class.getName());

    @Inject
    private VendorService vendorService;

    @Inject
    private NotificationService notificationService;

    @Context
    private SecurityContext securityContext;

    @GET
    public Response getAllVendors() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Unauthorized: No user principal found"))
                        .build();
            }

            List<Vendor> vendors = vendorService.getAllVendors();
            return Response.ok(vendors).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching vendors", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/register")
    public Response registerVendor(Map<String, String> registrationData) {
        try {
            String vendorName = registrationData.get("vendorName");
            String contactEmail = registrationData.get("contactEmail");
            String category = registrationData.get("category");
            String countryCode = registrationData.get("countryCode");

            if (vendorName == null || vendorName.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Vendor name is required"))
                        .build();
            }

            if (contactEmail == null || contactEmail.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Contact email is required"))
                        .build();
            }

            if (countryCode == null || countryCode.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Country code is required"))
                        .build();
            }

            Vendor vendor = vendorService.registerVendor(vendorName, contactEmail, category, countryCode);
            return Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                            "message", "Vendor registered successfully",
                            "vendorId", vendor.getVendorId(),
                            "vendorName", vendor.getVendorName(),
                            "status", vendor.getStatus().toString()
                    ))
                    .build();
        } catch (IllegalArgumentException e) {
            LOGGER.log(Level.WARNING, "Invalid registration data: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error registering vendor", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to register vendor: " + e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/profile")
    public Response getVendorProfile() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            return Response.ok(vendor).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching vendor profile", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/evaluations")
    public Response getVendorEvaluations() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            List<VendorEvaluation> evaluations = vendorService.getEvaluations(vendor.getVendorId());
            return Response.ok(evaluations).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching evaluations", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/replenishment-requests")
    public Response getVendorReplenishmentRequests() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            List<ReplenishmentRequest> requests = vendorService.getReplenishmentRequests(vendor.getVendorId());
            return Response.ok(requests).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching replenishment requests", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/central-demand-pool")
    public Response getCentralDemandPoolRequests() {
        try {
            List<ReplenishmentRequest> pendingRequests = vendorService.getAllPendingReplenishmentRequests();
            return Response.ok(pendingRequests).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching central demand pool", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/replenishment-requests/{id}/fulfill")
    public Response fulfillRequest(@PathParam("id") Integer requestId) {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            ReplenishmentRequest updated = vendorService.fulfillReplenishmentRequest(requestId, vendor.getVendorId());
            return Response.ok(updated).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fulfilling replenishment request", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/replenishment-requests")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createReplenishmentRequest(ReplenishmentRequest request) {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = null;
            if (request.getVendor() != null && request.getVendor().getVendorId() != null) {
                vendor = vendorService.getAllVendors().stream()
                        .filter(v -> v.getVendorId().equals(request.getVendor().getVendorId()))
                        .findFirst()
                        .orElse(null);
            }

            if (vendor == null) {
                vendor = vendorService.findVendorByUsername(principal.getName());
            }

            if (vendor == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Vendor profile could not be determined for this replenishment request"))
                        .build();
            }

            request.setVendor(vendor);
            ReplenishmentRequest created = vendorService.createReplenishmentRequest(request);

            try {
                if (created.getWarehouse() != null && created.getProduct() != null) {
                    notificationService.sendReminderEmail(
                            created.getWarehouse(),
                            created.getProduct(),
                            created.getQuantity(),
                            10
                    );
                }
            } catch (Exception mailEx) {
                LOGGER.log(Level.WARNING, "Failed to send replenishment email", mailEx);
            }

            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error creating replenishment request", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/active-rfqs")
    public Response getActiveRfqsForVendor() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            List<RFQ> activeRfqs = vendorService.getActiveRfqs(vendor.getVendorId());
            return Response.ok(activeRfqs).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching active RFQs", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/my-quotations")
    public Response getMyQuotations() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            List<RfqResponse> quotations = vendorService.getVendorQuotations(vendor.getVendorId());
            return Response.ok(quotations).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching vendor quotations", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/responses")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response submitRfqResponse(
            @FormDataParam("rfqId") Long rfqId,
            @FormDataParam("unitPrice") BigDecimal unitPrice,
            @FormDataParam("leadTime") Integer leadTime,
            @FormDataParam("remarks") String remarks,
            @FormDataParam("quotationPdf") InputStream pdfInputStream,
            @FormDataParam("quotationPdf") FormDataContentDisposition fileDetail) {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            if (rfqId == null || unitPrice == null || leadTime == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Required fields (rfqId, unitPrice, leadTime) are missing"))
                        .build();
            }

            String originalFileName = (fileDetail != null) ? fileDetail.getFileName() : null;

            RfqResponse responseObj = vendorService.submitQuotationWithFile(
                    rfqId,
                    principal.getName(),
                    unitPrice,
                    leadTime,
                    remarks,
                    pdfInputStream,
                    originalFileName
            );

            return Response.status(Response.Status.CREATED)
                    .entity(Map.of("message", "Quotation submitted successfully", "responseId", responseObj.getResponseId()))
                    .build();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error submitting quotation response", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/orders")
    public Response getVendorOrders() {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            Vendor vendor = vendorService.findVendorByUsername(principal.getName());
            if (vendor == null) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Vendor profile not found"))
                        .build();
            }

            List<Map<String, Object>> orders = vendorService.getVendorOrdersDto(vendor.getVendorId());
            return Response.ok(orders).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error fetching vendor orders", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/orders/{id}/dispatch")
    public Response dispatchVendorOrder(@PathParam("id") String orderIdStr, Map<String, String> payload) {
        try {
            Principal principal = securityContext.getUserPrincipal();
            if (principal == null || principal.getName() == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "User not authenticated"))
                        .build();
            }

            String poReference = payload != null ? payload.get("poReference") : null;
            String trackingNumber = payload != null ? payload.get("trackingNumber") : null;

            boolean success = false;
            if (poReference != null && !poReference.trim().isEmpty()) {
                success = vendorService.updateOrderTrackingByRef(poReference, trackingNumber);
            } else {
                success = vendorService.dispatchVendorOrderByRef(orderIdStr);
            }

            if (success) {
                return Response.ok(Map.of("message", "Order dispatched successfully")).build();
            } else {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Failed to dispatch order"))
                        .build();
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error dispatching vendor order", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}