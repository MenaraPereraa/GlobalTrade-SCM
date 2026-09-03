package lk.menara.globaltrade.logs.bean;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.AuditLog;
import lk.menara.globaltrade.core.entity.User;

@Stateless
public class AuditLoggerBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void addAuditLog(AuditLog log) {
        em.persist(log);
    }

    public User findUserByUsername(String username) {
        if (username == null || username.equals("anonymous")) {
            return null;
        }

        try {
            return em.createQuery(
                            "SELECT u FROM User u WHERE u.username = :username",
                            User.class
                    )
                    .setParameter("username", username)
                    .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }
}