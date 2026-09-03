package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.*;
import lk.menara.globaltrade.core.enums.RequestStatus;
import lk.menara.globaltrade.core.enums.VendorStatus;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.io.File;

public interface VendorService {
    Vendor findVendorByUsername(String username);
    Vendor getVendorProfile(Integer vendorId);
    List<Vendor> getAllVendors();
    List<ReplenishmentRequest> getReplenishmentRequests(Integer vendorId);
    ReplenishmentRequest fulfillReplenishmentRequest(Integer requestId, Integer vendorId);
    ReplenishmentRequest updateRequestStatus(Integer requestId, Integer vendorId, RequestStatus status);
    List<VendorEvaluation> getEvaluations(Integer vendorId);
    ReplenishmentRequest createReplenishmentRequest(ReplenishmentRequest request);
    Vendor updateVendorStatus(Integer vendorId, VendorStatus status);
    List<RFQ> getActiveRfqs(Integer vendorId);
    List<RfqResponse> getVendorQuotations(Integer vendorId);
    RfqResponse submitRfqResponse(Long rfqId, String username, BigDecimal unitPrice, Integer leadTime, String remarks, String quotationPdfPath);
    ReplenishmentRequest dispatchReplenishmentWithDoc(Integer requestId, Integer vendorId, String documentPath);
    ReplenishmentRequest rejectReplenishmentRequest(Integer requestId, Integer vendorId);

    RfqResponse submitQuotationWithFile(Long rfqId, String username, BigDecimal unitPrice, Integer leadTime, String remarks, InputStream pdfInputStream, String originalFileName) throws Exception;
    File getQuotationFile(String filename);
    List<Map<String, Object>> getVendorOrdersDto(Integer vendorId);
    List<ReplenishmentRequest> getAllPendingReplenishmentRequests();

    boolean dispatchVendorOrderByRef(String poRef);
    boolean updateOrderTrackingByRef(String poRef, String trackingNumber);
    
    Vendor registerVendor(String vendorName, String contactEmail, String category, String countryCode) throws Exception;
}