# SRM OT Scheduler

A comprehensive Operation Theatre (OT) Scheduling and Clinical Workflow Management Platform built with **Angular 22** and **ASP.NET Core (.NET 10)** backed by **SQLite**.

---

## 🏥 Complete Clinical Workflow (7 Stages)

1. **Surgery OP Ward (OT Slot Request)**:
   - Staff clicks `+ Request OT Slot` to register a new patient for surgery.
   - The patient is persisted to the database and appears in "All Patients" across all portals.
   - Status transitions to `pending_fitness` (forwarded to Anaesthesia OP / PAC).

2. **Anaesthesia OP / PAC (Fitness Evaluation)**:
   - Anaesthesiologist reviews clinical details and assesses fitness:
     - **If Fit**: Sets Anaesthesia Type & ASA Grade. Patient is returned to the **Surgery OP Ward** (`pending_scheduling`).
     - **If Unfit**: Enters a mandatory deferral reason and sets a new review date (`pending_fitness`, marked `unfit`).

3. **Surgery OP Ward (Scheduling & Team Assignment)**:
   - Staff selects surgery date, time, duration, surgical team (Unit Chief, Primary Surgeon, Assistant Surgeon, PG Trainee), and special equipment/instruments (C-Arm, Laparoscopy Tower, Harmonic Scalpel, Microscope, Implants, etc.).
   - Submitting forwards the case to the respective **Department HOD** (`pending_dept_approval`).

4. **Department HOD (Surgical Review & Approval)**:
   - The Department HOD reviews clinical indications, surgical team, requested equipments, and proposed date:
     - **Approve**: Forwards case to the **OT Matron** (`pending_ot_assignment`).
     - **Postpone**: Provides postponement reason and sets a new review date (`postponed`).

5. **OT Matron (OT Room & Nursing Assignment)**:
   - OT Matron assigns the OT Room (OT-1 to OT-8), scheduled time slot, Scrub Nurse, Floor Nurse, and OTAT Technician.
   - Submitting forwards the case to **HOD Anaesthesia** (`pending_anaes_approval`).

6. **HOD Anaesthesia (Anaesthesia Allocation & Final Approval)**:
   - HOD Anaesthesia assigns Primary Anaesthesiologist, Assistant Anaesthesiologist, and PG Anaesthesia Doctor, and gives **Final Approval** (`scheduled`).

7. **OT Matron (Surgery Day Execution & Completion)**:
   - On the surgery date, the case appears in the OT Matron schedule:
     - **Start Surgery**: OT Matron clicks "Start Surgery" to log `actualStartTime` (`in_progress`).
     - **Complete Surgery**: When the operation finishes, OT Matron clicks "Complete Surgery" to record `actualEndTime`, intra-op notes, PMR, and HPE specimen status (`completed` - final step).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **.NET SDK**: v10.0 or higher
- (Optional) **Docker**: If running via container

---

### Running Locally

#### 1. Quick Start (Backend + Frontend Unified)
The .NET backend automatically serves the pre-built Angular SPA from the `dist` folder:

```bash
# 1. Build the Angular 22 frontend
npm install
npm run build

# 2. Run the .NET 10 backend
cd backend
dotnet run
```
Access the application at: **`http://localhost:5100`**

---

#### 2. Development Mode (Separate Dev Servers with Hot Reload)

**Terminal 1 — Frontend (Vite Dev Server)**:
```bash
npm install
npm run dev
```
Runs at: **`http://localhost:8443`** (or port specified in terminal)

**Terminal 2 — Backend (.NET API)**:
```bash
cd backend
dotnet run
```
Runs at: **`http://localhost:5100`**

---

### Running with Docker

```bash
docker compose up --build
```
Access the application at: **`http://localhost:5100`**

---

## 📂 Project Structure

```text
├── src/                          # Angular 22 Standalone Application
│   ├── app.component.ts          # Main application shell & state synchronization
│   ├── components/               # Reusable UI & modal components
│   │   ├── patient-detail.component.ts # Detail view & 7-stage workflow modals
│   │   ├── standard-table.component.ts
│   │   └── ui.component.ts
│   ├── modules/                  # Role-based portal views
│   │   ├── surgery-op-ward.component.ts
│   │   ├── anaesthesia-op-pac.component.ts
│   │   ├── department-hod.component.ts
│   │   ├── ot-matron.component.ts
│   │   ├── hod-anaesthesia.component.ts
│   │   └── hospital-admin.component.ts
│   ├── services/                 # API service connecting to .NET backend
│   └── lib/                      # Workflow state definitions
├── backend/                      # ASP.NET Core (.NET 10) Web API
│   ├── Controllers/              # REST & Workflow endpoints
│   ├── Data/                     # Entity Framework Core DbContext
│   ├── Models/                   # Domain entities and workflow DTOs
│   ├── Services/                 # Patient & clinical workflow service
│   └── srm_ot_scheduler.db       # SQLite database file
├── dist/                         # Production bundle of Angular 22 app
├── Dockerfile                    # Multi-stage Docker build
└── docker-compose.yml            # Docker Compose configuration
```
