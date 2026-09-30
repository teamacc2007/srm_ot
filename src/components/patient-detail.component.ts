import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Patient, WorkflowHistoryEntry, PatientRequest } from "../types"
import { getActions, now } from "../lib/workflow"
import { ApiService } from "../services/api.service"
import { IconComponent } from "./icon.component"
import {
  StatusBadgeComponent,
  ModalComponent,
  ConfirmDialogComponent,
} from "./ui.component"

type ModalType = "mark_fit" | "mark_unfit" | "schedule" | "hod_approve" | "hod_anaes_approve" | "assign_ot" | "complete_surgery" | "postpone" | "cancel" | "resume" | "assign_anaes" | "start_surgery" | "reschedule_anaes" | null

@Component({
  selector: "app-patient-detail",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="flex flex-col h-full bg-slate-50">
      <!-- Header -->
      <div class="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <button
          type="button"
          (click)="back.emit()"
          class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3 transition-colors cursor-pointer"
        >
          <app-icon name="chevron-left" [size]="14"></app-icon> Back to list
        </button>

        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-bold text-white">{{ getInitials(patient.name) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-base font-semibold text-slate-900">{{ patient.name }}</h1>
              <app-status-badge [value]="patient.status" size="md" [dot]="true"></app-status-badge>
            </div>
            <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
              <span class="font-mono text-slate-400">{{ patient.uhid }}</span>
              <span>{{ patient.age }}y {{ patient.gender === 'M' ? 'Male' : 'Female' }} · {{ patient.bloodGroup }}</span>
              <span class="flex items-center gap-1">
                <app-icon name="bed" [size]="11"></app-icon> {{ patient.ward }} · Bed {{ patient.bedNumber }}
              </span>
              <span class="flex items-center gap-1">
                <app-icon name="clock" [size]="11"></app-icon> Admitted {{ patient.admissionDate }}
              </span>
            </div>
          </div>
          <button
            type="button"
            (click)="editSaved = false; showEditModal = true"
            class="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <app-icon name="edit" [size]="13"></app-icon> Edit
          </button>
        </div>

        @if (actionDone) {
          <div class="flex items-center gap-2 mt-3 py-2 px-3 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
            <app-icon name="check" [size]="13"></app-icon> Status updated successfully.
          </div>
        }
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <!-- 3-column info grid -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Patient Info -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <app-icon name="user" [size]="13" className="text-slate-400"></app-icon>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Information</h3>
            </div>
            <div class="px-4 py-3 space-y-1.5">
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Full Name</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.name }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">UHID</span>
                <span class="text-xs font-mono font-medium text-slate-800 flex-1 leading-5">{{ patient.uhid }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Age / Gender</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.age }} years / {{ patient.gender === 'M' ? 'Male' : 'Female' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Blood Group</span>
                <span class="text-xs font-mono font-semibold text-slate-800 flex-1 leading-5">{{ patient.bloodGroup }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Phone</span>
                <span class="text-xs font-mono font-medium text-slate-800 flex-1 leading-5">{{ patient.phone }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Department</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.department }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Ward / Bed</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.ward }} · Bed {{ patient.bedNumber }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Admission Date</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.admissionDate }}</span>
              </div>
            </div>
          </div>

          <!-- Surgery Info -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <app-icon name="activity" [size]="13" className="text-slate-400"></app-icon>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surgery Information</h3>
            </div>
            <div class="px-4 py-3 space-y-1.5">
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Diagnosis</span>
                <span class="text-xs font-medium text-slate-900 flex-1 leading-5">{{ patient.diagnosis }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Procedure</span>
                <span class="text-xs font-semibold text-slate-900 flex-1 leading-5">{{ patient.surgeryType }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Surgery Type</span>
                <span class="capitalize font-medium text-slate-700 flex-1 leading-5">{{ patient.surgeryCategory }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Case Type</span>
                <span class="flex-1 leading-5">
                  <span [class]="'capitalize font-medium px-2 py-0.5 rounded text-xs ' + (patient.priority === 'daycare' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700')">
                    {{ patient.priority }}
                  </span>
                </span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Surgeon</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.surgeon }}</span>
              </div>
              @if (patient.unitChief) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Unit Chief</span>
                  <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.unitChief }}</span>
                </div>
              }
              @if (patient.assistantSurgeon) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Asst. Surgeon</span>
                  <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.assistantSurgeon }}</span>
                </div>
              }
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">OT Room</span>
                <span class="text-xs font-mono font-semibold text-slate-800 flex-1 leading-5">{{ patient.otRoom || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Surgery Date</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.scheduledDate || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Surgery Time</span>
                <span class="text-xs font-mono font-medium text-slate-800 flex-1 leading-5">{{ patient.scheduledTime || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Est. Duration</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.estimatedDuration ? patient.estimatedDuration + ' min' : '—' }}</span>
              </div>
              @if (patient.scrubNurse) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Scrub Nurse</span>
                  <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.scrubNurse }}</span>
                </div>
              }
              @if (patient.floorNurse) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Floor Nurse</span>
                  <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.floorNurse }}</span>
                </div>
              }
              @if (patient.otatTechnician) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">OTAT Tech</span>
                  <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.otatTechnician }}</span>
                </div>
              }
              @if (patient.equipmentRequirements && patient.equipmentRequirements.length > 0) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Equipments</span>
                  <div class="flex-1 flex flex-wrap gap-1 leading-5">
                    @for (eq of patient.equipmentRequirements; track eq) {
                      <span class="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium">
                        {{ eq }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Clinical Info -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <app-icon name="shield" [size]="13" className="text-slate-400"></app-icon>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Information</h3>
            </div>
            <div class="px-4 py-3 space-y-1.5">
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Anaesthesiologist</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.anaesthesiologist || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Anaesthesia Type</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.anaesthesiaType || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">ASA Grade</span>
                <span class="flex-1 leading-5">
                  <app-status-badge [value]="patient.anaesthesiaRisk"></app-status-badge>
                </span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">PAC Status</span>
                <span class="flex-1 leading-5">
                  <app-status-badge [value]="patient.pacStatus" [dot]="true"></app-status-badge>
                </span>
              </div>
              @if (patient.patientFitness) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Fitness</span>
                  <span [class]="'capitalize font-semibold text-xs px-2 py-0.5 rounded ' + (patient.patientFitness === 'fit' ? 'bg-green-100 text-green-700' : patient.patientFitness === 'unfit' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')">
                    {{ patient.patientFitness }}
                  </span>
                </div>
              }
              @if (patient.fitnessReason) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Fitness Reason</span>
                  <span class="text-xs text-red-600 flex-1 leading-5">{{ patient.fitnessReason }}</span>
                </div>
              }
              @if (patient.reviewDate) {
                <div class="flex items-start gap-2 py-0.5">
                  <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Review Date</span>
                  <span class="text-xs font-mono font-medium text-amber-700 flex-1 leading-5">{{ patient.reviewDate }}</span>
                </div>
              }
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Allergies</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">
                  {{ patient.allergies && patient.allergies.length ? patient.allergies.join(', ') : 'NKDA' }}
                </span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Comorbidities</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">
                  {{ patient.comorbidities && patient.comorbidities.length ? patient.comorbidities.join(', ') : 'Nil' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Completion record (only when completed) -->
        @if (patient.status === 'completed') {
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <app-icon name="check" [size]="13" className="text-slate-400"></app-icon>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Record</h3>
            </div>
            <div class="px-4 py-3 space-y-1.5">
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Actual Start</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.actualStartTime || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">Actual End</span>
                <span class="text-xs font-medium text-slate-800 flex-1 leading-5">{{ patient.actualEndTime || '—' }}</span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">PMR Status</span>
                <span [class]="'text-xs font-medium capitalize flex-1 leading-5 ' + (patient.pmrStatus === 'completed' ? 'text-green-700' : 'text-amber-600')">
                  {{ patient.pmrStatus || '—' }}
                </span>
              </div>
              <div class="flex items-start gap-2 py-0.5">
                <span class="text-xs text-slate-400 w-28 flex-shrink-0 leading-5">HPE Status</span>
                <span [class]="'text-xs font-medium capitalize flex-1 leading-5 ' + (patient.hpeStatus === 'sent' ? 'text-green-700' : 'text-slate-500')">
                  {{ patient.hpeStatus || '—' }}
                </span>
              </div>
              @if (patient.intraOpNotes) {
                <div class="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Intra-op Notes</p>
                  <p class="text-xs text-slate-700">{{ patient.intraOpNotes }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Vitals + Actions Required -->
        <div class="flex gap-4">
          <!-- Vitals -->
          <div class="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <app-icon name="activity" [size]="13" className="text-slate-400"></app-icon>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitals</h3>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 flex-wrap">
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">BP</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ patient.vitals?.bp || '—' }}</div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">HR</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ patient.vitals?.hr ? patient.vitals.hr + ' bpm' : '—' }}</div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">SpO₂</div>
                <div [class]="'text-sm font-mono font-semibold ' + ((patient.vitals?.spo2 || 100) < 95 ? 'text-red-600' : 'text-slate-800')">
                  {{ patient.vitals?.spo2 ? patient.vitals.spo2 + '%' : '—' }}
                </div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Temp</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ patient.vitals?.temp ? patient.vitals.temp + '°C' : '—' }}</div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Wt</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ patient.vitals?.weight ? patient.vitals.weight + ' kg' : '—' }}</div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Ht</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ patient.vitals?.height ? patient.vitals.height + ' cm' : '—' }}</div>
              </div>
              <div class="w-px h-7 bg-slate-100 flex-shrink-0"></div>
              <div class="text-center flex-shrink-0">
                <div class="text-[10px] text-slate-400 uppercase tracking-wider">BMI</div>
                <div class="text-sm font-mono font-semibold text-slate-800">{{ bmi }}</div>
              </div>
            </div>
          </div>

          <!-- Actions Required -->
          <div class="flex-shrink-0 w-52 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions Required</h3>
            </div>
            <div class="px-4 py-3 space-y-2">
              @if (roleContext !== 'hospital-admin') {
                @if (roleActions.length > 0) {
                  @for (action of roleActions; track action.id) {
                    <button
                      type="button"
                      (click)="onActionClicked(action)"
                      [class]="'w-full text-left px-3 py-2.5 rounded text-xs font-semibold transition-colors border cursor-pointer ' + getActionBtnClass(action.variant)"
                    >
                      {{ action.label }}
                    </button>
                  }
                } @else {
                  <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
                    No actions for your role.
                  </div>
                }
              }

              @if (roleActions.length > 0 && roleContext !== 'hospital-admin') {
                <button
                  type="button"
                  (click)="requestForm = { to: '', comment: '' }; requestModalOpen = true"
                  class="w-full text-left px-3 py-2.5 rounded text-xs font-semibold transition-colors border bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 cursor-pointer"
                >
                  Request
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Incoming Requests for this portal -->
        @if (incomingRequests.length > 0) {
          <div class="mt-4 bg-white border border-violet-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-violet-100 bg-violet-50 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-violet-600 flex-shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3 class="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Requests ({{ incomingRequests.length }})
              </h3>
            </div>
            <div class="divide-y divide-slate-100">
              @for (req of incomingRequests; track req.id) {
                <div class="px-4 py-3">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-bold text-violet-600 uppercase tracking-wider">From: {{ req.fromPortal }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-slate-400">{{ req.timestamp }}</span>
                      <span [class]="'text-[10px] px-1.5 py-0.5 rounded font-semibold ' + (req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')">
                        {{ req.status }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-slate-700 mb-2">{{ req.comment || 'No message' }}</p>

                  @if (req.reply) {
                    <div class="bg-slate-50 border border-slate-200 rounded px-3 py-2">
                      <p class="text-[10px] font-semibold text-slate-500 mb-0.5">Your reply · {{ req.replyTimestamp }}</p>
                      <p class="text-xs text-slate-700">{{ req.reply }}</p>
                    </div>
                  } @else {
                    @if (req.status === 'pending') {
                      <div class="flex gap-2 mt-2">
                        <textarea
                          [(ngModel)]="replyTexts[req.id]"
                          placeholder="Write a reply…"
                          rows="2"
                          class="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                        ></textarea>
                        <button
                          type="button"
                          [disabled]="!canReply(req.id)"
                          (click)="submitReply(req.id)"
                          class="self-end h-7 px-3 text-xs font-semibold bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Workflow History -->
        <div class="bg-[#f7f8fc] border border-slate-200 rounded-2xl overflow-hidden">
          <!-- Header -->
          <div class="px-6 pt-5 pb-4 flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="8" y="2" width="8" height="5" rx="1" />
                  <rect x="1" y="16" width="6" height="5" rx="1" />
                  <rect x="9" y="16" width="6" height="5" rx="1" />
                  <rect x="17" y="16" width="6" height="5" rx="1" />
                  <path d="M12 7v3M4 16v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900 leading-tight">Workflow History</h3>
                <p class="text-sm text-slate-400 mt-0.5">Track the complete journey of this patient's surgery from request to completion.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold rounded-xl px-4 py-2 flex-shrink-0">
              {{ currentStageIdx + 1 }} {{ currentStageIdx + 1 === 1 ? 'Step' : 'Steps' }}
            </div>
          </div>

          <!-- Stage Progress Bar -->
          <div class="px-6 pb-5 overflow-x-auto">
            <div class="flex items-center min-w-max gap-0">
              @for (stage of stages; track stage.key; let i = $index) {
                <div class="flex flex-col items-center" style="width: 110px;">
                  <div [class]="getStageCircleClass(i)">
                    @if (i <= currentStageIdx) {
                      @if (i === currentStageIdx) {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="4" fill="white" stroke="none"/>
                        </svg>
                      } @else {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                    } @else {
                      <span class="text-[11px] font-bold text-slate-400">{{ i + 1 }}</span>
                    }
                  </div>
                  <p [class]="'text-[10px] font-semibold mt-2 text-center leading-tight ' + (i <= currentStageIdx ? (i === currentStageIdx ? 'text-blue-700' : 'text-blue-600') : 'text-slate-400')">
                    {{ stage.label }}
                  </p>
                  @if (getStageEntry(stage); as entry) {
                    @if (i <= currentStageIdx) {
                      <p class="text-[9px] text-slate-400 mt-1 text-center leading-tight px-1">{{ entry.timestamp.split(',')[0] }}</p>
                    }
                  } @else {
                    @if (i > currentStageIdx) {
                      <p class="text-[9px] text-slate-300 mt-1 text-center">Pending</p>
                    }
                  }
                </div>
                @if (i < stages.length - 1) {
                  <div
                    [class]="'h-0.5 flex-shrink-0 mt-[-22px] rounded-full transition-all ' + (i < currentStageIdx ? 'bg-blue-400' : 'bg-slate-200')"
                    style="width: 28px;"
                  ></div>
                }
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="flex gap-1">
                @for (stage of stages; track stage.key; let i = $index) {
                  <div [class]="'h-1.5 rounded-full w-6 ' + (i <= currentStageIdx ? 'bg-blue-500' : 'bg-slate-200')"></div>
                }
              </div>
              <span class="text-[10px] text-slate-400">{{ currentStageIdx + 1 }}/{{ stages.length }} stages</span>
            </div>
            @if (lastHistoryEntry) {
              <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Last updated: {{ lastHistoryEntry.timestamp }}
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Action Confirmation Dialog -->
      <app-confirm-dialog
        [open]="!!pendingAction"
        (close)="pendingAction = null"
        (confirm)="confirmPendingAction()"
        title="Confirm Action"
        [message]="pendingAction ? 'You are about to perform: \\'' + pendingAction.label + '\\' for patient ' + patient.name + ' (' + patient.uhid + '). This will update the patient\\'s status. Do you want to proceed?' : ''"
        [confirmLabel]="pendingAction?.label || 'Confirm'"
        [variant]="isDangerAction(pendingAction?.label) ? 'danger' : 'primary'"
      ></app-confirm-dialog>

      <!-- Submit Confirmation Dialog -->
      <app-confirm-dialog
        [open]="!!pendingSubmit"
        (close)="pendingSubmit = null"
        (confirm)="confirmPendingSubmit()"
        title="Confirm Submission"
        [message]="pendingSubmit ? 'Confirm: \\'' + pendingSubmit.label + '\\' for patient ' + patient.name + ' (' + patient.uhid + '). This action cannot be undone.' : ''"
        [confirmLabel]="pendingSubmit?.label || 'Confirm'"
        [variant]="pendingSubmit?.variant || 'primary'"
      ></app-confirm-dialog>

      <!-- MODALS -->

      <!-- Mark Fit Modal -->
      <app-modal [open]="openModal === 'mark_fit'" (close)="openModal = null" title="PAC Assessment — Fit" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Anaesthesia Type <span class="text-red-500">*</span></label>
            <select [(ngModel)]="fitForm.anaesthesiaType" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              @for (t of ['General Anaesthesia','Spinal Anaesthesia','Epidural Anaesthesia','Spinal + Epidural','Regional Block','Local Anaesthesia','Sedation / MAC','TIVA','General Anaesthesia + Interscalene Block']; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">ASA Classification <span class="text-red-500">*</span></label>
            <select [(ngModel)]="fitForm.asaClass" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              @for (a of ['ASA-I','ASA-II','ASA-III','ASA-IV','ASA-V']; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Clinical Remarks</label>
            <textarea [(ngModel)]="fitForm.notes" rows="3" placeholder="Anaesthesia plan notes…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" (click)="submitFit()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">Confirm Fit & Return to Ward</button>
        </div>
      </app-modal>

      <!-- Mark Unfit Modal -->
      <app-modal [open]="openModal === 'mark_unfit'" (close)="openModal = null" title="PAC Assessment — Unfit" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Reason for Deferral <span class="text-red-500">*</span></label>
            <select (change)="onAddUnfitReason($event)" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2">
              <option value="">Add reason category…</option>
              <option value="Uncontrolled hypertension">Uncontrolled hypertension</option>
              <option value="Uncontrolled diabetes">Uncontrolled diabetes</option>
              <option value="Active cardiac disease">Active cardiac disease</option>
              <option value="Respiratory compromise">Respiratory compromise</option>
              <option value="Renal impairment">Renal impairment</option>
              <option value="Coagulopathy">Coagulopathy</option>
              <option value="Electrolyte imbalance">Electrolyte imbalance</option>
              <option value="Active infection">Active infection</option>
            </select>
            <textarea [(ngModel)]="unfitForm.reason" rows="3" placeholder="Describe clinical reason(s)…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">New Review Date <span class="text-red-500">*</span></label>
            <input type="date" [(ngModel)]="unfitForm.reviewDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!unfitForm.reason.trim() || !unfitForm.reviewDate" (click)="submitUnfit()" class="h-8 px-3 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">Mark Unfit & Schedule Review</button>
        </div>
      </app-modal>

      <!-- Schedule Surgery Modal (Surgery OP Ward) -->
      <app-modal [open]="openModal === 'schedule'" (close)="openModal = null" title="Schedule Surgery & Assign Team" [subtitle]="patient.name + ' · ' + patient.uhid" width="lg">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Surgery Date <span class="text-red-500">*</span></label>
            <input type="date" [(ngModel)]="scheduleForm.date" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Preferred Time</label>
            <input type="time" [(ngModel)]="scheduleForm.time" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Est. Duration (min) <span class="text-red-500">*</span></label>
            <input type="number" [(ngModel)]="scheduleForm.duration" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Unit Chief</label>
            <input [(ngModel)]="scheduleForm.unitChief" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Primary Surgeon <span class="text-red-500">*</span></label>
            <input [(ngModel)]="scheduleForm.primarySurgeon" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Assistant Surgeon</label>
            <input [(ngModel)]="scheduleForm.assistantSurgeon" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 block mb-1">PG Surgery Doctor</label>
            <input [(ngModel)]="scheduleForm.pgSurgery" placeholder="Dr. name (PG trainee)…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 block mb-1">Equipments & Special Requirements</label>
            <div class="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded max-h-36 overflow-y-auto">
              @for (eq of availableEquipment; track eq) {
                <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-600">
                  <input type="checkbox" [checked]="isEquipmentSelected(eq)" (change)="toggleEquipment(eq)" class="rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                  <span>{{ eq }}</span>
                </label>
              }
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <input [(ngModel)]="customEquipmentInput" placeholder="Add custom equipment / instrument…" (keydown.enter)="addCustomEquipment()" class="flex-1 h-8 px-2.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <button type="button" (click)="addCustomEquipment()" class="h-8 px-2.5 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+ Add</button>
            </div>
          </div>
          <div class="col-span-2">
            <div class="bg-blue-50 border border-blue-100 rounded px-3 py-2 text-xs text-blue-700">Submitting will forward this case to the respective Department HOD for surgical approval.</div>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!scheduleForm.date || !scheduleForm.primarySurgeon" (click)="submitSchedule()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Submit Schedule to Dept HOD</button>
        </div>
      </app-modal>

      <!-- HOD Department Approve Modal -->
      <app-modal [open]="openModal === 'hod_approve'" (close)="openModal = null" title="Approve Surgery — Department HOD" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex"><span class="text-slate-400 w-28">Patient</span><span class="font-medium text-slate-800">{{ patient.name }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Procedure</span><span class="font-medium text-slate-800">{{ patient.surgeryType }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Surgery Date</span><span class="font-medium text-slate-800">{{ patient.scheduledDate || 'TBD' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Est. Duration</span><span class="font-medium text-slate-800">{{ patient.estimatedDuration ? patient.estimatedDuration + ' min' : '—' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Primary Surgeon</span><span class="font-medium text-slate-800">{{ patient.primarySurgeon || patient.surgeon }}</span></div>
            @if (patient.assistantSurgeon) {
              <div class="flex"><span class="text-slate-400 w-28">Asst. Surgeon</span><span class="font-medium text-slate-800">{{ patient.assistantSurgeon }}</span></div>
            }
            @if (patient.pgSurgery) {
              <div class="flex"><span class="text-slate-400 w-28">PG Doctor</span><span class="font-medium text-slate-800">{{ patient.pgSurgery }}</span></div>
            }
            @if (patient.equipmentRequirements && patient.equipmentRequirements.length > 0) {
              <div class="flex"><span class="text-slate-400 w-28">Equipments</span><span class="font-medium text-slate-800">{{ patient.equipmentRequirements.join(', ') }}</span></div>
            }
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Approval Remarks</label>
            <textarea [(ngModel)]="hodApproveForm.remarks" rows="3" placeholder="Optional remarks for the record…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="hodApproveForm.confirmed" class="mt-0.5 w-4 h-4 rounded border-slate-300 accent-blue-600 flex-shrink-0" />
            <span class="text-xs text-slate-700 leading-snug">I have reviewed the clinical details, surgical team, requested equipments, and proposed date. I approve this surgery for our department to proceed to OT Matron.</span>
          </label>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!hodApproveForm.confirmed" (click)="submitHodApprove()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Approve Surgery & Forward to OT Matron</button>
        </div>
      </app-modal>

      <!-- HOD Anaesthesia Approve Modal -->
      <app-modal [open]="openModal === 'hod_anaes_approve'" (close)="openModal = null" title="Approve Surgery — HOD Anaesthesia" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex"><span class="text-slate-400 w-28">Patient</span><span class="font-medium text-slate-800">{{ patient.name }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Procedure</span><span class="font-medium text-slate-800">{{ patient.surgeryType }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Surgery Date</span><span class="font-medium text-slate-800">{{ patient.scheduledDate || 'TBD' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">OT Room</span><span class="font-medium text-slate-800">{{ patient.otRoom || 'TBD' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Start Time</span><span class="font-medium text-slate-800">{{ patient.scheduledTime || 'TBD' }}</span></div>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Primary Anaesthesiologist <span class="text-red-500">*</span></label>
            <select [(ngModel)]="hodAnaesApproveForm.anaesthesiologist" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select anaesthesiologist…</option>
              @for (a of ['Dr. Ananya Krishnan','Dr. Prabhu Anandan','Dr. Ravi Sundaram','Dr. Dinesh Patel','Dr. Lakshmi Subramanian']; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Assistant Anaesthesiologist</label>
            <input [(ngModel)]="hodAnaesApproveForm.assistantAnaes" placeholder="Dr. name (optional)…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">PG Anaesthesia</label>
            <input [(ngModel)]="hodAnaesApproveForm.pgAnaes" placeholder="Dr. name (optional)…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Approval Remarks</label>
            <textarea [(ngModel)]="hodAnaesApproveForm.remarks" rows="2" placeholder="Optional remarks…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="hodAnaesApproveForm.confirmed" class="mt-0.5 w-4 h-4 rounded border-slate-300 accent-blue-600 flex-shrink-0" />
            <span class="text-xs text-slate-700 leading-snug">I have reviewed the anaesthesia plan and confirm this case is safe to proceed as scheduled.</span>
          </label>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!hodAnaesApproveForm.confirmed || !hodAnaesApproveForm.anaesthesiologist" (click)="submitHodAnaesApprove()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Approve & Schedule</button>
        </div>
      </app-modal>

      <!-- Start Surgery Modal -->
      <app-modal [open]="openModal === 'start_surgery'" (close)="openModal = null" title="Start Surgery" [subtitle]="patient.name + ' · ' + patient.uhid" width="sm">
        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex"><span class="text-slate-400 w-28">Patient</span><span class="font-medium text-slate-800">{{ patient.name }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">OT Room</span><span class="font-medium text-slate-800">{{ patient.otRoom || '—' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Scheduled Time</span><span class="font-medium text-slate-800">{{ patient.scheduledTime || '—' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Procedure</span><span class="font-medium text-slate-800">{{ patient.surgeryType }}</span></div>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Actual Start Time <span class="text-red-500">*</span></label>
            <input type="time" [(ngModel)]="startForm.actualStart" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="startForm.confirmed" class="mt-0.5 w-4 h-4 rounded border-slate-300 accent-blue-600 flex-shrink-0" />
            <span class="text-xs text-slate-700 leading-snug">I confirm the patient is in position, team briefing is complete, and surgery is being commenced.</span>
          </label>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!startForm.confirmed || !startForm.actualStart" (click)="submitStartSurgery()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Confirm — Start Surgery</button>
        </div>
      </app-modal>

      <!-- Assign OT Modal -->
      <app-modal [open]="openModal === 'assign_ot'" (close)="openModal = null" title="Assign OT & Staff" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">OT Room <span class="text-red-500">*</span></label>
            <select [(ngModel)]="otForm.otRoom" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              @for (o of ['OT-1','OT-2','OT-3','OT-4','OT-5','OT-6','OT-7','OT-8']; track o) {
                <option [value]="o">{{ o }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Start Time <span class="text-red-500">*</span></label>
            <input type="time" [(ngModel)]="otForm.startTime" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Scrub Nurse</label>
            <input [(ngModel)]="otForm.scrubNurse" placeholder="Sr. Nurse name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Floor Nurse</label>
            <input [(ngModel)]="otForm.floorNurse" placeholder="Sr. Nurse name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 block mb-1">OTAT Technician</label>
            <input [(ngModel)]="otForm.otatTech" placeholder="Technician name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <div class="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-600">
              <p class="font-semibold mb-1">OT Availability — Today</p>
              <div class="space-y-1">
                @for (s of ['OT-1: 08:00–10:30 (Occupied) | 11:00+ (Available)', 'OT-2: 08:00–11:30 (Occupied) | 12:00+ (Available)', 'OT-3: Available all day', 'OT-4: 09:00–12:00 (Occupied) | 12:30+ (Available)']; track s) {
                  <div [class]="'flex items-center gap-1.5 ' + (s.includes(otForm.otRoom) ? 'font-semibold text-blue-700' : 'text-slate-500')">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>{{ s }}
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!otForm.otRoom || !otForm.startTime" (click)="submitAssignOT()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Assign OT & Staff</button>
        </div>
      </app-modal>

      <!-- Complete Surgery Modal -->
      <app-modal [open]="openModal === 'complete_surgery'" (close)="openModal = null" title="Complete Surgery" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Actual Start Time</label>
            <input type="time" [(ngModel)]="completeForm.actualStart" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Actual End Time <span class="text-red-500">*</span></label>
            <input type="time" [(ngModel)]="completeForm.actualEnd" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">PMR Status</label>
            <select [(ngModel)]="completeForm.pmr" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">HPE Status</label>
            <select [(ngModel)]="completeForm.hpe" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="not_sent">Not Sent</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs font-semibold text-slate-600 block mb-1">Intra-op Notes <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="completeForm.intraOpNotes" rows="3" placeholder="Complications, EBL, deviations from plan…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!completeForm.actualEnd" (click)="submitCompleteSurgery()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Mark Completed</button>
        </div>
      </app-modal>

      <!-- Postpone Modal -->
      <app-modal [open]="openModal === 'postpone'" (close)="openModal = null" title="Postpone Surgery & Schedule Review" [subtitle]="patient.name + ' · ' + patient.uhid" width="sm">
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">New Review Date <span class="text-red-500">*</span></label>
            <input type="date" [(ngModel)]="postponeForm.newDate" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Reason for Postponement <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="postponeForm.reason" rows="3" placeholder="Clinical reason or administrative justification for postponement…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Additional Remarks</label>
            <textarea [(ngModel)]="postponeForm.remarks" rows="2" placeholder="Optional remarks…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!postponeForm.reason.trim() || !postponeForm.newDate" (click)="submitPostpone()" class="h-8 px-3 text-sm font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer">Confirm Postpone & Set Review</button>
        </div>
      </app-modal>

      <!-- Cancel Modal -->
      <app-modal [open]="openModal === 'cancel'" (close)="openModal = null" title="Cancel Request" [subtitle]="patient.name + ' · ' + patient.uhid" width="sm">
        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Reason for Cancellation <span class="text-red-500">*</span></label>
          <textarea [(ngModel)]="cancelForm.reason" rows="3" placeholder="Reason…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Keep Request</button>
          <button type="button" [disabled]="!cancelForm.reason.trim()" (click)="submitCancel()" class="h-8 px-3 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">Confirm Cancel</button>
        </div>
      </app-modal>

      <!-- Resume Modal -->
      <app-modal [open]="openModal === 'resume'" (close)="openModal = null" title="Resubmit After Postponement" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-4">
          @if (patient.postponementReason) {
            <div class="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
              <p class="font-semibold mb-0.5">Postponement Reason:</p>
              <p>{{ patient.postponementReason }}</p>
            </div>
          }
          <p class="text-xs text-slate-600">Pick a new date and submit the updated schedule directly to the Department HOD for review.</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">New Surgery Date <span class="text-red-500">*</span></label>
              <input type="date" [(ngModel)]="scheduleForm.date" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Preferred Time</label>
              <input type="time" [(ngModel)]="scheduleForm.time" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Est. Duration (min)</label>
              <input type="number" [(ngModel)]="scheduleForm.duration" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Unit Chief</label>
              <input [(ngModel)]="scheduleForm.unitChief" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Primary Surgeon <span class="text-red-500">*</span></label>
              <input [(ngModel)]="scheduleForm.primarySurgeon" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Assistant Surgeon</label>
              <input [(ngModel)]="scheduleForm.assistantSurgeon" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <label class="text-xs font-medium text-slate-600 block mb-1">PG Surgery</label>
              <input [(ngModel)]="scheduleForm.pgSurgery" placeholder="Dr. name…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!scheduleForm.date || !scheduleForm.primarySurgeon" (click)="submitResume()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Submit New Schedule to HOD</button>
        </div>
      </app-modal>

      <!-- Assign Anaesthesiologist Modal -->
      <app-modal [open]="openModal === 'assign_anaes'" (close)="openModal = null" title="Assign Anaesthesiologist" [subtitle]="patient.name + ' · ' + patient.uhid" width="sm">
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Primary Anaesthesiologist <span class="text-red-500">*</span></label>
            <select [(ngModel)]="anaesForm.anaesthesiologist" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select…</option>
              @for (a of ['Dr. Ananya Krishnan','Dr. Prabhu Anandan','Dr. Ravi Sundaram','Dr. Dinesh Patel','Dr. Lakshmi Subramanian']; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Assistant Anaesthesiologist</label>
            <input [(ngModel)]="anaesForm.assistant" placeholder="Optional…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">PG Anaesthesia</label>
            <input [(ngModel)]="anaesForm.pg" placeholder="Optional…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Remarks</label>
            <textarea [(ngModel)]="anaesForm.remarks" rows="2" placeholder="Optional remarks…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!anaesForm.anaesthesiologist" (click)="saveAnaesAssignment()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Save Assignment</button>
        </div>
      </app-modal>

      <!-- Reschedule Anaes Modal -->
      <app-modal [open]="openModal === 'reschedule_anaes'" (close)="openModal = null" title="Reschedule Surgery" [subtitle]="patient.name + ' · ' + patient.uhid" width="md">
        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex"><span class="text-slate-400 w-28">Current Date</span><span class="font-medium text-slate-800">{{ patient.scheduledDate || '—' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Current Time</span><span class="font-mono font-medium text-slate-800">{{ patient.scheduledTime || '—' }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">Procedure</span><span class="font-medium text-slate-800">{{ patient.surgeryType }}</span></div>
            <div class="flex"><span class="text-slate-400 w-28">OT Room</span><span class="font-medium text-slate-800">{{ patient.otRoom || '—' }}</span></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">New Surgery Date <span class="text-red-500">*</span></label>
              <input type="date" [(ngModel)]="rescheduleForm.date" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">New Surgery Time</label>
              <input type="time" [(ngModel)]="rescheduleForm.time" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 block mb-1">Assistant Anaesthesiologist (optional change)</label>
            <input [(ngModel)]="rescheduleForm.assistantAnaes" placeholder="Leave blank to keep current…" class="w-full h-9 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Reason for Rescheduling <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="rescheduleForm.reason" rows="3" placeholder="Reason for rescheduling…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="openModal = null" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!rescheduleForm.date || !rescheduleForm.reason.trim()" (click)="submitReschedule()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Reschedule</button>
        </div>
      </app-modal>

      <!-- Request Modal -->
      <app-modal [open]="requestModalOpen" (close)="requestModalOpen = false" title="Send Request" [subtitle]="patient.name + ' · ' + patient.uhid" width="sm">
        <div class="space-y-4">
          <div class="bg-violet-50 border border-violet-100 rounded px-3 py-2 text-xs text-violet-700">
            <span class="font-semibold">From:</span> {{ fromPortalLabel }}
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Send To <span class="text-red-500">*</span></label>
            <select [(ngModel)]="requestForm.to" class="w-full h-9 pl-3 pr-8 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select recipient…</option>
              @for (p of toPortalOptions; track p.id) {
                <option [value]="p.label">{{ p.label }}</option>
              }
            </select>
            @if (toPortalOptions.length === 0) {
              <p class="text-[10px] text-slate-400 mt-1">No earlier-stage portals available to request from.</p>
            }
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Comment</label>
            <textarea [(ngModel)]="requestForm.comment" rows="3" placeholder="Add a note or reason for the request…" class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div modal-footer class="flex justify-end gap-2 w-full">
          <button type="button" (click)="requestModalOpen = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" [disabled]="!requestForm.to" (click)="submitSendRequest()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Send Request</button>
        </div>
      </app-modal>

      <!-- Edit Record Modal -->
      <app-modal [open]="showEditModal" (close)="showEditModal = false" title="Edit Patient Record" [subtitle]="patient.name + ' · ' + patient.uhid" width="lg">
        @if (editSaved) {
          <div class="flex flex-col items-center py-8 text-center">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <app-icon name="check" [size]="22" className="text-green-600"></app-icon>
            </div>
            <p class="text-sm font-semibold text-slate-800">Record Updated</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Patient Name</label>
              <input [(ngModel)]="editForm.name" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Ward</label>
              <input [(ngModel)]="editForm.ward" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Bed Number</label>
              <input [(ngModel)]="editForm.bedNumber" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">OT Room</label>
              <input [(ngModel)]="editForm.otRoom" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <label class="text-xs font-medium text-slate-600 block mb-1">Diagnosis</label>
              <input [(ngModel)]="editForm.diagnosis" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <label class="text-xs font-medium text-slate-600 block mb-1">Procedure</label>
              <input [(ngModel)]="editForm.surgeryType" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Surgeon</label>
              <input [(ngModel)]="editForm.surgeon" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 block mb-1">Scheduled Date</label>
              <input type="date" [(ngModel)]="editForm.scheduledDate" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        }
        <div modal-footer class="flex justify-end gap-2 w-full">
          @if (editSaved) {
            <button type="button" (click)="showEditModal = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Close</button>
          } @else {
            <button type="button" (click)="showEditModal = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="button" (click)="saveEditRecord()" class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">Save Changes</button>
          }
        </div>
      </app-modal>
    </div>
  `,
})
export class PatientDetailComponent implements OnInit, OnChanges {
  private api = inject(ApiService)

  @Input() patient: Patient
  @Input() roleContext: string = "surgeon"
  @Output() back = new EventEmitter<void>()
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  openModal: ModalType = null
  showEditModal: boolean = false
  editSaved: boolean = false
  actionDone: boolean = false

  pendingAction: { label: string; nextStatus?: Patient["status"] } | null = null
  pendingSubmit: {
    fn: () => void
    label: string
    variant?: "primary" | "danger"
  } | null = null

  requestModalOpen: boolean = false
  requestForm = { to: "", comment: "" }
  replyTexts: Record<string, string> = {}

  availableEquipment: string[] = [
    "C-Arm Fluoroscopy",
    "Laparoscopic Tower & Instruments",
    "Harmonic Scalpel / Ultrasonic",
    "Surgical Microscope",
    "Bipolar Diathermy / Cautery",
    "Orthopedic Drill & Saw System",
    "Arthroscope & Camera",
    "Intraoperative Ultrasound",
    "Special Implants / Mesh Tray",
    "Vascular Clamp Set",
  ]
  selectedEquipment: string[] = []
  customEquipmentInput: string = ""

  isEquipmentSelected(eq: string): boolean {
    return this.selectedEquipment.includes(eq)
  }

  toggleEquipment(eq: string) {
    if (this.selectedEquipment.includes(eq)) {
      this.selectedEquipment = this.selectedEquipment.filter((e) => e !== eq)
    } else {
      this.selectedEquipment = [...this.selectedEquipment, eq]
    }
  }

  addCustomEquipment() {
    const val = this.customEquipmentInput?.trim()
    if (val && !this.selectedEquipment.includes(val)) {
      this.selectedEquipment = [...this.selectedEquipment, val]
      if (!this.availableEquipment.includes(val)) {
        this.availableEquipment.push(val)
      }
      this.customEquipmentInput = ""
    }
  }

  fitForm = {
    anaesthesiaType: "General Anaesthesia",
    asaClass: "ASA-II" as Patient["anaesthesiaRisk"],
    notes: "",
  }
  unfitForm = { reason: "", reviewDate: "" }
  scheduleForm = {
    date: "",
    time: "",
    otRoom: "OT-1",
    duration: "90",
    unitChief: "",
    primarySurgeon: "",
    assistantSurgeon: "",
    pgSurgery: "",
  }
  otForm = {
    otRoom: "OT-1",
    startTime: "",
    scrubNurse: "",
    floorNurse: "",
    otatTech: "",
  }
  completeForm = {
    actualStart: "",
    actualEnd: "",
    intraOpNotes: "",
    pmr: "pending",
    hpe: "not_sent",
  }
  postponeForm = { reason: "", newDate: "", remarks: "" }
  cancelForm = { reason: "" }
  anaesForm = {
    anaesthesiologist: "Dr. Dinesh Patel",
    assistant: "",
    pg: "",
    remarks: "",
  }
  hodApproveForm = { remarks: "", confirmed: false }
  hodAnaesApproveForm = {
    anaesthesiologist: "",
    assistantAnaes: "",
    pgAnaes: "",
    remarks: "",
    confirmed: false,
  }
  startForm = { actualStart: "", confirmed: false }
  rescheduleForm = { date: "", time: "", reason: "", assistantAnaes: "" }
  editForm = {
    name: "",
    ward: "",
    bedNumber: "",
    diagnosis: "",
    surgeryType: "",
    surgeon: "",
    otRoom: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  }

  stages = [
    { key: "request", label: "Request Created", toStatuses: ["draft"] },
    {
      key: "pac",
      label: "PAC / Fitness",
      toStatuses: ["pending_fitness", "pending_scheduling"],
    },
    {
      key: "schedule",
      label: "Scheduling",
      toStatuses: ["pending_scheduling", "ready_for_hod_approval"],
    },
    {
      key: "hod",
      label: "HOD Approval",
      toStatuses: ["pending_dept_approval", "pending_ot_assignment"],
    },
    {
      key: "ot",
      label: "OT Assignment",
      toStatuses: ["pending_ot_assignment", "pending_anaes_approval"],
    },
    {
      key: "anaes",
      label: "Anaes. Approval",
      toStatuses: ["pending_anaes_approval", "scheduled"],
    },
    {
      key: "surgery",
      label: "Surgery",
      toStatuses: ["in_progress", "in-progress", "scheduled"],
    },
    {
      key: "complete",
      label: "Completed",
      toStatuses: ["completed", "cancelled", "postponed"],
    },
  ]

  ngOnInit() {
    this.syncForms()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["patient"]) {
      this.syncForms()
    }
  }

  syncForms() {
    if (!this.patient) return
    this.fitForm = {
      anaesthesiaType: this.patient.anaesthesiaType || "General Anaesthesia",
      asaClass: this.patient.anaesthesiaRisk || "ASA-II",
      notes: "",
    }
    this.scheduleForm = {
      date: this.patient.scheduledDate || "",
      time: this.patient.scheduledTime || "",
      otRoom: this.patient.otRoom || "OT-1",
      duration: String(this.patient.estimatedDuration || 90),
      unitChief: this.patient.unitChief ?? "",
      primarySurgeon: this.patient.primarySurgeon ?? this.patient.surgeon ?? "",
      assistantSurgeon: this.patient.assistantSurgeon ?? "",
      pgSurgery: this.patient.pgSurgery ?? "",
    }
    this.selectedEquipment = Array.isArray(this.patient.equipmentRequirements)
      ? [...this.patient.equipmentRequirements]
      : []
    this.customEquipmentInput = ""
    this.otForm = {
      otRoom: this.patient.otRoom || "OT-1",
      startTime: this.patient.scheduledTime || "",
      scrubNurse: this.patient.scrubNurse ?? "",
      floorNurse: this.patient.floorNurse ?? "",
      otatTech: this.patient.otatTechnician ?? "",
    }
    this.completeForm = {
      actualStart: this.patient.actualStartTime ?? "",
      actualEnd: "",
      intraOpNotes: "",
      pmr: "pending",
      hpe: "not_sent",
    }
    this.anaesForm = {
      anaesthesiologist: this.patient.anaesthesiologist || "Dr. Dinesh Patel",
      assistant: "",
      pg: "",
      remarks: "",
    }
    this.hodAnaesApproveForm = {
      anaesthesiologist: this.patient.anaesthesiologist || "",
      assistantAnaes: "",
      pgAnaes: "",
      remarks: "",
      confirmed: false,
    }
    this.rescheduleForm = {
      date: this.patient.scheduledDate || "",
      time: this.patient.scheduledTime || "",
      reason: "",
      assistantAnaes: this.patient.anaesthesiaAssistant ?? "",
    }
    this.editForm = {
      name: this.patient.name,
      ward: this.patient.ward,
      bedNumber: this.patient.bedNumber,
      diagnosis: this.patient.diagnosis,
      surgeryType: this.patient.surgeryType,
      surgeon: this.patient.surgeon,
      otRoom: this.patient.otRoom,
      scheduledDate: this.patient.scheduledDate,
      scheduledTime: this.patient.scheduledTime,
      notes: this.patient.notes,
    }
  }

  get roleActions() {
    return getActions(this.roleContext, this.patient?.status)
  }

  get bmi(): string {
    if (!this.patient?.vitals?.weight || !this.patient?.vitals?.height)
      return "—"
    const h = this.patient.vitals.height / 100
    return (this.patient.vitals.weight / (h * h)).toFixed(1)
  }

  getInitials(name: string): string {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
  }

  getActionBtnClass(variant?: string): string {
    if (variant === "success")
      return "bg-green-600 text-white border-green-700 hover:bg-green-700"
    if (variant === "danger")
      return "bg-red-600 text-white border-red-700 hover:bg-red-700"
    if (variant === "warning")
      return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
    if (variant === "primary")
      return "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
    return "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
  }

  isDangerAction(label?: string): boolean {
    const l = (label || "").toLowerCase()
    return l.includes("cancel") || l.includes("unfit")
  }

  onActionClicked(action: {
    id: string
    label: string
    modal?: string
    nextStatus?: Patient["status"]
  }) {
    if (action.modal) {
      this.openModal = (action.modal as ModalType)
    } else {
      this.pendingAction = {
        label: action.label,
        nextStatus: action.nextStatus,
      }
    }
  }

  confirmPendingAction() {
    if (!this.pendingAction) return
    if (this.pendingAction.nextStatus) {
      this.applyAction(this.pendingAction.nextStatus, this.pendingAction.label)
    }
    this.pendingAction = null
  }

  confirmPendingSubmit() {
    if (this.pendingSubmit) {
      this.pendingSubmit.fn()
      this.pendingSubmit = null
    }
  }

  applyAction(
    nextStatus: Patient["status"],
    actionLabel: string,
    extraUpdates?: Partial<Patient>,
    notes?: string,
  ) {
    const entry: WorkflowHistoryEntry = {
      timestamp: now(),
      action: actionLabel,
      fromStatus: this.patient.status,
      toStatus: nextStatus,
      performedBy: this.roleContext,
      notes,
    }
    this.patientUpdate.emit({
      id: this.patient.id,
      updates: { status: nextStatus, ...extraUpdates },
      historyEntry: entry,
    })
    this.openModal = null
    this.actionDone = true
    setTimeout(() => {
      this.actionDone = false
    }, 3000)
  }

  // Submit methods for modals
  submitFit() {
    this.pendingSubmit = {
      label: "Confirm Fit & Return to Surgery OP Ward",
      fn: () => {
        const notes = `Anaesthesia Type: ${this.fitForm.anaesthesiaType}, ASA Grade: ${this.fitForm.asaClass}. ${this.fitForm.notes || "Cleared for surgery by Anaesthesia PAC and returned to Surgery OP Ward for scheduling."}`
        this.applyAction(
          "pending_scheduling",
          "PAC Cleared — Marked Fit",
          {
            anaesthesiaType: this.fitForm.anaesthesiaType,
            anaesthesiaRisk: this.fitForm.asaClass,
            pacStatus: "cleared",
            patientFitness: "fit",
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.assessAnaesthesiaFitness(this.patient.id, {
          isFit: true,
          anaesthesiaType: this.fitForm.anaesthesiaType,
          anaesthesiaRisk: this.fitForm.asaClass,
          assessedBy: "Dr. Dinesh Patel",
          notes,
        })
      },
    }
  }

  onAddUnfitReason(event: Event) {
    const val = (event.target as HTMLSelectElement).value
    if (val) {
      this.unfitForm.reason = this.unfitForm.reason
        ? this.unfitForm.reason + "\n" + val
        : val
    }
  }

  submitUnfit() {
    this.pendingSubmit = {
      label: "Mark Unfit & Schedule Review",
      variant: "danger",
      fn: () => {
        const reason = this.unfitForm.reason || "High anaesthesia risk / medical evaluation required"
        const reviewDate = this.unfitForm.reviewDate || "2024-12-25"
        const notes = `Unfit for anaesthesia. Reason: ${reason}. Review scheduled for: ${reviewDate}.`
        this.applyAction(
          "pending_fitness",
          "PAC — Marked Unfit (Review Scheduled)",
          {
            pacStatus: "deferred",
            patientFitness: "unfit",
            fitnessReason: reason,
            reviewDate: reviewDate,
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.assessAnaesthesiaFitness(this.patient.id, {
          isFit: false,
          fitnessReason: reason,
          reviewDate: reviewDate,
          assessedBy: "Dr. Dinesh Patel",
          notes,
        })
      },
    }
  }

  submitSchedule() {
    this.pendingSubmit = {
      label: "Submit Schedule to Dept HOD",
      fn: () => {
        const equipSummary = this.selectedEquipment.length > 0 ? this.selectedEquipment.join(", ") : "Standard instrumentation"
        const notes = `Scheduled for ${this.scheduleForm.date} ${this.scheduleForm.time}. Surgeon: ${this.scheduleForm.primarySurgeon}. Equipment: ${equipSummary}. Submitted to Department HOD for approval.`
        this.applyAction(
          "pending_dept_approval",
          "Surgery Scheduled & Submitted to Dept HOD",
          {
            scheduledDate: this.scheduleForm.date,
            scheduledTime: this.scheduleForm.time,
            estimatedDuration: Number(this.scheduleForm.duration),
            unitChief: this.scheduleForm.unitChief,
            primarySurgeon: this.scheduleForm.primarySurgeon,
            surgeon: this.scheduleForm.primarySurgeon,
            assistantSurgeon: this.scheduleForm.assistantSurgeon,
            pgSurgery: this.scheduleForm.pgSurgery,
            equipmentRequirements: [...this.selectedEquipment],
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.submitSchedule(this.patient.id, {
          scheduledDate: this.scheduleForm.date,
          scheduledTime: this.scheduleForm.time,
          estimatedDuration: Number(this.scheduleForm.duration),
          unitChief: this.scheduleForm.unitChief,
          primarySurgeon: this.scheduleForm.primarySurgeon,
          assistantSurgeon: this.scheduleForm.assistantSurgeon,
          pgSurgery: this.scheduleForm.pgSurgery,
          equipmentRequirements: [...this.selectedEquipment],
          scheduledBy: "Surgery OP Ward",
          notes,
        })
      },
    }
  }

  submitHodApprove() {
    this.pendingSubmit = {
      label: "Approve Surgery & Forward to OT Matron",
      fn: () => {
        const notes = this.hodApproveForm.remarks || "Department HOD reviewed and approved surgery. Forwarded to OT Matron for room and staff assignment."
        this.applyAction(
          "pending_ot_assignment",
          "Approved by Department HOD",
          {},
          notes,
        )
        // Call backend workflow endpoint
        this.api.deptHodApprove(this.patient.id, {
          approvedBy: "Department HOD",
          remarks: this.hodApproveForm.remarks,
        })
      },
    }
  }

  submitHodAnaesApprove() {
    this.pendingSubmit = {
      label: "Approve & Schedule Operation",
      fn: () => {
        const anaesthesiologist = this.hodAnaesApproveForm.anaesthesiologist || "Dr. Sunita Krishnan"
        const notes = this.hodAnaesApproveForm.remarks ||
          `HOD Anaesthesia approved surgery. Anaesthesiologist assigned: ${anaesthesiologist}. Ready for surgery.`
        this.applyAction(
          "scheduled",
          "Approved for Surgery by HOD Anaesthesia",
          {
            anaesthesiologist: anaesthesiologist,
            anaesthesiaAssistant: this.hodAnaesApproveForm.assistantAnaes,
            pgAnaesthesia: this.hodAnaesApproveForm.pgAnaes,
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.approveForSurgery(this.patient.id, {
          anaesthesiologist: anaesthesiologist,
          anaesthesiaAssistant: this.hodAnaesApproveForm.assistantAnaes,
          pgAnaesthesia: this.hodAnaesApproveForm.pgAnaes,
          approvedBy: "Dr. Sunita Krishnan",
          notes,
        })
      },
    }
  }

  submitStartSurgery() {
    this.pendingSubmit = {
      label: "Confirm — Start Surgery",
      fn: () => {
        const notes = `Surgery commenced at ${this.startForm.actualStart}. Patient shifted inside OT.`
        this.applyAction(
          "in_progress",
          "Surgery Started",
          {
            actualStartTime: this.startForm.actualStart,
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.startSurgery(this.patient.id, {
          actualStartTime: this.startForm.actualStart,
          startedBy: "OT Matron",
          notes,
        })
      },
    }
  }

  submitAssignOT() {
    this.pendingSubmit = {
      label: "Assign OT & Submit to HOD Anaesthesia",
      fn: () => {
        const notes = `OT: ${this.otForm.otRoom} · Time: ${this.otForm.startTime}. Scrub Nurse: ${this.otForm.scrubNurse || 'Nurse assigned'}. Floor Nurse: ${this.otForm.floorNurse || 'Nurse assigned'}. OTAT Tech: ${this.otForm.otatTech || 'Tech assigned'}. Forwarded to HOD Anaesthesia for approval.`
        this.applyAction(
          "pending_anaes_approval",
          "OT Room & Staff Assigned by OT Matron",
          {
            otRoom: this.otForm.otRoom,
            scheduledTime: this.otForm.startTime,
            scrubNurse: this.otForm.scrubNurse,
            floorNurse: this.otForm.floorNurse,
            otatTechnician: this.otForm.otatTech,
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.assignOtAndStaff(this.patient.id, {
          otRoom: this.otForm.otRoom,
          scheduledTime: this.otForm.startTime,
          scrubNurse: this.otForm.scrubNurse || "Sr. Nurse",
          floorNurse: this.otForm.floorNurse || "Sr. Nurse",
          otatTechnician: this.otForm.otatTech || "Tech Staff",
          assignedBy: "Sr. Meenakshi R.",
          notes,
        })
      },
    }
  }

  submitCompleteSurgery() {
    this.pendingSubmit = {
      label: "Mark Completed",
      fn: () => {
        const notes = this.completeForm.intraOpNotes || "Surgery completed. Patient shifted to Recovery / PACU."
        this.applyAction(
          "completed",
          "Surgery Completed",
          {
            actualStartTime:
              this.completeForm.actualStart || this.patient.actualStartTime,
            actualEndTime: this.completeForm.actualEnd,
            intraOpNotes: this.completeForm.intraOpNotes,
            pmrStatus: this.completeForm.pmr as Patient["pmrStatus"],
            hpeStatus: this.completeForm.hpe as Patient["hpeStatus"],
          },
          notes,
        )
        // Call backend workflow endpoint
        this.api.completeSurgery(this.patient.id, {
          actualEndTime: this.completeForm.actualEnd,
          actualStartTime: this.completeForm.actualStart || this.patient.actualStartTime,
          intraOpNotes: this.completeForm.intraOpNotes,
          pmrStatus: this.completeForm.pmr,
          hpeStatus: this.completeForm.hpe,
          completedBy: "OT Matron",
        })
      },
    }
  }

  submitPostpone() {
    this.pendingSubmit = {
      label: "Confirm Postpone",
      variant: "primary",
      fn: () => {
        const reason = this.postponeForm.reason || "Surgery postponed"
        const newDate = this.postponeForm.newDate || "2024-12-25"
        const notes = `${reason}${this.postponeForm.remarks ? " · " + this.postponeForm.remarks : ""}`
        this.applyAction(
          "postponed",
          "Surgery Postponed",
          {
            postponedFromStatus: this.patient.status,
            postponementReason: reason,
            reviewDate: newDate,
            otRoom: "",
            scheduledTime: "",
            scheduledDate: "",
          },
          notes,
        )
        // Call backend workflow endpoint
        if (this.patient.status === "pending_dept_approval" || this.roleContext === "department-hod") {
          this.api.deptHodPostpone(this.patient.id, {
            postponementReason: reason,
            reviewDate: newDate,
            postponedBy: "Department HOD",
            remarks: this.postponeForm.remarks,
          })
        } else {
          this.api.postponeSurgery(this.patient.id, {
            postponementReason: reason,
            reviewDate: newDate,
            postponedBy: "HOD Anaesthesia",
            notes,
          })
        }
      },
    }
  }

  submitCancel() {
    this.pendingSubmit = {
      label: "Confirm Cancel",
      variant: "danger",
      fn: () => {
        this.applyAction(
          "cancelled",
          "Request Cancelled",
          {},
          this.cancelForm.reason,
        )
      },
    }
  }

  submitResume() {
    this.pendingSubmit = {
      label: "Submit New Schedule to HOD",
      fn: () => {
        this.applyAction(
          "pending_dept_approval",
          "Resubmitted to Dept HOD",
          {
            scheduledDate: this.scheduleForm.date,
            scheduledTime: this.scheduleForm.time,
            estimatedDuration: Number(this.scheduleForm.duration),
            unitChief: this.scheduleForm.unitChief,
            primarySurgeon: this.scheduleForm.primarySurgeon,
            assistantSurgeon: this.scheduleForm.assistantSurgeon,
            pgSurgery: this.scheduleForm.pgSurgery,
            postponementReason: undefined,
          },
          `Resubmitted for ${this.scheduleForm.date}. Surgeon: ${this.scheduleForm.primarySurgeon}.`,
        )
      },
    }
  }

  saveAnaesAssignment() {
    this.patientUpdate.emit({
      id: this.patient.id,
      updates: {
        anaesthesiologist: this.anaesForm.anaesthesiologist,
        anaesthesiaAssistant: this.anaesForm.assistant,
        pgAnaesthesia: this.anaesForm.pg,
      },
    })
    this.openModal = null
  }

  submitReschedule() {
    this.pendingSubmit = {
      label: "Confirm Reschedule",
      fn: () => {
        this.applyAction(
          "scheduled",
          "Rescheduled by HOD Anaesthesia",
          {
            scheduledDate: this.rescheduleForm.date,
            scheduledTime: this.rescheduleForm.time,
            anaesthesiaAssistant:
              this.rescheduleForm.assistantAnaes ||
              this.patient.anaesthesiaAssistant,
          },
          `Rescheduled to ${this.rescheduleForm.date}${
            this.rescheduleForm.time ? " " + this.rescheduleForm.time : ""
          }. Reason: ${this.rescheduleForm.reason}`,
        )
      },
    }
  }

  submitSendRequest() {
    if (!this.requestForm.to) return
    const req: PatientRequest = {
      id: `req-${Date.now()}`,
      fromPortal: this.fromPortalLabel,
      toPortal: this.requestForm.to,
      comment: this.requestForm.comment,
      timestamp: now(),
      status: "pending",
    }
    this.patientUpdate.emit({
      id: this.patient.id,
      updates: { requests: [...(this.patient.requests ?? []), req] },
    })
    this.requestModalOpen = false
  }

  saveEditRecord() {
    this.patientUpdate.emit({
      id: this.patient.id,
      updates: { ...this.editForm },
    })
    this.editSaved = true
  }

  // Request & Portal Chain logic
  get fromPortalLabel(): string {
    const PORTAL_CHAIN: Record<string, string> = {
      "surgery-op-ward": "Surgery OP Ward",
      surgeon: "Surgery OP Ward",
      "anaesthesia-op-pac": "Anaesthesia OP / PAC",
      anaesthesia: "Anaesthesia OP / PAC",
      "dept-hod": "Department HOD",
      hod: "Department HOD",
      "department-hod": "Department HOD",
      "ot-matron": "OT Matron",
      matron: "OT Matron",
      "hod-anaesthesia": "HOD Anaesthesia",
      "hospital-admin": "Hospital Admin",
      admin: "Hospital Admin",
    }
    return PORTAL_CHAIN[this.roleContext] ?? this.roleContext
  }

  get toPortalOptions(): Array<{ id: string; label: string }> {
    const PORTAL_CHAIN = [
      { id: "surgery-op-ward", label: "Surgery OP Ward" },
      { id: "anaesthesia-op-pac", label: "Anaesthesia OP / PAC" },
      { id: "dept-hod", label: "Department HOD" },
      { id: "ot-matron", label: "OT Matron" },
      { id: "hod-anaesthesia", label: "HOD Anaesthesia" },
      { id: "hospital-admin", label: "Hospital Admin" },
    ]
    const ROLE_TO_IDX: Record<string, number> = {
      "surgery-op-ward": 0,
      surgeon: 0,
      "anaesthesia-op-pac": 1,
      anaesthesia: 1,
      "dept-hod": 2,
      hod: 2,
      "department-hod": 2,
      "ot-matron": 3,
      matron: 3,
      "hod-anaesthesia": 4,
      "hospital-admin": 5,
      admin: 5,
    }
    const currentIdx = ROLE_TO_IDX[this.roleContext] ?? -1
    return PORTAL_CHAIN.filter((p, idx) => {
      if (idx === currentIdx) return false
      if (p.id === "hospital-admin") return true
      return idx < currentIdx
    })
  }

  get incomingRequests(): PatientRequest[] {
    const myLabel = this.fromPortalLabel
    return (this.patient?.requests ?? []).filter((r) => r.toPortal === myLabel)
  }

  canReply(reqId: string): boolean {
    return !!(this.replyTexts[reqId] ?? "").trim()
  }

  submitReply(reqId: string) {
    const text = (this.replyTexts[reqId] ?? "").trim()
    if (!text) return
    const updated = (this.patient.requests ?? []).map((r) =>
      r.id === reqId
        ? {
            ...r,
            reply: text,
            replyTimestamp: now(),
            status: "resolved" as const,
          }
        : r,
    )
    this.patientUpdate.emit({
      id: this.patient.id,
      updates: { requests: updated },
    })
    delete this.replyTexts[reqId]
  }

  // Workflow stages logic
  get currentStageIdx(): number {
    if (!this.patient?.history) return 0
    const completedToStatuses = new Set<string>(
      this.patient.history.map((h) => h.toStatus as string),
    )
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (this.stages[i].toStatuses.some((ts) => completedToStatuses.has(ts))) {
        return i
      }
    }
    return 0
  }

  get lastHistoryEntry(): WorkflowHistoryEntry | undefined {
    return this.patient?.history?.[this.patient.history.length - 1]
  }

  getStageEntry(stage: {
    toStatuses: string[]
  }): WorkflowHistoryEntry | undefined {
    return this.patient?.history?.find((h) =>
      stage.toStatuses.includes(h.toStatus),
    )
  }

  getStageCircleClass(i: number): string {
    const isDone = i <= this.currentStageIdx
    const isCurrent = i === this.currentStageIdx
    const base =
      "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all shadow-sm "
    if (isDone) {
      return isCurrent
        ? `${base} bg-blue-600 border-blue-600 shadow-blue-200`
        : `${base} bg-white border-blue-500`
    }
    return `${base} bg-slate-100 border-slate-200`
  }
}
