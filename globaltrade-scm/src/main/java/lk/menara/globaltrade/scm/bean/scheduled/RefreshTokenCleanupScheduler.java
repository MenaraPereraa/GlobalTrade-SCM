package lk.menara.globaltrade.scm.bean.scheduled;

import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.logging.Logger;

@Singleton
@Startup
public class RefreshTokenCleanupScheduler {

    private static final Logger LOGGER =
            Logger.getLogger(RefreshTokenCleanupScheduler.class.getName());

    @PersistenceContext
    private EntityManager em;

    @Schedule(hour = "23", minute = "59", persistent = false)
    @Transactional
    public void scheduleCleanup() {
        int deleted = em.createNamedQuery("UserSession.deleteExpiredSessions")
                .setParameter("now", LocalDateTime.now())
                .executeUpdate();

        LOGGER.info("Expired user sessions cleanup: " + deleted + " sessions deleted.");
    }
}