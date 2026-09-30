IMPORTANT: DO NOT REDESIGN THE EXISTING UI. Preserve the current SRM OTS design exactly as much as possible — sidebar, header, typography, colors, cards, tables, spacing, buttons, navigation style and overall visual language. The goal is ONLY to add functional workflow behavior and realistic dummy data so the complete system can be demonstrated as a frontend prototype.

Build a fully interactive frontend demo for SRM Operation Theater Scheduler (SRM OTS) using dummy/local data only. No backend, database, authentication or API is required.

1. ROLE SWITCHER
Add a small professional role switcher in the existing header/profile area so the workflow can be demonstrated as different users:
- Surgery OP Ward
- Anaesthesia OP
- Department HOD
- OT Matron
- HOD Anaesthesia
- Hospital Admin

Changing the role must dynamically change the actions available to the user.

2. DUMMY PATIENT DATA
Create 12 realistic dummy surgery records, one for every workflow status:
SRM-001 Arun Kumar — draft
SRM-002 Priya Sharma — pending_fitness
SRM-003 Rahul Menon — pending_scheduling
SRM-004 Divya Raj — ready_for_hod_approval
SRM-005 Karthik S — pending_dept_approval
SRM-006 Meena Joseph — pending_ot_assignment
SRM-007 Sanjay Kumar — pending_anaes_approval
SRM-008 Ananya Ravi — scheduled
SRM-009 Vikram Das — in_progress
SRM-010 Nisha Krishnan — completed
SRM-011 Ramesh B — cancelled
SRM-012 Lakshmi Devi — postponed

Give each record realistic UHID, age, gender, department, diagnosis, procedure, surgeon, surgery type (Elective/Emergency), requested date, OT, anaesthesia type, ASA grade, remarks and current status.

The Patients table should display these records using the EXISTING table design.

3. PATIENT TABLE
Keep the existing patient table design but make every row clickable.
- Clicking the patient row → open that patient's Patient Details landing page.
- Add/retain an Actions button at the end of each row.
- Clicking Actions → show a small clean dropdown/popover, NOT a separate page.
- The popover must show only actions permitted for the CURRENT ROLE and CURRENT STATUS.

Do not clutter the table with every possible action.

4. PATIENT DETAILS
Clicking a row must open a proper Patient Details page using the existing design language.
Show:
- Patient information
- Surgery information
- Clinical information
- Scheduling information
- Current workflow status
- Remarks
- Workflow history/timeline

Most importantly, show a contextual "Available Actions" section/card based on role + current status.

Actions performed here must update the patient status immediately in the frontend and add an entry to workflow history.

5. WORKFLOW
Implement these exact statuses:
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

Elective flow:
draft → pending_fitness → pending_scheduling → pending_dept_approval → pending_ot_assignment → pending_anaes_approval → scheduled → in_progress → completed

Emergency flow:
draft → pending_scheduling → pending_ot_assignment → pending_anaes_approval → scheduled → in_progress → completed

Preserve the existing ready_for_hod_approval status where applicable.

6. ROLE-SPECIFIC ACTIONS

SURGERY OP WARD:
draft:
- View Details
- Edit Request
- Save Draft
- Submit for PAC
- Cancel Request

pending_scheduling:
- View Details
- Schedule Surgery
- Edit Schedule
- Submit to HOD
- Cancel

ready_for_hod_approval:
- View Details
- Edit Schedule
- Submit for HOD Review
- Cancel

Allow Ward users to enter/edit basic patient and surgery details through clean modal/forms using dummy frontend state.

ANAESTHESIA OP:
pending_fitness:
- View Details
- PAC Evaluation
- Mark Fit
- Mark Unfit

For Mark Fit, show a modal/form requiring:
- Anaesthesia Type
- ASA Grade
Then transition to pending_scheduling.

For Mark Unfit, require:
- Reason
- Optional review date
Then transition to cancelled.

DEPARTMENT HOD:
pending_dept_approval:
- View Details
- Approve
- Postpone
- Reject
- Request Another OT

Approve → pending_ot_assignment
Postpone → postponed
Reject → cancelled

OT MATR0N:
pending_ot_assignment:
- View Details
- Assign OT
- Assign Nurses
- Submit to Anaesthesia

Allow selection of:
- OT
- Start time
- Scrub nurse
- Floor nurse
- OTAT technician

Submit → pending_anaes_approval

scheduled:
- View Details
- Start Surgery

Start Surgery → in_progress

in_progress:
- View Details
- Complete Surgery

Complete Surgery must open a completion modal requiring:
- Actual Start
- Actual End
- PMR
- HPE
- Intra-op Notes

After completion → completed.

HOD ANAESTHESIA:
pending_anaes_approval:
- View Details
- Assign Anaesthesiologist
- Approve
- Postpone
- Reject

Approve → scheduled
Postpone → postponed
Reject → cancelled

HOSPITAL ADMIN:
Admin can view all patients and perform all workflow actions for demonstration purposes.

7. POSTPONED / CANCELLED
Cancelled is terminal.
Postponed must retain the patient record and workflow history.
Provide a "Resume/Re-enter Workflow" action where appropriate so the demo can show the patient returning to the workflow.

8. WORKFLOW HISTORY
Every status-changing action must append to a workflow history timeline:
Example:
Created → Draft
Submitted for PAC → Pending Fitness
PAC Fit → Pending Scheduling
Schedule Submitted → Department HOD Approval
Approved → OT Assignment
OT Assigned → Anaesthesia Approval
Anaesthesia Approved → Scheduled
Surgery Started → In Progress
Surgery Completed → Completed

Show:
- timestamp
- performed by role
- action
- previous status
- new status

Use realistic dummy timestamps.

9. DASHBOARD
Do NOT redesign the existing dashboard.
Populate existing dashboard cards/statistics with dummy data derived from the 12 patients.

Examples:
- Total Requests: 12
- Draft: 1
- Pending Actions: appropriate count
- Scheduled: 1
- In Progress: 1
- Completed: 1
- Cancelled: 1
- Postponed: 1

If charts already exist, populate them with dummy data rather than replacing the visual design.

10. STATUS BADGES
Use the existing badge design.
Each status must be visually distinguishable but professional.
Do not introduce excessive colors or flashy UI.

11. ACTION MODALS
Use compact professional modal/dialog forms.
Do not create huge forms unless necessary.
Every action that requires information should collect it through a modal.
After submission:
- close modal
- update patient
- update status
- update table
- update details page
- update workflow history
- update dashboard statistics

12. FILTERS / SEARCH
Make existing search and filters functional using the dummy dataset.
Allow filtering by:
- Patient
- UHID
- Department
- Surgery type
- Status
- Date
- Surgeon

13. NAVIGATION
Keep existing sidebar/navigation.
Make these pages functional with the same design:
- Dashboard
- Patients
- OT Schedule
- Reports
- Patient Details

OT Schedule should display the dummy scheduled/in-progress/completed surgeries in a clean schedule/calendar/table using the existing visual style.

Reports should show simple frontend-generated summaries based on the dummy records.

14. IMPORTANT UX RULE
Do NOT show all actions everywhere.
Actions must depend on:
CURRENT ROLE + CURRENT PATIENT STATUS.

For example:
Anaesthesia OP viewing pending_fitness should see Fit/Unfit.
OT Matron viewing scheduled should see Start Surgery.
HOD Anaesthesia viewing pending_anaes_approval should see Approve/Postpone/Reject.
This should be obvious during the demo.

15. FRONTEND STATE
Use local frontend state/local mock data.
No backend/API/database is required.
Refreshing the page may reset the dummy data.
Make the workflow functional enough for a complete UI demonstration.

16. DESIGN RULE
This is NOT a redesign task.
Do not change:
- sidebar structure
- header structure
- existing color palette
- typography
- existing table style
- existing card style
- existing spacing
- existing navigation style

Only add the missing functionality, dummy data, action menus, modals, detail pages, status transitions, role switching and workflow history.

17. DEMO QUALITY
The final result should feel like a real hospital enterprise application rather than a generic dashboard.
Keep the interface clean, professional, minimal and information-dense without looking cluttered.

Most important requirement:
I need to be able to switch roles and demonstrate the COMPLETE surgery lifecycle using the 12 dummy patients. Every patient should start in a different workflow status, and the available actions should change dynamically according to role and status. Clicking a patient should show the patient details and the correct contextual actions. Performing an action must visibly change the workflow and status.