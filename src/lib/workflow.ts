import type { PatientStatus } from "../types"

export interface ActionDef {
  id: string
  label: string
  variant: "primary" | "secondary" | "danger" | "warning" | "success"
  nextStatus?: PatientStatus
  modal?: "mark_fit" | "mark_unfit" | "schedule" | "hod_approve" | "hod_anaes_approve" | "assign_ot" | "complete_surgery" | "postpone" | "cancel" | "resume" | "assign_anaes" | "start_surgery" | "reschedule_anaes"
  description?: string
}

type RoleActions = Partial<Record<PatientStatus, ActionDef[]>>

const WARD_ACTIONS: RoleActions = {
  draft: [
    {
      id: "submit_pac",
      label: "Submit for PAC",
      variant: "primary",
      nextStatus: "pending_fitness",
      description: "Send to Anaesthesia for fitness evaluation",
    },
    {
      id: "cancel",
      label: "Cancel Request",
      variant: "danger",
      modal: "cancel",
    },
  ],
  pending_scheduling: [
    {
      id: "schedule",
      label: "Schedule Surgery & Submit to HOD",
      variant: "primary",
      modal: "schedule",
    },
    {
      id: "cancel",
      label: "Cancel Request",
      variant: "danger",
      modal: "cancel",
    },
  ],
  postponed: [
    {
      id: "resume",
      label: "Pick New Date & Resubmit",
      variant: "primary",
      modal: "resume",
    },
  ],
}

const ANAES_ACTIONS: RoleActions = {
  pending_fitness: [
    {
      id: "mark_fit",
      label: "Mark Fit",
      variant: "success",
      modal: "mark_fit",
    },
    {
      id: "mark_unfit",
      label: "Mark Unfit",
      variant: "danger",
      modal: "mark_unfit",
    },
  ],
}

const HOD_ACTIONS: RoleActions = {
  pending_dept_approval: [
    {
      id: "approve",
      label: "Approve",
      variant: "success",
      modal: "hod_approve",
    },
    {
      id: "postpone",
      label: "Postpone",
      variant: "warning",
      modal: "postpone",
    },
  ],
  postponed: [
    {
      id: "resume",
      label: "Resume Workflow",
      variant: "primary",
      modal: "resume",
    },
  ],
}

const MATRON_ACTIONS: RoleActions = {
  pending_ot_assignment: [
    {
      id: "assign_ot",
      label: "Assign OT & Staff",
      variant: "primary",
      modal: "assign_ot",
    },
  ],
  scheduled: [
    {
      id: "start_surgery",
      label: "Start Surgery",
      variant: "success",
      modal: "start_surgery",
    },
  ],
  in_progress: [
    {
      id: "complete",
      label: "Complete Surgery",
      variant: "primary",
      modal: "complete_surgery",
    },
  ],
  "in-progress": [
    {
      id: "complete",
      label: "Complete Surgery",
      variant: "primary",
      modal: "complete_surgery",
    },
  ],
}

const HOD_ANAES_ACTIONS: RoleActions = {
  pending_anaes_approval: [
    {
      id: "assign_anaes",
      label: "Assign Anaesthesiologist",
      variant: "secondary",
      modal: "assign_anaes",
    },
    {
      id: "approve",
      label: "Approve & Schedule",
      variant: "success",
      modal: "hod_anaes_approve",
    },
    {
      id: "postpone",
      label: "Postpone",
      variant: "warning",
      modal: "postpone",
    },
  ],
  scheduled: [
    {
      id: "reschedule",
      label: "Reschedule",
      variant: "warning",
      modal: "reschedule_anaes",
    },
  ],
  postponed: [
    {
      id: "resume",
      label: "Resume Workflow",
      variant: "primary",
      modal: "resume",
    },
  ],
}

// Admin can see all role actions combined
const ADMIN_ACTIONS: RoleActions = {
  draft: WARD_ACTIONS.draft!,
  pending_fitness: ANAES_ACTIONS.pending_fitness!,
  pending_scheduling: WARD_ACTIONS.pending_scheduling!,
  pending_dept_approval: HOD_ACTIONS.pending_dept_approval!,
  pending_ot_assignment: MATRON_ACTIONS.pending_ot_assignment!,
  pending_anaes_approval: HOD_ANAES_ACTIONS.pending_anaes_approval!,
  ready_for_hod_approval: [],
  scheduled: MATRON_ACTIONS.scheduled!,
  in_progress: MATRON_ACTIONS.in_progress!,
  "in-progress": MATRON_ACTIONS["in-progress"]!,
  postponed: [
    {
      id: "resume",
      label: "Resume Workflow",
      variant: "primary",
      modal: "resume",
    },
  ],
}

const ROLE_MAP: Record<string, RoleActions> = {
  "surgery-op-ward": WARD_ACTIONS,
  "anaesthesia-op-pac": ANAES_ACTIONS,
  "department-hod": HOD_ACTIONS,
  "ot-matron": MATRON_ACTIONS,
  "hod-anaesthesia": HOD_ANAES_ACTIONS,
  "hospital-admin": ADMIN_ACTIONS,
  surgeon: WARD_ACTIONS,
  anaesthesia: ANAES_ACTIONS,
  hod: HOD_ACTIONS,
  matron: MATRON_ACTIONS,
  admin: ADMIN_ACTIONS,
}

export function getActions(roleId: string, status: PatientStatus): ActionDef[] {
  return ROLE_MAP[roleId]?.[status] ?? []
}

export const STATUS_LABELS: Record<PatientStatus, string> = {
  draft: "Draft",
  pending_fitness: "Pending PAC",
  pending_scheduling: "Pending Scheduling",
  ready_for_hod_approval: "Ready for HOD",
  pending_dept_approval: "Dept. HOD Review",
  pending_ot_assignment: "OT Assignment",
  pending_anaes_approval: "Anaes. Approval",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  postponed: "Postponed",
  holding: "Holding",
}

export function now(): string {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function matchesStatusFilter(
  p: { status: string; requests?: Array<{ status: string }> },
  filterValue: string,
): boolean {
  if (!filterValue) return true
  if (filterValue === "requested")
    return p.requests?.some((r) => r.status === "pending") ?? false
  return p.status === filterValue
}
