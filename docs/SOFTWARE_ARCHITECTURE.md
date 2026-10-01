# SOFTWARE ARCHITECTURE DOCUMENTATION
**Project:** SIH26035 — NAWI Legal Metrology Evaluation & Certificate System  
**Standard:** OIML Recommendation R-76-1 (2006 E) & R-76-2 (2007 E)  
**Authority:** Ministry of Consumer Affairs, Food & Public Distribution (DoCA), Govt. of India  

---

## 1. SYSTEM OVERVIEW

The SIH26035 NAWI Application is an enterprise-grade, institutional web application designed for Legal Metrology officers, state calibration laboratories, and accredited inspectors. It automates the end-to-end evaluation, compliance calculation, approval workflow, certificate generation, and public verification of Non-Automatic Weighing Instruments (NAWI).

```
+-----------------------------------------------------------------------+
|                             CLIENT LAYER                              |
|   React 18 + TypeScript + Vite + Tailwind/Vanilla Custom Design CSS    |
|       (Institutional Palette: #413B32, #F1EADE, #D9D1C5, #A7BABA)     |
+-----------------------------------------------------------------------+
                                   |
                          REST API / HTTP Bearer
                                   v
+-----------------------------------------------------------------------+
|                            APPLICATION LAYER                          |
|                       FastAPI (Python 3.10+)                          |
|  - Auth & RBAC (Jose JWT, Bcrypt)                                    |
|  - NAWI OIML R-76 Engine (MPE, Ec, Pass/Fail)                          |
|  - Report Generator (ReportLab PDF, python-docx DOCX)                 |
|  - SHA-256 Report Hasher & QR Generator                               |
+-----------------------------------------------------------------------+
                                   |
                             SQLAlchemy ORM
                                   v
+-----------------------------------------------------------------------+
|                            DATABASE LAYER                             |
|               Supabase PostgreSQL (18 Schema Tables)                  |
|  - Row Level Security (RLS) Policies per Laboratory                   |
|  - Foreign Key Constraints & Cascade Triggers                         |
|  - Audit Log Tracking                                                 |
+-----------------------------------------------------------------------+
```

---

## 2. COMPONENT DESIGN & MODULE RESPONSIBILITIES

### 2.1 Backend Architecture (`backend/app/`)

- **`main.py`**: FastAPI application entry point, CORS middleware setup, startup seeding triggers, and API router mounts (`/api/v1/...`).
- **`core/config.py`**: Central settings management using Pydantic `BaseSettings`. Handles `.env` loading, database connection URLs, JWT secrets, and directory paths.
- **`core/database.py`**: SQLAlchemy engine setup, session factory (`SessionLocal`), and base model class declaration.
- **`models/models.py`**: 18 SQLAlchemy ORM entity models mapping directly to PostgreSQL database tables.
- **`schemas/schemas.py`**: Pydantic validation schemas enforcing strict input validation for API requests and response serializations.
- **`engine/nawi_calculator.py`**: Metrological engine implementing OIML R-76 mathematical formulas (MPE, Error $E$, Corrected Error $E_c$, Linearity, Repeatability, Eccentricity, Accuracy Class evaluation).
- **`services/report_generator.py`**: Dynamic PDF (via `reportlab`) and Word DOCX (via `python-docx`) certificate generator injecting live database evaluation data and SHA-256 QR code signatures.
- **`api/` Routers**:
  - `auth.py`: User registration, login token generation, password hashing.
  - `users.py`: User profile management, role assignment, pending registration approvals/rejections.
  - `instruments.py`: Instrument specifications, manufacturer profiles, model pattern approvals, and test history.
  - `sessions.py`: Test evaluation lifecycle, raw observation entry, calculation invocation, review submission.
  - `reports.py`: Report repository querying, PDF/DOCX downloads, CSV export, evidence upload.
  - `rules.py`: OIML R-76 rule versioning and limit configuration browser.
  - `equipment.py`: Laboratory reference standard mass inventory management.
  - `analytics.py`: Dashboard summary metrics and laboratory statistics.
  - `verify.py`: Public QR code verification endpoint (`/api/v1/verify/{reportNumber}`).

### 2.2 Frontend Architecture (`frontend/src/`)

- **`App.tsx`**: Main application wrapper, router provider, global layout shell, navigation bar, and context providers.
- **`context/AuthContext.tsx`**: State management for user authentication, JWT token persistence in `localStorage`, active user role, and lab scope.
- **`services/api.ts`**: Axios HTTP client configuration with request/response interceptors for automatic Bearer token injection and centralized error handling.
- **`pages/` Views**:
  - `LoginPage.tsx` / `RegisterPage.tsx`: Institutional authentication & self-registration interfaces.
  - `DashboardPage.tsx`: Executive dashboard showing test statistics, pending reviews, and recent activity.
  - `NewSessionPage.tsx`: Step-by-step wizard for initiating NAWI test sessions.
  - `SessionDetailsPage.tsx`: Core observation data entry form and OIML R-76 calculation results view.
  - `ReviewQueuePage.tsx`: Laboratory manager & reviewer approval workflow queue.
  - `RepositoryPage.tsx`: Searchable report repository with PDF/DOCX downloads and CSV export.
  - `InstrumentsPage.tsx`: Instrument database and calibration history view.
  - `EquipmentPage.tsx`: Reference mass equipment inventory management.
  - `RulesPage.tsx`: OIML R-76 standard rule versions and limits inspector.
  - `UsersPage.tsx`: Admin user management and registration approval panel.
  - `PublicVerifyPage.tsx`: Public certificate verification interface.

---

## 3. SECURITY & AUTHORIZATION MODEL

### 3.1 Authentication & Password Hashing
- Passwords are hashed prior to database insertion using `bcrypt` with salt rounds.
- Session tokens are stateless JSON Web Tokens (JWT) signed with `HS256`.

### 3.2 Role-Based Access Control (RBAC)
The application enforces four hierarchical user roles:
1. **`admin`**: Full system administration, user management, registration approvals, global audit log inspection.
2. **`lab_manager`**: Laboratory oversight, reviewer assignment, equipment approval, laboratory-wide report access.
3. **`inspector`**: Creation of test sessions, instrument specification entry, raw test observation recording, calculation triggers.
4. **`reviewer`**: Technical review of completed test sessions, compliance verdict confirmation, report approval/rejection.

### 3.3 Multi-Tenant Laboratory Scoping & Row Level Security (RLS)
- Every user belongs to a specific `laboratory_id`.
- PostgreSQL database tables enforce Row Level Security (RLS) policies (`laboratory_id = current_setting('app.current_laboratory_id')`).
- Cross-laboratory data access attempts are blocked at both backend middleware and database level (HTTP 403 Forbidden).

---

## 4. DATABASE ENTITY RELATIONSHIP ARCHITECTURE

The database comprises 18 normalized PostgreSQL tables:

1. `laboratories`: Laboratory profiles, accreditation numbers, address details.
2. `users`: System user credentials, roles, approval statuses, assigned lab IDs.
3. `equipment`: Standard weights and reference mass calibration certificates.
4. `manufacturers`: Instrument manufacturer profiles and accreditation codes.
5. `instrument_models`: Model patterns, capacity bounds, and pattern approval certs.
6. `instruments`: Individual weighing instruments with unique serial numbers.
7. `rule_versions`: OIML recommendation versions (e.g., OIML R-76-1 2006 E).
8. `rule_limits`: MPE formulas and tolerance limits per accuracy class.
9. `test_procedures`: Prescribed OIML test types (Weighing, Linearity, Tare, Repeatability, Eccentricity).
10. `test_sessions`: Evaluation session records, environmental conditions, status.
11. `observations`: Raw load readings, indicated values, and changeover weights $\Delta L$.
12. `calculated_results`: Calculated corrected errors $E_c$ and MPE thresholds per point.
13. `compliance_evaluations`: Aggregate pass/fail decisions and clause compliance notes.
14. `review_approvals`: Reviewer decision logs, signature timestamps, and remarks.
15. `reports`: Finalized report metadata, report numbers, file paths.
16. `report_verification`: Tamper-evident SHA-256 hashes and QR code payload URLs.
17. `audit_logs`: Immutable security event logs.
18. `system_settings`: Global system settings and parameters.
