package lk.menara.globaltrade.scm.bean.scheduled;

import jakarta.ejb.EJB;
import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.ReplenishmentRequest;
import lk.menara.globaltrade.core.entity.Vendor;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.services.InventoryService;
import lk.menara.globaltrade.core.services.VendorService;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;

@Singleton
@Startup
public class InventoryReorderTimerBean {

    private static final Logger LOGGER = Logger.getLogger(InventoryReorderTimerBean.class.getName());

    @EJB
    private InventoryService inventoryService;

    @Inject
    private VendorService vendorService;

    @Inject
    private NotificationService notificationService;

    @Schedule(hour = "*/1", minute = "0", second = "0", persistent = false)
    public void checkLowStock() {
        LOGGER.info("Running Low Stock Check Timer");
        try {
            List<Inventory> lowStock = inventoryService.findLowStockItems();
            if (lowStock == null || lowStock.isEmpty()) {
                LOGGER.info("No low stock items found.");
                return;
            }

            for (Inventory item : lowStock) {
                if (item == null || item.getProduct() == null || item.getWarehouse() == null) {
                    continue;
                }

                int threshold = item.getReorderThreshold() != null ? item.getReorderThreshold() : 10;
                if (item.getQuantityOnHand() > threshold) {
                    continue;
                }

                String prodId = String.valueOf(item.getProduct().getProductId());
                int currentQty = item.getQuantityOnHand();

                Integer vendorId = 1;
                try {
                    if (item.getProduct().getClass().getMethod("getVendor") != null) {
                        Vendor v = (Vendor) item.getProduct().getClass().getMethod("getVendor").invoke(item.getProduct());
                        if (v != null && v.getVendorId() != null) {
                            vendorId = v.getVendorId();
                        }
                    }
                } catch (Exception ignored) {
                }

                List<ReplenishmentRequest> existingRequests = vendorService.getReplenishmentRequests(vendorId);
                boolean hasPending = false;

                if (existingRequests != null) {
                    hasPending = existingRequests.stream()
                            .anyMatch(req -> req != null &&
                                    req.getProduct() != null &&
                                    req.getProduct().getProductId() != null &&
                                    String.valueOf(req.getProduct().getProductId()).equals(prodId) &&
                                    (req.getStatus() == RequestStatus.PENDING ||
                                            req.getStatus().name().equals("IN_PROGRESS") ||
                                            req.getStatus().name().equals("ROUTE_PLANNED")));
                }

                if (hasPending) {
                    continue;
                }

                try {
                    notificationService.sendLowStockAlert(item.getWarehouse(), item.getProduct(), currentQty, threshold);
                    LOGGER.info("Low stock alert email triggered via NotificationService for Product ID: " + prodId + " in Warehouse: " + item.getWarehouse().getName());
                } catch (Exception mailEx) {
                    LOGGER.severe("Failed to trigger NotificationService email: " + mailEx.getMessage());
                }

                Vendor vendor = vendorService.getVendorProfile(vendorId);

                ReplenishmentRequest request = new ReplenishmentRequest();
                request.setWarehouse(item.getWarehouse());
                request.setProduct(item.getProduct()); // Product object එක ලබා දී ඇත
                request.setVendor(vendor);
                request.setQuantity(threshold * 2);
                request.setStatus(RequestStatus.PENDING);
                request.setCreatedByTimer(true);
                request.setCreatedAt(LocalDateTime.now());

                vendorService.createReplenishmentRequest(request);
                LOGGER.info("Automatic Replenishment Request created for Product ID: " + prodId + " with Vendor ID: " + vendorId);
            }

        } catch (Exception e) {
            LOGGER.severe("Error in Low Stock Timer: " + e.getMessage());
            e.printStackTrace();
        }
    }
}