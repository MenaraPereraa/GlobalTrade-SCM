package lk.menara.globaltrade.rest.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.security.enterprise.AuthenticationException;
import jakarta.security.enterprise.AuthenticationStatus;
import jakarta.security.enterprise.authentication.mechanism.http.HttpAuthenticationMechanism;
import jakarta.security.enterprise.authentication.mechanism.http.HttpMessageContext;
import jakarta.security.enterprise.identitystore.CredentialValidationResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.core.HttpHeaders;
import lk.menara.globaltrade.auth.util.JwtUtil;

import java.util.Set;

@ApplicationScoped
public class AuthMechanism implements HttpAuthenticationMechanism {

    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/admin/login",
            "/api/admin/register",
            "/api/user/verify-user",
            "/api/teller/login",
            "/api/user/login"
    );

    private boolean isPublicPath(String requestUri) {
        if (requestUri == null) return false;
        return PUBLIC_PATHS.stream().anyMatch(requestUri::endsWith);
    }

    @Override
    public AuthenticationStatus validateRequest(HttpServletRequest request, HttpServletResponse response, HttpMessageContext httpMessageContext) throws AuthenticationException {
        String requestUri = request.getRequestURI();

        if (isPublicPath(requestUri)) {
            return httpMessageContext.doNothing();
        }

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (JwtUtil.isValid(token)) {
                    DecodedJWT decodedJWT = JwtUtil.parseToken(token);
                    String username = decodedJWT.getSubject();
                    Set<String> roles = JwtUtil.getRoles(token);

                    CredentialValidationResult result = new CredentialValidationResult(username, roles);

                    return httpMessageContext.notifyContainerAboutLogin(result);
                }
            } catch (Exception e) {
                return httpMessageContext.responseUnauthorized();
            }
        }

        return httpMessageContext.responseUnauthorized();
    }
}