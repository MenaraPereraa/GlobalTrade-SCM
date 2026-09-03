package lk.menara.globaltrade.rest.controller.warehouse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.scm.bean.warehouse.ProductBean;

import java.util.List;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @Inject
    private ProductBean productBean;

    @POST
    @RolesAllowed({"ADMIN", "WAREHOUSE_MANAGER"})
    public Response createProduct(Product product) {
        Product created = productBean.createProduct(product);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @RolesAllowed({"ADMIN", "COORDINATOR", "WAREHOUSE_MANAGER", "VENDOR_REP"})
    public Response getAllProducts() {
        List<Product> products = productBean.getAllProducts();
        return Response.ok(products).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "COORDINATOR", "WAREHOUSE_MANAGER"})
    public Response getProductById(@PathParam("id") Integer id) {
        Product product = productBean.getProductById(id);
        return Response.ok(product).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "WAREHOUSE_MANAGER"})
    public Response updateProduct(@PathParam("id") Integer id, Product product) {
        Product updated = productBean.updateProduct(id, product);
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN"})
    public Response deleteProduct(@PathParam("id") Integer id) {
        productBean.deleteProduct(id);
        return Response.noContent().build();
    }
}