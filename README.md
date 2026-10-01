# SIH26035 — NAWI Legal Metrology Evaluation & Digital Test Report System (OIML R-76)

An official Legal Metrology digital compliance, test report generation, and public verification system for Non-Automatic Weighing Instruments (NAWI) operating under **OIML R-76** international standards.

---

## 🚀 Key System Features

1. **Instrument Details & Technical Specifications Capture**: Full registration wizard supporting Max capacity ($Max$), minimum load ($Min$), verification scale interval ($e$), scale interval ($d$), accuracy classes (I, II, III, IIII), indicator model, and load cell parameters.
2. **Environmental & Laboratory Conditions Recording**: Tracks ambient temperature (°C), relative humidity (%), atmospheric pressure (hPa), standard mass serials, lab accreditation refs, and test locations.
3. **OIML R-76 Test Procedure Observations**:
   - Weighing Performance Test ($0 \to Max$)
   - Repeatability Test ($50\%$ and $100\%$ Max spread $P_{\max} - P_{\min}$)
   - Eccentricity (Corner Load) Test
   - Tare Balancing Test
4. **Metrological Calculation Engine**: Automated computation of Maximum Permissible Error $MPE(L)$ ($\pm 0.5e, \pm 1.0e, \pm 1.5e$), uncorrected error $E = I - L$, and corrected error $E_c = I + 0.5e - \Delta L - L$.
5. **Multi-User Authority Management & RBAC**:
   - `admin`: Administrator user management, laboratory creation, account approval/rejection, audit log inspection.
   - `lab_manager`: Equipment calibration, instrument registry, laboratory-scoped evaluation oversight.
   - `inspector`: Data entry, test execution, observation recording, evidence upload, session submission.
   - `reviewer`: Test session review, remarking, approval, rejection, and certificate finalization.
6. **Digital Certificate & Report Generation**: Automated PDF/DOCX report compilation via ReportLab with embedded SHA-256 cryptographic hash and QR verification payload.
7. **Public QR Certificate Verification**: Public URL verification endpoint (`/verify/:reportNum`) allowing instant verification of report authenticity against tamper-proof database records.

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Endpoint Routers (auth, users, instruments, sessions, reports, verify)
│   │   ├── core/            # Configuration, Security, Database bindings
│   │   ├── engine/          # OIML R-76 Compliance & Calculation Engine
│   │   ├── models/          # SQLAlchemy Database Schemas
│   │   ├── schemas/         # Pydantic Schemas & Input Validators
│   │   └── services/        # PDF Report Generator & Seeder
│   └── migrate_to_supabase.py
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navigation, Watermark, Modals)
│   │   ├── pages/           # Application pages (Dashboard, NewSession, SessionDetail, ReviewQueue, Repository, Users, etc.)
│   │   ├── services/        # API client integration
│   │   └── types/           # TypeScript Type Definitions
│   ├── package.json
│   └── vite.config.ts
├── scratch/                 # Verification & Automated Test Suites
│   ├── test_all_17_requirements.py
│   ├── test_self_registration_workflow.py
│   └── test_phase4_deep_verification.py
└── README.md
```

---

## 🛠️ Quick Start & Installation

### Backend Setup (Python 3.10+)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### Frontend Setup (Node.js 18+)

```bash
cd frontend
npm install
npm run dev
```
Application UI will be available at `http://localhost:5173`.

---

## 🧪 Verification & Test Suites

Run the comprehensive test suites from the root directory with the backend server running:

```bash
# 1. 17-Requirement Multi-User & RBAC Test Suite
python scratch/test_all_17_requirements.py

# 2. Self-Registration & Administrative Approval Test Suite
python scratch/test_self_registration_workflow.py

# 3. Phase 4 Deep Security & Functional Verification Suite
python scratch/test_phase4_deep_verification.py

# 4. Frontend Type Checking & Production Build
cd frontend
npx tsc --noEmit
npm run build
```

---

## 🛡️ License & Standards Compliance

Compliant with **OIML R-76-1 (2006)** *Non-automatic weighing instruments* & **Legal Metrology (General) Rules**.
