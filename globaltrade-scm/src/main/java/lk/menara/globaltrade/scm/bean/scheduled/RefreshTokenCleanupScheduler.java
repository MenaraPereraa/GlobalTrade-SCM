package lk.menara.globaltrade.core.schedule;

import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.Instant;
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
        int deleted = em.createNamedQuery("RefreshToken.deleteExpiredToken")
                .setParameter("now", Instant.now())
                .executeUpdate();

        LOGGER.info("Refresh token cleanup : " + deleted + " expired tokens deleted.");
    }
}