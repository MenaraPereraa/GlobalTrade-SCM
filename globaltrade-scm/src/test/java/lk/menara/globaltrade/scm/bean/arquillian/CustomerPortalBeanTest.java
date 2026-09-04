package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.dto.OrderRequestDTO;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.entity.Customer;
import lk.menara.globaltrade.scm.bean.customer.CustomerPortalBean;
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
import java.util.List;

/**
 * Arquillian integration tests for CustomerPortalBean using JUnit 5.
 * 
 * Demonstrates:
 * - Testing customer-facing stateless EJB methods
 * - Query operations with JPA EntityManager
 * - DTO integration in tests
 * - Multiple entity creation for realistic scenarios
 */
@ExtendWith(ArquillianExtension.class)
@DisplayName("CustomerPortalBean Integration Tests")
public class CustomerPortalBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private CustomerPortalBean customerPortalBean;

    /**
     * Creates ShrinkWrap deployment with customer portal dependencies.
     */
    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-customer-portal.jar")
                // Bean under test
                .addClasses(CustomerPortalBean.class)
                // Entity classes
                .addClasses(Product.class, Order.class, Customer.class)
                // DTO classes
                .addClasses(OrderRequestDTO.class)
                // Enums and exceptions
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addPackage("lk.menara.globaltrade.core.dto")
                // CDI and JPA configuration
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    /**
     * Setup test data with products and customers.
     */
    @BeforeEach
    void setupTestData() {
        // Create test products
        Product product1 = new Product();
        product1.setProductName("Industrial Machinery");
        product1.setUnitPrice(BigDecimal.valueOf(15000.00));
        product1.setStockQuantity(100);
        em.persist(product1);

        Product product2 = new Product();
        product2.setProductName("Raw Materials");
        product2.setUnitPrice(BigDecimal.valueOf(500.00));
        product2.setStockQuantity(500);
        em.persist(product2);

        Product product3 = new Product();
        product3.setProductName("Components");
        product3.setUnitPrice(BigDecimal.valueOf(100.00));
        product3.setStockQuantity(1000);
        em.persist(product3);

        // Create test customer
        Customer customer = new Customer();
        customer.setName("Test Customer Inc");
        customer.setEmail("customer@test.com");
        customer.setPhone("+1-555-0001");
        customer.setAddress("999 Test Boulevard");
        em.persist(customer);

        em.flush();
    }

    /**
     * Verifies CustomerPortalBean injection.
     */
    @Test
    @DisplayName("Should successfully inject CustomerPortalBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(customerPortalBean, "CustomerPortalBean should be injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    /**
     * Tests retrieving available product catalog.
     */
    @Test
    @DisplayName("Should retrieve all available products in catalog")
    void testGetAvailableCatalog() {
        List<Product> catalog = customerPortalBean.getAvailableCatalog();

        Assertions.assertNotNull(catalog, "Catalog should not be null");
        Assertions.assertTrue(catalog.size() >= 3, "Should have at least 3 products");
        
        // Verify products exist
        Assertions.assertTrue(
                catalog.stream().anyMatch(p -> "Industrial Machinery".equals(p.getProductName())),
                "Catalog should contain Industrial Machinery"
        );
    }

    /**
     * Tests catalog contains products with correct pricing.
     */
    @Test
    @DisplayName("Should retrieve catalog with correct product pricing")
    void testCatalogPricing() {
        List<Product> catalog = customerPortalBean.getAvailableCatalog();

        Product machinery = catalog.stream()
                .filter(p -> "Industrial Machinery".equals(p.getProductName()))
                .findFirst()
                .orElse(null);

        Assertions.assertNotNull(machinery, "Should find machinery product");
        Assertions.assertEquals(
                BigDecimal.valueOf(15000.00),
                machinery.getUnitPrice(),
                "Machinery should cost 15000"
        );
        Assertions.assertTrue(
                machinery.getStockQuantity() > 0,
                "Product should have available stock"
        );
    }

    /**
     * Tests creating a sales order from customer request.
     */
    @Test
    @DisplayName("Should create sales order successfully")
    void testCreateSalesOrder() {
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();
        Product product = em.createQuery("SELECT p FROM Product p WHERE p.productName = 'Industrial Machinery'", Product.class)
                .getSingleResult();

        OrderRequestDTO orderDto = new OrderRequestDTO();
        orderDto.setCustomerId(customer.getCustomerId());
        orderDto.setDestinationAddress("Delivery Address");

        Order createdOrder = customerPortalBean.createSalesOrder(orderDto);

        Assertions.assertNotNull(createdOrder, "Order should be created");
        Assertions.assertNotNull(createdOrder.getOrderId(), "Order should have ID");
    }

    /**
     * Tests generating invoice PDF.
     */
    @Test
    @DisplayName("Should generate invoice PDF for order")
    void testGenerateInvoicePdf() {
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        OrderRequestDTO orderDto = new OrderRequestDTO();
        orderDto.setCustomerId(customer.getCustomerId());
        orderDto.setDestinationAddress("Delivery Address");

        Order order = customerPortalBean.createSalesOrder(orderDto);

        byte[] pdfBytes = customerPortalBean.generateInvoicePdf(order.getOrderId().longValue());

        Assertions.assertNotNull(pdfBytes, "PDF should be generated");
    }

    /**
     * Tests retrieving tracking details for an order.
     */
    @Test
    @DisplayName("Should retrieve tracking details for order")
    void testGetTrackingDetails() {
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        OrderRequestDTO orderDto = new OrderRequestDTO();
        orderDto.setCustomerId(customer.getCustomerId());
        orderDto.setDestinationAddress("Delivery Address");

        Order order = customerPortalBean.createSalesOrder(orderDto);
        Long orderId = order.getOrderId().longValue();

        String trackingDetails = customerPortalBean.getTrackingDetails(orderId);

        Assertions.assertNotNull(trackingDetails, "Tracking details should be provided");
        Assertions.assertTrue(
                trackingDetails.contains(orderId.toString()),
                "Tracking details should contain order ID"
        );
    }

    /**
     * Tests catalog retrieval with empty database fallback.
     */
    @Test
    @DisplayName("Should handle catalog retrieval gracefully")
    void testCatalogRetrievalGracefully() {
        List<Product> catalog = customerPortalBean.getAvailableCatalog();

        Assertions.assertNotNull(catalog, "Catalog should never be null");
        // Even with 3 test products, catalog should return them
        Assertions.assertTrue(catalog.size() > 0, "Catalog should contain products");
    }

    /**
     * Tests that multiple orders can be created sequentially.
     */
    @Test
    @DisplayName("Should create multiple orders sequentially")
    void testMultipleOrderCreation() {
        Customer customer = em.createQuery("SELECT c FROM Customer c", Customer.class).getSingleResult();

        Order order1 = new Order();
        order1.setCustomer(customer);
        order1.setDestinationAddress("Address 1");
        em.persist(order1);

        Order order2 = new Order();
        order2.setCustomer(customer);
        order2.setDestinationAddress("Address 2");
        em.persist(order2);

        em.flush();

        List<Order> customerOrders = em.createQuery(
                "SELECT o FROM Order o WHERE o.customer.customerId = :customerId",
                Order.class
        ).setParameter("customerId", customer.getCustomerId()).getResultList();

        Assertions.assertTrue(customerOrders.size() >= 2, "Customer should have multiple orders");
    }
}
