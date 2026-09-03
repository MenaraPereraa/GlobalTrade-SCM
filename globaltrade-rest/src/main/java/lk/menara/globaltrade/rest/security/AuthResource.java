package lk.menara.globaltrade.rest.security;

import jakarta.inject.Inject;
import jakarta.security.enterprise.credential.UsernamePasswordCredential;
import jakarta.security.enterprise.identitystore.CredentialValidationResult;
import jakarta.security.enterprise.identitystore.IdentityStoreHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.UserSession;
import lk.menara.globaltrade.core.services.LoginService;
import lk.menara.globaltrade.core.services.UserSessionService;
import lk.menara.globaltrade.auth.util.JwtUtil;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    private IdentityStoreHandler identityStoreHandler;

    @Inject
    private LoginService loginService;

    @Inject
    private UserSessionService userSessionService;

    @Context
    private HttpServletRequest httpRequest;

    public record LoginRequest(String username, String password) {}

    @Path("/login")
    @POST
    public Response login(LoginRequest request) {
        if (request == null || request.username() == null || request.password() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Missing username and password"))
                    .build();
        }

        UsernamePasswordCredential credential = new UsernamePasswordCredential(request.username(), request.password());
        CredentialValidationResult result = identityStoreHandler.validate(credential);

        if (result.getStatus() == CredentialValidationResult.Status.VALID) {
            String username = result.getCallerPrincipal().getName();
            Optional<User> userOpt = loginService.findByUsername(username);

            if (userOpt.isEmpty()) {
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            loginService.ensureUserHasRoles(username);
            Set<String> dbRoles = loginService.getRoles(username);

            Set<String> roles = new HashSet<>();
            for (String r : dbRoles) {
                if (r != null) {
                    roles.add(r.toUpperCase().trim().replace(" ", "_"));
                }
            }

            String accessToken = JwtUtil.generateToken(username, roles);
            String refreshToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");

            LocalDateTime accessExpires = LocalDateTime.now().plusMinutes(5);
            LocalDateTime refreshExpires = LocalDateTime.now().plusDays(7);

            String sessionId = UUID.randomUUID().toString();
            String ipAddress = httpRequest.getRemoteAddr();
            String userAgent = httpRequest.getHeader("User-Agent");

            userSessionService.createSession(sessionId, userOpt.get(), accessToken, refreshToken, accessExpires, refreshExpires, ipAddress, userAgent);

            NewCookie accessTokenCookie = new NewCookie.Builder("accessToken")
                    .value(accessToken)
                    .path("/")
                    .httpOnly(false)
                    .secure(false)
                    .expiry(java.sql.Timestamp.valueOf(accessExpires))
                    .build();

            NewCookie refreshTokenCookie = new NewCookie.Builder("refreshToken")
                    .value(refreshToken)
                    .path("/")
                    .httpOnly(true)
                    .secure(false)
                    .expiry(java.sql.Timestamp.valueOf(refreshExpires))
                    .build();

            return Response.status(Response.Status.OK)
                    .cookie(accessTokenCookie, refreshTokenCookie)
                    .entity(Map.of(
                            "message", "Login successful",
                            "username", username,
                            "roles", roles,
                            "accessToken", accessToken
                    ))
                    .build();
        }

        return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "Invalid username or password"))
                .build();
    }

    @Path("/refresh")
    @POST
    public Response refreshTokens(@CookieParam("refreshToken") Cookie refreshTokenCookie) {

        if (refreshTokenCookie == null || refreshTokenCookie.getValue() == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Refresh token is missing from cookie"))
                    .build();
        }

        String incomingRefreshToken = refreshTokenCookie.getValue();
        Optional<UserSession> sessionOpt = userSessionService.findByValidRefreshToken(incomingRefreshToken);

        if (sessionOpt.isEmpty()) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or expired refresh token"))
                    .build();
        }

        UserSession session = sessionOpt.get();
        User user = session.getUser();
        Set<String> dbRoles = loginService.getRoles(user.getUsername());

        Set<String> roles = new HashSet<>();
        for (String r : dbRoles) {
            if (r != null) {
                roles.add(r.toUpperCase().trim().replace(" ", "_"));
            }
        }

        String newAccessToken = JwtUtil.generateToken(user.getUsername(), roles);
        LocalDateTime newAccessExpires = LocalDateTime.now().plusMinutes(5);

        userSessionService.updateAccessToken(session, newAccessToken, newAccessExpires);

        NewCookie accessTokenCookie = new NewCookie.Builder("accessToken")
                .value(newAccessToken)
                .path("/")
                .httpOnly(false)
                .expiry(java.sql.Timestamp.valueOf(newAccessExpires))
                .build();

        return Response.status(Response.Status.OK)
                .cookie(accessTokenCookie)
                .entity(Map.of("message", "Token refreshed successfully"))
                .build();
    }
}