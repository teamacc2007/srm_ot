export type PatientStatus = "draft" | "pending_fitness" | "pending_scheduling" | "ready_for_hod_approval" | "pending_dept_approval" | "pending_ot_assignment" | "pending_anaes_approval" | "scheduled" | "confirmed" | "in-progress" | "in_progress" | "completed" | "cancelled" | "postponed" | "holding"

export type PACStatus = "pending" | "cleared" | "high-risk" | "deferred" | "not-required"

export type Priority = "elective" | "daycare"

export type ASAClass = "ASA-I" | "ASA-II" | "ASA-III" | "ASA-IV" | "ASA-V"

export interface WorkflowHistoryEntry {
  timestamp: string
  action: string
  fromStatus: PatientStatus
  toStatus: PatientStatus
  performedBy: string
  notes?: string
}

export interface PatientRequest {
  id: string
  fromPortal: string
  toPortal: string
  comment: string
  timestamp: string
  status: "pending" | "resolved"
  reply?: string
  replyTimestamp?: string
}

export interface Vitals {
  bp: string
  hr: number
  spo2: number
  temp: number
  rr: number
  weight: number
  height: number
}

export interface PreOpChecklist {
  consentSigned: boolean
  nbmStatus: boolean
  jewelryRemoved: boolean
  nailPolishRemoved: boolean
  idBandAttached: boolean
  ivAccessDone: boolean
  labsReviewed: boolean
  ecgReviewed: boolean
  imagingReviewed: boolean
  anaesthesiaCleared: boolean
  surgeonClearance: boolean
  bloodOrdered: boolean
}

export interface Patient {
  id: string
  uhid: string
  name: string
  age: number
  gender: "M" | "F"
  bloodGroup: string
  phone: string
  department: string
  diagnosis: string
  surgeryType: string
  surgeon: string
  surgeonId: string
  anaesthesiologist: string
  anaesthesiologistId: string
  otRoom: string
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: number
  status: PatientStatus
  pacStatus: PACStatus
  priority: Priority
  ward: string
  bedNumber: string
  admissionDate: string
  allergies: string[]
  comorbidities: string[]
  anaesthesiaType: string
  anaesthesiaRisk: ASAClass
  notes: string
  vitals: Vitals
  checklist: PreOpChecklist
  surgeryCategory: "elective" | "emergency"
  history: WorkflowHistoryEntry[]
  patientFitness?: "pending" | "fit" | "unfit"
  fitnessReason?: string
  reviewDate?: string
  unitChief?: string
  primarySurgeon?: string
  assistantSurgeon?: string
  pgSurgery?: string
  equipmentRequirements?: string[]
  scrubNurse?: string
  floorNurse?: string
  otatTechnician?: string
  anaesthesiaAssistant?: string
  pgAnaesthesia?: string
  postponedFromStatus?: PatientStatus
  postponementReason?: string
  actualStartTime?: string
  actualEndTime?: string
  pmrStatus?: "pending" | "completed"
  hpeStatus?: "sent" | "not_sent"
  intraOpNotes?: string
  requests?: PatientRequest[]
}

export interface OTRoom {
  id: string
  name: string
  status: "available" | "occupied" | "cleaning" | "maintenance"
  currentPatient?: string
  currentSurgery?: string
  nextPatient?: string
  nextTime?: string
  specialization: string
}

export interface Surgeon {
  id: string
  name: string
  department: string
  designation: string
  available: boolean
  scheduledSurgeries: number
}

export interface Module {
  id: string
  label: string
  role: string
  user: string
  department: string
}

export type NavItem = {
  id: string
  label: string
  icon: string
}
