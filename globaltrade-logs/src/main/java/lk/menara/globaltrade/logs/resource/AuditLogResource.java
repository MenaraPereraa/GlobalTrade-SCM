package lk.menara.globaltrade.logs.resource;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.security.enterprise.SecurityContext;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.menara.globaltrade.core.entity.AuditLog;

import java.util.List;

@Path("/customs/audit-logs")
@Produces(MediaType.APPLICATION_JSON)
public class AuditLogResource {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private SecurityContext securityContext;

    @GET
    public Response getAuditLogs() {
        try {
            String username = getUsername();
            List<AuditLog> logs;

            if (isAdmin(username)) {
                logs = em.createQuery(
                        "SELECT a FROM AuditLog a ORDER BY a.timestamp DESC",
                        AuditLog.class
                ).getResultList();
            } else if (username != null) {
                logs = em.createQuery(
                                "SELECT a FROM AuditLog a WHERE a.user.username = :username ORDER BY a.timestamp DESC",
                                AuditLog.class
                        )
                        .setParameter("username", username)
                        .getResultList();
            } else {
                logs = List.of();
            }

            return Response.ok(logs).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }

    private String getUsername() {
        if (securityContext == null || securityContext.getCallerPrincipal() == null) {
            return null;
        }
        return securityContext.getCallerPrincipal().getName();
    }

    private boolean isAdmin(String username) {
        return username != null && "admin".equalsIgnoreCase(username);
    }

    @GET
    @Path("/stock-movements")
    public Response getStockMovements() {
        try {
            List<AuditLog> logs = em.createQuery(
                    "SELECT a FROM AuditLog a WHERE a.entityName = 'Inventory' ORDER BY a.timestamp DESC",
                    AuditLog.class
            ).getResultList();

            return Response.ok(logs).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}