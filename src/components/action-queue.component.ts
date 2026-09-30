import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import type { Patient, PatientStatus } from "../types"
import { getActions } from "../lib/workflow"
import { IconComponent } from "./icon.component"
import { StatusBadgeComponent } from "./ui.component"

const ROLE_STATUSES: Record<string, PatientStatus[]> = {
  "surgery-op-ward": [
    "draft",
    "pending_scheduling",
    "ready_for_hod_approval",
    "postponed",
  ],
  "anaesthesia-op-pac": ["pending_fitness"],
  "department-hod": ["pending_dept_approval", "postponed"],
  "ot-matron": [
    "pending_ot_assignment",
    "scheduled",
    "in_progress",
    "in-progress",
  ],
  "hod-anaesthesia": ["pending_anaes_approval"],
  "hospital-admin": [
    "draft",
    "pending_fitness",
    "pending_scheduling",
    "ready_for_hod_approval",
    "pending_dept_approval",
    "pending_ot_assignment",
    "pending_anaes_approval",
    "postponed",
  ],
}

@Component({
  selector: "app-action-queue",
  standalone: true,
  imports: [CommonModule, IconComponent, StatusBadgeComponent],
  template: `
    @if (queue.length === 0) {
      <div class="bg-white border border-slate-200 rounded-lg flex items-center justify-center py-10">
        <div class="text-center">
          <div class="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-2">
            <app-icon name="check" [size]="18" className="text-green-500"></app-icon>
          </div>
          <p class="text-sm font-medium text-slate-600">{{ emptyLabel || 'No pending actions' }}</p>
          <p class="text-xs text-slate-400 mt-0.5">All cases are up to date</p>
        </div>
      </div>
    } @else {
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs" style="min-width: 720px;">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 160px;">Patient</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 120px;">UHID</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 180px;">Procedure</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 110px;">Department</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 90px;">Surgery Date</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 120px;">Status</th>
                <th class="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 80px;">Priority</th>
                <th class="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider" style="min-width: 80px;">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (p of queue; track p.id) {
                <tr
                  (click)="rowClick.emit(p)"
                  class="hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span class="text-[10px] font-bold text-white">{{ getInitials(p.name) }}</span>
                      </div>
                      <div>
                        <div class="font-semibold text-slate-800 group-hover:text-blue-700">{{ p.name }}</div>
                        <div class="text-slate-400 text-[10px]">{{ p.age }}y {{ p.gender }} · {{ p.bloodGroup }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-mono text-slate-500">{{ p.uhid }}</td>
                  <td class="px-4 py-3">
                    <div class="text-slate-700 leading-tight max-w-[200px] truncate">{{ p.surgeryType }}</div>
                    @if (p.surgeon) {
                      <div class="text-slate-400 text-[10px] mt-0.5 truncate">{{ p.surgeon }}</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ p.department }}</td>
                  <td class="px-4 py-3 text-slate-600">
                    @if (p.scheduledDate) {
                      {{ p.scheduledDate }}
                    } @else {
                      <span class="text-slate-400">TBD</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <app-status-badge [value]="p.status" [dot]="true"></app-status-badge>
                  </td>
                  <td class="px-4 py-3">
                    <app-status-badge [value]="p.priority"></app-status-badge>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      @if (getFirstAction(p); as action) {
                        <span class="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {{ action.label }}
                        </span>
                      }
                      <app-icon name="chevron-right" [size]="13" className="text-slate-400 group-hover:text-blue-500 flex-shrink-0"></app-icon>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class ActionQueueComponent {
  @Input() patients: Patient[] = []
  @Input() roleId: string = ""
  @Input() emptyLabel?: string
  @Output() rowClick = new EventEmitter<Patient>()

  get queue(): Patient[] {
    const statuses = ROLE_STATUSES[this.roleId] ?? []
    return this.patients.filter((p) =>
      statuses.includes(p.status as PatientStatus),
    )
  }

  getInitials(name: string): string {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
  }

  getFirstAction(p: Patient) {
    const actions = getActions(this.roleId, p.status)
    return actions.length > 0 ? actions[0] : null
  }
}
