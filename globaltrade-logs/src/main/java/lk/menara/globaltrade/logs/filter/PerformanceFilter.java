package lk.menara.globaltrade.logs.filter;

import jakarta.ejb.EJB;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import lk.menara.globaltrade.logs.bean.PerformanceMonitorBean;

import java.io.IOException;

@WebFilter("/*")
public class PerformanceFilter implements Filter {

    @EJB
    private PerformanceMonitorBean performanceMonitor;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain)
            throws IOException, ServletException {

        long start = System.currentTimeMillis();

        chain.doFilter(request, response);

        long end = System.currentTimeMillis();
        long responseTime = end - start;

        if (performanceMonitor != null) {
            performanceMonitor.recordRequest(responseTime);
        }
    }

    @Override
    public void destroy() {
    }
}