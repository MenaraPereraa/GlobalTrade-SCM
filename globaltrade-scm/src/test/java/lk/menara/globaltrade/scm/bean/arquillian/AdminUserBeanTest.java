package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.auth.service.PasswordService;
import lk.menara.globaltrade.core.entity.Role;
import lk.menara.globaltrade.core.entity.User;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.enums.UserStatus;
import lk.menara.globaltrade.scm.bean.admin.AdminUserBean;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit5.ArquillianExtension;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.asset.EmptyAsset;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Arrays;
import java.util.List;

/**
 * Arquillian integration tests for AdminUserBean using JUnit 5.
 * 
 * This test class demonstrates:
 * - @ExtendWith(ArquillianExtension.class) for JUnit 5 integration
 * - ShrinkWrap @Deployment with JavaArchive for EJB module testing
 * - Dependency injection of @Stateless EJB and EntityManager
 * - Proper test resource configuration (beans.xml, persistence.xml)
 */
@ExtendWith(ArquillianExtension.class)
@DisplayName("AdminUserBean Integration Tests")
public class AdminUserBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private AdminUserBean adminUserBean;

    /**
     * Creates a ShrinkWrap deployment archive for testing.
     * 
     * This method:
     * 1. Creates a JavaArchive (JAR) suitable for EJB/stateless bean testing
     * 2. Adds all required classes from the project
     * 3. Includes test resources (persistence.xml, beans.xml)
     * 4. Packages dependencies needed for the bean to function
     */
    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-admin-user.jar")
                // Add the bean class being tested
                .addClasses(AdminUserBean.class)
                // Add entity classes needed for JPA
                .addClasses(User.class, Role.class, Warehouse.class, UserStatus.class)
                // Add service dependencies for the bean
                .addClasses(PasswordService.class)
                // Add all enums from core package
                .addPackage("lk.menara.globaltrade.core.enums")
                // Add exception classes
                .addPackage("lk.menara.globaltrade.core.exception")
                // Add beans.xml for CDI bean discovery
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                // Add persistence.xml for JPA configuration
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    /**
     * Setup test data before each test method.
     * Creates test roles required by AdminUserBean methods.
     */
    @BeforeEach
    void setupTestData() {
        // Create Admin role
        Role adminRole = new Role();
        adminRole.setRoleName("Admin");
        adminRole.setDescription("Administrator with full system access");
        em.persist(adminRole);

        // Create User role
        Role userRole = new Role();
        userRole.setRoleName("User");
        userRole.setDescription("Regular application user");
        em.persist(userRole);

        // Create Manager role
        Role managerRole = new Role();
        managerRole.setRoleName("Manager");
        managerRole.setDescription("Manager with warehouse oversight");
        em.persist(managerRole);

        em.flush();
    }

    /**
     * Verifies that AdminUserBean is successfully injected by Arquillian.
     */
    @Test
    @DisplayName("Should successfully inject AdminUserBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(adminUserBean, "AdminUserBean should be successfully injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    /**
     * Tests creating a staff user with valid credentials and role assignment.
     */
    @Test
    @DisplayName("Should create staff user with valid credentials and role")
    void testCreateStaffUser() throws Exception {
        String username = "john_admin";
        String email = "john.admin@globaltrade.com";
        String plainPassword = "SecurePassword123!@#";

        User createdUser = adminUserBean.createStaffUser(username, email, plainPassword, "Admin");

        Assertions.assertNotNull(createdUser, "User should be created successfully");
        Assertions.assertEquals(username, createdUser.getUsername(), "Username should match");
        Assertions.assertEquals(email, createdUser.getEmail(), "Email should match");
        Assertions.assertNotNull(createdUser.getPasswordHash(), "Password hash should be generated");
        Assertions.assertFalse(createdUser.getRoles().isEmpty(), "User should have assigned roles");
        Assertions.assertEquals(UserStatus.ACTIVE, createdUser.getStatus(), "New user should be ACTIVE");
        Assertions.assertNotNull(createdUser.getCreatedAt(), "Creation timestamp should be set");
    }

    /**
     * Tests that duplicate email is rejected during user creation.
     */
    @Test
    @DisplayName("Should reject duplicate email during user creation")
    void testCreateStaffUserWithDuplicateEmail() throws Exception {
        String email = "duplicate@globaltrade.com";
        String plainPassword = "SecurePassword123!";

        adminUserBean.createStaffUser("user1", email, plainPassword, "Admin");

        Exception exception = Assertions.assertThrows(
                Exception.class,
                () -> adminUserBean.createStaffUser("user2", email, plainPassword, "Admin"),
                "Should throw exception for duplicate email"
        );

        Assertions.assertTrue(
                exception.getMessage().contains("already exists"),
                "Error message should mention duplicate"
        );
    }

    /**
     * Tests that duplicate username is rejected during user creation.
     */
    @Test
    @DisplayName("Should reject duplicate username during user creation")
    void testCreateStaffUserWithDuplicateUsername() throws Exception {
        String username = "duplicate_user";
        String plainPassword = "SecurePassword123!";

        adminUserBean.createStaffUser(username, "email1@test.com", plainPassword, "Admin");

        Exception exception = Assertions.assertThrows(
                Exception.class,
                () -> adminUserBean.createStaffUser(username, "email2@test.com", plainPassword, "Admin"),
                "Should throw exception for duplicate username"
        );

        Assertions.assertTrue(
                exception.getMessage().contains("already exists"),
                "Error message should mention duplicate"
        );
    }

    /**
     * Tests retrieving all staff users.
     */
    @Test
    @DisplayName("Should retrieve all staff users from database")
    void testGetAllStaff() throws Exception {
        // Create multiple users
        adminUserBean.createStaffUser("user1", "user1@globaltrade.com", "pass123", "Admin");
        adminUserBean.createStaffUser("user2", "user2@globaltrade.com", "pass123", "User");
        adminUserBean.createStaffUser("user3", "user3@globaltrade.com", "pass123", "Manager");

        List<User> allStaff = adminUserBean.getAllStaff();

        Assertions.assertNotNull(allStaff, "Staff list should not be null");
        Assertions.assertTrue(allStaff.size() >= 3, "Should retrieve at least 3 created users");
    }

    /**
     * Tests updating a staff user's username and role.
     */
    @Test
    @DisplayName("Should update staff user username and role")
    void testUpdateStaffUser() throws Exception {
        User createdUser = adminUserBean.createStaffUser(
                "original_user",
                "user@globaltrade.com",
                "password123",
                "User"
        );

        User updatedUser = adminUserBean.updateStaffUser(
                createdUser.getUserId(),
                "updated_user",
                "Manager"
        );

        Assertions.assertNotNull(updatedUser, "Updated user should be returned");
        Assertions.assertEquals("updated_user", updatedUser.getUsername(), "Username should be updated");
        Assertions.assertTrue(
                updatedUser.getRoles().stream().anyMatch(r -> "Manager".equals(r.getRoleName())),
                "User should have Manager role"
        );
    }

    /**
     * Tests that updating non-existent user throws exception.
     */
    @Test
    @DisplayName("Should throw exception when updating non-existent user")
    void testUpdateNonExistentUser() {
        Exception exception = Assertions.assertThrows(
                Exception.class,
                () -> adminUserBean.updateStaffUser(99999, "username", "Admin"),
                "Should throw exception for non-existent user"
        );

        Assertions.assertTrue(
                exception.getMessage().contains("not found"),
                "Error message should indicate user not found"
        );
    }

    /**
     * Tests assigning warehouses to a user.
     */
    @Test
    @DisplayName("Should assign warehouses to staff user")
    void testAssignWarehouses() throws Exception {
        User createdUser = adminUserBean.createStaffUser(
                "warehouse_user",
                "warehouse@globaltrade.com",
                "password123",
                "Manager"
        );

        // Create test warehouses
        Warehouse warehouse1 = new Warehouse();
        warehouse1.setWarehouseCode("WH001");
        warehouse1.setWarehouseName("Main Warehouse");
        em.persist(warehouse1);

        Warehouse warehouse2 = new Warehouse();
        warehouse2.setWarehouseCode("WH002");
        warehouse2.setWarehouseName("Secondary Warehouse");
        em.persist(warehouse2);

        em.flush();

        List<Integer> warehouseIds = Arrays.asList(warehouse1.getWarehouseId(), warehouse2.getWarehouseId());
        User updatedUser = adminUserBean.assignWarehouses(createdUser.getUserId(), warehouseIds);

        Assertions.assertNotNull(updatedUser.getManagedWarehouses(), "Managed warehouses should be set");
        Assertions.assertEquals(2, updatedUser.getManagedWarehouses().size(), "Should have 2 warehouses assigned");
    }

    /**
     * Tests ensuring admin role is assigned to user.
     */
    @Test
    @DisplayName("Should ensure Admin role is assigned to user")
    void testEnsureAdminRole() throws Exception {
        User createdUser = adminUserBean.createStaffUser(
                "regular_user",
                "regular@globaltrade.com",
                "password123",
                "User"
        );

        User adminUser = adminUserBean.ensureAdminRole(createdUser.getUserId());

        Assertions.assertNotNull(adminUser, "User should be returned");
        Assertions.assertTrue(
                adminUser.getRoles().stream().anyMatch(r -> "Admin".equals(r.getRoleName())),
                "User should have Admin role after ensureAdminRole call"
        );
    }

    /**
     * Tests retrieving warehouses assigned to a user.
     */
    @Test
    @DisplayName("Should retrieve warehouses assigned to user")
    void testGetAssignedWarehouses() throws Exception {
        User createdUser = adminUserBean.createStaffUser(
                "manager_user",
                "manager@globaltrade.com",
                "password123",
                "Manager"
        );

        // Create and assign warehouses
        Warehouse warehouse = new Warehouse();
        warehouse.setWarehouseCode("WH003");
        warehouse.setWarehouseName("Distribution Center");
        em.persist(warehouse);
        em.flush();

        adminUserBean.assignWarehouses(createdUser.getUserId(), Arrays.asList(warehouse.getWarehouseId()));

        List<Warehouse> assignedWarehouses = adminUserBean.getAssignedWarehouses(createdUser.getUserId());

        Assertions.assertNotNull(assignedWarehouses, "Assigned warehouses list should not be null");
        Assertions.assertEquals(1, assignedWarehouses.size(), "Should have 1 assigned warehouse");
        Assertions.assertEquals("WH003", assignedWarehouses.get(0).getWarehouseCode(), "Warehouse code should match");
    }
}