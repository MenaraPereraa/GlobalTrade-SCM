package lk.menara.globaltrade.scm.bean.customer;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.dto.OrderRequestDTO;

@Stateless
public class CustomerPortalBean {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    public List<Product> getAvailableCatalog() {
        return em.createQuery("SELECT p FROM Product p", Product.class).getResultList();
    }

    public Order createSalesOrder(OrderRequestDTO orderDto) {
        Order order = new Order();
        em.persist(order);
        return order;
    }

    public byte[] generateInvoicePdf(Long orderId) {
        return new byte[0];
    }

    public String getTrackingDetails(Long orderId) {
        return "Tracking details for order ID: " + orderId;
    }
}