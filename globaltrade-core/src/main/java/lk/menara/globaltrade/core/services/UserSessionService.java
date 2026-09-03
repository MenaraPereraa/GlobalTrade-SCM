package lk.menara.globaltrade.core.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.UserSession;

import java.time.LocalDateTime;
import java.util.Optional;

@ApplicationScoped
@Transactional
public class UserSessionService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    public void createSession(String sessionId, User user, String accessToken, String refreshToken,
                              LocalDateTime accessExpires, LocalDateTime refreshExpires,
                              String ipAddress, String userAgent) {
        UserSession session = new UserSession(sessionId, user, accessToken, refreshToken,
                accessExpires, refreshExpires, ipAddress, userAgent);
        em.persist(session);
    }

    public Optional<UserSession> findByValidRefreshToken(String refreshToken) {
        try {
            UserSession session = em.createQuery(
                            "SELECT s FROM UserSession s WHERE s.refreshToken = :token AND s.refreshTokenExpiresAt > :now AND s.isRevoked = false",
                            UserSession.class)
                    .setParameter("token", refreshToken)
                    .setParameter("now", LocalDateTime.now())
                    .getSingleResult();
            return Optional.of(session);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void updateAccessToken(UserSession session, String newAccessToken, LocalDateTime newExpiresAt) {
        session.setAccessToken(newAccessToken);
        session.setAccessTokenExpiresAt(newExpiresAt);
        session.setLastActive(LocalDateTime.now());
        em.merge(session);
    }
}