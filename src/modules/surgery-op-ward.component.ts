import { Component, Input, Output, EventEmitter, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { otRooms } from "../data/mock"
import type { Patient, WorkflowHistoryEntry } from "../types"
import { matchesStatusFilter } from "../lib/workflow"
import { ApiService } from "../services/api.service"
import { IconComponent } from "../components/icon.component"
import {
  DashTileComponent,
  DeptFilterSelectComponent,
  StatusFilterDropdownComponent,
  ModalComponent,
  ConfirmDialogComponent,
  OTTimelineComponent,
  OTSlotPopupComponent,
  OTSlot,
} from "../components/ui.component"
import { StandardTableComponent } from "../components/standard-table.component"
import { AllPatientsPageComponent } from "../components/all-patients-page.component"
import { PatientDetailComponent } from "../components/patient-detail.component"
import { AnalysisPageComponent } from "../components/analysis-page.component"

const TODAY = "2024-12-20"
const ROLE_ID = "surgery-op-ward"

const EMPTY_FORM = {
  name: "",
  uhid: "",
  age: "42",
  gender: "M",
  bloodGroup: "O+",
  department: "General Surgery",
  diagnosis: "",
  surgeryType: "",
  surgeon: "Dr. Rajesh Kumar",
  preferredDate: TODAY,
  preferredTime: "09:00",
  ward: "General Ward A",
  bedNumber: "Bed 101",
  otRoom: "",
  priority: "elective" as "elective" | "daycare",
  electivePriority: "P1" as "P1" | "P2",
  notes: "",
  isEmergency: false,
}

@Component({
  selector: "app-surgery-op-ward",
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
            <div class="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div>
                <h1 class="text-sm font-semibold text-slate-900">Surgery OP Ward — Dashboard</h1>
                <p class="text-xs text-slate-500 mt-0.5">{{ today }} · {{ todayPatients.length }} cases scheduled</p>
              </div>
              <button
                type="button"
                (click)="submitted = false; form = getEmptyForm(); showOTModal = true"
                class="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <app-icon name="plus" [size]="13"></app-icon> Request OT Slot
              </button>
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
                <button (click)="dashStatus = ''; dashDept = ''" class="text-xs text-blue-600 hover:underline cursor-pointer">
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

            <!-- Request OT Modal -->
            <app-modal
              [open]="showOTModal"
              (close)="showOTModal = false; submitted = false; form = getEmptyForm()"
              title="Request OT Slot"
              width="lg"
            >
              @if (submitted) {
                <div class="flex flex-col items-center py-8 text-center">
                  <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <app-icon name="check" [size]="22" className="text-green-600"></app-icon>
                  </div>
                  <p class="text-sm font-semibold text-slate-800 mb-1">OT Slot Request Submitted Successfully</p>
                  <p class="text-xs text-slate-500 max-w-sm mb-2">
                    Patient has been created and forwarded to Anaesthesia PAC for fitness assessment.
                  </p>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                    <app-icon name="check" [size]="12"></app-icon> Updated in All Patients across all portals
                  </span>
                </div>
              } @else {
                <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Patient Name *</label>
                    <input [(ngModel)]="form.name" placeholder="e.g. John Doe" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">UHID (Optional)</label>
                    <input [(ngModel)]="form.uhid" placeholder="Auto-generated if empty" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Age</label>
                    <input [(ngModel)]="form.age" type="number" placeholder="42" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Gender</label>
                    <select [(ngModel)]="form.gender" class="w-full h-8 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Blood Group</label>
                    <select [(ngModel)]="form.bloodGroup" class="w-full h-8 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Department</label>
                    <select [(ngModel)]="form.department" class="w-full h-8 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="General Surgery">General Surgery</option>
                      <option value="Orthopaedics">Orthopaedics</option>
                      <option value="Cardiothoracic Surgery">Cardiothoracic Surgery</option>
                      <option value="Neurosurgery">Neurosurgery</option>
                      <option value="Urology">Urology</option>
                      <option value="ENT">ENT</option>
                      <option value="Gynaecology">Gynaecology</option>
                      <option value="Vascular Surgery">Vascular Surgery</option>
                      <option value="Surgical Oncology">Surgical Oncology</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Diagnosis *</label>
                    <input [(ngModel)]="form.diagnosis" placeholder="e.g. Inguinal Hernia" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Procedure / Surgery *</label>
                    <input [(ngModel)]="form.surgeryType" placeholder="e.g. Laparoscopic Hernioplasty" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Primary Surgeon</label>
                    <input [(ngModel)]="form.surgeon" placeholder="e.g. Dr. Rajesh Kumar" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Ward / Bed</label>
                    <div class="flex gap-2">
                      <input [(ngModel)]="form.ward" placeholder="Ward A" class="w-1/2 h-8 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input [(ngModel)]="form.bedNumber" placeholder="Bed 101" class="w-1/2 h-8 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Case Type</label>
                    <select [(ngModel)]="form.priority" class="w-full h-8 pl-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="elective">Elective</option>
                      <option value="daycare">Day Care</option>
                    </select>
                  </div>
                  @if (form.priority === 'elective') {
                    <div>
                      <label class="text-xs font-medium text-slate-600 block mb-1">Elective Priority</label>
                      <div class="flex gap-2 mt-1">
                        <label [class]="'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border cursor-pointer text-xs font-semibold transition-colors ' + (form.electivePriority === 'P1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400')">
                          <input type="radio" name="electivePriority" value="P1" [checked]="form.electivePriority === 'P1'" (change)="form.electivePriority = 'P1'" class="sr-only" />
                          P1
                        </label>
                        <label [class]="'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border cursor-pointer text-xs font-semibold transition-colors ' + (form.electivePriority === 'P2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400')">
                          <input type="radio" name="electivePriority" value="P2" [checked]="form.electivePriority === 'P2'" (change)="form.electivePriority = 'P2'" class="sr-only" />
                          P2
                        </label>
                      </div>
                      <p class="text-[10px] text-slate-400 mt-1">
                        {{ form.electivePriority === 'P1' ? 'P1 — High priority, schedule within 1 week' : 'P2 — Routine, schedule within 4 weeks' }}
                      </p>
                    </div>
                  }
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Preferred Date</label>
                    <input type="date" [(ngModel)]="form.preferredDate" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-slate-600 block mb-1">Preferred Time</label>
                    <input type="time" [(ngModel)]="form.preferredTime" class="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div class="col-span-2">
                    <label [class]="'flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-colors ' + (form.isEmergency ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:border-slate-300')">
                      <input type="checkbox" [(ngModel)]="form.isEmergency" class="w-4 h-4 rounded border-slate-300 accent-red-600 flex-shrink-0" />
                      <div>
                        <span class="text-sm font-semibold text-slate-800">Emergency Case</span>
                        <p class="text-xs text-slate-500 mt-0.5">Check if this is an emergency requiring immediate OT allocation</p>
                      </div>
                    </label>
                  </div>
                  <div class="col-span-2">
                    <label class="text-xs font-medium text-slate-600 block mb-1">Clinical Notes</label>
                    <textarea [(ngModel)]="form.notes" rows="2" placeholder="Clinical history, comorbidities, pre-op instructions..." class="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
                  </div>
                </div>
              }
              <div modal-footer class="flex justify-end gap-2 w-full">
                @if (submitted) {
                  <button type="button" (click)="showOTModal = false; submitted = false; form = getEmptyForm()" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Close</button>
                } @else {
                  <button type="button" (click)="showOTModal = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
                  <button
                    type="button"
                    [disabled]="!form.name || isSubmitting"
                    (click)="showSubmitConfirm = true"
                    class="h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
                  </button>
                }
              </div>
            </app-modal>

            <app-confirm-dialog
              [open]="showSubmitConfirm"
              (close)="showSubmitConfirm = false"
              (confirm)="submitOTRequest()"
              title="Confirm OT Request Submission"
              [message]="'Submit OT slot request for patient \\'' + (form.name || 'this patient') + '\\'? The request will be sent to Anaesthesia PAC for fitness assessment.'"
              confirmLabel="Submit Request"
              variant="primary"
            ></app-confirm-dialog>
          </div>
        }

        @case ('patient-list') {
          <div class="p-5 flex flex-col" style="height: calc(100vh - 40px);">
            <div class="flex items-start justify-between mb-5">
              <div>
                <h1 class="text-lg font-semibold text-slate-900">Patients</h1>
                <p class="text-sm text-slate-500 mt-0.5">{{ todayPatients.length }} cases scheduled for {{ today }}</p>
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

        @case ('ot-schedule') {
          <div class="flex" style="height: calc(100vh - 40px);">
            <!-- Left calendar (toggled) -->
            @if (showCal) {
              <div class="flex-shrink-0 w-64 bg-white border-r border-slate-200 flex flex-col p-4">
                <div class="flex items-center justify-between mb-3">
                  <button (click)="prevMonth()" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">‹</button>
                  <span class="text-xs font-semibold text-slate-700">{{ months[calMonth.month] }} {{ calMonth.year }}</span>
                  <button (click)="nextMonth()" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">›</button>
                </div>
                <div class="grid grid-cols-7 mb-1">
                  @for (d of days; track d) {
                    <div class="text-center text-[10px] font-semibold text-slate-400 py-1">{{ d }}</div>
                  }
                </div>
                <div class="grid grid-cols-7 gap-y-0.5">
                  @for (d of calCells; track $index) {
                    @if (!d) {
                      <div></div>
                    } @else {
                      <button
                        type="button"
                        (click)="filterDate = toDateStr(d)"
                        [class]="getCalBtnClass(d)"
                      >
                        {{ d }}
                        @if (hasPatientsOn(d)) {
                          <span [class]="'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ' + (toDateStr(d) === filterDate ? 'bg-white' : 'bg-blue-400')"></span>
                        }
                      </button>
                    }
                  }
                </div>
                <div class="mt-3 p-2.5 bg-blue-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-blue-700">{{ filterDate }}</p>
                  <p class="text-[10px] text-blue-500 mt-0.5">{{ filteredSchedPatients.length }} case{{ filteredSchedPatients.length !== 1 ? 's' : '' }} scheduled</p>
                </div>
              </div>
            }

            <!-- Right OT grid -->
            <div class="flex-1 overflow-hidden flex flex-col">
              <div class="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-100">
                <button
                  type="button"
                  (click)="showCal = !showCal"
                  [title]="showCal ? 'Hide Calendar' : 'Show Calendar'"
                  [class]="'flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded border transition-colors cursor-pointer ' + (showCal ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')"
                >
                  <app-icon name="calendar" [size]="13"></app-icon>
                  {{ filterDate }}
                </button>
                <select
                  [(ngModel)]="filterStatus"
                  class="h-7 pl-2 pr-6 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">Surgery Going On</option>
                  <option value="completed">Completed</option>
                </select>
                <span class="text-xs text-slate-400 ml-auto">
                  {{ filteredSchedPatients.length }} case{{ filteredSchedPatients.length !== 1 ? 's' : '' }}
                </span>
              </div>
              <div class="flex-1 overflow-y-auto p-5">
                <div class="bg-white border border-slate-200 rounded-lg p-4">
                  <app-ot-timeline
                    [rooms]="rooms"
                    [slots]="timelineSlots"
                    (slotClick)="onTimelineSlotClick($event)"
                  ></app-ot-timeline>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating popup when a slot is clicked -->
          @if (otSlotPanel) {
            <app-ot-slot-popup
              [patient]="otSlotPanel"
              [pos]="otSlotPos"
              (close)="otSlotPanel = null"
              (view)="showSummaryModal = true"
              viewLabel="View Summary"
            ></app-ot-slot-popup>
          }

          <!-- Summary Modal -->
          @if (otSlotPanel && showSummaryModal) {
            <app-modal
              [open]="showSummaryModal"
              (close)="showSummaryModal = false"
              title="Patient Summary"
              [subtitle]="otSlotPanel.name + ' · ' + otSlotPanel.uhid"
              width="xl"
            >
              <div id="ot-summary-content" class="space-y-4">
                <div>
                  <h1 class="text-lg font-bold text-slate-900">{{ otSlotPanel.name }}</h1>
                  <p class="text-xs text-slate-500">{{ otSlotPanel.uhid }} · {{ otSlotPanel.age }}y {{ otSlotPanel.gender === 'M' ? 'Male' : 'Female' }} · {{ otSlotPanel.bloodGroup }}</p>
                </div>
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Patient Information</h2>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Ward / Bed</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.ward }} · Bed {{ otSlotPanel.bedNumber }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Phone</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.phone }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Admission Date</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.admissionDate }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Department</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.department }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Allergies</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.allergies?.length ? otSlotPanel.allergies.join(', ') : 'NKDA' }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Comorbidities</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.comorbidities?.length ? otSlotPanel.comorbidities.join(', ') : 'Nil' }}</span></div>
                  </div>
                  <div>
                    <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Surgery Information</h2>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Diagnosis</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.diagnosis }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Procedure</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.surgeryType }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">OT Room</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.otRoom }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Scheduled Date</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.scheduledDate }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Scheduled Time</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.scheduledTime }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Est. Duration</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.estimatedDuration }} min</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Surgery Doctor</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.surgeon }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Anaesthesia Doctor</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.anaesthesiologist || '—' }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">Anaesthesia Type</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.anaesthesiaType }}</span></div>
                    <div class="flex gap-2 py-1 border-b border-slate-50"><span class="text-xs text-slate-400 w-36 flex-shrink-0">ASA Grade</span><span class="text-xs font-medium text-slate-800">{{ otSlotPanel.anaesthesiaRisk }}</span></div>
                  </div>
                </div>
                @if (otSlotPanel.notes) {
                  <div>
                    <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Clinical Notes</h2>
                    <p class="text-sm text-slate-700 bg-slate-50 rounded p-3 border border-slate-100">{{ otSlotPanel.notes }}</p>
                  </div>
                }
              </div>
              <div modal-footer class="flex items-center justify-between w-full">
                <button
                  type="button"
                  (click)="printSummary()"
                  class="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <app-icon name="download" [size]="14"></app-icon> Download PDF
                </button>
                <button type="button" (click)="showSummaryModal = false" class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Close</button>
              </div>
            </app-modal>
          }
        }

        @case ('analysis') {
          <app-analysis-page
            [patients]="patients"
            [roleId]="roleId"
            roleLabel="Surgery OP Ward"
            [performerKeys]="['Surgery OP Ward', 'surgery-op-ward']"
            (patientUpdate)="patientUpdate.emit($event)"
          ></app-analysis-page>
        }

        @case ('reports') {
          <div class="overflow-y-auto p-5" style="height: calc(100vh - 40px);">
            <div class="flex items-start justify-between mb-5">
              <div>
                <h1 class="text-lg font-semibold text-slate-900">Reports</h1>
                <p class="text-sm text-slate-500 mt-0.5">{{ patients.length }} total patients · All dates</p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="rounded-lg border p-4 text-blue-700 bg-blue-50 border-blue-200">
                <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Total Patients</p>
                <p class="text-3xl font-bold mt-1">{{ patients.length }}</p>
              </div>
              <div class="rounded-lg border p-4 text-green-700 bg-green-50 border-green-200">
                <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Completed</p>
                <p class="text-3xl font-bold mt-1">{{ completedCount }}</p>
              </div>
              <div class="rounded-lg border p-4 text-red-700 bg-red-50 border-red-200">
                <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Cancelled</p>
                <p class="text-3xl font-bold mt-1">{{ cancelledCount }}</p>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-lg p-5 mb-4">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Cases by Department</h3>
              <div class="space-y-2.5">
                @for (d of deptReportEntries; track d.dept) {
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-600 w-40 truncate flex-shrink-0">{{ d.dept }}</span>
                    <div class="flex-1 bg-slate-100 rounded-full h-2">
                      <div class="bg-blue-500 h-2 rounded-full transition-all" [style.width]="d.pct + '%'"></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-700 w-5 text-right">{{ d.count }}</span>
                  </div>
                }
              </div>
            </div>

            <app-standard-table
              [patients]="patients"
              [roleId]="roleId"
              (rowClick)="selectedPatient = $event"
            ></app-standard-table>
          </div>
        }
      }
    }
  `,
})
export class SurgeryOPWardComponent {
  private api = inject(ApiService)

  @Input() activePage: string = "dashboard"
  @Input() patients: Patient[] = []
  @Output() pageChange = new EventEmitter<string>()
  @Output() patientCreated = new EventEmitter<Patient>()
  @Output() patientUpdate = new EventEmitter<{
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }>()

  readonly today = TODAY
  readonly roleId = ROLE_ID

  selectedPatient: Patient | null = null
  showOTModal: boolean = false
  form = { ...EMPTY_FORM }
  submitted: boolean = false
  isSubmitting: boolean = false
  showSubmitConfirm: boolean = false

  tileFilter: string | null = null
  dashStatus: string = ""
  dashDept: string = ""

  filterDate: string = TODAY
  filterStatus: string = ""
  calMonth = { year: 2024, month: 11 }
  showCal: boolean = false

  otSlotPanel: Patient | null = null
  otSlotPos = { x: 0, y: 0 }
  showSummaryModal: boolean = false

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

  readonly tiles = [
    { id: "today", label: "Patients", color: "blue", icon: "users" },
    { id: "action", label: "Action Needed", color: "orange", icon: "clock" },
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

  getEmptyForm() {
    return { ...EMPTY_FORM }
  }

  getTileCount(id: string): number {
    const ACTION_STATUSES = ["draft", "pending_scheduling", "postponed"]
    switch (id) {
      case "today":
        return this.todayPatients.length
      case "action":
        return this.patients.filter((p) =>
          ACTION_STATUSES.includes(p.status),
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

  get filteredDashPatients(): Patient[] {
    const ACTION_STATUSES = ["draft", "pending_scheduling", "postponed"]
    let list: Patient[]

    if (this.tileFilter && this.tileFilter !== "today") {
      switch (this.tileFilter) {
        case "action":
          list = this.patients.filter((p) =>
            ACTION_STATUSES.includes(p.status),
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
        (!this.dashDept ||
          p.department.toLowerCase().includes(this.dashDept.toLowerCase())),
    )
  }

  async submitOTRequest() {
    this.showSubmitConfirm = false
    if (!this.form.name) return
    this.isSubmitting = true

    try {
      const payload = {
        name: this.form.name.trim(),
        uhid: this.form.uhid ? this.form.uhid.trim() : undefined,
        age: Number(this.form.age) || 35,
        gender: this.form.gender || "M",
        bloodGroup: this.form.bloodGroup || "O+",
        phone: "9876543210",
        department: this.form.department || "General Surgery",
        diagnosis: this.form.diagnosis?.trim() || "Diagnosis Pending",
        surgeryType: this.form.surgeryType?.trim() || "Elective Surgery",
        surgeon: this.form.surgeon?.trim() || "Dr. Rajesh Kumar",
        ward: this.form.ward?.trim() || "General Ward A",
        bedNumber: this.form.bedNumber?.trim() || "Bed 101",
        scheduledDate: this.form.preferredDate || TODAY,
        scheduledTime: this.form.preferredTime || "09:00",
        estimatedDuration: 90,
        priority: this.form.priority,
        surgeryCategory: this.form.isEmergency ? "emergency" : this.form.priority,
        notes: this.form.notes || (this.form.isEmergency ? "Emergency case requested" : "Routine elective surgery request"),
      }

      const created = await this.api.requestOtSlot(payload)
      if (created) {
        // Emit patient created so that AppComponent updates all portals immediately
        this.patientCreated.emit(created)
      }
      this.submitted = true
    } catch (err) {
      console.error("Error submitting OT slot request:", err)
      this.submitted = true
    } finally {
      this.isSubmitting = false
    }
  }

  // OT Schedule helpers
  get filteredSchedPatients(): Patient[] {
    const sched = this.patients.filter(
      (p) => p.scheduledDate === this.filterDate && p.status !== "cancelled",
    )
    return sched.filter((p) => matchesStatusFilter(p, this.filterStatus))
  }

  get rooms() {
    return otRooms.map((r) => ({
      id: r.id,
      name: r.name,
      specialization: r.specialization,
    }))
  }

  get timelineSlots(): OTSlot[] {
    return this.filteredSchedPatients.map((p) => {
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

  onTimelineSlotClick(data: { slot: OTSlot; event: MouseEvent }) {
    const p = this.patients.find((x) => x.id === data.slot.patientId)
    if (p) {
      this.otSlotPanel = p
      this.otSlotPos = { x: data.event.clientX, y: data.event.clientY }
      this.showSummaryModal = false
    }
  }

  // Calendar
  prevMonth() {
    this.calMonth =
      this.calMonth.month === 0
        ? { year: this.calMonth.year - 1, month: 11 }
        : { year: this.calMonth.year, month: this.calMonth.month - 1 }
  }

  nextMonth() {
    this.calMonth =
      this.calMonth.month === 11
        ? { year: this.calMonth.year + 1, month: 0 }
        : { year: this.calMonth.year, month: this.calMonth.month + 1 }
  }

  toDateStr(d: number): string {
    const { year, month } = this.calMonth
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }

  hasPatientsOn(d: number): boolean {
    const ds = this.toDateStr(d)
    return this.patients.some((p) => p.scheduledDate === ds)
  }

  get calCells(): (number | null)[] {
    const { year, month } = this.calMonth
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
  }

  getCalBtnClass(d: number): string {
    const ds = this.toDateStr(d)
    const isSelected = ds === this.filterDate
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

  printSummary() {
    const el = document.getElementById("ot-summary-content")
    if (!el || !this.otSlotPanel) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<html><head><title>Patient Summary - ${this.otSlotPanel.name}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;font-size:13px}
      h1{font-size:18px;margin-bottom:4px}h2{font-size:14px;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .row{display:flex;gap:8px;margin-bottom:6px}.label{color:#64748b;width:160px;flex-shrink:0}.value{font-weight:600}
      </style></head><body>`)
    win.document.write(el.innerHTML)
    win.document.write("</body></html>")
    win.document.close()
    win.print()
  }

  // Reports
  get completedCount(): number {
    return this.patients.filter((p) => p.status === "completed").length
  }

  get cancelledCount(): number {
    return this.patients.filter((p) => p.status === "cancelled").length
  }

  get deptReportEntries() {
    const byDept: Record<string, number> = {}
    this.patients.forEach((p) => {
      byDept[p.department] = (byDept[p.department] ?? 0) + 1
    })
    const entries = Object.entries(byDept).sort((a, b) => b[1] - a[1])
    const max = Math.max(...entries.map((e) => e[1]), 1)
    return entries.map(([dept, count]) => ({
      dept,
      count,
      pct: (count / max) * 100,
    }))
  }
}
