import { Component, OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { modules, patients as initialPatients } from "./data/mock"
import type { Module, Patient, WorkflowHistoryEntry } from "./types"
import { ApiService } from "./services/api.service"
import { ShellComponent } from "./components/shell.component"
import { SurgeryOPWardComponent } from "./modules/surgery-op-ward.component"
import { AnaesthesiaOPPACComponent } from "./modules/anaesthesia-op-pac.component"
import { DepartmentHODComponent } from "./modules/department-hod.component"
import { OTMatronComponent } from "./modules/ot-matron.component"
import { HODAnaesthesiaComponent } from "./modules/hod-anaesthesia.component"
import { HospitalAdminComponent } from "./modules/hospital-admin.component"

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "patient-list": "Today's Patients",
  "all-patients": "All Patients",
  "ot-schedule": "OT Schedule",
  "ot-master": "OT Master Schedule",
  reports: "Reports",
  "ot-rooms": "OT Rooms",
  "pending-approvals": "Pending Approvals",
  "patient-history": "Patient History",
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    SurgeryOPWardComponent,
    AnaesthesiaOPPACComponent,
    DepartmentHODComponent,
    OTMatronComponent,
    HODAnaesthesiaComponent,
    HospitalAdminComponent,
  ],
  template: `
    <app-shell
      [currentModule]="currentModule"
      [activePage]="activePage"
      [breadcrumb]="breadcrumb"
      (pageChange)="setActivePage($event)"
      (moduleChange)="onModuleChange($event)"
    >
      @switch (currentModuleId) {
        @case ('surgery-op-ward') {
          <app-surgery-op-ward
            [activePage]="activePage"
            [patients]="patients"
            (pageChange)="setActivePage($event)"
            (patientCreated)="onPatientCreated($event)"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-surgery-op-ward>
        }
        @case ('anaesthesia-op-pac') {
          <app-anaesthesia-op-pac
            [activePage]="activePage"
            [patients]="patients"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-anaesthesia-op-pac>
        }
        @case ('department-hod') {
          <app-department-hod
            [activePage]="activePage"
            [patients]="patients"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-department-hod>
        }
        @case ('ot-matron') {
          <app-ot-matron
            [activePage]="activePage"
            [patients]="patients"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-ot-matron>
        }
        @case ('hod-anaesthesia') {
          <app-hod-anaesthesia
            [activePage]="activePage"
            [patients]="patients"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-hod-anaesthesia>
        }
        @case ('hospital-admin') {
          <app-hospital-admin
            [activePage]="activePage"
            [patients]="patients"
            (patientUpdate)="onUpdatePatient($event)"
          ></app-hospital-admin>
        }
      }
    </app-shell>
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService)

  currentModuleId = "surgery-op-ward"
  activePages: Record<string, string> = {
    "surgery-op-ward": "dashboard",
    "anaesthesia-op-pac": "dashboard",
    "department-hod": "dashboard",
    "ot-matron": "dashboard",
    "hod-anaesthesia": "dashboard",
    "hospital-admin": "dashboard",
  }
  patients: Patient[] = [...initialPatients]

  async ngOnInit() {
    const list = await this.api.getPatients()
    if (list && list.length > 0) {
      this.patients = list
    }
  }

  get currentModule(): Module {
    return modules.find((m) => m.id === this.currentModuleId) ?? modules[0]
  }

  get activePage(): string {
    return this.activePages[this.currentModuleId] ?? "dashboard"
  }

  get breadcrumb(): string {
    return PAGE_LABELS[this.activePage] ?? ""
  }

  setActivePage(page: string) {
    this.activePages[this.currentModuleId] = page
  }

  onModuleChange(moduleId: string) {
    this.currentModuleId = moduleId
  }

  onPatientCreated(newPatient: Patient) {
    // Prepend new patient so it immediately appears at the top of All Patients & dashboards across all portals
    this.patients = [newPatient, ...this.patients.filter((p) => p.id !== newPatient.id)]
  }

  onUpdatePatient(event: {
    id: string
    updates: Partial<Patient>
    historyEntry?: WorkflowHistoryEntry
  }) {
    this.patients = this.patients.map((p) => {
      if (p.id === event.id) {
        return {
          ...p,
          ...event.updates,
          history: event.historyEntry
            ? [...p.history, event.historyEntry]
            : p.history,
        }
      }
      return p
    })

    // Sync with .NET 10 backend
    this.api.updatePatient(event.id, event.updates, event.historyEntry)
  }
}
