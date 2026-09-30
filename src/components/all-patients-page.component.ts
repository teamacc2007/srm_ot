import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { matchesStatusFilter } from "../lib/workflow"
import { IconComponent } from "./icon.component"
import {
  DeptFilterSelectComponent,
  StatusFilterDropdownComponent,
} from "./ui.component"
import { StandardTableComponent } from "./standard-table.component"

const DEPARTMENTS = [
  "General Surgery",
  "Orthopaedics",
  "Cardiothoracic Surgery",
  "Neurosurgery",
  "Urology",
  "ENT",
  "Gynaecology",
  "Vascular Surgery",
  "Oncology",
  "Surgical Oncology",
]

@Component({
  selector: "app-all-patients-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    DeptFilterSelectComponent,
    StatusFilterDropdownComponent,
    StandardTableComponent,
  ],
  template: `
    <div class="flex flex-col" style="height: calc(100vh - 40px);">
      <div class="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h1 class="text-base font-semibold text-slate-900">All Patients</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Complete surgery record database · {{ filteredPatients.length }} of {{ patients.length }} records
            </p>
          </div>
          <div class="flex items-center gap-2">
            @if (hasActiveFilters) {
              <button
                type="button"
                (click)="clearAll()"
                class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-2.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <app-icon name="x" [size]="11"></app-icon> Clear filters
              </button>
            }
            <button
              type="button"
              (click)="exportCSV()"
              class="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1.5 transition-colors cursor-pointer"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>

        <!-- Filter row 1: search + dept + status -->
        <div class="flex items-center gap-3 mb-2.5 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <app-icon name="search" [size]="12" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              [(ngModel)]="search"
              placeholder="Patient name, UHID, procedure…"
              class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <app-dept-filter-select
            [value]="filterDept"
            (valueChange)="filterDept = $event"
            [departments]="departments"
          ></app-dept-filter-select>
          <app-status-filter-dropdown
            [value]="filterStatus"
            (valueChange)="filterStatus = $event"
          ></app-status-filter-dropdown>
        </div>

        <!-- Filter row 2: date range -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">From:</label>
            <input
              type="date"
              [(ngModel)]="fromDate"
              class="h-8 px-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">To:</label>
            <input
              type="date"
              [(ngModel)]="toDate"
              class="h-8 px-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            (click)="applied = true"
            class="h-8 px-3 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Apply Date Filter
          </button>
          @if (applied && (fromDate || toDate)) {
            <button
              type="button"
              (click)="fromDate = ''; toDate = ''; applied = false"
              class="h-8 px-2.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Clear Dates
            </button>
          }
          <div class="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <app-icon name="filter" [size]="11"></app-icon>
            <span>{{ filteredPatients.length }} records</span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-hidden p-4">
        <app-standard-table
          [patients]="filteredPatients"
          [roleId]="roleId"
          (rowClick)="rowClick.emit($event)"
          emptyMessage="No patients match the current filters."
        ></app-standard-table>
      </div>
    </div>
  `,
})
export class AllPatientsPageComponent {
  @Input() patients: Patient[] = []
  @Input() roleId: string = ""
  @Output() rowClick = new EventEmitter<Patient>()
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  search: string = ""
  fromDate: string = ""
  toDate: string = ""
  filterDept: string = ""
  filterStatus: string = ""
  applied: boolean = false

  departments = DEPARTMENTS

  get hasActiveFilters(): boolean {
    return !!(
      this.search ||
      this.filterDept ||
      this.filterStatus ||
      (this.applied && (this.fromDate || this.toDate))
    )
  }

  get filteredPatients(): Patient[] {
    return this.patients.filter((p) => {
      const q = this.search.toLowerCase()
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.uhid.toLowerCase().includes(q) &&
        !p.surgeryType.toLowerCase().includes(q)
      ) {
        return false
      }
      if (
        this.filterDept &&
        !p.department.toLowerCase().includes(this.filterDept.toLowerCase())
      ) {
        return false
      }
      if (this.filterStatus && !matchesStatusFilter(p, this.filterStatus)) {
        return false
      }
      if (this.applied) {
        if (this.fromDate && p.scheduledDate && p.scheduledDate < this.fromDate)
          return false
        if (this.toDate && p.scheduledDate && p.scheduledDate > this.toDate)
          return false
      }
      return true
    })
  }

  clearAll() {
    this.search = ""
    this.fromDate = ""
    this.toDate = ""
    this.filterDept = ""
    this.filterStatus = ""
    this.applied = false
  }

  exportCSV() {
    const headers = [
      "UHID",
      "Name",
      "Age",
      "Gender",
      "Department",
      "Diagnosis",
      "Procedure",
      "Status",
      "Scheduled Date",
      "OT Room",
      "Surgeon",
      "Anaesthesiologist",
    ]
    const rows = this.filteredPatients.map((p) => [
      p.uhid,
      p.name,
      p.age,
      p.gender,
      p.department,
      p.diagnosis,
      p.surgeryType,
      p.status,
      p.scheduledDate,
      p.otRoom,
      p.surgeon,
      p.anaesthesiologist,
    ])
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patients_export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }
}
