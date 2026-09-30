import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { IconComponent } from "./icon.component"
import { StatusBadgeComponent, ConfirmDialogComponent } from "./ui.component"
import { StandardTableComponent } from "./standard-table.component"

@Component({
  selector: "app-pre-habilitation-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    StandardTableComponent,
  ],
  template: `
    @if (selectedPatient) {
      <div class="flex flex-col h-full bg-slate-50">
        <!-- Header -->
        <div class="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
          <button
            type="button"
            (click)="selectedPatient = null"
            class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3 transition-colors cursor-pointer"
          >
            <app-icon name="chevron-left" [size]="14"></app-icon> Back to Pre-Habilitation list
          </button>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <app-icon name="clipboard" [size]="22" className="text-white"></app-icon>
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-base font-semibold text-slate-900">Pre-Habilitation Assessment</h1>
                  <app-status-badge [value]="selectedPatient.status" size="md" [dot]="true"></app-status-badge>
                </div>
                <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span class="font-mono text-slate-400">{{ selectedPatient.uhid }}</span>
                  <span>{{ selectedPatient.name }}</span>
                  <span>{{ selectedPatient.age }}y · {{ selectedPatient.gender === 'M' ? 'Male' : 'Female' }}</span>
                  <span>{{ selectedPatient.department }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (saved) {
                <span class="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded px-2 py-1">
                  <app-icon name="check" [size]="12"></app-icon> Saved
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- Patient / Referral -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient / Referral Details</h3>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Patient Name</label>
                  <input [value]="selectedPatient.name" disabled class="w-full h-9 px-3 text-sm border border-slate-200 rounded bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">UHID No.</label>
                  <input [value]="selectedPatient.uhid" disabled class="w-full h-9 px-3 text-sm border border-slate-200 rounded bg-slate-50 text-slate-500 font-mono" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Age / Gender</label>
                  <input [value]="selectedPatient.age + ' years / ' + (selectedPatient.gender === 'M' ? 'Male' : 'Female')" disabled class="w-full h-9 px-3 text-sm border border-slate-200 rounded bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Department / Unit</label>
                  <input [value]="selectedPatient.department" disabled class="w-full h-9 px-3 text-sm border border-slate-200 rounded bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Date of Referral</label>
                  <input type="date" [(ngModel)]="form.referralDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Time</label>
                  <input type="time" [(ngModel)]="form.referralTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div class="col-span-3">
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Proposed Surgery</label>
                  <input [value]="selectedPatient.surgeryType" disabled class="w-full h-9 px-3 text-sm border border-slate-200 rounded bg-slate-50 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          <!-- Surgeon Remarks -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Surgeon Remarks</h3>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-600 block mb-1">Remarks</label>
                <textarea [(ngModel)]="form.surgeonRemarks" rows="3" placeholder="Enter surgeon remarks…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-4 gap-3 pt-1">
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.surgeonName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.surgeonReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.surgeonDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.surgeonTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>
            </div>
          </div>

          <!-- Anaesthetist Assessment -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Anaesthetist Assessment</h3>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-600 block mb-1">Assessment</label>
                <textarea [(ngModel)]="form.anaestAssessment" rows="3" placeholder="Enter anaesthetist assessment…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-4 gap-3 pt-1">
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.anaestName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.anaestReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.anaestDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.anaestTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>
            </div>
          </div>

          <!-- Additional Pre-Habilitation Records -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Additional Pre-Habilitation Records</h3>
            </div>
            <div class="px-5 py-4 space-y-4">
              <!-- Diagnostics -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Diagnostics</p>
                <div class="grid grid-cols-4 gap-3">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Diagnostics Advised — Date</label><input type="date" [(ngModel)]="form.diagAdvisedDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Advised — Time</label><input type="time" [(ngModel)]="form.diagAdvisedTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Diagnostics Completed — Date</label><input type="date" [(ngModel)]="form.diagCompletedDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Completed — Time</label><input type="time" [(ngModel)]="form.diagCompletedTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>

              <!-- Anaesthetist Review -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Anaesthetist Review</p>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Notes / Remarks</label><textarea [(ngModel)]="form.arNotes" rows="2" placeholder="Enter notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.arName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.arReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.arDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.arTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>

              <!-- Physiotherapist Counseling -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Physiotherapist Counseling</p>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Notes / Remarks</label><textarea [(ngModel)]="form.physioNotes" rows="2" placeholder="Enter notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.physioName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.physioReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.physioDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.physioTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>

              <!-- Dietician Advise -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Dietician Advise</p>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Notes / Remarks</label><textarea [(ngModel)]="form.dietNotes" rows="2" placeholder="Enter notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.dietName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.dietReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.dietDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.dietTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>

              <!-- Clinical Psychologist -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Clinical Psychologist / Psychiatric Medical Social Worker</p>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Notes / Remarks</label><textarea [(ngModel)]="form.psychNotes" rows="2" placeholder="Enter notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.psychName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.psychReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.psychDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.psychTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>

              <!-- Scheme / Insurance Counsellor -->
              <div class="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/40">
                <p class="text-xs font-semibold text-slate-700">Scheme / Insurance Counsellor</p>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Notes / Remarks</label><textarea [(ngModel)]="form.schemeNotes" rows="2" placeholder="Enter notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Name</label><input [(ngModel)]="form.schemeName" placeholder="Full name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Reg. No.</label><input [(ngModel)]="form.schemeReg" placeholder="Reg. number…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Date</label><input type="date" [(ngModel)]="form.schemeDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label class="text-xs font-semibold text-slate-600 block mb-1">Time</label><input type="time" [(ngModel)]="form.schemeTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Surgery Status -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Surgery Status</h3>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Surgery Scheduled — Date</label><input type="date" [(ngModel)]="form.surgScheduledDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Surgery Scheduled — Time</label><input type="time" [(ngModel)]="form.surgScheduledTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Surgery Completed — Date</label><input type="date" [(ngModel)]="form.surgCompletedDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Surgery Completed — Time</label><input type="time" [(ngModel)]="form.surgCompletedTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Patient Discharged — Date</label><input type="date" [(ngModel)]="form.patientDischargedDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label class="text-xs font-semibold text-slate-600 block mb-1">Patient Discharged — Time</label><input type="time" [(ngModel)]="form.patientDischargedTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>
            </div>
          </div>

          <div class="flex justify-end pb-2">
            <button
              type="button"
              (click)="confirmOpen = true"
              class="h-9 px-4 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Save Form
            </button>
          </div>
        </div>

        <app-confirm-dialog
          [open]="confirmOpen"
          (close)="confirmOpen = false"
          (confirm)="saveForm()"
          title="Save Pre-Habilitation Form"
          [message]="'Save the pre-habilitation assessment for ' + selectedPatient.name + ' (' + selectedPatient.uhid + ')?'"
          confirmLabel="Save Form"
          variant="primary"
        ></app-confirm-dialog>
      </div>
    } @else {
      <div class="p-5 flex flex-col" style="height: calc(100vh - 40px);">
        <div class="flex items-start justify-between mb-5">
          <div>
            <h1 class="text-lg font-semibold text-slate-900">Pre-Habilitation</h1>
            <p class="text-sm text-slate-500 mt-0.5">{{ scheduledPatients.length }} scheduled patient{{ scheduledPatients.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <app-standard-table
            [patients]="scheduledPatients"
            (rowClick)="openPatient($event)"
            roleId="anaesthesia-op-pac"
            emptyMessage="No patients with scheduled surgery."
          ></app-standard-table>
        </div>
      </div>
    }
  `,
})
export class PreHabilitationPageComponent {
  @Input() patients: Patient[] = []
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  selectedPatient: Patient | null = null
  saved: boolean = false
  confirmOpen: boolean = false

  form = {
    referralDate: "",
    referralTime: "",
    surgeonRemarks: "",
    surgeonDate: "",
    surgeonTime: "",
    surgeonName: "",
    surgeonReg: "",
    anaestAssessment: "",
    anaestDate: "",
    anaestTime: "",
    anaestName: "",
    anaestReg: "",
    diagAdvisedDate: "",
    diagAdvisedTime: "",
    diagCompletedDate: "",
    diagCompletedTime: "",
    arNotes: "",
    arDate: "",
    arTime: "",
    arName: "",
    arReg: "",
    physioNotes: "",
    physioDate: "",
    physioTime: "",
    physioName: "",
    physioReg: "",
    dietNotes: "",
    dietDate: "",
    dietTime: "",
    dietName: "",
    dietReg: "",
    psychNotes: "",
    psychDate: "",
    psychTime: "",
    psychName: "",
    psychReg: "",
    schemeNotes: "",
    schemeDate: "",
    schemeTime: "",
    schemeName: "",
    schemeReg: "",
    surgScheduledDate: "",
    surgScheduledTime: "",
    surgCompletedDate: "",
    surgCompletedTime: "",
    patientDischargedDate: "",
    patientDischargedTime: "",
  }

  get scheduledPatients(): Patient[] {
    return this.patients.filter((p) => p.status === "scheduled")
  }

  openPatient(p: Patient) {
    this.selectedPatient = p
    this.saved = false
    this.form = {
      referralDate: "",
      referralTime: "",
      surgeonRemarks: "",
      surgeonDate: "",
      surgeonTime: "",
      surgeonName: p.surgeon ?? "",
      surgeonReg: "",
      anaestAssessment: "",
      anaestDate: "",
      anaestTime: "",
      anaestName: p.anaesthesiologist ?? "",
      anaestReg: "",
      diagAdvisedDate: "",
      diagAdvisedTime: "",
      diagCompletedDate: "",
      diagCompletedTime: "",
      arNotes: "",
      arDate: "",
      arTime: "",
      arName: "",
      arReg: "",
      physioNotes: "",
      physioDate: "",
      physioTime: "",
      physioName: "",
      physioReg: "",
      dietNotes: "",
      dietDate: "",
      dietTime: "",
      dietName: "",
      dietReg: "",
      psychNotes: "",
      psychDate: "",
      psychTime: "",
      psychName: "",
      psychReg: "",
      schemeNotes: "",
      schemeDate: "",
      schemeTime: "",
      schemeName: "",
      schemeReg: "",
      surgScheduledDate: p.scheduledDate ?? "",
      surgScheduledTime: p.scheduledTime ?? "",
      surgCompletedDate: p.actualEndTime ?? "",
      surgCompletedTime: "",
      patientDischargedDate: "",
      patientDischargedTime: "",
    }
  }

  saveForm() {
    this.saved = true
    this.confirmOpen = false
  }
}
