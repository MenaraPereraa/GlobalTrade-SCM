package lk.menara.globaltrade.rest.controller.admin;

import jakarta.ejb.EJB;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.logs.bean.PerformanceMonitorBean;

import java.util.HashMap;
import java.util.Map;

@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
public class NFRMetricsResource {

    @EJB
    private PerformanceMonitorBean performanceMonitor;

    @GET
    @Path("/nfr-metrics")
    public Response getNFRMetrics() {
        if (performanceMonitor == null) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "Performance monitor not available"))
                    .build();
        }

        try {
            double usedHeap = performanceMonitor.getHeapMemoryUsageMB();
            double maxHeap = performanceMonitor.getMaxHeapMemoryMB();
            double heapPercent = maxHeap > 0 ? (usedHeap / maxHeap) * 100.0 : 0.0;
            double cpuUsage = performanceMonitor.getCpuUsage();
            int activeThreads = performanceMonitor.getActiveThreadCount();
            int peakThreads = performanceMonitor.getPeakThreadCount();
            double avgResponseTime = performanceMonitor.getAverageResponseTimeMs();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("cpuUsage", cpuUsage);
            metrics.put("activeThreads", activeThreads);
            metrics.put("peakThreads", peakThreads);
            metrics.put("usedHeap", usedHeap);
            metrics.put("maxHeap", maxHeap);
            metrics.put("heapPercent", heapPercent);
            metrics.put("avgResponseTime", avgResponseTime);
            metrics.put("totalRequests", performanceMonitor.getTotalRequests());
            metrics.put("uptime", performanceMonitor.getUptime());
            metrics.put("status", performanceMonitor.getArchitectureStatus());

            return Response.ok(metrics).build();

        } catch (Exception e) {
            System.err.println("[NFRMetricsResource] Error retrieving metrics: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve metrics: " + e.getMessage()))
                    .build();
        }
    }
}