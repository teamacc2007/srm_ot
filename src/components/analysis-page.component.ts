import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { DeptFilterSelectComponent } from "./ui.component"
import { PatientDetailComponent } from "./patient-detail.component"

const BAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
]

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-700 bg-green-50",
  scheduled: "text-blue-700 bg-blue-50",
  in_progress: "text-amber-700 bg-amber-50",
  "in-progress": "text-amber-700 bg-amber-50",
  draft: "text-slate-600 bg-slate-100",
  pending_fitness: "text-sky-700 bg-sky-50",
  pending_scheduling: "text-indigo-700 bg-indigo-50",
  cancelled: "text-red-700 bg-red-50",
  postponed: "text-orange-700 bg-orange-50",
  pending_dept_approval: "text-orange-700 bg-orange-50",
  pending_ot_assignment: "text-violet-700 bg-violet-50",
  pending_anaes_approval: "text-purple-700 bg-purple-50",
}

@Component({
  selector: "app-analysis-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DeptFilterSelectComponent,
    PatientDetailComponent,
  ],
  template: `
    @if (detailPatient) {
      <app-patient-detail
        [patient]="liveDetailPatient"
        (back)="detailPatient = null"
        [roleContext]="roleId"
        (patientUpdate)="patientUpdate.emit($event)"
      ></app-patient-detail>
    } @else {
      <div class="overflow-y-auto p-5 space-y-5" style="height: calc(100vh - 40px);">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-sm font-bold text-slate-900">{{ roleLabel }} — Activity Analysis</h1>
            <p class="text-xs text-slate-500 mt-0.5">{{ totalActions }} total actions · {{ completedCount }} cases completed</p>
          </div>
          @if (showDeptFilter) {
            <app-dept-filter-select
              [value]="filterDept"
              (valueChange)="onDeptChange($event)"
              [departments]="allDepartments"
            ></app-dept-filter-select>
          }
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="w-8 h-1 rounded-full mb-3 bg-blue-600"></div>
            <p class="text-2xl font-bold text-slate-900">{{ totalActions }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Total Actions</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="w-8 h-1 rounded-full mb-3 bg-indigo-500"></div>
            <p class="text-2xl font-bold text-slate-900">{{ filteredPatients.length }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Cases Handled</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="w-8 h-1 rounded-full mb-3 bg-green-500"></div>
            <p class="text-2xl font-bold text-slate-900">{{ completedCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Completed</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="w-8 h-1 rounded-full mb-3 bg-violet-500"></div>
            <p class="text-2xl font-bold text-slate-900">{{ barSlices.length }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Unique Actions</p>
          </div>
        </div>

        <!-- Bar chart + status distribution -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Activity Breakdown -->
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity Breakdown</h3>
              @if (selectedAction) {
                <button (click)="selectedAction = null" class="text-[10px] text-blue-600 hover:underline cursor-pointer">
                  Clear filter
                </button>
              }
            </div>
            <p class="text-[10px] text-slate-400 mb-3">Click a bar to filter activity details</p>

            @if (barSlices.length === 0) {
              <p class="text-xs text-slate-400 py-4">No actions recorded yet.</p>
            } @else {
              <div class="space-y-2">
                @for (s of barSlices; track s.label; let i = $index) {
                  <button
                    type="button"
                    (click)="toggleSlice(s.label)"
                    [class]="'w-full flex items-center gap-2 text-left rounded px-1.5 py-1 transition-colors cursor-pointer ' +
                      (selectedAction === s.label ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50') +
                      (selectedAction && selectedAction !== s.label ? ' opacity-40' : '')"
                  >
                    <span class="text-[11px] text-slate-600 w-32 truncate flex-shrink-0">{{ s.label }}</span>
                    <div class="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                      <div class="h-full rounded transition-all" [style.width]="s.pct + '%'" [style.backgroundColor]="s.color"></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-800 w-5 text-right flex-shrink-0">{{ s.value }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Status Distribution -->
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Patient Status Distribution</h3>
            <div class="space-y-2">
              @for (item of statusDistribution; track item.status) {
                <div class="flex items-center gap-2">
                  <span [class]="'text-[10px] font-medium px-2 py-0.5 rounded w-40 text-center flex-shrink-0 ' + getStatusClass(item.status)">
                    {{ item.label }}
                  </span>
                  <div class="flex-1 bg-slate-100 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" [style.width]="item.pct + '%'"></div>
                  </div>
                  <span class="text-xs font-semibold text-slate-700 w-5 text-right">{{ item.count }}</span>
                </div>
              }
              @if (statusDistribution.length === 0) {
                <p class="text-xs text-slate-400">No patients found.</p>
              }
            </div>
          </div>
        </div>

        <!-- Activity detail when a bar is selected -->
        @if (selectedAction) {
          <div class="bg-white border border-blue-100 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Activity Detail — <span class="text-blue-600">{{ selectedAction }}</span>
              </h3>
              <span class="text-xs text-slate-400">
                {{ filteredActivityRows.length }} occurrence{{ filteredActivityRows.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 mb-3">
              <select
                [(ngModel)]="detailFilterField"
                (change)="detailFilterValue = ''"
                class="h-7 pl-2 pr-6 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Filter by…</option>
                <option value="timestamp">Timestamp</option>
                <option value="gender">Gender</option>
                <option value="age">Age</option>
              </select>
              @if (detailFilterField) {
                <input
                  [(ngModel)]="detailFilterValue"
                  [placeholder]="detailFilterField === 'gender' ? 'male / female' : 'Search ' + detailFilterField + '…'"
                  class="h-7 pl-2 pr-2 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
                />
              }
              @if (detailFilterField || detailFilterValue) {
                <button
                  type="button"
                  (click)="detailFilterField = ''; detailFilterValue = ''"
                  class="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              }
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs" style="border-collapse: collapse;">
                <thead>
                  <tr class="border-b border-slate-100">
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">UHID</th>
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Patient</th>
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Department</th>
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Performed By</th>
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Timestamp</th>
                    <th class="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Status →</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (e of filteredActivityRows; track e.timestamp + e.patient.id; let i = $index) {
                    <tr
                      (click)="detailPatient = e.patient"
                      class="hover:bg-blue-50 cursor-pointer"
                    >
                      <td class="px-3 py-2 font-mono text-slate-400">{{ e.patient.uhid }}</td>
                      <td class="px-3 py-2 font-medium text-blue-700 hover:underline">{{ e.patient.name }}</td>
                      <td class="px-3 py-2 text-slate-600">{{ e.patient.department }}</td>
                      <td class="px-3 py-2 text-slate-600">{{ e.performedBy }}</td>
                      <td class="px-3 py-2 text-slate-500">{{ e.timestamp }}</td>
                      <td class="px-3 py-2">
                        <span [class]="'text-[10px] px-1.5 py-0.5 rounded font-medium ' + getStatusClass(e.toStatus)">
                          {{ formatStatus(e.toStatus) }}
                        </span>
                      </td>
                    </tr>
                  }
                  @if (filteredActivityRows.length === 0) {
                    <tr>
                      <td colspan="6" class="px-3 py-6 text-center text-slate-400 text-xs">No matching records.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AnalysisPageComponent {
  @Input() patients: Patient[] = []
  @Input() roleId: string = ""
  @Input() roleLabel: string = ""
  @Input() performerKeys: string[] = []
  @Input() showDeptFilter: boolean = false
  @Input() allDepartments: string[] = []
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  filterDept: string = ""
  selectedAction: string | null = null
  detailPatient: Patient | null = null
  detailFilterField: "timestamp" | "gender" | "age" | "" = ""
  detailFilterValue: string = ""

  get liveDetailPatient(): Patient {
    if (!this.detailPatient) return {} as Patient
    return (
      this.patients.find((p) => p.id === this.detailPatient!.id) ??
      this.detailPatient
    )
  }

  get filteredPatients(): Patient[] {
    return this.filterDept
      ? this.patients.filter((p) =>
          p.department.toLowerCase().includes(this.filterDept.toLowerCase()),
        )
      : this.patients
  }

  get allEntries(): Array<WorkflowHistoryEntry & { patient: Patient }> {
    return this.filteredPatients.flatMap((p) =>
      (this.showDeptFilter
        ? p.history
        : p.history.filter((h) =>
            this.performerKeys.some((k) =>
              (h.performedBy || "").toLowerCase().includes(k.toLowerCase()),
            ),
          )
      ).map((h) => ({ ...h, patient: p })),
    )
  }

  get totalActions(): number {
    return this.allEntries.length
  }

  get completedCount(): number {
    return this.filteredPatients.filter((p) => p.status === "completed").length
  }

  get barSlices() {
    const actionCounts: Record<string, number> = {}
    this.allEntries.forEach((e) => {
      actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1
    })
    const actionEntries = Object.entries(actionCounts).sort(
      (a, b) => b[1] - a[1],
    )
    const max = Math.max(...actionEntries.map((e) => e[1]), 1)

    return actionEntries.map(([label, value], i) => ({
      label,
      value,
      pct: Math.round((value / max) * 100),
      color: BAR_COLORS[i % BAR_COLORS.length],
    }))
  }

  get statusDistribution() {
    const statusCounts: Record<string, number> = {}
    this.filteredPatients.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
    })
    const max = Math.max(...Object.values(statusCounts), 1)

    return Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        label: status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
        pct: (count / max) * 100,
      }))
  }

  get filteredActivityRows() {
    if (!this.selectedAction) return []
    const base = this.allEntries.filter((e) => e.action === this.selectedAction)
    if (!this.detailFilterField || !this.detailFilterValue) return base
    const v = this.detailFilterValue.toLowerCase()

    return base.filter((e) => {
      if (this.detailFilterField === "timestamp")
        return e.timestamp.toLowerCase().includes(v)
      if (this.detailFilterField === "gender") {
        const gLabel = e.patient.gender === "M" ? "male" : "female"
        return gLabel.includes(v) || e.patient.gender.toLowerCase().includes(v)
      }
      if (this.detailFilterField === "age")
        return String(e.patient.age).includes(v)
      return true
    })
  }

  onDeptChange(d: string) {
    this.filterDept = d
    this.selectedAction = null
  }

  toggleSlice(label: string) {
    this.selectedAction = this.selectedAction === label ? null : label
  }

  getStatusClass(status: string): string {
    return STATUS_COLORS[status] ?? "text-slate-600 bg-slate-100"
  }

  formatStatus(status: string): string {
    return (status || "").replace(/_/g, " ")
  }
}
