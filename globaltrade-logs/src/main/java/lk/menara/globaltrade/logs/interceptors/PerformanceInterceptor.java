package lk.menara.globaltrade.logs.interceptors;

import jakarta.ejb.EJB;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.InvocationContext;
import lk.menara.globaltrade.logs.bean.PerformanceMonitorBean;

public class PerformanceInterceptor {

    @EJB
    private PerformanceMonitorBean performanceMonitor;

    @AroundInvoke
    public Object measureExecutionTime(InvocationContext context) throws Exception {
        long startTime = System.currentTimeMillis();

        try {
            return context.proceed();
        } finally {
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;

            if (performanceMonitor != null) {
                performanceMonitor.recordRequest(executionTime);
            }

            System.out.println("[Performance Monitor] Method: " + context.getTarget().getClass().getSimpleName()
                    + "." + context.getMethod().getName() + "() took " + executionTime + " ms");
        }
    }
}