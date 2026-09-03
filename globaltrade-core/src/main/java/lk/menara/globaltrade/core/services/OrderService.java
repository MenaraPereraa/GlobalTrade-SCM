package lk.menara.globaltrade.core.services;

import lk.menara.globaltrade.core.entity.Order;
import lk.menara.globaltrade.core.enums.OrderStatus;
import java.util.List;

public interface OrderService {
    List<Order> findAllOrders();
    List<Order> findOrdersByStatus(OrderStatus status);
    Order findOrderById(Integer orderId);
    Order createOrder(Order order);
    Order updateOrderStatus(Integer orderId, OrderStatus status);
}