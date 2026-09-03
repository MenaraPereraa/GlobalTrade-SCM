package lk.menara.globaltrade.scm.bean.coordinator;

import lk.menara.globaltrade.core.entity.Vendor;
import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.entity.OrderItem;
import lk.menara.globaltrade.core.enums.OrderStatus;
import lk.menara.globaltrade.core.services.OrderService;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;

@Stateless
public class OrderBean implements OrderService {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Override
    public List<Order> findAllOrders() {
        return em.createQuery("SELECT o FROM Order o ORDER BY o.orderId DESC", Order.class)
                .getResultList();
    }

    @Override
    public List<Order> findOrdersByStatus(OrderStatus status) {
        return em.createQuery("SELECT o FROM Order o WHERE o.status = :status ORDER BY o.orderId DESC", Order.class)
                .setParameter("status", status)
                .getResultList();
    }

    @Override
    public Order findOrderById(Integer orderId) {
        return em.find(Order.class, orderId);
    }

    @Override
    public Order createOrder(Order order) {
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDateTime.now());
        }
        if (order.getStatus() == null) {
            order.setStatus(OrderStatus.PENDING);
        }

        if (order.getVendor() == null) {
            throw new IllegalArgumentException("Vendor object cannot be null.");
        }

        Integer vId = order.getVendor().getVendorId();
        if (vId == null) {
            throw new IllegalArgumentException("Vendor ID cannot be null. Please provide a valid vendor ID.");
        }

        Vendor managedVendor = em.find(Vendor.class, vId);
        if (managedVendor != null) {
            order.setVendor(managedVendor);
        } else {
            throw new IllegalArgumentException("Provided Vendor ID does not exist in the database.");
        }

        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                item.setOrder(order);
            }
        }

        em.persist(order);
        return order;
    }

    @Override
    public Order updateOrderStatus(Integer orderId, OrderStatus status) {
        Order order = findOrderById(orderId);
        if (order != null) {
            order.setStatus(status);
            em.merge(order);
        }
        return order;
    }
}