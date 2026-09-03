package lk.menara.globaltrade.logs.bean;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Singleton;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

@Singleton
@LocalBean
public class PerformanceMonitorBean {

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalResponseTime = new AtomicLong(0);
    private LocalDateTime startTime;

    @PostConstruct
    public void init() {
        startTime = LocalDateTime.now();
        System.out.println("[PerformanceMonitor] GlobalTrade SCM Performance Monitor initialized");
    }

    public void recordRequest(long responseTimeMs) {
        totalRequests.incrementAndGet();
        totalResponseTime.addAndGet(responseTimeMs);
    }

    public double getAverageResponseTimeMs() {
        long reqs = totalRequests.get();
        return reqs == 0 ? 0.0 : (double) totalResponseTime.get() / reqs;
    }

    public long getTotalRequests() {
        return totalRequests.get();
    }

    public long getTotalResponseTime() {
        return totalResponseTime.get();
    }

    public String getUptime() {
        if (startTime == null) return "Unknown";
        return java.time.Duration.between(startTime, LocalDateTime.now()).toMinutes() + " mins";
    }

    public String getArchitectureStatus() {
        return "EJB Container Active (Jakarta EE 10)";
    }

    public double getCpuUsage() {
        try {
            com.sun.management.OperatingSystemMXBean osBean =
                    ManagementFactory.getPlatformMXBean(com.sun.management.OperatingSystemMXBean.class);
            double cpuLoad = osBean.getCpuLoad();
            return cpuLoad < 0 ? 0.0 : cpuLoad * 100.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    public int getActiveThreadCount() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        return threadBean.getThreadCount();
    }

    public int getPeakThreadCount() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        return threadBean.getPeakThreadCount();
    }

    public double getHeapMemoryUsageMB() {
        MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
        return (double) memBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
    }

    public double getMaxHeapMemoryMB() {
        MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
        return (double) memBean.getHeapMemoryUsage().getMax() / (1024 * 1024);
    }

    public double getUsedMemoryMB() {
        return getHeapMemoryUsageMB();
    }

    public double getTotalMemoryMB() {
        return getMaxHeapMemoryMB();
    }

    public double getHeapUsagePercent() {
        double used = getHeapMemoryUsageMB();
        double max = getMaxHeapMemoryMB();
        return max > 0 ? (used / max) * 100.0 : 0.0;
    }

    @PreDestroy
    public void cleanup() {
        System.out.println("GlobalTrade SCM Performance Monitor Shutting Down");
        System.out.println("Total Requests: " + totalRequests.get());
        System.out.println("Average Response Time: " + getAverageResponseTimeMs() + " ms");
    }
}