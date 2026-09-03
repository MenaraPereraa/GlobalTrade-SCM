package lk.menara.globaltrade.logs.interceptors;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import jakarta.security.enterprise.SecurityContext;
import lk.menara.globaltrade.core.entity.AuditLog;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.enums.AuditStatus;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.logs.bean.AuditLoggerBean;

import java.time.LocalDateTime;
import java.util.logging.Logger;

@Interceptor
@Audit
@Priority(Interceptor.Priority.APPLICATION)
public class AuditInterceptor {

    private static final Logger LOGGER = Logger.getLogger(AuditInterceptor.class.getName());

    @Inject
    private AuditLoggerBean auditLoggerBean;

    @Inject
    private SecurityContext securityContext;

    @AroundInvoke
    public Object intercept(InvocationContext context) throws Exception {
        long startTime = System.currentTimeMillis();
        AuditStatus status = AuditStatus.SUCCESS;
        Object result = null;

        try {
            result = context.proceed();
            return result;
        } catch (Exception e) {
            status = AuditStatus.FAILURE;
            throw e;
        } finally {
            long executionTime = System.currentTimeMillis() - startTime;
            saveAuditLog(context, result, status, executionTime);
        }
    }

    private void saveAuditLog(InvocationContext context, Object result, AuditStatus status, long executionTime) {
        try {
            String username = getUsername();
            AuditLog log = new AuditLog();

            log.setActionPerformed(getActionName(context.getMethod().getName()));
            log.setEntityName("Inventory");
            log.setExecutionTimeMs((int) executionTime);
            log.setStatus(status);
            log.setTimestamp(LocalDateTime.now());

            User user = auditLoggerBean.findUserByUsername(username);
            if (user != null) {
                log.setUser(user);
            }

            if (result instanceof Inventory inventory) {
                if (inventory.getProduct() != null && inventory.getProduct().getProductId() != null) {
                    log.setEntityId(inventory.getProduct().getProductId().toString());
                }
            }

            auditLoggerBean.addAuditLog(log);

            LOGGER.info("STOCK AUDIT | Action=" + log.getActionPerformed() + " | User=" + username + " | EntityId=" + log.getEntityId() + " | Status=" + status);

        } catch (Exception e) {
            LOGGER.warning("Failed to save stock audit: " + e.getMessage());
        }
    }

    private String getUsername() {
        if (securityContext != null && securityContext.getCallerPrincipal() != null) {
            String username = securityContext.getCallerPrincipal().getName();
            if (username != null && !username.isBlank()) {
                return username;
            }
        }
        return "anonymous";
    }

    private String getActionName(String methodName) {
        return switch (methodName) {
            case "receiveStock" -> "RECEIVE_STOCK";
            case "dispatchStock" -> "DISPATCH_STOCK";
            default -> methodName.toUpperCase();
        };
    }
}