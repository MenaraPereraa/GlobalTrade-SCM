# Arquillian + JUnit 5 Quick Reference Card

## Test Execution Commands

```bash
# Run all tests in globaltrade-scm
mvn test -pl globaltrade-scm

# Run specific test class
mvn test -pl globaltrade-scm -Dtest=AdminUserBeanTest

# Run specific test method
mvn test -pl globaltrade-scm -Dtest=AdminUserBeanTest#testCreateStaffUser

# Run multiple tests
mvn test -pl globaltrade-scm -Dtest=AdminUserBeanTest,OrderBeanTest

# Skip tests during build
mvn package -pl globaltrade-scm -DskipTests

# Clean and test
mvn clean test -pl globaltrade-scm -X
```

## IDE Shortcuts

| IDE | Run Test | Debug Test |
|-----|----------|-----------|
| **IntelliJ IDEA** | `Ctrl+Shift+F10` | `Ctrl+Shift+D` |
| **Eclipse** | `Alt+Shift+X, T` | `Alt+Shift+D, T` |
| **VS Code** | Click "Run" above test | Click "Debug" above test |

## Key Annotations

```java
// Enable Arquillian for JUnit 5
@ExtendWith(ArquillianExtension.class)

// Create test deployment archive
@Deployment
public static JavaArchive createDeployment() { ... }

// Inject EntityManager
@PersistenceContext(unitName = "globaltradePU")
private EntityManager em;

// Inject stateless EJB
@Inject
private MyStatelessBean bean;

// Test setup before each test
@BeforeEach
void setup() { ... }

// Test method
@Test
@DisplayName("Should test something")
void testSomething() { ... }
```

## ShrinkWrap Archive Building

```java
ShrinkWrap.create(JavaArchive.class, "test.jar")
    // Add classes
    .addClasses(Bean.class, Entity.class)
    .addPackage("com.example.package")
    .addPackages(true, "com.example")  // true = includes subpackages
    
    // Add resources
    .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
    .addAsManifestResource("META-INF/persistence.xml", "persistence.xml")
    .addAsResource("config.properties", "config.properties")
    .addAsWebResource(new File("src/main/webapp/index.html"), "index.html")
```

## Assertion Patterns

```java
// Null checks
Assertions.assertNotNull(obj, "Message");
Assertions.assertNull(obj);

// Equality
Assertions.assertEquals(expected, actual);
Assertions.assertNotEquals(unexpected, actual);

// Boolean
Assertions.assertTrue(condition);
Assertions.assertFalse(condition);

// Exceptions
Assertions.assertThrows(Exception.class, () -> {
    methodThatThrows();
});

// Collections
Assertions.assertTrue(list.contains(item));
Assertions.assertEquals(3, list.size());
```

## Test Class Template

```java
@ExtendWith(ArquillianExtension.class)
@DisplayName("MyBeanTest")
public class MyBeanTest {

    @PersistenceContext(unitName = "globaltradePU")
    private EntityManager em;

    @Inject
    private MyStatelessBean myBean;

    @Deployment
    public static JavaArchive createDeployment() {
        return ShrinkWrap.create(JavaArchive.class)
                .addClasses(MyStatelessBean.class, MyEntity.class)
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
    }

    @BeforeEach
    void setup() {
        // Create test data
        MyEntity entity = new MyEntity();
        em.persist(entity);
        em.flush();
    }

    @Test
    @DisplayName("Should do something")
    void testSomething() {
        // Act
        Result result = myBean.businessMethod(data);
        
        // Assert
        Assertions.assertNotNull(result);
        Assertions.assertEquals(expected, result.getField());
    }
}
```

## Configuration Files Locations

```
src/main/resources/arquillian.xml         # Container config
src/test/resources/arquillian.xml         # Test overrides
src/test/resources/META-INF/beans.xml     # CDI config
src/test/resources/META-INF/persistence.xml  # JPA config
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Container not found" | Missing container adapter | Add `arquillian-glassfish-server-managed` dependency |
| "Persistence unit not found" | persistence.xml not in archive | Check path: `META-INF/persistence.xml` |
| "EJB not injected" | Missing beans.xml | Add `EmptyAsset.INSTANCE` for `beans.xml` |
| "DataSource not found" | JNDI name mismatch | Verify `jta-data-source` in persistence.xml |
| "Test hangs" | Server startup issue | Check admin port 4848 not in use |
| "ClassNotFoundException" | Missing class in archive | Add class with `.addClasses()` |

## File Checklist

Before running tests, ensure:

```
✓ globaltrade-scm/src/main/resources/arquillian.xml
✓ globaltrade-scm/src/test/resources/arquillian.xml
✓ globaltrade-scm/src/test/resources/META-INF/beans.xml
✓ globaltrade-scm/src/test/resources/META-INF/persistence.xml
✓ globaltrade-scm/src/test/java/.../AdminUserBeanTest.java
✓ globaltrade-scm/src/test/java/.../OrderBeanTest.java
✓ globaltrade-scm/src/test/java/.../CustomerPortalBeanTest.java
✓ pom.xml has all Arquillian dependencies
✓ Java compiler version: 17+
✓ Maven: 3.6+
```

## Debug Mode

Enable detailed logging:

```bash
# Edit arquillian.xml
<property name="debug">true</property>

# Run with Maven debug
mvn -X test -pl globaltrade-scm

# View full stack traces
mvn test -e -pl globaltrade-scm
```

## Performance Tips

1. **Minimize archive size** - Only add necessary classes
2. **Reuse container** - Multiple tests in same suite
3. **Use @BeforeEach wisely** - Only setup what's needed
4. **Batch related tests** - Group by bean
5. **Skip integration tests when not needed** - Use Maven skipITs
6. **Parallel test execution** - Configure in pom.xml (if GlassFish supports it)

## Resources

- **Arquillian Docs:** https://arquillian.org/
- **ShrinkWrap Docs:** https://shrinkwrap.org/
- **JUnit 5 Docs:** https://junit.org/junit5/
- **GlassFish Docs:** https://glassfish.org/
- **Jakarta EE Docs:** https://jakarta.ee/

## Test Coverage Metrics

```bash
# Run tests with JaCoCo coverage
mvn clean test jacoco:report -pl globaltrade-scm

# View coverage report
# Open: target/site/jacoco/index.html
```

---

**Created:** 2026-09-04
**Version:** 1.0
**Status:** Ready for Testing
