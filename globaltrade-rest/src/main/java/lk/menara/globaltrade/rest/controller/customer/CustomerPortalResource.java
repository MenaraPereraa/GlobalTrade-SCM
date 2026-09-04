package lk.menara.globaltrade.rest.controller.customer;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.dto.OrderRequestDTO;
import lk.menara.globaltrade.scm.bean.customer.CustomerPortalBean;

@Path("/customer")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerPortalResource {

    @Inject
    private CustomerPortalBean customerPortalBean;

    @GET
    @Path("/catalog")
    public Response getLiveCatalog() {
        return Response.ok(customerPortalBean.getAvailableCatalog()).build();
    }

    @POST
    @Path("/orders")
    public Response createSalesOrder(OrderRequestDTO orderDto) {
        var savedOrder = customerPortalBean.createSalesOrder(orderDto);
        return Response.status(Response.Status.CREATED).entity(savedOrder).build();
    }

    @GET
    @Path("/invoices/{orderId}")
    public Response downloadInvoice(@PathParam("orderId") Long orderId) {
        return Response.ok(customerPortalBean.generateInvoicePdf(orderId)).build();
    }

    @GET
    @Path("/tracking/{orderId}")
    public Response trackOrder(@PathParam("orderId") Long orderId) {
        return Response.ok(customerPortalBean.getTrackingDetails(orderId)).build();
    }
}