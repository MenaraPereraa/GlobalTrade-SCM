package lk.menara.globaltrade.core.exception;

import jakarta.ejb.ApplicationException;

@ApplicationException(rollback = true)
public class InvalidShipmentTransitionException extends Exception {
    public InvalidShipmentTransitionException(String message) {
        super(message);
    }
}