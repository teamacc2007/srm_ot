THIS IS A FINAL UI/UX + FUNCTIONALITY REPAIR. DO NOT MAKE SMALL PATCHES OR RANDOM CHANGES. FIRST UNDERSTAND THE EXISTING SRM OTS APPLICATION STRUCTURE AND THEN REBUILD/REORGANIZE THE FRONTEND UX WHERE NECESSARY.

The current implementation is malfunctioning:
- Actions such as HOD Approve immediately change status without collecting required information.
- The UI hierarchy is unclear.
- Dashboard tiles/cards are poorly arranged.
- The grid/table layout has collapsed.
- Pages look cluttered and inconsistent.
- Role-specific pending work is not prioritized.
- Admin currently has too few pages.
- Dashboard and All Patients are not separated correctly by date.

Create the FINAL polished SRM Operation Theater Scheduler frontend prototype.

IMPORTANT:
This is a frontend/demo application using dummy data. No backend/API/database is required. All workflow changes can use local state/mock data.

DO NOT blindly redesign everything. Keep the existing SRM OTS visual identity where it is good, but fix the layout, hierarchy, spacing, grids, cards, tables, navigation and interaction patterns wherever they are currently broken.

==================================================
1. CORE UX PRINCIPLE
==================================================

The application must feel like a professional hospital enterprise application.

Use:
- clean white/light interface
- strong visual hierarchy
- consistent spacing
- professional typography
- clearly separated sections
- proper responsive grid
- readable tables
- compact but clear status badges
- consistent buttons
- consistent modals/forms
- no oversized decorative cards
- no unnecessary gradients
- no excessive rounded containers
- no childish UI
- no information dumping

Every page must have:
Page title
Short description/breadcrumb where useful
Primary action
Relevant filters
Main content
Clear empty/loading/error states where appropriate

Never allow cards, tables or grids to collapse into each other.

==================================================
2. FIX THE DASHBOARD ARCHITECTURE
==================================================

The dashboard must NOT show every patient in the hospital.

The dashboard represents the CURRENT DAY.

At the top show:

Today's Surgery Dashboard
[Today’s date]
[Role]

Then show compact KPI cards:
- Today's Patients
- Pending My Action
- Scheduled Today
- In Progress
- Completed Today
- Cancelled/Postponed Today

The exact counts must come from dummy data.

Below the KPI cards:

SECTION A — "MY ACTION QUEUE"

This is the MOST IMPORTANT section.

Patients requiring action from the CURRENT ROLE must appear FIRST.

Examples:

Surgery OP Ward:
- Draft cases
- Pending scheduling
- Cases ready for HOD submission
- Cases requiring rescheduling

Anaesthesia OP:
- Pending PAC / Fitness evaluation

Department HOD:
- Pending department approvals
- Postponed cases requiring review
- Unfit cases requiring acknowledgement

OT Matron:
- Pending OT assignment
- Scheduled cases ready to start
- In-progress cases
- Cases requiring completion

HOD Anaesthesia:
- Pending anaesthesia approval
- Cases requiring anaesthesiologist assignment

Admin:
- All critical/pending workflow actions across hospital

Display these as a clean table/list, NOT giant tiles.

Each row:
Patient
UHID
Procedure
Department
Surgery Date
Status
Priority/Type
Action

Only show actions relevant to the current role.

SECTION B — "TODAY'S OT SCHEDULE"

Show today's scheduled surgeries in a clean timeline/grid.

Use a proper OT schedule grid:
Rows = time slots
Columns = OT 1, OT 2, OT 3, OT 4 etc.

Do NOT allow the grid to collapse.

Use fixed/minimum column widths and horizontal scrolling if necessary.

Each surgery block should display:
- patient name
- procedure
- time
- status
- surgery type

SECTION C — "TODAY'S PATIENTS"

Show today's patient records in a clean table.

Include:
Patient
UHID
Procedure
Department
Surgeon
OT
Time
Status
Actions

Do not put the complete hospital database here.

==================================================
3. ALL PATIENTS PAGE
==================================================

Create a dedicated:

"All Patients"

page containing ALL surgery records across ALL dates.

This is separate from the Dashboard.

At the top provide:

Search Patient
Search UHID
Department
Status
Surgery Type
Surgeon

AND MOST IMPORTANTLY:

FROM DATE
TO DATE
[Apply Filter]
[Clear]

The date filter must actually work on the dummy dataset.

Default:
All dates.

The table should show every patient matching the filters.

Columns:
Patient
UHID
Age/Gender
Department
Procedure
Surgery Type
Surgery Date
OT
Status
Actions

Clicking a row opens Patient Details.

Actions opens a compact action menu.

==================================================
4. ROLE-BASED PRIORITY
==================================================

The system must dynamically determine the CURRENT ROLE.

Add a clean role switcher in the header for demo purposes:

Surgery OP Ward
Anaesthesia OP
Department HOD
OT Matron
HOD Anaesthesia
Hospital Admin

When the role changes:

1. Dashboard title/role changes.
2. "My Action Queue" changes.
3. Pending cases change.
4. Available actions change.
5. Navigation can expose role-relevant pages.
6. Patient action menus change.

The first content users see must be the work that THEIR ROLE needs to perform.

Do NOT make every role see the same dashboard.

==================================================
5. PATIENT DETAILS PAGE
==================================================

Clicking a patient row must open:

Patient Details

This must be a proper landing page, NOT a generic "Patient Actions" page.

Structure:

Header:
Patient Name
UHID
Status badge
Surgery type badge

Then a two-column professional layout.

LEFT:
Patient Information
- Name
- UHID
- Age
- Gender
- Department
- Diagnosis

Surgery Information
- Procedure
- Surgery type
- Surgeon
- Unit Chief
- Estimated duration
- Surgery date
- OT

Clinical Information
- Anaesthesia type
- ASA grade
- Fitness status

RIGHT:
"Current Stage"

Large but compact status card.

Then:

"ACTIONS REQUIRED"

Show ONLY actions allowed for the current role and status.

Then:

"WORKFLOW HISTORY"

Timeline:
Date/time
Role
Action
Previous status
New status
Notes

==================================================
6. CRITICAL: NEVER CHANGE STATUS IMMEDIATELY FOR COMPLEX ACTIONS
==================================================

THIS IS VERY IMPORTANT.

Buttons such as Approve, Reject, Postpone, Assign OT, Assign Anaesthesiologist, Mark Fit, Mark Unfit and Complete Surgery MUST NOT instantly change status.

Clicking the button must open a professional confirmation/form modal.

The modal must collect the required information.

Only after clicking the final confirmation/submit button should the status change.

==================================================
7. HOD DEPARTMENT APPROVAL
==================================================

For pending_dept_approval:

Actions:
- Review Details
- Approve
- Postpone
- Reject
- Request Another OT

APPROVE must open:

"Approve Surgery"

Show read-only summary:
Patient
Procedure
Date
Estimated Duration
Surgeon
Mapped OT

Then required confirmation fields:
- Approval note / remarks
- Confirmation checkbox:
  "I have reviewed the patient, procedure and proposed schedule."

Buttons:
Cancel
Approve Surgery

Only then:
pending_dept_approval → pending_ot_assignment

POSTPONE must open:

"Postpone Surgery"

Fields:
- New tentative date
- Reason
- Additional remarks

Submit:
→ postponed

REJECT must open:

"Reject Surgery"

Required:
- Rejection reason
- Remarks

Submit:
→ cancelled

REQUEST ANOTHER OT:
Open a form:
- Current OT
- Requested OT / OT preference
- Reason
- Required equipment
- Remarks

Do NOT change the status immediately if the workflow specifies an OT override request.

==================================================
8. ANAESTHESIA OP PAC
==================================================

For pending_fitness:

"PAC Evaluation"

Show:
Patient details
Diagnosis
Procedure
Surgery type

Fields:
- Anaesthesia Type
  General
  Spinal
  Local
  IV Sedation
  Other

- ASA Grade
  Grade I
  Grade II
  Grade III
  Grade IV

Optional clinical remarks.

Mark Fit:
Require Anaesthesia Type + ASA Grade.

Then:
pending_fitness → pending_scheduling

Mark Unfit:
Require:
- Reason
  Clinical
  Social
  Financial
- Review Date optional
- Clinical remarks

Then:
pending_fitness → cancelled

==================================================
9. SURGERY OP WARD SCHEDULING
==================================================

For pending_scheduling:

"Schedule Surgery"

Fields:
- Scheduled Date
- Estimated Duration
- Unit Chief
- Primary Surgeon
- Assistant Surgeon
- PG Surgery
- Equipment Requirements
- OT if applicable

Buttons:
Save Schedule
Submit for HOD Approval

Saving schedule:
→ ready_for_hod_approval

Submitting:
→ pending_dept_approval

For emergency surgery, preserve the emergency fast path:
draft → pending_scheduling → pending_ot_assignment

==================================================
10. OT MATR0N ASSIGNMENT
==================================================

For pending_ot_assignment:

Create a professional "OT Assignment" modal/page.

Fields:
- OT Room
- Scheduled Date
- Start Time
- Scrub Nurse
- Floor Nurse
- OTAT Technician

Show OT availability beside/below the form.

Use a proper OT availability grid.

Actions:
Save Assignment
Submit to Anaesthesia

Submit:
→ pending_anaes_approval

Do not allow the grid to collapse.

==================================================
11. HOD ANAESTHESIA APPROVAL
==================================================

For pending_anaes_approval:

Actions:
- Assign Anaesthesiologist
- Approve
- Postpone
- Reject

Assign Anaesthesiologist opens:

- Primary Anaesthesiologist REQUIRED
- Assistant Anaesthesiologist optional
- PG Anaesthesia optional
- Remarks

Save assignment without changing status.

APPROVE must require:
- Primary Anaesthesiologist
- Confirmation checkbox
- Approval remarks

Only then:
pending_anaes_approval → scheduled

POSTPONE:
- New Date
- Reason
- Remarks

→ postponed

REJECT:
- Reason
- Remarks

→ cancelled

==================================================
12. SCHEDULED / IN PROGRESS
==================================================

Scheduled:

OT Matron sees:
"Start Surgery"

Clicking opens confirmation:
- OT
- Patient
- Scheduled time
- Actual start time
- Confirmation

Then:
scheduled → in_progress

In Progress:

"Complete Surgery"

Required fields:
- Actual Start Time
- Actual End Time
- PMR Status
- HPE Status
- Intra-operative Notes

Optional:
- Performed Procedure
- Updated Anaesthesia Type

Only after submission:
in_progress → completed

==================================================
13. POSTPONED CASES
==================================================

Postponed is NOT terminal.

Show:
- Previous status
- Previous date
- Reason
- Postponed date

Add:

"Reschedule"

This should open a proper rescheduling workflow depending on where the case was postponed.

Include an "Upcoming Reschedules" / "Rescheduling Queue" page.

For example:

Pending Department Approval postponement:
Surgery OP Ward reschedules and submits back to Department HOD.

Pending Anaesthesia Approval postponement:
OT Matron rebooks OT slot and submits back to Anaesthesia.

Scheduled/In Progress postponement:
Ward reschedules according to elective/emergency routing.

==================================================
14. ADMIN PORTAL — EXPAND IT
==================================================

ADMIN MUST NOT HAVE ONLY TWO PAGES.

Create a complete professional navigation structure:

Dashboard
All Patients
Today's OT Schedule
OT Master Schedule
Pending Approvals
Rescheduling
OT Allocation
Staff & Teams
Departments
OT Rooms
Reports
Workflow History
Notifications
System Overview

Keep these pages visually consistent.

ADMIN DASHBOARD:
Hospital-wide overview.

Show:
Today's surgeries
Pending approvals
OT utilization
In-progress surgeries
Completed today
Postponed
Cancelled
Upcoming surgeries

Admin should also have a "Critical Actions" / "Pending Work" section first.

==================================================
15. RESCHEDULING PAGE
==================================================

Create a dedicated:

"Rescheduling"

page.

Sections:
- Cases awaiting reschedule
- Recently rescheduled
- Upcoming postponed cases

Filters:
Patient
Department
Status
From Date
To Date

Each row:
Patient
Original Date
New Date
Previous Stage
Reason
Assigned OT
Status
Actions

"Reschedule" opens a proper scheduling form.

==================================================
16. OT MASTER SCHEDULE
==================================================

Create a dedicated hospital-wide OT grid.

Top filters:
Date
OT Room
Department
Status
Surgery Type

Grid:
Time | OT 1 | OT 2 | OT 3 | OT 4

Use 30-minute rows.

Never let columns collapse.

Each booking must have a clear visual block.

Clicking a booking opens patient details.

==================================================
17. PENDING APPROVALS PAGE
==================================================

Create a centralized page for Admin.

Tabs:
Department HOD
Anaesthesia
OT Assignment
PAC
Other Pending

Show only cases requiring action.

==================================================
18. REPORTS
==================================================

Create a clean Reports page.

Include:
- Surgeries by date
- Surgeries by department
- Completed vs cancelled vs postponed
- OT utilization
- Average surgery duration
- Pending workflow stages

Use clean charts with proper spacing.

==================================================
19. DUMMY DATA
==================================================

Seed at least 20–25 realistic patients across multiple dates.

Do NOT put all 12 statuses only on today's date.

Use dates:
Yesterday
Today
Tomorrow
Next few days
Previous dates

Include all 12 canonical statuses:

draft
pending_fitness
pending_scheduling
ready_for_hod_approval
pending_dept_approval
pending_ot_assignment
pending_anaes_approval
scheduled
in_progress
completed
cancelled
postponed

Use realistic data:
UHID
Patient name
Age
Gender
Department
Diagnosis
Procedure
Surgeon
Surgery type
Date
Duration
OT
Anaesthesia
ASA
Remarks

==================================================
20. DATE BEHAVIOUR
==================================================

Dashboard:
TODAY ONLY.

All Patients:
ALL DATES.

The All Patients page MUST have:

From Date
To Date

and filtering must actually work.

Dashboard "Today's Patients" should only show records whose surgery date equals today.

If there are no records:
show a professional empty state.

==================================================
21. TABLE DESIGN
==================================================

Fix the collapsed grid problem.

Tables must have:
- horizontal overflow when needed
- minimum column widths
- sticky header if appropriate
- proper row height
- consistent alignment
- readable text
- compact action column
- status badges
- no overlapping content

Never shrink 10–12 columns into unreadable tiny columns.

On smaller screens, allow horizontal scrolling rather than destroying the table.

==================================================
22. ACTION POPOVER
==================================================

The row-level Actions button must open a SMALL dropdown.

Example:

Actions
──────────────
View Details
Approve
Postpone
Reject
──────────────

Only show applicable actions.

Do NOT navigate to a separate "Patient Actions" page.

Patient Details contains the same applicable actions in the main action panel.

==================================================
23. ROLE-SPECIFIC DASHBOARD CONTENT
==================================================

The first major section after KPI cards MUST be the role's action queue.

Examples:

WARD:
"Cases Requiring Ward Action"

ANAESTHESIA OP:
"Patients Awaiting PAC"

DEPARTMENT HOD:
"Approvals Awaiting My Decision"

OT MATRON:
"OT Assignment & Theatre Actions"

HOD ANAESTHESIA:
"Anaesthesia Approvals Awaiting Decision"

ADMIN:
"Hospital-wide Critical Actions"

This is more important than generic analytics.

==================================================
24. VISUAL DESIGN SYSTEM
==================================================

Create one consistent design system.

Spacing:
Use consistent 8/12/16/24px spacing.

Cards:
Use subtle borders and shadows.
Do not make every element a floating card.

Buttons:
Primary action
Secondary action
Danger action
Neutral action

Status badges:
Clear and compact.

Forms:
Two-column layout for desktop where appropriate.
Labels above fields.
Required fields clearly marked.
Inline validation.

Modals:
Do not make them enormous.
Use clear title, description, fields and footer buttons.

==================================================
25. FINAL QUALITY CHECK
==================================================

Before finishing, verify EVERY workflow action.

No action should directly change status if required information has not been entered.

Verify:

PAC Fit → requires anaesthesia type + ASA
PAC Unfit → requires reason

HOD Approve → requires approval confirmation/details
HOD Postpone → requires date + reason
HOD Reject → requires reason

OT Assignment → requires OT + time + nurses + technician

HOD Anaesthesia Approve → requires anaesthesiologist

HOD Anaesthesia Postpone → requires date + reason
HOD Anaesthesia Reject → requires reason

Start Surgery → requires actual start confirmation

Complete Surgery → requires actual start/end + PMR + HPE + intra-op notes

Every successful action:
1. updates the status
2. updates the patient
3. updates dashboard counts
4. updates relevant queues
5. updates workflow history
6. updates OT schedule if applicable

==================================================
FINAL REQUIREMENT
==================================================

The final result must look like a polished hospital enterprise application that can be demonstrated role-by-role.

DO NOT prioritize decorative visuals over usability.

PRIORITIZE:
1. Clear navigation
2. Role-specific work queues
3. Correct workflow
4. Proper forms before decisions
5. Patient details
6. Date-based patient management
7. OT scheduling grid
8. Rescheduling workflow
9. Admin management pages
10. Clean visual hierarchy

Do NOT leave the application with collapsed grids, unclear tiles, instant approvals, missing forms, generic actions or placeholder buttons.

Everything visible in the prototype should either work with dummy data or clearly behave as a UI prototype.