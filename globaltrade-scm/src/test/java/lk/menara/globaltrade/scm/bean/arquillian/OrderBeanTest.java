package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Customer;
import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.entity.Vendor;
import lk.menara.globaltrade.core.enums.OrderStatus;
import lk.menara.globaltrade.scm.bean.coordinator.OrderBean;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Arquillian integration tests for OrderBean coordinator using JUnit 5.
 * 
 * Demonstrates comprehensive testing of stateless EJB with persistence operations:
 * - Testing CRUD operations through business logic
 * - Proper EntityManager injection and transaction handling
 * - ShrinkWrap archive with transitive dependencies
 * - JUnit 5 assertions and display names
 */
@ExtendWith(ArquillianExtension.class)
@DisplayName("OrderBean Coordinator Integration Tests")
public class OrderBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private OrderBean orderBean;

    /**
     * Creates ShrinkWrap deployment archive for OrderBean testing.
     * Includes order, vendor, and customer entity classes.
     */
    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-order-bean.jar")
                // Bean being tested
                .addClasses(OrderBean.class)
                // Entity classes required by OrderBean
                .addClasses(Order.class, Vendor.class, Customer.class)
                // Enums needed for order operations
                .addClasses(OrderStatus.class)
                // Service interfaces implemented by the bean
                .addPackage("lk.menara.globaltrade.core.services")
                // All enums from core
                .addPackage("lk.menara.globaltrade.core.enums")
                // Exception classes
                .addPackage("lk.menara.globaltrade.core.exception")
                // CDI configuration
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                // JPA configuration
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    /**
     * Setup test data: creates vendor and customer test fixtures.
     */
    @BeforeEach
    void setupTestData() {
        // Create test vendor
        Vendor vendor = new Vendor();
        vendor.setVendorName("Premium Supplies Ltd");
        vendor.setContactEmail("contact@premium-supplies.com");
        vendor.setContactPhone("+1-800-SUPPLIES");
        vendor.setAddress("123 Commerce Street");
        em.persist(vendor);

        // Create test customer
        Customer customer = new Customer();
        customer.setCustomerName("Global Trade Customer");
        customer.setEmail("customer@globaltrade.com");
        customer.setContactPhone("+1-555-1234");
        customer.setAddress("456 Business Ave");
        em.persist(customer);

        em.flush();
    }

    /**
     * Verifies OrderBean injection via CDI.
     */
    @Test
    @DisplayName("Should successfully inject OrderBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(orderBean, "OrderBean should be successfully injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    /**
     * Tests creating an order with vendor assignment and default status.
     */
    @Test
    @DisplayName("Should create order with auto-assigned PENDING status and order date")
    void testCreateOrderWithDefaultStatus() {
        Vendor vendor = em.createQuery("SELECT v FROM Vendor v", Vendor.class).getSingleResult();
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order order = new Order();
        order.setVendor(vendor);
        order.setCustomer(customer);
        order.setTotalAmount(BigDecimal.valueOf(5000.00));
        order.setDestinationAddress("789 Delivery Lane, Port City");

        Order createdOrder = orderBean.createOrder(order);

        Assertions.assertNotNull(createdOrder, "Order should be created");
        Assertions.assertNotNull(createdOrder.getOrderId(), "Order ID should be generated");
        Assertions.assertEquals(OrderStatus.PENDING, createdOrder.getStatus(), "Default status should be PENDING");
        Assertions.assertNotNull(createdOrder.getOrderDate(), "Order date should be auto-set");
        Assertions.assertEquals(vendor.getVendorId(), createdOrder.getVendor().getVendorId(), "Vendor should be assigned");
    }

    /**
     * Tests retrieving all created orders.
     */
    @Test
    @DisplayName("Should retrieve all orders sorted by descending order ID")
    void testFindAllOrders() {
        Vendor vendor = em.createQuery("SELECT v FROM Vendor v", Vendor.class).getSingleResult();
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        // Create multiple orders
        for (int i = 1; i <= 3; i++) {
            Order order = new Order();
            order.setVendor(vendor);
            order.setCustomer(customer);
            order.setTotalAmount(BigDecimal.valueOf(1000 * i));
            order.setDestinationAddress("Address " + i);
            orderBean.createOrder(order);
        }

        List<Order> allOrders = orderBean.findAllOrders();

        Assertions.assertNotNull(allOrders, "Orders list should not be null");
        Assertions.assertTrue(allOrders.size() >= 3, "Should have at least 3 orders");
        // Verify descending order ID sort
        for (int i = 0; i < allOrders.size() - 1; i++) {
            Assertions.assertTrue(
                    allOrders.get(i).getOrderId() >= allOrders.get(i + 1).getOrderId(),
                    "Orders should be sorted by descending ID"
            );
        }
    }

    /**
     * Tests finding order by specific ID.
     */
    @Test
    @DisplayName("Should find specific order by ID")
    void testFindOrderById() {
        Vendor vendor = em.createQuery("SELECT v FROM Vendor v", Vendor.class).getSingleResult();
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order order = new Order();
        order.setVendor(vendor);
        order.setCustomer(customer);
        order.setTotalAmount(BigDecimal.valueOf(3500.50));
        order.setDestinationAddress("Specific Address");

        Order createdOrder = orderBean.createOrder(order);

        Order foundOrder = orderBean.findOrderById(createdOrder.getOrderId());

        Assertions.assertNotNull(foundOrder, "Order should be found by ID");
        Assertions.assertEquals(createdOrder.getOrderId(), foundOrder.getOrderId(), "Order IDs should match");
        Assertions.assertEquals(BigDecimal.valueOf(3500.50), foundOrder.getTotalAmount(), "Amount should match");
    }

    /**
     * Tests filtering orders by specific status.
     */
    @Test
    @DisplayName("Should find all orders with PENDING status")
    void testFindOrdersByStatus() {
        Vendor vendor = em.createQuery("SELECT v FROM Vendor v", Vendor.class).getSingleResult();
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order pendingOrder = new Order();
        pendingOrder.setVendor(vendor);
        pendingOrder.setCustomer(customer);
        pendingOrder.setStatus(OrderStatus.PENDING);
        pendingOrder.setTotalAmount(BigDecimal.valueOf(2000.00));
        pendingOrder.setDestinationAddress("Pending Address");
        orderBean.createOrder(pendingOrder);

        List<Order> pendingOrders = orderBean.findOrdersByStatus(OrderStatus.PENDING);

        Assertions.assertNotNull(pendingOrders, "Pending orders list should not be null");
        Assertions.assertTrue(pendingOrders.size() > 0, "Should find at least one PENDING order");
        Assertions.assertTrue(
                pendingOrders.stream().allMatch(o -> o.getStatus() == OrderStatus.PENDING),
                "All returned orders should have PENDING status"
        );
    }

    /**
     * Tests that creating order without vendor throws exception.
     */
    @Test
    @DisplayName("Should throw IllegalArgumentException when vendor is null")
    void testCreateOrderWithoutVendor() {
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order order = new Order();
        order.setCustomer(customer);
        order.setTotalAmount(BigDecimal.valueOf(1000.00));
        order.setDestinationAddress("Address without vendor");

        IllegalArgumentException exception = Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> orderBean.createOrder(order),
                "Should throw exception when vendor is null"
        );

        Assertions.assertTrue(
                exception.getMessage().contains("Vendor"),
                "Error message should mention vendor requirement"
        );
    }

    /**
     * Tests updating order status through persistence.
     */
    @Test
    @DisplayName("Should update order status and verify persistence")
    void testOrderStatusUpdate() {
        Vendor vendor = em.createQuery("SELECT v FROM Vendor v", Vendor.class).getSingleResult();
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order order = new Order();
        order.setVendor(vendor);
        order.setCustomer(customer);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(BigDecimal.valueOf(1500.00));
        order.setDestinationAddress("Update test address");

        Order createdOrder = orderBean.createOrder(order);
        Integer orderId = createdOrder.getOrderId();

        // Update status
        Order foundOrder = em.find(Order.class, orderId);
        foundOrder.setStatus(OrderStatus.CONFIRMED);
        em.merge(foundOrder);
        em.flush();

        // Verify update persisted
        Order verifyOrder = orderBean.findOrderById(orderId);
        Assertions.assertEquals(
                OrderStatus.CONFIRMED,
                verifyOrder.getStatus(),
                "Order status should be updated to CONFIRMED"
        );
    }
}
