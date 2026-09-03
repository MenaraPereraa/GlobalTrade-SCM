package lk.menara.globaltrade.core.exception;

import jakarta.ejb.ApplicationException;

@ApplicationException(rollback = true)
public class InsufficientStockException extends Exception {
    public InsufficientStockException(String message) {
        super(message);
    }
}