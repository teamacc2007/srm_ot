import type { Patient } from "../types"

export type WorkflowAction = "view" | "edit_patient" | "submit_fitness" | "schedule_surgery" | "submit_hod" | "reschedule" | "cancel"

export interface ActionDefinition {
  id: WorkflowAction
  label: string
  description: string
  variant?: "primary" | "secondary" | "danger"
}

export function getWardActions(patient: Patient): ActionDefinition[] {
  const actions: ActionDefinition[] = [
    {
      id: "view",
      label: "View Patient Details",
      description: "Open the complete patient and surgery record.",
      variant: "secondary",
    },
  ]

  switch (patient.status) {
    case "draft":
      actions.push(
        {
          id: "edit_patient",
          label: "Edit Patient",
          description: "Update patient and procedure information.",
          variant: "secondary",
        },
        {
          id:
            patient.surgeryCategory === "emergency"
              ? "schedule_surgery"
              : "submit_fitness",
          label:
            patient.surgeryCategory === "emergency"
              ? "Schedule Emergency Surgery"
              : "Submit for PAC Fitness",
          description:
            patient.surgeryCategory === "emergency"
              ? "Continue the emergency fast-path."
              : "Forward the case to Anaesthesia OP for PAC.",
          variant: "primary",
        },
        {
          id: "cancel",
          label: "Cancel Request",
          description: "Withdraw this surgery request.",
          variant: "danger",
        },
      )
      break

    case "pending_scheduling":
      actions.push({
        id: "schedule_surgery",
        label: "Schedule Surgery",
        description: "Select date, duration, surgical team and equipment.",
        variant: "primary",
      })
      break

    case "ready_for_hod_approval":
      actions.push({
        id: "submit_hod",
        label: "Submit to Department HOD",
        description: "Send the completed schedule for HOD review.",
        variant: "primary",
      })
      break

    case "postponed":
      actions.push({
        id: "reschedule",
        label: "Reschedule Surgery",
        description: "Choose a new date and resubmit the case.",
        variant: "primary",
      })
      break

    case "pending_dept_approval":
    case "pending_ot_assignment":
    case "pending_anaes_approval":
    case "scheduled":
    case "in_progress":
    case "completed":
    case "cancelled":
      break
  }

  return actions
}
