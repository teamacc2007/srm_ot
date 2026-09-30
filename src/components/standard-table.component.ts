import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, PatientStatus } from "../types"
import { IconComponent } from "./icon.component"
import { StatusBadgeComponent } from "./ui.component"

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  scheduled: 1,
  confirmed: 1,
  pending_fitness: 2,
  pending_scheduling: 2,
  ready_for_hod_approval: 2,
  pending_dept_approval: 2,
  pending_ot_assignment: 2,
  pending_anaes_approval: 2,
  postponed: 3,
  "in-progress": 4,
  in_progress: 4,
  completed: 5,
  cancelled: 6,
  holding: 7,
}

type SortKey = "name" | "scheduledDate" | "status"

@Component({
  selector: "app-standard-table",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 mb-3 flex-shrink-0">
        @if (title) {
          <h2 class="text-sm font-semibold text-slate-800">{{ title }}</h2>
        }
        <div class="relative flex-1 max-w-xs ml-auto">
          <app-icon
            name="search"
            [size]="13"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            [(ngModel)]="search"
            placeholder="Search name, UHID or diagnosis…"
            class="w-full h-8 pl-8 pr-3 text-sm border border-slate-200 rounded bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span class="text-xs text-slate-400 flex-shrink-0">
          {{ sortedPatients.length }} patient{{ sortedPatients.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto border border-slate-200 rounded-lg bg-white">
        <table class="w-full text-sm" style="border-collapse: collapse;">
          <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr>
              @for (col of cols; track col.label) {
                <th
                  [style.width]="col.width || null"
                  [class]="'text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap select-none ' + (col.sortKey ? 'cursor-pointer hover:text-slate-700' : '')"
                  (click)="col.sortKey ? toggleSort(col.sortKey) : null"
                >
                  <span class="inline-flex items-center gap-1">
                    {{ col.label }}
                    @if (col.sortKey) {
                      @if (sort?.key === col.sortKey) {
                        @if (sort?.dir === 'asc') {
                          <app-icon name="arrow-up" [size]="11"></app-icon>
                        } @else {
                          <app-icon name="arrow-down" [size]="11"></app-icon>
                        }
                      } @else {
                        <span class="opacity-25 flex flex-col gap-px">
                          <app-icon name="arrow-up" [size]="9"></app-icon>
                          <app-icon name="arrow-down" [size]="9"></app-icon>
                        </span>
                      }
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (sortedPatients.length === 0) {
              <tr>
                <td [attr.colspan]="cols.length" class="px-4 py-12 text-center text-sm text-slate-400">
                  {{ emptyMessage }}
                </td>
              </tr>
            } @else {
              @for (p of sortedPatients; track p.id) {
                <tr
                  (click)="rowClick.emit(p)"
                  class="cursor-pointer hover:bg-blue-50/50 transition-colors bg-white"
                >
                  <td class="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{{ p.uhid }}</td>
                  <td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{{ p.name }}</td>
                  <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {{ p.age }}y / {{ p.gender === 'M' ? 'M' : 'F' }}
                  </td>
                  <td class="px-4 py-3 text-slate-700 max-w-[180px]">
                    <span class="truncate block">{{ p.diagnosis }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-700 max-w-[180px]">
                    <span class="truncate block">{{ p.surgeryType }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                    {{ formatAnaesthesia(p.anaesthesiaType) }}
                  </td>
                  <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{{ p.ward }}</td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <app-status-badge [value]="p.status" [dot]="true"></app-status-badge>
                  </td>
                  @if (roleId) {
                    <td class="px-3 py-3 whitespace-nowrap" (click)="$event.stopPropagation()">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="rowClick.emit(p)"
                          title="View details"
                          class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          <app-icon name="eye" [size]="13"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="rowClick.emit(p)"
                          title="Edit"
                          class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                          <app-icon name="edit" [size]="13"></app-icon>
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StandardTableComponent {
  @Input() patients: Patient[] = []
  @Input() roleId?: string
  @Input() title?: string
  @Input() filterStatus: PatientStatus | "" = ""
  @Input() emptyMessage: string = "No patients found."
  @Output() rowClick = new EventEmitter<Patient>()

  search: string = ""
  sort: { key: SortKey; dir: "asc" | "desc" } | null = null

  get cols(): Array<{ label: string; sortKey?: SortKey; width?: string }> {
    const list: Array<{ label: string; sortKey?: SortKey; width?: string }> = [
      { label: "UHID", width: "140px" },
      { label: "Name", sortKey: "name" },
      { label: "Age / Gender", width: "90px" },
      { label: "Diagnosis" },
      { label: "Procedure Plan" },
      { label: "Type of Anaesthesia" },
      { label: "Unit" },
      { label: "Status", sortKey: "status", width: "155px" },
    ]
    if (this.roleId) {
      list.push({ label: "Actions", width: "72px" })
    }
    return list
  }

  get filteredPatients(): Patient[] {
    return this.patients.filter((p) => {
      const q = this.search.toLowerCase()
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q)
      const matchStatus = !this.filterStatus || p.status === this.filterStatus
      return matchSearch && matchStatus
    })
  }

  get sortedPatients(): Patient[] {
    const list = [...this.filteredPatients]
    if (this.sort) {
      const { key, dir } = this.sort
      return list.sort((a, b) => {
        const av = String(a[key] ?? "")
        const bv = String(b[key] ?? "")
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return list.sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99),
    )
  }

  toggleSort(key: SortKey) {
    if (this.sort?.key === key) {
      this.sort = { key, dir: this.sort.dir === "asc" ? "desc" : "asc" }
    } else {
      this.sort = { key, dir: "asc" }
    }
  }

  formatAnaesthesia(type: string): string {
    return (type || "").replace(" Anaesthesia", "").replace("General (", "GA (")
  }
}
