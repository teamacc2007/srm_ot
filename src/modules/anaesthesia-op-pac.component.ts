import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { matchesStatusFilter } from "../lib/workflow"
import {
  DashTileComponent,
  StatusFilterDropdownComponent,
} from "../components/ui.component"
import { StandardTableComponent } from "../components/standard-table.component"
import { AllPatientsPageComponent } from "../components/all-patients-page.component"
import { PatientDetailComponent } from "../components/patient-detail.component"
import { AnalysisPageComponent } from "../components/analysis-page.component"
import { PreHabilitationPageComponent } from "../components/pre-habilitation-page.component"

const TODAY = "2024-12-20"
const ROLE_ID = "anaesthesia-op-pac"

@Component({
  selector: "app-anaesthesia-op-pac",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashTileComponent,
    StatusFilterDropdownComponent,
    StandardTableComponent,
    AllPatientsPageComponent,
    PatientDetailComponent,
    AnalysisPageComponent,
    PreHabilitationPageComponent,
  ],
  template: `
    @if (selectedPatient) {
      <app-patient-detail
        [patient]="liveSelectedPatient"
        (back)="selectedPatient = null"
        [roleContext]="roleId"
        (patientUpdate)="patientUpdate.emit($event)"
      ></app-patient-detail>
    } @else {
      @switch (activePage) {
        @case ('dashboard') {
          <div class="flex flex-col" style="height: calc(100vh - 40px);">
            <div class="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3">
              <h1 class="text-sm font-semibold text-slate-900">Anaesthesia OP / PAC — Dashboard</h1>
              <p class="text-xs text-slate-500 mt-0.5">{{ today }} · {{ todayPatients.length }} cases scheduled</p>
            </div>

            <!-- KPI Tiles -->
            <div class="flex-shrink-0 grid grid-cols-6 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
              @for (t of tiles; track t.id) {
                <app-dash-tile
                  [label]="t.label"
                  [value]="getTileCount(t.id)"
                  [color]="t.color"
                  [icon]="t.icon"
                  [active]="tileFilter === t.id"
                  (clicked)="toggleTile(t.id)"
                ></app-dash-tile>
              }
            </div>

            <!-- Filter bar -->
            <div class="flex-shrink-0 flex items-center gap-3 px-5 py-2 bg-white border-b border-slate-100">
              <select
                [(ngModel)]="dashDept"
                class="h-8 pl-3 pr-7 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              >
                <option value="">All Departments</option>
                @for (d of departments; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
              <app-status-filter-dropdown
                [value]="dashStatus"
                (valueChange)="dashStatus = $event"
              ></app-status-filter-dropdown>
              @if (dashDept || dashStatus) {
                <button (click)="dashDept = ''; dashStatus = ''" class="text-xs text-blue-600 hover:underline cursor-pointer">
                  Clear
                </button>
              }
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-hidden p-4">
              <app-standard-table
                [patients]="filteredDashPatients"
                [roleId]="roleId"
                (rowClick)="selectedPatient = $event"
                [emptyMessage]="tileFilter ? 'No patients in this category for today.' : 'No patients scheduled for today.'"
              ></app-standard-table>
            </div>
          </div>
        }

        @case ('patient-list') {
          <div class="p-5 flex flex-col" style="height: calc(100vh - 40px);">
            <div class="flex items-start justify-between mb-5">
              <div>
                <h1 class="text-lg font-semibold text-slate-900">Patients</h1>
                <p class="text-sm text-slate-500 mt-0.5">{{ todayPatients.length }} cases on {{ today }}</p>
              </div>
            </div>
            <div class="flex-1 overflow-hidden">
              <app-standard-table
                [patients]="todayPatients"
                [roleId]="roleId"
                (rowClick)="selectedPatient = $event"
                emptyMessage="No patients scheduled for today."
              ></app-standard-table>
            </div>
          </div>
        }

        @case ('pre-habilitation') {
          <app-pre-habilitation-page
            [patients]="patients"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-pre-habilitation-page>
        }

        @case ('all-patients') {
          <app-all-patients-page
            [patients]="patients"
            [roleId]="roleId"
            (rowClick)="selectedPatient = $event"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-all-patients-page>
        }

        @case ('analysis') {
          <app-analysis-page
            [patients]="patients"
            [roleId]="roleId"
            roleLabel="Anaesthesia OP / PAC"
            [performerKeys]="['Anaesthesia OP', 'anaesthesia-op-pac', 'PAC']"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-analysis-page>
        }
      }
    }
  `,
})
export class AnaesthesiaOPPACComponent {
  @Input() activePage: string = "dashboard"
  @Input() patients: Patient[] = []
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  readonly today = TODAY
  readonly roleId = ROLE_ID

  selectedPatient: Patient | null = null
  tileFilter: string | null = null
  dashStatus: string = ""
  dashDept: string = ""

  readonly tiles = [
    { id: "today", label: "Patients", color: "blue", icon: "users" },
    { id: "action", label: "Awaiting PAC", color: "orange", icon: "clock" },
    { id: "scheduled", label: "Scheduled", color: "violet", icon: "calendar" },
    {
      id: "progress",
      label: "Surgery Going On",
      color: "amber",
      icon: "activity",
    },
    { id: "completed", label: "Completed", color: "green", icon: "check" },
    {
      id: "cancelled",
      label: "Cancelled / Postponed",
      color: "red",
      icon: "alert-triangle",
    },
  ]

  get liveSelectedPatient(): Patient {
    if (!this.selectedPatient) return {} as Patient
    return (
      this.patients.find((p) => p.id === this.selectedPatient!.id) ??
      this.selectedPatient
    )
  }

  get todayPatients(): Patient[] {
    return this.patients.filter((p) => p.scheduledDate === TODAY)
  }

  get departments(): string[] {
    return [...new Set(this.todayPatients.map((p) => p.department))].sort()
  }

  getTileCount(id: string): number {
    switch (id) {
      case "today":
        return this.todayPatients.length
      case "action":
        return this.patients.filter((p) => p.status === "pending_fitness")
          .length
      case "scheduled":
        return this.todayPatients.filter((p) => p.status === "scheduled").length
      case "progress":
        return this.todayPatients.filter(
          (p) => p.status === "in_progress" || p.status === "in-progress",
        ).length
      case "completed":
        return this.todayPatients.filter((p) => p.status === "completed").length
      case "cancelled":
        return this.todayPatients.filter(
          (p) => p.status === "cancelled" || p.status === "postponed",
        ).length
      default:
        return 0
    }
  }

  toggleTile(id: string) {
    this.tileFilter = this.tileFilter === id ? null : id
  }

  get filteredDashPatients(): Patient[] {
    const ACTION_STATUSES = ["pending_fitness"]
    let list: Patient[]

    if (this.tileFilter && this.tileFilter !== "today") {
      switch (this.tileFilter) {
        case "action":
          list = this.patients.filter(
            (p) => p.status === "pending_fitness",
          )
          break
        case "scheduled":
          list = this.todayPatients.filter((p) => p.status === "scheduled")
          break
        case "progress":
          list = this.todayPatients.filter(
            (p) => p.status === "in_progress" || p.status === "in-progress",
          )
          break
        case "completed":
          list = this.todayPatients.filter((p) => p.status === "completed")
          break
        case "cancelled":
          list = this.todayPatients.filter(
            (p) => p.status === "cancelled" || p.status === "postponed",
          )
          break
        default:
          list = this.todayPatients
      }
    } else {
      list = [
        ...this.patients.filter((p) => ACTION_STATUSES.includes(p.status)),
        ...this.todayPatients.filter(
          (p) => !ACTION_STATUSES.includes(p.status),
        ),
      ]
    }

    return list.filter(
      (p) =>
        matchesStatusFilter(p, this.dashStatus) &&
        (!this.dashDept || p.department === this.dashDept),
    )
  }
}
