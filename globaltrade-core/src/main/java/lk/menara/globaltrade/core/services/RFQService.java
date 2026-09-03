package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.dto.RFQDTO;
import lk.menara.globaltrade.core.entity.PurchaseOrder;
import lk.menara.globaltrade.core.entity.RFQ;
import lk.menara.globaltrade.core.entity.ReplenishmentRequest;
import lk.menara.globaltrade.core.entity.RfqResponse;

import java.io.File;
import java.util.List;
import java.util.Map;

public interface RFQService {
    List<RFQ> getAllRFQs();

    List<ReplenishmentRequest> getAllPendingReplenishmentRequests();

    RFQ createRFQ(RFQDTO dto) throws Exception;

    List<RfqResponse> getBidsByRfqId(Long rfqId);

    PurchaseOrder acceptBid(Long responseId) throws Exception;

    void saveRoute(Long rfqId, Map<String, Object> routeData) throws Exception;

    Map<String, Object> getRfqFulfillmentDetails(Long rfqId);

    File generateOrGetDocumentPdf(String docType, Long rfqId, Map<String, Object> requestPayload) throws Exception;
}