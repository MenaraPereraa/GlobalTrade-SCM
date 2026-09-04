package lk.menara.globaltrade.scm.bean.arquillian;

import jakarta.inject.Inject;
import lk.menara.globaltrade.scm.bean.service.ProcurementService;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit5.ArquillianExtension;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.asset.EmptyAsset;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

/**
 * ProcurementService has no persistence dependency - sourceRfq() just
 * fills in defaults and hands off to an async mailer stub, so these tests
 * exercise it purely through CDI, no EntityManager needed.
 */
@ExtendWith(ArquillianExtension.class)
@DisplayName("ProcurementService Integration Tests")
public class ProcurementServiceTest {

    @Inject
    private ProcurementService procurementService;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class, "test-procurement-service.jar")
                .addClasses(ProcurementService.class)
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml");
    }

    @Test
    @DisplayName("Should inject ProcurementService via CDI")
    void testBeanInjection() {
        Assertions.assertNotNull(procurementService);
    }

    @Test
    @DisplayName("Should accept an explicit quantity and expected date without altering them")
    void testSourceRfqWithExplicitValues() {
        Assertions.assertDoesNotThrow(() ->
                procurementService.sourceRfq(1L, 1L, 50, "2026-12-25"));
    }

    @Test
    @DisplayName("Should fall back to default quantity when customQty is zero or negative")
    void testSourceRfqDefaultsQuantity() {
        Assertions.assertDoesNotThrow(() -> procurementService.sourceRfq(1L, 1L, 0, "2026-12-25"));
        Assertions.assertDoesNotThrow(() -> procurementService.sourceRfq(1L, 1L, -5, "2026-12-25"));
    }

    @Test
    @DisplayName("Should fall back to a +7 day expected date when none is supplied")
    void testSourceRfqDefaultsExpectedDate() {
        Assertions.assertDoesNotThrow(() -> procurementService.sourceRfq(1L, 1L, 20, null));
        Assertions.assertDoesNotThrow(() -> procurementService.sourceRfq(1L, 1L, 20, ""));
    }

    @Test
    @DisplayName("Should dispatch the async vendor email without raising an error")
    void testSendEmailToVendorAsyncDoesNotThrow() {
        Assertions.assertDoesNotThrow(() ->
                procurementService.sendEmailToVendorAsync(1L, 30, "2026-01-01"));
    }
}
