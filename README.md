# GlobalTrade — Supply Chain Management System

A multi-module **Jakarta EE 10** enterprise application that modernises international logistics operations by automating end-to-end supply-chain workflows, including inventory management, low-stock alerting, RFQ bidding, vendor coordination, multi-warehouse dispatches, customs clearance, trade documentation, and role-based access control. This project was created for learning enterprise Java development and is not intended for production use.

> **Note:** This is an academic/learning project. Sensitive data is not encrypted, and security features are limited. Use at your own risk if working with real supply-chain or financial data, and consider implementing additional security measures.

---

## Features

- **Role-Based Access Control (RBAC)**: Separate portals and dashboards for Admins, Logistics Coordinators, Warehouse Managers, Vendors, and Customs Agents
- **Inventory & Warehouse Management**: Real-time stock tracking, warehouse movements, inter-warehouse stock transfers, and low-stock detection
- **Automated RFQ & Bidding**: Auto-triggered Request-for-Quotation (RFQ) on low-stock events; vendor filtering by category and email notifications via Java Mail
- **Vendor Portal**: Vendor registration/approval workflow, USD bid submission with PDF attachments, shipment status updates, and logistics route selection
- **Customs Clearance**: Shipment lifecycle management, customs documents, declarations, import permits, and checkpoint audit trails
- **EJB Timer Services**: Automated background tasks — periodic inventory reorder checks, deadline tracking, refresh-token cleanup, and time-critical shipment alerts
- **Transaction Management**: Container-managed and bean-managed transactions ensuring data integrity and rollback support across global logistics operations
- **Audit Logging**: Interceptor-based audit trail with `@Audit` annotation for all critical business operations
- **NFR & Performance Monitoring**: Real-time system metrics tracking via CDI interceptors and servlet filter
- **Customer Portal**: Product catalogue, customer sales order creation and tracking
- **PDF Generation**: Purchase orders, shipping documents, and import permits generated with Apache PDFBox
- **JWT Authentication**: Stateless security with Auth0 Java JWT and Jakarta Security

---

## Tech Stack

### Backend (Jakarta EE 10)
| Layer | Technology |
|---|---|
| Application Server | GlassFish 7.0.21 |
| Java Version | Java 17 |
| EJB / CDI | Jakarta EJB 4.0, CDI 4.0 |
| Persistence | JPA / Hibernate 6.6 |
| REST API | Jakarta RESTful Web Services (JAX-RS) |
| Security | Jakarta Security, Auth0 Java JWT 4.6 |
| Email | Jakarta Mail 2.1 / Eclipse Angus Mail 2.0 |
| PDF | Apache PDFBox 3.0 |
| JSON | Jackson Databind 2.15 |
| Multipart | Jersey Media Multipart 3.1 |

### Frontend (Web Module)
| Layer | Technology |
|---|---|
| View Layer | JSP (Jakarta Server Pages) + JSTL 3.0 |
| Styling | Tailwind CSS v3 (compiled via Node.js / npm) |
| Client-side Logic | Vanilla JavaScript |

### Database
| Layer | Technology |
|---|---|
| RDBMS | MySQL 8.x (via `mysql-connector-j 8.3`) |
| ORM | Hibernate 6.6 / JPA |

### Build & Infrastructure
| Tool | Version |
|---|---|
| Build | Apache Maven (multi-module POM) |
| App Server | GlassFish 7.0.21 |
| CSS pipeline | Node.js v20.11 + npm 10.2.4 (via frontend-maven-plugin) |

### Testing
| Tool | Purpose |
|---|---|
| JUnit 5 | Unit & integration test framework |
| Arquillian | In-container EJB/CDI integration testing |
| Mockito 5 | Mocking framework |
| Postman | REST API manual testing |
| JMeter | Performance & scalability testing |
| Trivy | Supply-chain security / vulnerability scanning |

---

## Project Structure

```
GlobalTrade/                         # Root Maven multi-module project
├── globaltrade-core/                # Shared entities, DTOs, enums, exceptions, service interfaces
│   └── src/main/java/lk/menara/globaltrade/core/
│       ├── entity/                  # JPA entities (User, Vendor, Warehouse, Inventory, Order, RFQ, Shipment …)
│       ├── dto/                     # Data Transfer Objects (RFQDTO, ShipmentRequestDTO …)
│       ├── enums/                   # Domain enumerations (OrderStatus, ShipmentStatus, RFQStatus …)
│       ├── exception/               # Custom exceptions (ResourceNotFoundException, InsufficientStockException …)
│       └── services/                # CDI service interfaces
│
├── globaltrade-auth/                # Authentication & security EJB module
│   └── src/main/java/lk/menara/globaltrade/auth/
│       ├── identity/AppIdentityStore.java   # Jakarta Security identity store
│       ├── service/PasswordService.java     # BCrypt password hashing
│       └── util/                    # JWT utilities and input validation
│
├── globaltrade-logs/                # Audit & performance monitoring EJB module
│   └── src/main/java/lk/menara/globaltrade/logs/
│       ├── annotations/Audit.java   # @Audit CDI annotation
│       ├── bean/                    # AuditLoggerBean, PerformanceMonitorBean
│       ├── interceptors/            # AuditInterceptor, PerformanceInterceptor
│       ├── filter/PerformanceFilter.java
│       └── resource/AuditLogResource.java
│
├── globaltrade-scm/                 # Core supply-chain EJB module (business logic)
│   └── src/main/java/lk/menara/globaltrade/scm/bean/
│       ├── admin/AdminUserBean.java
│       ├── coordinator/             # LogisticsCoordinatorBean, OrderBean, RFQBean
│       ├── customer/CustomerPortalBean.java
│       ├── customs/CustomsClearanceBean.java
│       ├── scheduled/               # EJB Timer beans (InventoryReorderTimerBean, CustomsTimerBean …)
│       ├── service/                 # NotificationService (async email), ProcurementService
│       ├── vendor/VendorBean.java
│       └── warehouse/              # InventoryBean, WarehouseBean, LogisticsBean, ProductBean
│   └── src/test/java/…/arquillian/ # 12 Arquillian + JUnit 5 integration test classes (160 methods)
│
├── globaltrade-rest/                # JAX-RS REST API WAR module
│   └── src/main/java/lk/menara/globaltrade/rest/
│       ├── config/RestApplication.java
│       ├── controller/              # REST resources (admin, coordinator, customer, customs, vendor, warehouse)
│       └── security/               # JWT AuthMechanism, AuthResource
│
├── globaltrade-web/                 # JSP/Tailwind CSS WAR module (frontend)
│   └── src/main/webapp/
│       ├── admin/                   # Admin dashboard, staff management, vendor approvals, NFR metrics
│       ├── coordinator/             # Coordinator dashboard, RFQ management, purchase orders, shipments
│       ├── custom/                  # Customs dashboard, declarations, arrivals, audit trail
│       ├── vendor/                  # Vendor dashboard, RFQs, orders, signup
│       ├── fragments/sidebar.jsp    # Shared navigation sidebar
│       ├── assets/css/tailwind.css  # Compiled Tailwind CSS
│       ├── assets/js/               # Feature-specific vanilla JS modules
│       ├── login.jsp
│       └── dashboard-select.jsp
│
└── globaltrade-ear/                 # Enterprise Application Archive (EAR) assembler
```

---

## Getting Started

### Prerequisites

- Java 17 (JDK)
- Apache Maven 3.8+
- GlassFish 7.0.21 (application server)
- MySQL 8.x (database server)
- Node.js v20+ and npm 10+ *(only needed if building CSS manually)*

---

### 1 — Database Setup

Create the database and configure a JDBC connection pool on GlassFish:

```sql
CREATE DATABASE globaltrade;
```

In the GlassFish Admin Console (`http://localhost:4848`):

1. **Resources → JDBC → Connection Pools** → New pool pointing to your MySQL instance
2. **Resources → JDBC → JDBC Resources** → Create resource with JNDI name `jdbc/GlobalTrade`

---

### 2 — Build the Project

```bash
# Clone the repository
git clone https://github.com/your-username/globaltrade.git
cd globaltrade

# Build all modules (skips Arquillian tests by default)
mvn clean package

# To run integration tests (requires GlassFish running with jdbc/GlobalTrade):
mvn test -pl globaltrade-scm -am -DskipTests=false
```

---

### 3 — Deploy to GlassFish

Deploy the generated EAR file to your GlassFish instance:

```bash
# Via asadmin CLI
$GLASSFISH_HOME/bin/asadmin deploy target/globaltrade.ear

# Or drag-and-drop the EAR via the Admin Console:
# http://localhost:4848 → Applications → Deploy
```

Access the application at: **[http://localhost:8080/globaltrade-web](http://localhost:8080/globaltrade-web)**

---

### 4 — Environment / Mail Session

Configure a Jakarta Mail session resource in GlassFish for automated low-stock email notifications:

```
JNDI name: mail/globaltradeMailSession
Host: smtp.example.com
From: noreply@globaltrade.lk
```

---

## Role Guide

| Role | Default Landing Page | Key Capabilities |
|---|---|---|
| **Admin** | `/admin/admin-dashboard.jsp` | User/staff management, vendor approvals, NFR metrics, audit logs, warehouse admin |
| **Logistics Coordinator** | `/coordinator/coordinator-dashboard.jsp` | RFQ management, purchase orders, shipment tracking, vendor approvals, replenishment |
| **Warehouse Manager** | `/warehouse-dashboard.jsp` | Inventory, stock movements, low-stock alerts, product management, transfers |
| **Vendor** | `/vendor/vendor-dashboard.jsp` | Active RFQs, bid submission (USD + PDF), order fulfilment, replenishment requests |
| **Customs Agent** | `/custom/customs-dashboard.jsp` | Shipment arrivals, customs declarations, import permits, audit trail |
| **Customer** | `/customer-portal.jsp` | Product catalogue, sales order placement, order tracking |

---

## Testing

The `globaltrade-scm` module contains **160 JUnit 5 + Arquillian integration test methods** across 12 test classes:

```
AdminUserBeanTest           CustomerPortalBeanTest      CustomsClearanceBeanTest
InventoryBeanTest           LogisticsBeanTest           LogisticsCoordinatorBeanTest
OrderBeanTest               ProcurementServiceTest      ProductBeanTest
RFQBeanTest                 VendorBeanTest              WarehouseBeanTest
```

> **Known blockers** — See the full test report for Defects D01 and D02:  
> - **D01**: `arquillian.xml` hardcodes a machine-specific GlassFish path — must be made portable via a Maven property or env variable.  
> - **D02**: `<skipTests>true</skipTests>` in `pom.xml` silently excludes the suite from plain `mvn test` — add `-DskipTests=false` to run.

### Running Postman / Performance Tests

- Import the Postman collection and target `http://localhost:8080/globaltrade-rest/api`
- Use JMeter scripts for load and scalability scenarios (PT002, SC001, SC002)

---

## Security Scanning

[Trivy](https://trivy.dev/) was used for supply-chain vulnerability analysis:

```bash
trivy fs --format table .
```

> Identified critical/high-severity CVEs originate from transitive dependencies and cannot be directly mitigated within the current project scope.

---

## Deployment

### GlassFish (on-premises / any Java host)

```bash
mvn clean package -DskipTests
$GLASSFISH_HOME/bin/asadmin start-domain
$GLASSFISH_HOME/bin/asadmin deploy globaltrade-ear/target/globaltrade.ear
```

### Cloud / CI

| Platform | Approach |
|---|---|
| Payara Cloud | Upload EAR via Payara Cloud dashboard |
| Railway / Render | Containerise GlassFish + app using Docker, set env vars |
| GitHub Actions | Build with `mvn package`, archive EAR as artifact, deploy via `asadmin` |

---

## License

[Custom License](LICENSE) — Personal / academic use only. Commercial use and redistribution are not permitted.
