import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { otRooms } from "../data/mock"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { matchesStatusFilter } from "../lib/workflow"
import {
  DashTileComponent,
  DeptFilterSelectComponent,
  StatusFilterDropdownComponent,
  OTTimelineComponent,
  OTSlotPopupComponent,
  OTSlot,
} from "../components/ui.component"
import { StandardTableComponent } from "../components/standard-table.component"
import { AllPatientsPageComponent } from "../components/all-patients-page.component"
import { PatientDetailComponent } from "../components/patient-detail.component"
import { AnalysisPageComponent } from "../components/analysis-page.component"

const TODAY = "2024-12-20"
const ROLE_ID = "hod-anaesthesia"

@Component({
  selector: "app-hod-anaesthesia",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashTileComponent,
    DeptFilterSelectComponent,
    StatusFilterDropdownComponent,
    OTTimelineComponent,
    OTSlotPopupComponent,
    StandardTableComponent,
    AllPatientsPageComponent,
    PatientDetailComponent,
    AnalysisPageComponent,
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
              <h1 class="text-sm font-semibold text-slate-900">HOD Anaesthesia — Theatre Schedule</h1>
              <p class="text-xs text-slate-500 mt-0.5">{{ today }} · {{ rooms.length }} theatres · {{ timelineSlots.length }} booked slots</p>
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

            @if (tileFilter) {
              <div class="flex-shrink-0 flex items-center gap-3 px-5 py-2 bg-white border-b border-slate-100">
                <app-dept-filter-select
                  [value]="dashDept"
                  (valueChange)="dashDept = $event"
                  [departments]="departments"
                ></app-dept-filter-select>
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

              <div class="flex-1 overflow-hidden p-4">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-xs font-semibold text-slate-600">
                    {{ filteredTilePatients.length }} patient{{ filteredTilePatients.length !== 1 ? 's' : '' }} — {{ activeTileLabel }}
                  </p>
                  <button (click)="tileFilter = null" class="text-xs text-blue-600 hover:underline cursor-pointer">
                    ← Back to OT Grid
                  </button>
                </div>
                <app-standard-table
                  [patients]="filteredTilePatients"
                  [roleId]="roleId"
                  (rowClick)="selectedPatient = $event"
                  emptyMessage="No patients in this category for today."
                ></app-standard-table>
              </div>
            } @else {
              <div class="flex-1 overflow-y-auto p-4">
                <div class="bg-white border border-slate-200 rounded-lg p-4 h-full">
                  <app-ot-timeline
                    [rooms]="rooms"
                    [slots]="timelineSlots"
                    (slotClick)="onSlotClick($event)"
                  ></app-ot-timeline>
                </div>
              </div>
            }

            @if (slotPanel && !tileFilter) {
              <app-ot-slot-popup
                [patient]="slotPanel"
                [pos]="slotPos"
                (close)="slotPanel = null"
                (view)="selectedPatient = slotPanel; slotPanel = null"
              ></app-ot-slot-popup>
            }
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
            roleLabel="HOD Anaesthesia"
            [performerKeys]="['HOD Anaesthesia', 'hod-anaesthesia', 'Anaesthesia HOD']"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-analysis-page>
        }
      }
    }
  `,
})
export class HODAnaesthesiaComponent {
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
  dashDept: string = ""
  dashStatus: string = ""

  slotPanel: Patient | null = null
  slotPos = { x: 0, y: 0 }

  otRoomList = otRooms

  readonly tiles = [
    { id: "today", label: "Patients", color: "blue", icon: "users" },
    {
      id: "action",
      label: "Pending Anaes Appvl",
      color: "orange",
      icon: "clock",
    },
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

  get rooms() {
    return this.otRoomList.map((r) => ({
      id: r.id,
      name: r.name,
      specialization: r.specialization,
    }))
  }

  get timelineSlots(): OTSlot[] {
    return this.todayPatients
      .filter((p) => p.otRoom)
      .map((p) => {
        const [h, m] = (p.scheduledTime || "08:00").split(":").map(Number)
        return {
          roomId: p.otRoom,
          patientName: p.name,
          surgery: p.surgeryType,
          startHour: h + m / 60,
          durationHours: (p.estimatedDuration || 90) / 60,
          status: p.status,
          patientId: p.id,
        }
      })
  }

  getTileCount(id: string): number {
    switch (id) {
      case "today":
        return this.todayPatients.length
      case "action":
        return this.patients.filter(
          (p) => p.status === "pending_anaes_approval",
        ).length
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

  get activeTileLabel(): string {
    return this.tiles.find((t) => t.id === this.tileFilter)?.label ?? ""
  }

  get filteredTilePatients(): Patient[] {
    let list: Patient[]
    switch (this.tileFilter) {
      case "action":
        list = this.patients.filter(
          (p) => p.status === "pending_anaes_approval",
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

    return list.filter(
      (p) =>
        (!this.dashDept ||
          p.department.toLowerCase().includes(this.dashDept.toLowerCase())) &&
        matchesStatusFilter(p, this.dashStatus),
    )
  }

  onSlotClick(data: { slot: OTSlot; event: MouseEvent }) {
    const p = this.patients.find((x) => x.id === data.slot.patientId)
    if (p) {
      this.slotPanel = p
      this.slotPos = { x: data.event.clientX, y: data.event.clientY }
    }
  }
}
