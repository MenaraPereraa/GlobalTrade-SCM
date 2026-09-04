# Arquillian + JUnit 5 Setup Guide for GlobalTrade

This document explains the complete Arquillian testing infrastructure for your GlobalTrade project.

## Overview

Arquillian is a container-agnostic testing platform that allows you to test Jakarta EE components (EJBs, CDI Beans, Servlets) in a real container environment. When combined with JUnit 5, it provides a modern, annotation-driven testing experience.

## Project Structure

```
globaltrade-scm/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── lk/menara/globaltrade/scm/bean/
│   │   │       ├── admin/AdminUserBean.java
│   │   │       ├── coordinator/OrderBean.java
│   │   │       └── customer/CustomerPortalBean.java
│   │   └── resources/
│   │       └── arquillian.xml                 [Main config - uses GlassFish]
│   └── test/
│       ├── java/
│       │   └── lk/menara/globaltrade/scm/bean/arquillian/
│       │       ├── AdminUserBeanTest.java     [EJB testing example]
│       │       ├── OrderBeanTest.java         [Coordinator bean testing]
│       │       └── CustomerPortalBeanTest.java [Portal bean testing]
│       └── resources/
│           ├── arquillian.xml                 [Test-specific overrides]
│           └── META-INF/
│               ├── beans.xml                  [CDI configuration]
│               └── persistence.xml            [JPA test configuration]
```

## Configuration Files

### 1. arquillian.xml (Main Configuration)
**Location:** `src/main/resources/arquillian.xml`

```xml
<container default="true" qualifier="glassfish-managed">
    <configuration>
        <property name="glassFishHome">target/glassfish</property>
        <property name="adminPort">4848</property>
        <property name="domain">domain1</property>
        <property name="debug">false</property>
    </configuration>
</container>
```

**Key Properties:**
- `glassFishHome`: Path to GlassFish/Payara installation (managed container downloads it automatically)
- `adminPort`: DAS (Domain Admin Server) port for container management
- `domain`: GlassFish domain name
- `debug`: Enable debugging for troubleshooting test execution

**Container Type:** GlassFish/Payara Managed Container
- Arquillian controls the server lifecycle (start/stop)
- Ideal for CI/CD pipelines
- Requires JDK and Maven

### 2. beans.xml (CDI Configuration)
**Location:** `src/test/resources/META-INF/beans.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="https://jakarta.ee/xml/ns/jakartaee"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/beans_4_0.xsd"
       bean-discovery-mode="all">
</beans>
```

**Attributes:**
- `bean-discovery-mode="all"`: Enables CDI for all classes including @Stateless EJBs
- Must be present in test archive for dependency injection to work

### 3. persistence.xml (JPA Configuration)
**Location:** `src/test/resources/META-INF/persistence.xml`

```xml
<persistence-unit name="globaltradePU" transaction-type="JTA">
    <jta-data-source>jdbc/GlobalTrade</jta-data-source>
    <properties>
        <property name="jakarta.persistence.schema-generation.database.action" value="create"/>
        <property name="hibernate.dialect" value="org.hibernate.dialect.H2Dialect"/>
    </properties>
</persistence-unit>
```

**Key Settings:**
- `name="globaltradePU"`: Must match unitName in @PersistenceContext
- `transaction-type="JTA"`: Uses container-managed transactions
- `jta-data-source`: JNDI name must be configured in GlassFish
- `hibernate.dialect`: Use H2Dialect for in-memory testing

## Test Class Structure

### Pattern 1: @ExtendWith(ArquillianExtension.class)
Enables Arquillian for JUnit 5 tests.

```java
@ExtendWith(ArquillianExtension.class)
public class MyBeanTest { ... }
```

### Pattern 2: @Deployment
Creates the ShrinkWrap archive for testing.

```java
@Deployment
public static JavaArchive createDeployment() {
    return ShrinkWrap.create(JavaArchive.class, "test.jar")
            .addClasses(MyBean.class, MyEntity.class)
            .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
            .addAsManifestResource("META-INF/persistence.xml", "persistence.xml");
}
```

**Archive Types:**
- `JavaArchive`: For EJB/JAR modules (stateless beans, entities)
- `WebArchive`: For web modules (servlets, JSPs)
- `EnterpriseArchive`: For complete EAR packages

### Pattern 3: Dependency Injection
Arquillian injects both test resource and container-managed instances.

```java
@PersistenceContext(unitName = "globaltradePU")
private EntityManager em;

@Inject
private MyStatelessBean myBean;
```

## ShrinkWrap Best Practices

### What to Include in Archive

1. **The Bean Being Tested**
   ```java
   .addClasses(AdminUserBean.class)
   ```

2. **Entity Classes**
   ```java
   .addClasses(User.class, Role.class, Warehouse.class)
   ```

3. **Dependencies of the Bean**
   ```java
   .addClasses(PasswordService.class)
   ```

4. **Enums and Exceptions**
   ```java
   .addPackage("lk.menara.globaltrade.core.enums")
   .addPackage("lk.menara.globaltrade.core.exception")
   ```

5. **CDI Configuration**
   ```java
   .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
   ```

6. **Persistence Configuration**
   ```java
   .addAsManifestResource("META-INF/persistence.xml", "persistence.xml")
   ```

### What NOT to Include

- **Duplicate resources** - Only one persistence.xml per archive
- **Conflicting libraries** - Arquillian provides Jakarta EE APIs
- **Unrelated classes** - Keep archives minimal for fast test execution

## Running Tests

### From IDE
```bash
# Most IDEs (IntelliJ, Eclipse) run Arquillian tests automatically
# Right-click test class > Run or Debug
```

### From Maven
```bash
# Run all Arquillian tests
mvn test

# Run specific test class
mvn test -Dtest=AdminUserBeanTest

# Run specific test method
mvn test -Dtest=AdminUserBeanTest#testCreateStaffUser

# Skip tests
mvn package -DskipTests
```

### Test Output
```
[INFO] Running lk.menara.globaltrade.scm.bean.arquillian.AdminUserBeanTest
[INFO] Starting GlassFish container...
[INFO] Deploying test archive...
[INFO] ✓ testBeanInjection
[INFO] ✓ testCreateStaffUser
[INFO] ✓ testGetAllStaff
[INFO] Tests run: 3, Failures: 0, Errors: 0
[INFO] Shutting down GlassFish container...
```

## Common Test Patterns

### Pattern 1: Test Bean Injection
```java
@Test
void testBeanInjection() {
    Assertions.assertNotNull(myBean, "Bean should be injected!");
}
```

### Pattern 2: Test CRUD Operations
```java
@Test
void testCreateEntity() throws Exception {
    MyEntity created = myBean.create(data);
    Assertions.assertNotNull(created.getId());
    
    MyEntity found = em.find(MyEntity.class, created.getId());
    Assertions.assertNotNull(found);
}
```

### Pattern 3: Test Business Logic
```java
@Test
void testBusinessRule() throws Exception {
    MyEntity result = myBean.complexBusinessMethod(input);
    Assertions.assertEquals(expectedValue, result.getField());
}
```

### Pattern 4: Test Transaction Rollback
```java
@Test
void testValidationException() {
    Assertions.assertThrows(ValidationException.class,
        () -> myBean.invalidOperation()
    );
}
```

## Troubleshooting

### Issue: "Cannot deploy application"
**Solution:** Check if beans.xml exists in META-INF directory of archive.

### Issue: "Persistence unit not found"
**Solution:** Verify persistence.xml path matches in both archive and @PersistenceContext.

### Issue: "EJB injection fails"
**Solution:** Ensure beans.xml has `bean-discovery-mode="all"` for @Stateless EJBs.

### Issue: "GlassFish start timeout"
**Solution:** Increase timeout in arquillian.xml or check system resources.

### Issue: "Test database connection fails"
**Solution:** Verify JNDI datasource name matches in persistence.xml.

## GlassFish Container Configuration

### Managed Container Advantages
- ✅ Arquillian controls server lifecycle
- ✅ Isolated test environment
- ✅ Good for CI/CD pipelines
- ✅ No manual server startup needed

### Download Configuration
GlassFish is automatically downloaded to `target/glassfish/` by Arquillian if not present.

### Custom Installation
To use existing GlassFish installation:
```xml
<property name="glassFishHome">/path/to/glassfish</property>
```

## Dependency Management

Your pom.xml already includes all necessary dependencies:

```xml
<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.9.3</version>
    <scope>test</scope>
</dependency>

<!-- Arquillian JUnit 5 -->
<dependency>
    <groupId>org.jboss.arquillian.junit5</groupId>
    <artifactId>arquillian-junit5-container</artifactId>
    <version>1.7.0.Final</version>
    <scope>test</scope>
</dependency>

<!-- GlassFish Container Adapter -->
<dependency>
    <groupId>ee.omnifish.arquillian</groupId>
    <artifactId>arquillian-glassfish-server-managed</artifactId>
    <version>2.1.2</version>
    <scope>test</scope>
</dependency>

<!-- ShrinkWrap -->
<dependency>
    <groupId>org.jboss.shrinkwrap.resolver</groupId>
    <artifactId>shrinkwrap-resolver-depchain</artifactId>
    <version>3.3.0</version>
    <type>pom</type>
    <scope>test</scope>
</dependency>
```

## Best Practices

1. **Keep test archives small** - Only include necessary classes
2. **Use @BeforeEach for test data** - Ensures clean state for each test
3. **Test one concern per test method** - Clear test names with @DisplayName
4. **Use meaningful assertions** - Include assertion messages for debugging
5. **Mock external services** - Use Mockito for third-party service calls
6. **Document complex tests** - Use JavaDoc on test methods
7. **Test both success and failure paths** - Include negative test cases

## Example: Complete Test Flow

```
1. @BeforeEach setupTestData()
   └─ Creates Role entities in database
   
2. @Test testCreateStaffUser()
   ├─ Call adminUserBean.createStaffUser()
   ├─ Assertions verify returned object
   └─ EntityManager finds created entity
   
3. Test completes
   └─ Transaction rolls back (test isolation)
   
4. Next test runs with clean database
```

## Resources

- [Arquillian Documentation](https://arquillian.org/)
- [ShrinkWrap API](https://shrinkwrap.org/)
- [JUnit 5 Documentation](https://junit.org/junit5/)
- [GlassFish Server](https://glassfish.org/)
- [Jakarta EE Platform](https://jakarta.ee/)

## File Checklist

- [x] `src/main/resources/arquillian.xml` - Main container config
- [x] `src/test/resources/arquillian.xml` - Test overrides
- [x] `src/test/resources/META-INF/beans.xml` - CDI config
- [x] `src/test/resources/META-INF/persistence.xml` - JPA config
- [x] `AdminUserBeanTest.java` - Complete test example
- [x] `OrderBeanTest.java` - Coordinator bean tests
- [x] `CustomerPortalBeanTest.java` - Portal bean tests

## Next Steps

1. Run the test suite: `mvn test`
2. Review test output for any failures
3. Add tests for other beans in your project
4. Configure CI/CD pipeline to run tests automatically
5. Monitor test coverage with tools like JaCoCo
