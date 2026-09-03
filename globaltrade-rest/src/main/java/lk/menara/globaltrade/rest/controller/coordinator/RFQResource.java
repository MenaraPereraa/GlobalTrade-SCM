package lk.menara.globaltrade.rest.controller.coordinator;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.dto.RFQDTO;
import lk.menara.globaltrade.core.entity.PurchaseOrder;
import lk.menara.globaltrade.core.entity.RFQ;
import lk.menara.globaltrade.core.entity.RfqResponse;
import lk.menara.globaltrade.core.services.RFQService;

import java.io.File;
import java.util.List;
import java.util.Map;

@Path("/coordinator")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RFQResource {

    @Inject
    private RFQService rfqService;

    @GET
    @Path("/rfq")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public List<RFQ> getAllRFQs() {
        return rfqService.getAllRFQs();
    }

    @POST
    @Path("/rfq")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public Response createRFQ(RFQDTO dto) {
        try {
            RFQ rfq = rfqService.createRFQ(dto);
            return Response.status(Response.Status.CREATED).entity(rfq).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }

    @GET
    @Path("/rfq/{rfqId}/bids")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public List<RfqResponse> getBidsByRfqId(@PathParam("rfqId") Long rfqId) {
        return rfqService.getBidsByRfqId(rfqId);
    }

    @POST
    @Path("/rfq/bids/{responseId}/accept")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public Response acceptBid(@PathParam("responseId") Long responseId) {
        try {
            PurchaseOrder po = rfqService.acceptBid(responseId);
            return Response.ok(po).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }

    @POST
    @Path("/rfq/{rfqId}/route")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public Response saveRoute(@PathParam("rfqId") Long rfqId, Map<String, Object> routeData) {
        try {
            rfqService.saveRoute(rfqId, routeData);
            return Response.ok().entity("Route saved successfully").build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
    }

    @GET
    @Path("/rfq/{rfqId}/fulfillment")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN"})
    public Map<String, Object> getRfqFulfillmentDetails(@PathParam("rfqId") Long rfqId) {
        return rfqService.getRfqFulfillmentDetails(rfqId);
    }

    @POST
    @Path("/documents/generate")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN", "CUSTOM_AGENT", "VENDOR"})
    @Produces({"application/pdf", MediaType.TEXT_PLAIN})
    @Consumes({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.WILDCARD})
    public Response generateDocument(Map<String, Object> requestPayload) {
        try {
            String docType = (String) requestPayload.get("docType");
            Long rfqId = requestPayload.get("rfqId") != null ? Long.valueOf(requestPayload.get("rfqId").toString()) : null;

            File file = rfqService.generateOrGetDocumentPdf(docType, rfqId, requestPayload);
            if (file == null || !file.exists()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .type(MediaType.TEXT_PLAIN)
                        .entity("Document file could not be generated or found.")
                        .build();
            }

            return Response.ok(file, "application/pdf")
                    .type("application/pdf")
                    .header("Content-Disposition", "inline; filename=\"" + file.getName() + "\"")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .type(MediaType.TEXT_PLAIN)
                    .entity("Error generating document: " + e.getMessage())
                    .build();
        }
    }

    @GET
    @Path("/documents/preview")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN", "CUSTOM_AGENT", "VENDOR"})
    @Produces("application/pdf")
    public Response previewDocument(@QueryParam("path") String path, @QueryParam("rfqId") Long rfqId, @QueryParam("docType") String docType) {
        try {
            File file = rfqService.generateOrGetDocumentPdf(docType, rfqId, null);

            if (file == null || !file.exists()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("PDF file not found on server.")
                        .build();
            }

            return Response.ok(file, "application/pdf")
                    .header("Content-Disposition", "inline; filename=\"" + file.getName() + "\"")
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error: " + e.getMessage())
                    .build();
        }
    }

    @GET
    @Path("/uploads/{filename}")
    @RolesAllowed({"ADMIN", "COORDINATOR", "SUPER_ADMIN", "CUSTOM_AGENT", "VENDOR"})
    @Produces("application/pdf")
    public Response downloadUploadedPdf(@PathParam("filename") String filename) {
        try {
            // ඩෙස්ක්ටොප් එකේ ඔබ සෑදූ ෆෝල්ඩරයේ නිවැරදි පාත් එක (ජාවා වලදී ස්ලෑෂ් / මාරු කර දැමිය යුතුය)
            String uploadDir = "C:/Users/Lenovo/Desktop/QuotationsFolder/";
            File file = new File(uploadDir + filename);

            if (!file.exists()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("PDF file not found on server: " + filename)
                        .build();
            }

            return Response.ok(file, "application/pdf")
                    .header("Content-Disposition", "inline; filename=\"" + file.getName() + "\"")
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error loading PDF: " + e.getMessage())
                    .build();
        }
    }

}