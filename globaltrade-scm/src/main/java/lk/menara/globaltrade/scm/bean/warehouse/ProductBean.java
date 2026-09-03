package lk.menara.globaltrade.scm.bean.warehouse;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lk.menara.globaltrade.core.entity.Inventory;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Warehouse;
import lk.menara.globaltrade.core.exception.ResourceNotFoundException;
import lk.menara.globaltrade.logs.annotations.Audit;

import java.util.List;

@Stateless
public class ProductBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Audit
    public Product createProduct(Product product) {
        em.persist(product);
        em.flush();

        Warehouse defaultWarehouse = em.find(Warehouse.class, 1);
        if (defaultWarehouse != null) {
            Inventory inventory = new Inventory();
            inventory.setProduct(product);
            inventory.setWarehouse(defaultWarehouse);
            inventory.setQuantityOnHand(0);
            inventory.setReorderThreshold(10);
            inventory.setMinStockLevel(3);
            em.persist(inventory);
        }

        return product;
    }

    public List<Product> getAllProducts() {
        return em.createQuery("SELECT p FROM Product p ORDER BY p.productId DESC", Product.class).getResultList();
    }

    public Product getProductById(Integer id) {
        Product product = em.find(Product.class, id);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        return product;
    }

    @Audit
    public Product updateProduct(Integer id, Product updated) {
        Product existing = getProductById(id);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setUnitPrice(updated.getUnitPrice());
        existing.setSku(updated.getSku());
        existing.setWeightKg(updated.getWeightKg());
        existing.setStatus(updated.getStatus());
        return existing;
    }

    @Audit
    public void deleteProduct(Integer id) {
        Product product = getProductById(id);
        em.remove(product);
    }
}