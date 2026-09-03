package lk.menara.globaltrade.scm.bean.vendor;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RFQStatus;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.core.enums.VendorStatus;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.core.services.VendorService;

import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

@Stateless
public class VendorBean implements VendorService {

    private static final Logger LOGGER = Logger.getLogger(VendorBean.class.getName());

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    private static final String UPLOAD_DIR = "C:/Users/Lenovo/Desktop/QuotationsFolder/";

    @Override
    public Vendor findVendorByUsername(String username) {
        try {
            List<Vendor> vendors = em.createQuery(
                            "SELECT v FROM Vendor v WHERE v.user.username = :username",
                            Vendor.class)
                    .setParameter("username", username)
                    .getResultList();

            return (vendors != null && !vendors.isEmpty()) ? vendors.get(0) : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Vendor getVendorProfile(Integer vendorId) {
        Vendor vendor = em.find(Vendor.class, vendorId);
        if (vendor == null) {
            throw new ResourceNotFoundException("Vendor not found: " + vendorId);
        }
        return vendor;
    }

    @Override
    public List<Vendor> getAllVendors() {
        return em.createQuery("SELECT v FROM Vendor v", Vendor.class).getResultList();
    }

    @Override
    public List<ReplenishmentRequest> getReplenishmentRequests(Integer vendorId) {
        return em.createQuery(
                        "SELECT r FROM ReplenishmentRequest r " +
                                "JOIN FETCH r.warehouse w " +
                                "JOIN FETCH r.product p " +
                                "WHERE r.vendor.vendorId = :vendorId " +
                                "ORDER BY r.createdAt DESC",
                        ReplenishmentRequest.class)
                .setParameter("vendorId", vendorId)
                .getResultList();
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public ReplenishmentRequest createReplenishmentRequest(ReplenishmentRequest request) {
        Product product = null;

        if (request.getProduct() != null && request.getProduct().getProductId() != null) {
            product = em.find(Product.class, request.getProduct().getProductId());
        }

        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null for replenishment request.");
        }

        request.setProduct(product);

        if (request.getWarehouse() != null && request.getWarehouse().getWarehouseId() != null) {
            request.setWarehouse(em.merge(request.getWarehouse()));
        }
        if (request.getVendor() != null && request.getVendor().getVendorId() != null) {
            request.setVendor(em.find(Vendor.class, request.getVendor().getVendorId()));
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            request.setQuantity(1);
        }

        if (request.getStatus() == null) {
            request.setStatus(RequestStatus.PENDING);
        }
        if (request.getCreatedAt() == null) {
            request.setCreatedAt(LocalDateTime.now());
        }
        if (request.getCreatedByTimer() == null) {
            request.setCreatedByTimer(false);
        }

        em.persist(request);
        return request;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public ReplenishmentRequest fulfillReplenishmentRequest(Integer requestId, Integer vendorId) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request == null) {
            throw new ResourceNotFoundException("Replenishment request not found: " + requestId);
        }
        if (!request.getVendor().getVendorId().equals(vendorId)) {
            throw new SecurityException("Request does not belong to vendor " + vendorId);
        }

        request.setStatus(RequestStatus.FULFILLED);
        em.merge(request);
        return request;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public ReplenishmentRequest updateRequestStatus(Integer requestId, Integer vendorId, RequestStatus status) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request == null) {
            throw new ResourceNotFoundException("Replenishment request not found: " + requestId);
        }
        if (!request.getVendor().getVendorId().equals(vendorId)) {
            throw new SecurityException("Request does not belong to vendor " + vendorId);
        }

        request.setStatus(status);
        em.merge(request);
        return request;
    }

    @Override
    public List<VendorEvaluation> getEvaluations(Integer vendorId) {
        return em.createQuery(
                        "SELECT e FROM VendorEvaluation e " +
                                "WHERE e.vendor.vendorId = :vendorId " +
                                "ORDER BY e.evaluationDate DESC",
                        VendorEvaluation.class)
                .setParameter("vendorId", vendorId)
                .getResultList();
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Vendor updateVendorStatus(Integer vendorId, VendorStatus status) {
        Vendor vendor = em.find(Vendor.class, vendorId);
        if (vendor == null) {
            throw new ResourceNotFoundException("Vendor not found: " + vendorId);
        }
        vendor.setStatus(status);
        em.merge(vendor);
        return vendor;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public RfqResponse submitRfqResponse(Long rfqId, String username, BigDecimal unitPrice, Integer leadTime, String remarks, String quotationPdfPath) {
        Vendor vendor = findVendorByUsername(username);
        if (vendor == null) {
            throw new ResourceNotFoundException("Vendor profile not found for username: " + username);
        }

        RFQ rfq = em.find(RFQ.class, rfqId);
        if (rfq == null) {
            throw new ResourceNotFoundException("RFQ not found with ID: " + rfqId);
        }

        RfqResponse response = new RfqResponse();
        response.setRfq(rfq);
        response.setVendor(vendor);
        response.setOfferedUnitPrice(unitPrice);
        response.setEstimatedLeadTimeDays(leadTime);
        response.setRemarks(remarks);
        response.setQuotationPdfPath(quotationPdfPath);
        response.setStatus("PENDING");

        em.persist(response);
        return response;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public RfqResponse submitQuotationWithFile(Long rfqId, String username, BigDecimal unitPrice, Integer leadTime, String remarks, InputStream pdfInputStream, String originalFileName) throws Exception {
        File customDir = new File(UPLOAD_DIR);
        if (!customDir.exists()) {
            customDir.mkdirs();
        }

        String fileName = (originalFileName != null && !originalFileName.isEmpty())
                ? System.currentTimeMillis() + "_" + originalFileName
                : "quotation.pdf";

        Path filePath = Paths.get(UPLOAD_DIR, fileName);
        if (pdfInputStream != null) {
            Files.copy(pdfInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return submitRfqResponse(rfqId, username, unitPrice, leadTime, remarks, fileName);
    }

    @Override
    public File getQuotationFile(String filename) {
        return new File(UPLOAD_DIR, filename);
    }

    @Override
    public List<RFQ> getActiveRfqs(Integer vendorId) {
        return em.createQuery(
                        "SELECT r FROM RFQ r JOIN FETCH r.product p " +
                                "WHERE (r.status = :status1 OR r.status = :status2 OR r.status = :status3) " +
                                "AND r.rfqId NOT IN (SELECT resp.rfq.rfqId FROM RfqResponse resp WHERE resp.vendor.vendorId = :vendorId) " +
                                "ORDER BY r.rfqId DESC",
                        RFQ.class)
                .setParameter("status1", RFQStatus.OPEN)
                .setParameter("status2", RFQStatus.PENDING)
                .setParameter("status3", RFQStatus.CONFIRMED)
                .setParameter("vendorId", vendorId)
                .getResultList();
    }

    @Override
    public List<RfqResponse> getVendorQuotations(Integer vendorId) {
        return em.createQuery(
                        "SELECT resp FROM RfqResponse resp JOIN FETCH resp.rfq WHERE resp.vendor.vendorId = :vendorId ORDER BY resp.responseId DESC",
                        RfqResponse.class)
                .setParameter("vendorId", vendorId)
                .getResultList();
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public ReplenishmentRequest dispatchReplenishmentWithDoc(Integer requestId, Integer vendorId, String documentPath) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request != null) {
            request.setStatus(RequestStatus.DISPATCHED);
            em.merge(request);
        }
        return request;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public ReplenishmentRequest rejectReplenishmentRequest(Integer requestId, Integer vendorId) {
        ReplenishmentRequest request = em.find(ReplenishmentRequest.class, requestId);
        if (request == null) {
            throw new ResourceNotFoundException("Replenishment request not found: " + requestId);
        }
        if (!request.getVendor().getVendorId().equals(vendorId)) {
            throw new SecurityException("Request does not belong to vendor " + vendorId);
        }

        request.setStatus(RequestStatus.REJECTED);
        em.merge(request);
        return request;
    }

    @Override
    public List<Map<String, Object>> getVendorOrdersDto(Integer vendorId) {
        List<Object[]> results = em.createQuery(
                        "SELECT po, r FROM PurchaseOrder po " +
                                "JOIN RfqResponse r ON po.rfqResponseId = r.responseId " +
                                "WHERE r.vendor.vendorId = :vendorId", Object[].class)
                .setParameter("vendorId", vendorId)
                .getResultList();

        List<Map<String, Object>> orderDtos = new ArrayList<>();
        for (Object[] row : results) {
            PurchaseOrder po = (PurchaseOrder) row[0];
            RfqResponse r = (RfqResponse) row[1];

            Map<String, Object> map = new HashMap<>();
            map.put("poId", po.getPoId());

            String formattedPoRef = "PO-" + (8550000 + po.getPoId());
            map.put("poReference", formattedPoRef);

            Long actualRfqId = (r.getRfq() != null && r.getRfq().getRfqId() != null) ? r.getRfq().getRfqId() : 1L;
            map.put("rfqId", actualRfqId);
            map.put("rfqReference", actualRfqId);

            map.put("status", po.getStatus());
            map.put("trackingNumber", po.getTrackingNumber());

            String productName = "Imported Goods";
            if (r.getRfq() != null && r.getRfq().getProduct() != null) {
                productName = r.getRfq().getProduct().getName();
            }
            map.put("productName", productName);

            Integer requestedQty = 100;
            if (r.getRfq() != null && r.getRfq().getRequestedQuantity() != null) {
                requestedQty = r.getRfq().getRequestedQuantity();
            }
            map.put("quantity", requestedQty);

            orderDtos.add(map);
        }
        return orderDtos;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public boolean dispatchVendorOrderByRef(String poRef) {
        try {
            String cleanRef = poRef.replace("PO-", "").trim();
            Long poId;

            if (cleanRef.startsWith("85500")) {
                poId = Long.parseLong(cleanRef.substring(5));
            } else {
                poId = Long.parseLong(cleanRef);
            }

            PurchaseOrder po = em.find(PurchaseOrder.class, poId);
            if (po != null) {
                po.setStatus("DISPATCHED");

                if (po.getTrackingNumber() == null || po.getTrackingNumber().trim().isEmpty()) {
                    po.setTrackingNumber("BOL-" + (int)(Math.random() * 900000 + 100000));
                }

                em.merge(po);

                if (po.getRfqResponseId() != null) {
                    RfqResponse rfqResponse = em.find(RfqResponse.class, po.getRfqResponseId());
                    if (rfqResponse != null && rfqResponse.getRfq() != null) {
                        RFQ rfq = rfqResponse.getRfq();
                        Long rfqId = rfq.getRfqId();

                        rfq.setDispatchedAt(LocalDateTime.now());
                        rfq.setInvoicePath("invoice_" + rfqId + ".pdf");
                        rfq.setBolPath("bol_" + rfqId + ".pdf");
                        rfq.setCustomsDocPath("customs_" + rfqId + ".pdf");
                        rfq.setImportPermitPath("import_permit_" + rfqId + ".pdf");

                        em.merge(rfq);
                    }
                }

                em.flush();
                return true;
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error dispatching PO by ref", e);
        }
        return false;
    }

    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public boolean updateOrderTrackingByRef(String poRef, String trackingNumber) {
        try {
            String cleanRef = poRef.replace("PO-", "").trim();
            Long poId;

            if (cleanRef.startsWith("85500")) {
                poId = Long.parseLong(cleanRef.substring(5));
            } else {
                poId = Long.parseLong(cleanRef);
            }

            PurchaseOrder po = em.find(PurchaseOrder.class, poId);
            if (po != null) {
                if (trackingNumber != null && !trackingNumber.trim().isEmpty()) {
                    po.setTrackingNumber(trackingNumber);
                } else if (po.getTrackingNumber() == null || po.getTrackingNumber().trim().isEmpty()) {
                    po.setTrackingNumber("BOL-" + (int)(Math.random() * 900000 + 100000));
                }
                po.setStatus("DISPATCHED");
                em.merge(po);

                if (po.getRfqResponseId() != null) {
                    RfqResponse rfqResponse = em.find(RfqResponse.class, po.getRfqResponseId());
                    if (rfqResponse != null && rfqResponse.getRfq() != null) {
                        RFQ rfq = rfqResponse.getRfq();
                        Long rfqId = rfq.getRfqId();

                        rfq.setDispatchedAt(LocalDateTime.now());
                        rfq.setInvoicePath("invoice_" + rfqId + ".pdf");
                        rfq.setBolPath("bol_" + rfqId + ".pdf");
                        rfq.setCustomsDocPath("customs_" + rfqId + ".pdf");
                        rfq.setImportPermitPath("import_permit_" + rfqId + ".pdf");

                        em.merge(rfq);
                    }
                }

                em.flush();
                return true;
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error updating tracking by ref", e);
        }
        return false;
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
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Vendor registerVendor(String vendorName, String contactEmail, String category, String countryCode) throws Exception {
        if (vendorName == null || vendorName.trim().isEmpty() ||
                contactEmail == null || contactEmail.trim().isEmpty() ||
                countryCode == null || countryCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Vendor name, email, and country code are required");
        }

        List<Vendor> existingVendors = em.createQuery(
                        "SELECT v FROM Vendor v WHERE v.contactEmail = :email",
                        Vendor.class)
                .setParameter("email", contactEmail)
                .getResultList();

        if (!existingVendors.isEmpty()) {
            throw new IllegalArgumentException("Vendor with this email already exists");
        }

        String baseUsername = contactEmail.split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "");
        String username = baseUsername;
        int counter = 1;

        while (true) {
            List<User> existingUsers = em.createQuery(
                            "SELECT u FROM User u WHERE u.username = :username",
                            User.class)
                    .setParameter("username", username)
                    .getResultList();
            if (existingUsers.isEmpty()) break;
            username = baseUsername + counter++;
        }

        String tempPassword = "Vendor@" + System.currentTimeMillis();

        User user = new User(username, tempPassword, contactEmail, UserStatus.PENDING_APPROVAL);
        em.persist(user);

        Role vendorRole = findOrCreateRole("VENDOR");
        Set<Role> roles = new HashSet<>();
        roles.add(vendorRole);
        user.setRoles(roles);
        em.merge(user);

        Vendor vendor = new Vendor(user, vendorName, contactEmail, category, countryCode, VendorStatus.PENDING);
        em.persist(vendor);

        em.flush();
        return vendor;
    }

    private Role findOrCreateRole(String roleName) {
        List<Role> existing = em.createQuery(
                        "SELECT r FROM Role r WHERE r.roleName = :name", Role.class)
                .setParameter("name", roleName)
                .getResultList();
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Role role = new Role(roleName);
        em.persist(role);
        em.flush();
        return role;
    }
}