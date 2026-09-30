import { Injectable } from '@angular/core';
import type { Patient, WorkflowHistoryEntry, OTRoom, OTSlot } from '../types';
import { patients as fallbackPatients } from '../data/mock';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl =
    typeof window !== 'undefined' && (window.location.port === '5100' || window.location.port === '')
      ? '/api'
      : 'http://localhost:5100/api';

  async getPatients(): Promise<Patient[]> {
    try {
      const res = await fetch(`${this.baseUrl}/patients`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API unavailable, falling back to local dataset:', err);
      return fallbackPatients;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/patients/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn(`Failed to fetch patient ${id}:`, err);
      return fallbackPatients.find((p) => p.id === id) ?? null;
    }
  }

  async updatePatient(id: string, updates: Partial<Patient>, historyEntry?: WorkflowHistoryEntry): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/patients/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (historyEntry) {
        await fetch(`${this.baseUrl}/patients/${encodeURIComponent(id)}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(historyEntry),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Failed to update patient ${id} on backend:`, err);
      return null;
    }
  }

  // =========================================================================
  // WORKFLOW PIPELINE METHODS (Surgery OP -> PAC -> OT Matron -> HOD Anaesthesia)
  // =========================================================================

  /** Step 1: Surgery OP Ward adds a new patient for OT slot */
  async requestOtSlot(dto: any): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/request-ot-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to request OT slot via backend, using local fallback:', err);
      const count = Math.floor(Math.random() * 900) + 100;
      const id = 'P' + count;
      const newP: Patient = {
        id,
        uhid: dto.uhid || ('SRM2024' + count),
        name: dto.name,
        age: Number(dto.age) || 35,
        gender: dto.gender || 'M',
        bloodGroup: dto.bloodGroup || 'O+',
        phone: dto.phone || '9876543210',
        department: dto.department || 'General Surgery',
        diagnosis: dto.diagnosis || 'Clinical Diagnosis',
        surgeryType: dto.surgeryType || 'Elective Procedure',
        surgeon: dto.surgeon || 'Dr. Rajesh Kumar',
        ward: dto.ward || 'General Ward A',
        bedNumber: dto.bedNumber || 'Bed 101',
        admissionDate: '2024-12-20',
        scheduledDate: dto.scheduledDate || '2024-12-20',
        scheduledTime: dto.scheduledTime || '09:00',
        estimatedDuration: dto.estimatedDuration || 90,
        otRoom: '',
        anaesthesiaType: 'GA',
        anaesthesiaRisk: 'ASA-I',
        anaesthesiologist: '',
        pacStatus: 'pending',
        patientFitness: 'pending',
        status: 'pending_fitness',
        priority: dto.priority || 'elective',
        surgeryCategory: dto.surgeryCategory || 'elective',
        notes: dto.notes || '',
        history: [{
          action: 'OT Slot Request Created',
          fromStatus: 'draft',
          toStatus: 'pending_fitness',
          performedBy: 'Surgery OP Ward',
          timestamp: new Date().toISOString(),
          notes: `New patient ${dto.name} submitted for OT slot. Forwarded to Anaesthesia OP/PAC.`,
        }],
        requests: [],
      };
      return newP;
    }
  }

  /** Step 2: Anaesthesia OP / PAC marks patient Fit or Unfit (with reason & review date) */
  async assessAnaesthesiaFitness(patientId: string, dto: {
    isFit: boolean;
    fitnessReason?: string;
    reviewDate?: string;
    assessedBy?: string;
    anaesthesiaType?: string;
    anaesthesiaRisk?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/anaesthesia-fitness/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to assess anaesthesia fitness:', err);
      return null;
    }
  }

  /** Step 3: Surgery OP Ward submits schedule, surgeons, and equipments to Department HOD */
  async submitSchedule(patientId: string, dto: {
    scheduledDate: string;
    scheduledTime?: string;
    estimatedDuration: number;
    unitChief?: string;
    primarySurgeon: string;
    assistantSurgeon?: string;
    pgSurgery?: string;
    equipmentRequirements?: string[];
    scheduledBy?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/submit-schedule/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to submit schedule to Department HOD:', err);
      return null;
    }
  }

  /** Step 4A: Department HOD approves surgery -> moves to OT Matron */
  async deptHodApprove(patientId: string, dto: {
    approvedBy?: string;
    remarks?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/dept-hod-approve/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to approve by Department HOD:', err);
      return null;
    }
  }

  /** Step 4B: Department HOD postpones surgery with review date and reason */
  async deptHodPostpone(patientId: string, dto: {
    postponementReason: string;
    reviewDate: string;
    postponedBy?: string;
    remarks?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/dept-hod-postpone/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to postpone by Department HOD:', err);
      return null;
    }
  }

  /** Step 5: OT Matron assigns the OT Room and Staff */
  async assignOtAndStaff(patientId: string, dto: {
    otRoom: string;
    scheduledDate?: string;
    scheduledTime?: string;
    scrubNurse: string;
    floorNurse: string;
    otatTechnician: string;
    assignedBy?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/assign-ot-staff/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to assign OT and staff:', err);
      return null;
    }
  }

  /** Step 6A: HOD Anaesthesia assigns Anaesthesiologist, Assistant, PG and APPROVES for surgery */
  async approveForSurgery(patientId: string, dto: {
    anaesthesiologist: string;
    anaesthesiaAssistant?: string;
    pgAnaesthesia?: string;
    approvedBy?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/hod-approve/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to approve for surgery:', err);
      return null;
    }
  }

  /** Step 6B: HOD Anaesthesia POSTPONES surgery with reason and review date */
  async postponeSurgery(patientId: string, dto: {
    postponementReason: string;
    reviewDate?: string;
    newScheduledDate?: string;
    postponedBy?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/hod-postpone/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to postpone surgery:', err);
      return null;
    }
  }

  /** Step 7A: OT Matron starts surgery on surgery day (Start Button) */
  async startSurgery(patientId: string, dto: {
    actualStartTime?: string;
    startedBy?: string;
    notes?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/start-surgery/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to start surgery:', err);
      return null;
    }
  }

  /** Step 7B: OT Matron completes surgery after operation completes (Complete Button - Final Step) */
  async completeSurgery(patientId: string, dto: {
    actualEndTime?: string;
    actualStartTime?: string;
    intraOpNotes?: string;
    pmrStatus?: string;
    hpeStatus?: string;
    completedBy?: string;
  }): Promise<Patient | null> {
    try {
      const res = await fetch(`${this.baseUrl}/workflow/complete-surgery/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to complete surgery:', err);
      return null;
    }
  }

  async getRooms(): Promise<OTRoom[]> {
    try {
      const res = await fetch(`${this.baseUrl}/ot/rooms`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch OT rooms:', err);
      return [];
    }
  }

  async getSlots(): Promise<OTSlot[]> {
    try {
      const res = await fetch(`${this.baseUrl}/ot/slots`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch OT slots:', err);
      return [];
    }
  }

  async getAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/analytics/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch analytics:', err);
      return null;
    }
  }
}
