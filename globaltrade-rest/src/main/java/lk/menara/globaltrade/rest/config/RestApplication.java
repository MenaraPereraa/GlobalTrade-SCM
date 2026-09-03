package lk.menara.globaltrade.rest.config;

import jakarta.annotation.security.DeclareRoles;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import lk.menara.globaltrade.logs.resource.AuditLogResource;
import lk.menara.globaltrade.rest.controller.FileDownloadResource;
import lk.menara.globaltrade.rest.controller.admin.AdminUserResource;
import lk.menara.globaltrade.rest.controller.coordinator.LogisticsCoordinatorResource;
import lk.menara.globaltrade.rest.controller.coordinator.OrderResource;
import lk.menara.globaltrade.rest.controller.coordinator.RFQResource;
import lk.menara.globaltrade.rest.controller.customs.CustomsResource;
import lk.menara.globaltrade.rest.controller.vendor.VendorResource;
import lk.menara.globaltrade.rest.controller.warehouse.InventoryResource;
import lk.menara.globaltrade.rest.controller.warehouse.LogisticsResource;
import lk.menara.globaltrade.rest.controller.warehouse.ProductResource;
import lk.menara.globaltrade.rest.controller.warehouse.WarehouseResource;
import lk.menara.globaltrade.rest.security.AuthResource;
import org.glassfish.jersey.media.multipart.MultiPartFeature;

import java.util.Set;

@ApplicationPath("/api")
@DeclareRoles({
        "ADMIN",
        "SUPER_ADMIN",
        "WAREHOUSE_MANAGER",
        "COORDINATOR",
        "CUSTOMS_AGENT",
        "CUSTOM_AGENT",
        "VENDOR_REPRESENTATIVE",
        "VENDOR_REP",
        "CUSTOMER"
})
public class RestApplication extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        return Set.of(
                AuthResource.class,
                WarehouseResource.class,
                InventoryResource.class,
                LogisticsResource.class,
                ProductResource.class,
                CustomsResource.class,
                VendorResource.class,
                LogisticsCoordinatorResource.class,
                OrderResource.class,
                AdminUserResource.class,
                AuditLogResource.class,
                RFQResource.class,
                MultiPartFeature.class,
                FileDownloadResource.class
        );
    }
}