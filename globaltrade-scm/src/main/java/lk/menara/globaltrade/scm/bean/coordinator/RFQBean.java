package lk.menara.globaltrade.scm.bean.coordinator;

import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.dto.RFQDTO;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.services.RFQService;
import lk.menara.globaltrade.scm.bean.service.NotificationService;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Stateless
public class RFQBean implements RFQService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private NotificationService notificationService;

    @Override
    public List<RFQ> getAllRFQs() {
        return em.createQuery("SELECT r FROM RFQ r ORDER BY r.rfqId DESC", RFQ.class).getResultList();
    }

    @Override
    public List<ReplenishmentRequest> getAllPendingReplenishmentRequests() {
        return em.createQuery(
                        "SELECT r FROM ReplenishmentRequest r " +
                                "JOIN FETCH r.warehouse w " +
                                "JOIN FETCH r.product p " +
                                "WHERE r.status = :status " +
                                "ORDER BY r.createdAt DESC",
                        ReplenishmentRequest.class)
                .setParameter("status", RequestStatus.PENDING)
                .getResultList();
    }

    @Override
    public RFQ createRFQ(RFQDTO dto) throws Exception {
        if (dto.getProductId() == null || dto.getRequestedQuantity() == null || dto.getUserId() == null) {
            throw new IllegalArgumentException("Product ID, Requested Quantity, and User ID are required.");
        }

        Long productId = dto.getProductId().longValue();
        Integer userId = dto.getUserId().intValue();

        Product product = em.find(Product.class, productId);
        if (product == null) {
            throw new IllegalArgumentException("Invalid Product ID provided: " + productId);
        }

        User user = em.find(User.class, userId);
        if (user == null) {
            throw new IllegalArgumentException("Invalid User ID provided (" + userId + "): No matching user found in the database.");
        }

        RFQ rfq = new RFQ();
        rfq.setProduct(product);

        // 1. Qty Logic: 20 හෝ DTO එකෙන් එන අගය
        rfq.setRequestedQuantity(dto.getRequestedQuantity() != null ? dto.getRequestedQuantity() : 20);

        // 2. Expected Date / Target Delivery Date Logic: දින 7කින් ලැබීමට සකස් කිරීම
        if (dto.getTargetDeliveryDate() != null) {
            rfq.setTargetDeliveryDate(dto.getTargetDeliveryDate());
        } else {
            rfq.setTargetDeliveryDate(java.sql.Date.valueOf(LocalDate.now().plusDays(7)));
        }

        rfq.setStatus(RFQStatus.OPEN);
        rfq.setCreatedBy(user);

        em.persist(rfq);
        em.flush(); // මෙතැනදී ජනනය වන rfqId එක ඉන්ප ඉදිරියට සියලු තැන්වලට භාවිතා වේ.

        if (dto.getReqId() != null) {
            ReplenishmentRequest replenishmentReq = em.find(ReplenishmentRequest.class, dto.getReqId().intValue());
            if (replenishmentReq != null) {
                replenishmentReq.setStatus(RequestStatus.IN_PROGRESS);
                em.merge(replenishmentReq);
            }
        }

        String productCategoryName = "General";
        try {
            productCategoryName = em.createQuery(
                            "SELECT c.name FROM Category c JOIN Product p ON c.categoryId = p.category.categoryId WHERE p.productId = :productId", String.class)
                    .setParameter("productId", productId)
                    .getSingleResult();
        } catch (Exception e) {
            productCategoryName = "General";
        }

        // Category එකට අදාළ vendor ලා පමණක් ෆිල්ටර් කිරීම
        List<Vendor> matchingVendors = em.createQuery(
                        "SELECT v FROM Vendor v WHERE v.category = :category OR v.category = 'Both'", Vendor.class)
                .setParameter("category", productCategoryName)
                .getResultList();

        // 3. Async විදිහට අදාළ Vendor ලාට ඊමේල් යැවීම
        for (Vendor vendor : matchingVendors) {
            String vendorEmail = vendor.getEmail() != null ? vendor.getEmail() : vendor.getContactEmail();
            if (vendorEmail != null && !vendorEmail.trim().isEmpty()) {
                String vendorHtmlBody = String.format(
                        "<div style='font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 650px; background-color: #ffffff;'>" +
                                "<h2 style='color: #059669; border-bottom: 2px solid #a7f3d0; padding-bottom: 12px; margin-top: 0;'>NEW RFQ AVAILABLE</h2>" +
                                "<p style='color: #1e293b; font-size: 15px; font-weight: bold;'>RFQ ID: #%d</p>" +
                                "<hr style='border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;'/>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Product:</b> %s</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Requested Quantity:</b> %d</p>" +
                                "<p style='color: #475569; margin-top: 15px;'>A new Request for Quotation has been published. Please log in to submit your bid.</p>" +
                                "</div>",
                        rfq.getRfqId(),
                        product.getName(),
                        rfq.getRequestedQuantity()
                );

                // Async Notification Call (Thread හරහා හෝ NotificationService මඟින් Async ක්‍රියාත්මක වේ)
                new Thread(() -> {
                    try {
                        notificationService.sendEmail(vendorEmail, "New RFQ Published - Global Trade", vendorHtmlBody);
                    } catch (Exception ignored) {}
                }).start();
            }
        }

        return rfq;
    }

    @Override
    public List<RfqResponse> getBidsByRfqId(Long rfqId) {
        return em.createQuery(
                        "SELECT r FROM RfqResponse r WHERE r.rfq.rfqId = :rfqId ORDER BY r.responseId DESC", RfqResponse.class)
                .setParameter("rfqId", rfqId)
                .getResultList();
    }

    @Override
    public PurchaseOrder acceptBid(Long responseId) throws Exception {
        RfqResponse acceptedResponse = em.find(RfqResponse.class, responseId);
        if (acceptedResponse == null) {
            throw new IllegalArgumentException("Invalid Bid Response ID provided.");
        }

        RFQ rfq = acceptedResponse.getRfq();
        Long rfqId = rfq.getRfqId();

        // අනෙක් සියලුම bids Auto-Reject කිරීම
        em.createQuery("UPDATE RfqResponse r SET r.status = 'REJECTED' WHERE r.rfq.rfqId = :rfqId AND r.responseId != :responseId")
                .setParameter("rfqId", rfqId)
                .setParameter("responseId", responseId)
                .executeUpdate();

        acceptedResponse.setStatus("ACCEPTED");
        em.merge(acceptedResponse);

        rfq.setStatus(RFQStatus.CONFIRMED);
        em.merge(rfq);

        PurchaseOrder po = new PurchaseOrder();
        po.setRfqResponseId(acceptedResponse.getResponseId());

        if (acceptedResponse.getVendor() != null) {
            po.setVendorId(acceptedResponse.getVendor().getVendorId().longValue());
        }

        BigDecimal totalAmount = acceptedResponse.getOfferedUnitPrice()
                .multiply(BigDecimal.valueOf(rfq.getRequestedQuantity()));
        po.setTotalAmount(totalAmount);
        po.setStatus("ISSUED");
        po.setDestinationWarehouseId(1L);
        po.setCreatedBy(rfq.getCreatedBy() != null ? rfq.getCreatedBy().getUserId().longValue() : 1L);

        em.persist(po);
        em.flush(); // poId එක ලබා ගැනීමට flush කිරීම අත්‍යවශ්‍ය වේ

        // 4. PO Number එක Database එකේ Save වන ආකාරයට සැකසීම (උදා: PO-8550006)
        long customPoId = po.getPoId() + 8550000;
        String generatedPoNumber = "PO-" + customPoId;

        PurchaseOrderItem poItem = new PurchaseOrderItem();
        poItem.setPoId(po.getPoId());
        poItem.setProductId(rfq.getProduct().getProductId());
        poItem.setQuantity(rfq.getRequestedQuantity());
        poItem.setUnitPrice(acceptedResponse.getOfferedUnitPrice());
        em.persist(poItem);

        Product product = rfq.getProduct();
        Vendor winningVendor = acceptedResponse.getVendor();
        if (winningVendor != null) {
            String vendorEmail = winningVendor.getEmail() != null ? winningVendor.getEmail() : winningVendor.getContactEmail();
            if (vendorEmail != null && !vendorEmail.trim().isEmpty()) {
                String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("M/d/yyyy"));

                String emailBody = String.format(
                        "<div style='font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 650px; background-color: #ffffff;'>" +
                                "<h2 style='color: #059669; border-bottom: 2px solid #a7f3d0; padding-bottom: 12px; margin-top: 0;'>PURCHASE ORDER & CUSTOMS PERMIT</h2>" +
                                "<p style='color: #1e293b; font-size: 15px; font-weight: bold;'>PO Ref: %s</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Date:</b> %s</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>RFQ ID:</b> #%d</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Product:</b> %s</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Quantity:</b> %d</p>" +
                                "<p style='color: #334155; margin: 6px 0;'><b>Total Amount:</b> $%.2f</p>" +
                                "</div>",
                        generatedPoNumber, currentDate, rfq.getRfqId(),
                        product.getName(),
                        rfq.getRequestedQuantity(),
                        totalAmount
                );

                new Thread(() -> {
                    try {
                        notificationService.sendEmail(vendorEmail, "Customs Import Permit & PO - Global Trade", emailBody);
                    } catch (Exception ignored) {}
                }).start();
            }
        }

        return po;
    }

    @Override
    public void saveRoute(Long rfqId, Map<String, Object> routeData) throws Exception {
        RFQ rfq = em.find(RFQ.class, rfqId);
        if (rfq == null) {
            throw new IllegalArgumentException("RFQ not found for ID: " + rfqId);
        }

        rfq.setStatus(RFQStatus.CONFIRMED);

        if (routeData.containsKey("mode")) {
            rfq.setTransportMode((String) routeData.get("mode"));
        }
        if (routeData.containsKey("carrierName")) {
            rfq.setCarrier((String) routeData.get("carrierName"));
        }

        em.merge(rfq);
    }

    @Override
    public Map<String, Object> getRfqFulfillmentDetails(Long rfqId) {
        Map<String, Object> details = new HashMap<>();
        RFQ rfq = em.find(RFQ.class, rfqId);

        if (rfq == null) {
            details.put("error", "RFQ not found");
            return details;
        }

        List<PurchaseOrder> pos = em.createQuery(
                        "SELECT po FROM PurchaseOrder po " +
                                "JOIN RfqResponse resp ON po.rfqResponseId = resp.responseId " +
                                "WHERE resp.rfq.rfqId = :rfqId", PurchaseOrder.class)
                .setParameter("rfqId", rfqId)
                .getResultList();

        PurchaseOrder po = pos.isEmpty() ? null : pos.get(0);

        boolean isDispatched = false;
        String poStatus = "PENDING";
        String trackingNo = "";
        String poRef = "";
        String vendorName = "";
        BigDecimal unitPrice = BigDecimal.ZERO;

        if (po != null) {
            poStatus = po.getStatus() != null ? po.getStatus().toUpperCase() : "ISSUED";
            trackingNo = po.getTrackingNumber() != null ? po.getTrackingNumber() : "";
            poRef = "PO-" + (8550000 + po.getPoId());

            if ("DISPATCHED".equals(poStatus) || "IN_TRANSIT".equals(poStatus)
                    || "TRACKING_UPDATED".equals(poStatus) || "TRACKING".equals(poStatus)
                    || "COMPLETE".equals(poStatus) || "COMPLETED".equals(poStatus)) {
                isDispatched = true;
            }

            if (po.getVendorId() != null) {
                Vendor vendor = em.find(Vendor.class, po.getVendorId().intValue());
                if (vendor != null) {
                    vendorName = vendor.getVendorName() != null ? vendor.getVendorName() : "";
                }
            }

            List<PurchaseOrderItem> items = em.createQuery(
                            "SELECT i FROM PurchaseOrderItem i WHERE i.poId = :poId", PurchaseOrderItem.class)
                    .setParameter("poId", po.getPoId())
                    .getResultList();
            if (!items.isEmpty() && items.get(0).getUnitPrice() != null) {
                unitPrice = items.get(0).getUnitPrice();
            }
        }

        boolean hasInvoice = rfq.getCustomsDocPath() != null && !rfq.getCustomsDocPath().isEmpty();
        String invoicePath = hasInvoice ? rfq.getCustomsDocPath() : "";

        boolean hasBol = rfq.getBolPath() != null && !rfq.getBolPath().isEmpty();
        String bolPath = hasBol ? rfq.getBolPath() : "";

        details.put("rfqId", rfqId);
        details.put("poRef", poRef);
        details.put("poStatus", poStatus);
        details.put("isDispatched", isDispatched);
        details.put("vendorName", vendorName);
        details.put("unitPrice", unitPrice);
        details.put("hasInvoice", hasInvoice);
        details.put("invoicePath", invoicePath);
        details.put("hasBol", hasBol);
        details.put("bolPath", bolPath);
        details.put("trackingNumber", trackingNo);
        details.put("transportMode", rfq.getTransportMode());
        details.put("carrier", rfq.getCarrier());
        details.put("isCustomsCleared", false);

        return details;
    }

    @Override
    public File generateOrGetDocumentPdf(String docType, Long rfqId, Map<String, Object> requestPayload) throws Exception {
        // F ඩ්‍රයිව් එකේ සැබෑ බාහිර ෆෝල්ඩරය
        File folder = new File("F:/globaltrade_uploads/");
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String fileName;
        if (docType != null && docType.toLowerCase().endsWith(".pdf")) {
            fileName = docType;
        } else {
            String type = (docType != null ? docType.toLowerCase() : "doc");
            fileName = type + "_" + (rfqId != null ? rfqId : "default") + ".pdf";
        }

        File file = new File(folder, fileName);

        if (!file.exists()) {
            File defaultFile = new File(folder, "default.pdf");
            if (!defaultFile.exists()) {
                defaultFile.createNewFile();
            }
            return defaultFile;
        }

        return file;
    }

}