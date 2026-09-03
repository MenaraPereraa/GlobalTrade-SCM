package lk.menara.globaltrade.core.services;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Role;
import lk.menara.globaltrade.core.entity.User;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class LoginService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    public Optional<User> findByUsername(String username) {
        try {
            User user = em.createNamedQuery("User.findByUsername", User.class)
                    .setParameter("username", username)
                    .getSingleResult();
            return Optional.of(user);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public boolean validate(String username, String passwordHash) {
        Optional<User> userOpt = findByUsername(username);
        if (userOpt.isPresent()) {
            return userOpt.get().getPasswordHash().equals(passwordHash);
        }
        return false;
    }

    public Set<String> getRoles(String username) {
        Optional<User> userOpt = findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getRoles() != null) {
            return userOpt.get().getRoles().stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toSet());
        }
        return Collections.emptySet();
    }

    public User ensureUserHasRoles(String username) {
        Optional<User> userOpt = findByUsername(username);
        if (userOpt.isEmpty()) {
            return null;
        }

        User user = userOpt.get();
        Set<Role> roles = user.getRoles();

        // If user has no roles assigned, try to assign based on username pattern
        if (roles == null || roles.isEmpty()) {
            roles = new HashSet<>();
            String lowerUsername = username != null ? username.toLowerCase() : "";

            if (lowerUsername.contains("admin")) {
                roles.add(findOrCreateRole("ADMIN"));
            } else if (lowerUsername.contains("warehouse")) {
                roles.add(findOrCreateRole("WAREHOUSE_MANAGER"));
            } else if (lowerUsername.contains("custom")) {
                roles.add(findOrCreateRole("CUSTOM_AGENT"));
            } else if (lowerUsername.contains("coordinator")) {
                roles.add(findOrCreateRole("COORDINATOR"));
            } else if (lowerUsername.contains("vendor")) {
                roles.add(findOrCreateRole("VENDOR_REPRESENTATIVE"));
            } else {
                roles.add(findOrCreateRole("CUSTOM_AGENT"));
            }

            user.setRoles(roles);
            em.merge(user);
            em.flush();
            System.out.println("DEBUG: Assigned role based on username pattern to user: " + username);
        }

        return user;
    }

    private Role findOrCreateRole(String roleName) {
        List<Role> existing = em.createQuery(
                        "SELECT r FROM Role r WHERE r.roleName = :name", Role.class)
                .setParameter("name", roleName)
                .getResultList();
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Role role = new Role(roleName);
        em.persist(role);
        em.flush();
        return role;
    }
}