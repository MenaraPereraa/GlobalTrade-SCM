package lk.menara.globaltrade.scm.bean.admin;

import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.auth.service.PasswordService;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Role;
import lk.menara.globaltrade.core.entity.Warehouse;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;

@Stateless
public class AdminUserBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager entityManager;

    @Inject
    private PasswordService passwordService;

    public User createStaffUser(String username, String email, String plainPassword, String roleName) throws Exception {
        Long existingCount = entityManager.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :email OR u.username = :username", Long.class)
                .setParameter("email", email)
                .setParameter("username", username)
                .getSingleResult();

        if (existingCount > 0) {
            throw new Exception("Username or email already exists.");
        }

        Role role = entityManager.createQuery("SELECT r FROM Role r WHERE r.roleName = :roleName", Role.class)
                .setParameter("roleName", roleName)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (role == null) {
            throw new Exception("Specified role does not exist.");
        }

        String hashedPassword = passwordService.hashPassword(plainPassword);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(hashedPassword);
        user.setRoles(Collections.singleton(role));
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setStatus(lk.menara.globaltrade.core.enums.UserStatus.ACTIVE);
        entityManager.persist(user);
        return user;
    }

    public List<User> getAllStaff() {
        List<User> users = entityManager.createQuery(
                        "SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.managedWarehouses", User.class)
                .getResultList();

        for (User user : users) {
            if (user.getRoles() != null) {
                user.getRoles().size();
            }
        }
        return users;
    }

    public User updateStaffUser(Integer userId, String username, String roleName) throws Exception {
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new Exception("User not found.");
        }

        Role role = entityManager.createQuery("SELECT r FROM Role r WHERE r.roleName = :roleName", Role.class)
                .setParameter("roleName", roleName)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (role == null) {
            throw new Exception("Specified role does not exist.");
        }

        user.setUsername(username);
        user.setRoles(Collections.singleton(role));

        entityManager.merge(user);
        return user;
    }

    public User assignWarehouses(Integer userId, List<Integer> warehouseIds) throws Exception {
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new Exception("User not found.");
        }

        List<Warehouse> warehouses = warehouseIds.isEmpty() ? Collections.emptyList() :
                entityManager.createQuery("SELECT w FROM Warehouse w WHERE w.warehouseId IN :ids", Warehouse.class)
                        .setParameter("ids", warehouseIds)
                        .getResultList();

        user.setManagedWarehouses(new HashSet<>(warehouses));
        entityManager.merge(user);
        entityManager.flush();
        return user;
    }

    public User ensureAdminRole(Integer userId) throws Exception {
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new Exception("User not found.");
        }

        Role adminRole = entityManager.createQuery("SELECT r FROM Role r WHERE r.roleName = 'Admin'", Role.class)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (adminRole != null && !user.getRoles().contains(adminRole)) {
            user.getRoles().add(adminRole);
            entityManager.merge(user);
        }

        return user;
    }

    public List<Warehouse> getAssignedWarehouses(Integer userId) throws Exception {
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new Exception("User not found.");
        }
        if (user.getManagedWarehouses() != null) {
            user.getManagedWarehouses().size();
        }
        return new ArrayList<>(user.getManagedWarehouses());
    }
}