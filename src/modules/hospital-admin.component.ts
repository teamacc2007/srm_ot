import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { otRooms } from "../data/mock"
import type { Patient, OTRoom, WorkflowHistoryEntry } from "../types"
import { matchesStatusFilter } from "../lib/workflow"
import { IconComponent } from "../components/icon.component"
import {
  DashTileComponent,
  DeptFilterSelectComponent,
  StatusFilterDropdownComponent,
  ModalComponent,
  ConfirmDialogComponent,
  OTTimelineComponent,
  OTSlotPopupComponent,
  StatusBadgeComponent,
  OTSlot,
} from "../components/ui.component"
import { StandardTableComponent } from "../components/standard-table.component"
import { AllPatientsPageComponent } from "../components/all-patients-page.component"
import { PatientDetailComponent } from "../components/patient-detail.component"
import { AnalysisPageComponent } from "../components/analysis-page.component"

const TODAY = "2024-12-20"
const ROLE_ID = "hospital-admin"

const PENDING_STATUSES = [
  "draft",
  "pending_fitness",
  "pending_scheduling",
  "ready_for_hod_approval",
  "pending_dept_approval",
  "pending_ot_assignment",
  "pending_anaes_approval",
]

@Component({
  selector: "app-hospital-admin",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    DashTileComponent,
    DeptFilterSelectComponent,
    StatusFilterDropdownComponent,
    ModalComponent,
    ConfirmDialogComponent,
    OTTimelineComponent,
    OTSlotPopupComponent,
    StatusBadgeComponent,
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
          <div class="flex flex-col overflow-hidden" style="height: calc(100vh - 40px);">
            <div class="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3">
              <h1 class="text-sm font-semibold text-slate-900">Hospital Admin — Dashboard</h1>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ today }} · {{ todayPatients.length }} cases today · {{ pendingAllCount }} pending hospital-wide
              </p>
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

            <!-- Chart + Table -->
            @if (!tileFilter) {
              <div class="flex flex-1 overflow-hidden gap-0">
                <!-- Dept chart -->
                <div class="flex-shrink-0 w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Cases by Department</p>
                  <div class="space-y-2.5">
                    @for (item of deptChartEntries; track item.dept; let i = $index) {
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <span class="text-[11px] text-slate-600 truncate max-w-[160px]">{{ item.dept }}</span>
                          <span class="text-[11px] font-bold text-slate-700 ml-2">{{ item.count }}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            [class]="barColors[i % barColors.length] + ' h-1.5 rounded-full transition-all'"
                            [style.width]="item.pct + '%'"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Table -->
                <div class="flex-1 overflow-hidden flex flex-col">
                  <div class="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-white">
                    <app-dept-filter-select
                      [value]="dashDept"
                      (valueChange)="dashDept = $event"
                      [departments]="departments"
                    ></app-dept-filter-select>
                    <app-status-filter-dropdown
                      [value]="dashStatus"
                      (valueChange)="dashStatus = $event"
                    ></app-status-filter-dropdown>
                    @if (dashStatus || dashDept) {
                      <button (click)="dashStatus = ''; dashDept = ''" class="text-[11px] text-blue-600 hover:underline cursor-pointer">
                        Clear
                      </button>
                    }
                  </div>
                  <div class="flex-1 overflow-hidden p-3">
                    <app-standard-table
                      [patients]="filteredDashPatients"
                      [roleId]="roleId"
                      (rowClick)="selectedPatient = $event"
                      emptyMessage="No patients scheduled for today."
                    ></app-standard-table>
                  </div>
                </div>
              </div>
            } @else {
              <div class="flex-1 overflow-hidden p-4">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-xs font-semibold text-slate-600">
                    {{ filteredDashPatients.length }} patient{{ filteredDashPatients.length !== 1 ? 's' : '' }} — {{ activeTileLabel }}
                  </p>
                  <button (click)="tileFilter = null" class="text-xs text-blue-600 hover:underline cursor-pointer">
                    Clear filter
                  </button>
                </div>
                <app-standard-table
                  [patients]="filteredDashPatients"
                  [roleId]="roleId"
                  (rowClick)="selectedPatient = $event"
                  emptyMessage="No patients in this category for today."
                ></app-standard-table>
              </div>
            }
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

        @case ('ot-master') {
          <div class="flex" style="height: calc(100vh - 40px);">
            <!-- Left calendar (toggled) -->
            @if (showMasterCal) {
              <div class="flex-shrink-0 w-64 bg-white border-r border-slate-200 flex flex-col p-4">
                <div class="flex items-center justify-between mb-3">
                  <button (click)="prevMasterMonth()" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">‹</button>
                  <span class="text-xs font-semibold text-slate-700">{{ months[masterCalMonth.month] }} {{ masterCalMonth.year }}</span>
                  <button (click)="nextMasterMonth()" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">›</button>
                </div>
                <div class="grid grid-cols-7 mb-1">
                  @for (d of days; track d) {
                    <div class="text-center text-[10px] font-semibold text-slate-400 py-1">{{ d }}</div>
                  }
                </div>
                <div class="grid grid-cols-7 gap-y-0.5">
                  @for (d of masterCalCells; track $index) {
                    @if (!d) {
                      <div></div>
                    } @else {
                      <button
                        type="button"
                        (click)="masterDate = toMasterDateStr(d); masterSlotPanel = null"
                        [class]="getMasterCalBtnClass(d)"
                      >
                        {{ d }}
                        @if (hasPatientsOnDate(d)) {
                          <span [class]="'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ' + (toMasterDateStr(d) === masterDate ? 'bg-white' : 'bg-blue-400')"></span>
                        }
                      </button>
                    }
                  }
                </div>
                <div class="mt-3 p-2.5 bg-blue-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-blue-700">{{ masterDate }}</p>
                  <p class="text-[10px] text-blue-500 mt-0.5">{{ filteredMasterPatients.length }} case{{ filteredMasterPatients.length !== 1 ? 's' : '' }} scheduled</p>
                </div>
              </div>
            }

            <!-- Right OT grid -->
            <div class="flex-1 overflow-hidden flex flex-col">
              <div class="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-100">
                <button
                  type="button"
                  (click)="showMasterCal = !showMasterCal"
                  [title]="showMasterCal ? 'Hide Calendar' : 'Show Calendar'"
                  [class]="'flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded border transition-colors cursor-pointer ' + (showMasterCal ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')"
                >
                  <app-icon name="calendar" [size]="13"></app-icon>
                  {{ masterDate }}
                </button>
                <select
                  [(ngModel)]="masterFilterStatus"
                  class="h-7 pl-2 pr-6 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">Surgery Going On</option>
                  <option value="completed">Completed</option>
                </select>
                <span class="text-xs text-slate-400 ml-auto">
                  {{ filteredMasterPatients.length }} case{{ filteredMasterPatients.length !== 1 ? 's' : '' }}
                </span>
              </div>
              <div class="flex-1 overflow-y-auto p-5">
                <div class="bg-white border border-slate-200 rounded-lg p-4">
                  <app-ot-timeline
                    [rooms]="rooms"
                    [slots]="masterTimelineSlots"
                    (slotClick)="onMasterSlotClick($event)"
                  ></app-ot-timeline>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating popup -->
          @if (masterSlotPanel) {
            <app-ot-slot-popup
              [patient]="masterSlotPanel"
              [pos]="masterSlotPos"
              (close)="masterSlotPanel = null"
              (view)="selectedPatient = masterSlotPanel; masterSlotPanel = null"
            ></app-ot-slot-popup>
          }
        }

        @case ('pending-approvals') {
          <div class="flex flex-col" style="height: calc(100vh - 40px);">
            <div class="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h1 class="text-base font-semibold text-slate-900">Pending Approvals</h1>
                  <p class="text-xs text-slate-500 mt-0.5">Centralized view of all cases awaiting approvals</p>
                </div>
                <span class="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-medium">
                  {{ pendingAllCount }} total pending
                </span>
              </div>
              <div class="flex gap-1">
                @for (tab of approvalTabs; track tab.id) {
                  <button
                    type="button"
                    (click)="approvalTab = tab.id"
                    [class]="'px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ' + (approvalTab === tab.id ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-600 hover:text-slate-800')"
                  >
                    {{ tab.label }}
                    @if (getTabCount(tab.statuses) > 0) {
                      <span [class]="'w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ' + (approvalTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600')">
                        {{ getTabCount(tab.statuses) }}
                      </span>
                    }
                  </button>
                }
              </div>
            </div>
            <div class="flex-1 overflow-hidden p-4">
              <app-standard-table
                [patients]="currentTabPatients"
                [roleId]="roleId"
                (rowClick)="selectedPatient = $event"
                [emptyMessage]="'No cases in ' + activeTabDef.label + ' queue.'"
              ></app-standard-table>
            </div>
          </div>
        }

        @case ('ot-rooms') {
          <div class="p-5 overflow-y-auto" style="height: calc(100vh - 40px);">
            <div class="flex items-start justify-between mb-5">
              <div>
                <h1 class="text-lg font-semibold text-slate-900">OT Rooms</h1>
                <p class="text-sm text-slate-500 mt-0.5">{{ localRooms.length }} operating theatres · Hospital-wide</p>
              </div>
              <button
                type="button"
                (click)="addRoomForm = { number: '', dept: '' }; addRoomOpen = true"
                class="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <app-icon name="plus" [size]="12"></app-icon> OT Room
              </button>
            </div>

            <div class="grid grid-cols-4 gap-4">
              @for (room of localRooms; track room.id) {
                <div class="bg-white border border-slate-200 rounded-lg p-4 relative">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <p class="text-sm font-bold text-slate-900">{{ room.name }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{{ room.specialization }}</p>
                    </div>
                    <app-status-badge [value]="room.status" size="md" [dot]="true"></app-status-badge>
                  </div>
                  @if (room.status === 'occupied' && room.currentPatient) {
                    <div class="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      <p class="font-semibold text-blue-800 text-xs truncate">{{ room.currentPatient }}</p>
                      <p class="text-blue-600 text-[10px] mt-0.5">{{ room.currentSurgery }}</p>
                      @if (room.nextPatient) {
                        <p class="text-blue-500 text-[10px] mt-1">Next: {{ room.nextPatient }} · {{ room.nextTime }}</p>
                      }
                    </div>
                  }
                  @if (room.status === 'cleaning') {
                    <p class="text-amber-600 text-xs mt-2">Turnaround in progress</p>
                  }
                  @if (room.status === 'maintenance') {
                    <p class="text-red-600 text-xs mt-2">Out of service</p>
                  }
                  @if (room.status === 'available') {
                    <p class="text-green-600 text-xs mt-2">Ready for next case</p>
                  }
                  <!-- Edit icon -->
                  <button
                    type="button"
                    (click)="editRoom = room; editRoomDept = room.specialization"
                    title="Edit OT Room"
                    class="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  >
                    <app-icon name="edit" [size]="12"></app-icon>
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Edit room modal -->
          <app-modal
            [open]="!!editRoom"
            (close)="editRoom = null"
            [title]="'Edit — ' + (editRoom ? editRoom.name : '')"
            width="sm"
          >
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium text-slate-700 block mb-1.5">Change Department / Specialization</label>
                <div class="flex gap-2">
                  <input
                    [(ngModel)]="editRoomDept"
                    class="flex-1 h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    (click)="editRoomConfirm = 'dept'"
                    [disabled]="!editRoomDept || editRoomDept === editRoom?.specialization"
                    class="h-8 px-3 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div class="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  (click)="editRoomConfirm = 'close'"
                  class="h-8 px-3 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                >
                  Close OT Room
                </button>
                <p class="text-[10px] text-slate-400 mt-1.5">Marks room as out of service (maintenance).</p>
              </div>
            </div>
            <div modal-footer class="flex justify-end w-full">
              <button type="button" (click)="editRoom = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
            </div>
          </app-modal>

          <!-- Edit confirm dialog -->
          <app-confirm-dialog
            [open]="!!editRoomConfirm"
            (close)="editRoomConfirm = ''"
            (confirm)="applyRoomEdit()"
            [title]="editRoomConfirm === 'dept' ? 'Change Department — ' + (editRoom?.name || '') : 'Close OT Room — ' + (editRoom?.name || '')"
            [message]="editRoomConfirm === 'dept'
              ? 'Change ' + (editRoom?.name || '') + ' department from \\'' + (editRoom?.specialization || '') + '\\' to \\'' + editRoomDept + '\\'?'
              : 'Close ' + (editRoom?.name || '') + '? It will be marked as out of service.'"
            [confirmLabel]="editRoomConfirm === 'dept' ? 'Apply Change' : 'Close Room'"
            [variant]="editRoomConfirm === 'dept' ? 'primary' : 'danger'"
          ></app-confirm-dialog>

          <!-- Add room modal -->
          <app-modal
            [open]="addRoomOpen"
            (close)="addRoomOpen = false"
            title="Add OT Room"
            width="sm"
          >
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-slate-700 block mb-1">OT Room Number</label>
                <input
                  [(ngModel)]="addRoomForm.number"
                  placeholder="e.g. OT-9"
                  class="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-700 block mb-1">Department / Specialization</label>
                <input
                  [(ngModel)]="addRoomForm.dept"
                  placeholder="e.g. Cardiothoracic"
                  class="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div modal-footer class="flex justify-end gap-2 w-full">
              <button type="button" (click)="addRoomOpen = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button
                type="button"
                [disabled]="!addRoomForm.number.trim() || !addRoomForm.dept.trim()"
                (click)="addRoomConfirm = true"
                class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                Create OT Room
              </button>
            </div>
          </app-modal>

          <!-- Add room confirm -->
          <app-confirm-dialog
            [open]="addRoomConfirm"
            (close)="addRoomConfirm = false"
            (confirm)="applyAddRoom()"
            title="Create OT Room"
            [message]="'Create ' + addRoomForm.number + ' for ' + addRoomForm.dept + '?'"
            confirmLabel="Create"
            variant="primary"
          ></app-confirm-dialog>
        }

        @case ('patient-history') {
          <div class="flex flex-col" style="height: calc(100vh - 40px);">
            <div class="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between">
              <div>
                <h1 class="text-base font-semibold text-slate-900">Patient History</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                  Complete audit trail of all workflow transitions · {{ allHistoryEntries.length }} events
                </p>
              </div>
              <button
                type="button"
                (click)="exportHistoryCSV()"
                class="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1.5 transition-colors cursor-pointer"
              >
                ↓ Export CSV
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table class="w-full text-xs" style="min-width: 700px;">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                      <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Performed By</th>
                      <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (h of allHistoryEntries; track $index) {
                      <tr
                        (click)="openHistoryPatient(h.patientId)"
                        class="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td class="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{{ h.timestamp }}</td>
                        <td class="px-4 py-2.5">
                          <div class="font-semibold text-slate-800">{{ h.patientName }}</div>
                          <div class="text-slate-400 font-mono">{{ h.patientUhid }}</div>
                        </td>
                        <td class="px-4 py-2.5 font-medium text-slate-700">{{ h.action }}</td>
                        <td class="px-4 py-2.5 text-slate-600">{{ h.performedBy }}</td>
                        <td class="px-4 py-2.5 text-slate-400 italic max-w-[160px] truncate">{{ h.notes || '—' }}</td>
                      </tr>
                    }
                    @if (allHistoryEntries.length === 0) {
                      <tr>
                        <td colspan="5" class="px-4 py-10 text-center text-slate-400">No workflow events recorded yet.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        @case ('analysis') {
          <app-analysis-page
            [patients]="patients"
            [roleId]="roleId"
            roleLabel="Hospital Admin"
            [performerKeys]="['Hospital Admin', 'hospital-admin', 'Admin']"
            [showDeptFilter]="true"
            [allDepartments]="allDepartments"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-analysis-page>
        }
      }
    }
  `,
})
export class HospitalAdminComponent {
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
  approvalTab: string = "dept-hod"

  masterDate: string = TODAY
  masterCalMonth = { year: 2024, month: 11 }
  masterFilterStatus: string = ""
  masterSlotPanel: Patient | null = null
  masterSlotPos = { x: 0, y: 0 }
  showMasterCal: boolean = false

  tileFilter: string | null = null
  dashStatus: string = ""
  dashDept: string = ""

  localRooms: OTRoom[] = otRooms.map((r) => ({ ...r }))
  editRoom: OTRoom | null = null
  editRoomDept: string = ""
  editRoomConfirm: "dept" | "close" | "" = ""

  addRoomOpen: boolean = false
  addRoomForm = { number: "", dept: "" }
  addRoomConfirm: boolean = false

  months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  barColors = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-orange-500",
  ]

  approvalTabs = [
    { id: "dept-hod", label: "Dept HOD", statuses: ["pending_dept_approval"] },
    {
      id: "anaesthesia",
      label: "Anaesthesia HOD",
      statuses: ["pending_anaes_approval"],
    },
    {
      id: "ot-assign",
      label: "OT Assignment",
      statuses: ["pending_ot_assignment"],
    },
    { id: "pac", label: "PAC", statuses: ["pending_fitness"] },
    {
      id: "other",
      label: "Other Pending",
      statuses: ["draft", "pending_scheduling", "postponed"],
    },
  ]

  readonly tiles = [
    { id: "today", label: "Patients", color: "blue", icon: "users" },
    {
      id: "pending",
      label: "Pending Hospital-wide",
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

  get pendingAllCount(): number {
    return this.patients.filter((p) => PENDING_STATUSES.includes(p.status))
      .length
  }

  get departments(): string[] {
    return [...new Set(this.todayPatients.map((p) => p.department))].sort()
  }

  get allDepartments(): string[] {
    return [...new Set(this.patients.map((p) => p.department))].sort()
  }

  getTileCount(id: string): number {
    switch (id) {
      case "today":
        return this.todayPatients.length
      case "pending":
        return this.patients.filter((p) => PENDING_STATUSES.includes(p.status))
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

  get activeTileLabel(): string {
    return this.tiles.find((t) => t.id === this.tileFilter)?.label ?? ""
  }

  get filteredDashPatients(): Patient[] {
    let list: Patient[]
    if (this.tileFilter && this.tileFilter !== "today") {
      switch (this.tileFilter) {
        case "pending":
          list = this.todayPatients.filter((p) =>
            PENDING_STATUSES.includes(p.status),
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
        ...this.todayPatients.filter((p) =>
          PENDING_STATUSES.includes(p.status),
        ),
        ...this.todayPatients.filter(
          (p) => !PENDING_STATUSES.includes(p.status),
        ),
      ]
    }

    return list.filter(
      (p) =>
        matchesStatusFilter(p, this.dashStatus) &&
        (!this.dashDept ||
          p.department.toLowerCase().includes(this.dashDept.toLowerCase())),
    )
  }

  get deptChartEntries() {
    const byDept: Record<string, number> = {}
    this.patients.forEach((p) => {
      byDept[p.department] = (byDept[p.department] ?? 0) + 1
    })
    const entries = Object.entries(byDept)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    const maxCount = Math.max(...entries.map((e) => e[1]), 1)

    return entries.map(([dept, count]) => ({
      dept,
      count,
      pct: (count / maxCount) * 100,
    }))
  }

  // OT Master
  get rooms() {
    return this.localRooms.map((r) => ({
      id: r.id,
      name: r.name,
      specialization: r.specialization,
    }))
  }

  get filteredMasterPatients(): Patient[] {
    const sched = this.patients.filter(
      (p) => p.scheduledDate === this.masterDate && p.status !== "cancelled",
    )
    return sched.filter(
      (p) => !this.masterFilterStatus || p.status === this.masterFilterStatus,
    )
  }

  get masterTimelineSlots(): OTSlot[] {
    return this.filteredMasterPatients.map((p) => {
      const [h, m] = (p.scheduledTime || "08:00").split(":").map(Number)
      return {
        roomId: p.otRoom || "OT-1",
        patientName: p.name,
        surgery: p.surgeryType,
        startHour: h + m / 60,
        durationHours: (p.estimatedDuration || 90) / 60,
        status: p.status,
        patientId: p.id,
      }
    })
  }

  onMasterSlotClick(data: { slot: OTSlot; event: MouseEvent }) {
    const p = this.patients.find((x) => x.id === data.slot.patientId)
    if (p) {
      this.masterSlotPanel = p
      this.masterSlotPos = { x: data.event.clientX, y: data.event.clientY }
    }
  }

  prevMasterMonth() {
    this.masterCalMonth =
      this.masterCalMonth.month === 0
        ? { year: this.masterCalMonth.year - 1, month: 11 }
        : {
            year: this.masterCalMonth.year,
            month: this.masterCalMonth.month - 1,
          }
  }

  nextMasterMonth() {
    this.masterCalMonth =
      this.masterCalMonth.month === 11
        ? { year: this.masterCalMonth.year + 1, month: 0 }
        : {
            year: this.masterCalMonth.year,
            month: this.masterCalMonth.month + 1,
          }
  }

  toMasterDateStr(d: number): string {
    const { year, month } = this.masterCalMonth
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }

  hasPatientsOnDate(d: number): boolean {
    const ds = this.toMasterDateStr(d)
    return this.patients.some((p) => p.scheduledDate === ds)
  }

  get masterCalCells(): (number | null)[] {
    const { year, month } = this.masterCalMonth
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
  }

  getMasterCalBtnClass(d: number): string {
    const ds = this.toMasterDateStr(d)
    const isSelected = ds === this.masterDate
    const isToday = ds === TODAY
    const base =
      "relative w-full aspect-square flex flex-col items-center justify-center rounded-full text-[11px] font-medium transition-colors cursor-pointer "
    if (isSelected) return base + "bg-blue-600 text-white"
    if (isToday)
      return (
        base + "ring-1 ring-blue-400 text-blue-600 font-bold hover:bg-blue-50"
      )
    return base + "text-slate-700 hover:bg-slate-100"
  }

  // Pending Approvals
  get activeTabDef() {
    return (
      this.approvalTabs.find((t) => t.id === this.approvalTab) ??
      this.approvalTabs[0]
    )
  }

  getTabCount(statuses: string[]): number {
    return this.patients.filter((p) => statuses.includes(p.status)).length
  }

  get currentTabPatients(): Patient[] {
    return this.patients.filter((p) =>
      this.activeTabDef.statuses.includes(p.status),
    )
  }

  // Room management
  applyRoomEdit() {
    if (!this.editRoom) return
    if (this.editRoomConfirm === "dept") {
      this.localRooms = this.localRooms.map((r) =>
        r.id === this.editRoom!.id
          ? { ...r, specialization: this.editRoomDept }
          : r,
      )
    } else {
      this.localRooms = this.localRooms.map((r) =>
        r.id === this.editRoom!.id
          ? { ...r, status: "maintenance" as const }
          : r,
      )
    }
    this.editRoomConfirm = ""
    this.editRoom = null
  }

  applyAddRoom() {
    const n = this.addRoomForm.number.trim()
    this.localRooms = [
      ...this.localRooms,
      {
        id: n,
        name: n,
        status: "available" as const,
        specialization: this.addRoomForm.dept.trim(),
      },
    ]
    this.addRoomConfirm = false
    this.addRoomOpen = false
  }

  // Patient History
  get allHistoryEntries() {
    return this.patients
      .flatMap((p) =>
        p.history.map((h) => ({
          ...h,
          patientName: p.name,
          patientId: p.id,
          patientUhid: p.uhid,
        })),
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  openHistoryPatient(id: string) {
    const p = this.patients.find((x) => x.id === id)
    if (p) this.selectedPatient = p
  }

  exportHistoryCSV() {
    const headers = [
      "Timestamp",
      "Patient",
      "UHID",
      "Action",
      "Performed By",
      "From Status",
      "To Status",
      "Notes",
    ]
    const rows = this.allHistoryEntries.map((h) => [
      h.timestamp,
      h.patientName,
      h.patientUhid,
      h.action,
      h.performedBy,
      h.fromStatus,
      h.toStatus,
      h.notes ?? "",
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patient_history_export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }
}
