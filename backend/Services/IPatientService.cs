using Backend.Models;

namespace Backend.Services;

public interface IPatientService
{
    Task<IEnumerable<Patient>> GetPatientsAsync(string? search = null, string? department = null, string? status = null, string? priority = null);
    Task<Patient?> GetPatientByIdAsync(string id);
    Task<Patient> CreatePatientAsync(Patient patient);
    Task<Patient?> UpdatePatientAsync(string id, Patient patient, WorkflowHistoryEntry? historyEntry = null);
    Task<bool> DeletePatientAsync(string id);
    Task<WorkflowHistoryEntry?> AddHistoryEntryAsync(string id, HistoryEntryDto dto);
    Task<PatientRequest?> AddPortalRequestAsync(string id, PortalRequestCreateDto dto);
    Task<PatientRequest?> ResolvePortalRequestAsync(string id, string requestId, PortalRequestResolveDto dto);
    
    Task<IEnumerable<OTRoom>> GetRoomsAsync();
    Task<OTRoom> AddOrUpdateRoomAsync(OTRoom room);
    
    Task<IEnumerable<OTSlot>> GetScheduleSlotsAsync(string? date = null);
    Task<IEnumerable<Surgeon>> GetSurgeonsAsync();
    Task<IEnumerable<ModuleInfo>> GetModulesAsync();
    
    Task<object> GetAnalyticsSummaryAsync();

    // Specific Workflow Pipeline Methods requested by user
    Task<Patient> RequestOtSlotAsync(SurgeryOpWardRequestDto dto);
    Task<Patient?> AssessAnaesthesiaFitnessAsync(string patientId, AnaesthesiaFitnessDto dto);
    Task<Patient?> SubmitScheduleAsync(string patientId, SurgeryScheduleDto dto);
    Task<Patient?> DeptHodApproveAsync(string patientId, DeptHODApprovalDto dto);
    Task<Patient?> DeptHodPostponeAsync(string patientId, DeptHODPostponeDto dto);
    Task<Patient?> AssignOtAndStaffAsync(string patientId, OTMatronAssignDto dto);
    Task<Patient?> ApproveForSurgeryAsync(string patientId, HODApprovalDto dto);
    Task<Patient?> PostponeSurgeryAsync(string patientId, HODPostponeDto dto);
    Task<Patient?> StartSurgeryAsync(string patientId, StartSurgeryDto dto);
    Task<Patient?> CompleteSurgeryAsync(string patientId, CompleteSurgeryDto dto);
}
