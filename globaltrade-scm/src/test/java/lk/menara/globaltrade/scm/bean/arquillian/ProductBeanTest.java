package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;
import lk.menara.globaltrade.scm.bean.warehouse.ProductBean;
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

@ExtendWith(ArquillianExtension.class)
@DisplayName("ProductBean Integration Tests")
public class ProductBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private ProductBean productBean;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-product-bean.jar")
                .addClasses(ProductBean.class, Product.class, Inventory.class, Warehouse.class, Audit.class)
                .addPackage("lk.menara.globaltrade.core.enums")
                .addPackage("lk.menara.globaltrade.core.exception")
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setupTestData() {
        Warehouse mainWarehouse = new Warehouse("Main Warehouse", "US", 5000, true);
        em.persist(mainWarehouse);
        em.flush();
    }

    @Test
    @DisplayName("Should successfully inject ProductBean via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(productBean, "ProductBean should be injected!");
        Assertions.assertNotNull(em, "EntityManager should be injected!");
    }

    @Test
    @DisplayName("Should create product and seed a zero-quantity inventory row in warehouse #1")
    void testCreateProduct() {
        Product product = new Product();
        product.setName("Steel Beams");
        product.setSku("SKU-STEEL-01");
        product.setUnitPrice(BigDecimal.valueOf(250.00));

        Product created = productBean.createProduct(product);

        Assertions.assertNotNull(created.getProductId(), "Product should get a generated ID");
        Assertions.assertEquals("Steel Beams", created.getName());

        Inventory inventory = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.product.productId = :pid", Inventory.class)
                .setParameter("pid", created.getProductId())
                .getSingleResult();
        Assertions.assertEquals(0, inventory.getQuantityOnHand(), "New product inventory should start at 0");
        Assertions.assertEquals(10, inventory.getReorderThreshold());
        Assertions.assertEquals(3, inventory.getMinStockLevel());
    }

    @Test
    @DisplayName("Should retrieve all products ordered by descending ID")
    void testGetAllProducts() {
        productBean.createProduct(newProduct("Product A", "SKU-A"));
        productBean.createProduct(newProduct("Product B", "SKU-B"));

        List<Product> all = productBean.getAllProducts();

        Assertions.assertTrue(all.size() >= 2);
        for (int i = 0; i < all.size() - 1; i++) {
            Assertions.assertTrue(all.get(i).getProductId() >= all.get(i + 1).getProductId());
        }
    }

    @Test
    @DisplayName("Should find product by ID")
    void testGetProductById() {
        Product created = productBean.createProduct(newProduct("Findable Product", "SKU-FIND"));

        Product found = productBean.getProductById(created.getProductId().intValue());

        Assertions.assertEquals(created.getProductId(), found.getProductId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unknown product ID")
    void testGetProductByIdNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class, () -> productBean.getProductById(999999));
    }

    @Test
    @DisplayName("Should update product fields")
    void testUpdateProduct() {
        Product created = productBean.createProduct(newProduct("Old Name", "SKU-UPD"));

        Product updates = new Product();
        updates.setName("New Name");
        updates.setDescription("Updated description");
        updates.setUnitPrice(BigDecimal.valueOf(999.99));
        updates.setSku("SKU-UPD-NEW");
        updates.setStatus("DISCONTINUED");

        Product updated = productBean.updateProduct(created.getProductId().intValue(), updates);

        Assertions.assertEquals("New Name", updated.getName());
        Assertions.assertEquals("Updated description", updated.getDescription());
        Assertions.assertEquals(BigDecimal.valueOf(999.99), updated.getUnitPrice());
        Assertions.assertEquals("SKU-UPD-NEW", updated.getSku());
        Assertions.assertEquals("DISCONTINUED", updated.getStatus());

        em.flush();
        em.clear();
        Product reloaded = em.find(Product.class, created.getProductId());
        Assertions.assertEquals("New Name", reloaded.getName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when updating unknown product")
    void testUpdateProductNotFound() {
        Product updates = newProduct("Ghost", "SKU-GHOST");
        Assertions.assertThrows(ResourceNotFoundException.class,
                () -> productBean.updateProduct(999999, updates));
    }

    @Test
    @DisplayName("Should delete product")
    void testDeleteProduct() {
        Product created = productBean.createProduct(newProduct("Disposable Product", "SKU-DEL"));
        Integer id = created.getProductId().intValue();

        productBean.deleteProduct(id);
        em.flush();

        Assertions.assertThrows(ResourceNotFoundException.class, () -> productBean.getProductById(id));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting unknown product")
    void testDeleteProductNotFound() {
        Assertions.assertThrows(ResourceNotFoundException.class, () -> productBean.deleteProduct(999999));
    }

    private Product newProduct(String name, String sku) {
        Product product = new Product();
        product.setName(name);
        product.setSku(sku);
        product.setUnitPrice(BigDecimal.valueOf(100.00));
        return product;
    }
}
