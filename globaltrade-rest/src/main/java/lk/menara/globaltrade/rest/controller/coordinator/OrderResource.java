package lk.menara.globaltrade.rest.controller.coordinator;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.entity.Customer;
import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.entity.Vendor;
import lk.menara.globaltrade.core.enums.OrderStatus;
import lk.menara.globaltrade.core.services.OrderService;

import java.time.LocalDateTime;
import java.util.List;

@Path("/purchase-orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrderResource {

    @Inject
    private OrderService orderService;

    @PersistenceContext
    private EntityManager entityManager;

    @GET
    public Response getAllOrders() {
        try {
            List<Order> orders = orderService.findAllOrders();
            return Response.ok(orders).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @POST
    public Response createOrder(Order order) {
        try {
            if (order.getOrderDate() == null) {
                order.setOrderDate(LocalDateTime.now());
            }
            if (order.getStatus() == null) {
                order.setStatus(OrderStatus.PENDING);
            }

            if (order.getCustomer() == null || order.getCustomer().getCustomerId() == null) {
                try {
                    Customer defaultCustomer = entityManager.createQuery("SELECT c FROM Customer c", Customer.class)
                            .setMaxResults(1)
                            .getSingleResult();
                    order.setCustomer(defaultCustomer);
                } catch (Exception ex) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity("{\"error\": \"No customers found in database. Please add a customer first.\"}")
                            .build();
                }
            }

            if (order.getVendor() == null || order.getVendor().getVendorId() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Vendor information is missing or null in request payload.\"}")
                        .build();
            }

            Vendor vendor = entityManager.find(Vendor.class, order.getVendor().getVendorId());
            if (vendor == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Vendor not found in database.\"}")
                        .build();
            }
            order.setVendor(vendor);

            Order created = orderService.createOrder(order);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @GET
    @Path("/{id}")
    public Response getOrderById(@PathParam("id") Integer id) {
        try {
            Order order = orderService.findOrderById(id);
            if (order != null) {
                return Response.ok(order).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Order not found with ID: " + id + "\"}")
                        .build();
            }
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @GET
    @Path("/approved")
    public Response getApprovedOrders() {
        try {
            List<Order> orders = orderService.findOrdersByStatus(OrderStatus.APPROVED);
            return Response.ok(orders).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @PUT
    @Path("/{id}/status")
    public Response updateOrderStatus(@PathParam("id") Integer id, @QueryParam("status") OrderStatus status) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(id, status);
            if (updatedOrder != null) {
                return Response.ok(updatedOrder).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Order not found with ID: " + id + "\"}")
                        .build();
            }
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}