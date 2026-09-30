using System.Text.Json.Serialization;

namespace Backend.Models;

public class Vitals
{
    public string Bp { get; set; } = "120/80";
    public int Hr { get; set; } = 72;
    public int Spo2 { get; set; } = 99;
    public double Temp { get; set; } = 98.6;
    public int Rr { get; set; } = 16;
    public double Weight { get; set; } = 65;
    public double Height { get; set; } = 168;
}

public class PreOpChecklist
{
    public bool ConsentSigned { get; set; }
    public bool NbmStatus { get; set; }
    public bool JewelryRemoved { get; set; }
    public bool NailPolishRemoved { get; set; }
    public bool IdBandAttached { get; set; }
    public bool IvAccessDone { get; set; }
    public bool LabsReviewed { get; set; }
    public bool EcgReviewed { get; set; }
    public bool ImagingReviewed { get; set; }
    public bool AnaesthesiaCleared { get; set; }
    public bool SurgeonClearance { get; set; }
    public bool BloodOrdered { get; set; }
}

public class WorkflowHistoryEntry
{
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
    public string Action { get; set; } = string.Empty;
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class PatientRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string FromPortal { get; set; } = string.Empty;
    public string ToPortal { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
    public string Status { get; set; } = "pending";
    public string? Reply { get; set; }
    public string? ReplyTimestamp { get; set; }
}

public class Patient
{
    public string Id { get; set; } = string.Empty;
    public string Uhid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = "M";
    public string BloodGroup { get; set; } = "O+";
    public string Phone { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string SurgeryType { get; set; } = string.Empty;
    public string Surgeon { get; set; } = string.Empty;
    public string SurgeonId { get; set; } = string.Empty;
    public string Anaesthesiologist { get; set; } = string.Empty;
    public string AnaesthesiologistId { get; set; } = string.Empty;
    public string OtRoom { get; set; } = string.Empty;
    public string ScheduledDate { get; set; } = string.Empty;
    public string ScheduledTime { get; set; } = string.Empty;
    public int EstimatedDuration { get; set; } = 90;
    public string Status { get; set; } = "draft";
    public string PacStatus { get; set; } = "pending";
    public string Priority { get; set; } = "elective";
    public string Ward { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string AdmissionDate { get; set; } = string.Empty;
    public List<string> Allergies { get; set; } = new();
    public List<string> Comorbidities { get; set; } = new();
    public string AnaesthesiaType { get; set; } = "GA";
    public string AnaesthesiaRisk { get; set; } = "ASA-I";
    public string Notes { get; set; } = string.Empty;
    public Vitals Vitals { get; set; } = new();
    public PreOpChecklist Checklist { get; set; } = new();
    public string SurgeryCategory { get; set; } = "elective";
    public List<WorkflowHistoryEntry> History { get; set; } = new();

    public string? PatientFitness { get; set; }
    public string? FitnessReason { get; set; }
    public string? ReviewDate { get; set; }
    public string? UnitChief { get; set; }
    public string? PrimarySurgeon { get; set; }
    public string? AssistantSurgeon { get; set; }
    public string? PgSurgery { get; set; }
    public List<string>? EquipmentRequirements { get; set; }
    public string? ScrubNurse { get; set; }
    public string? FloorNurse { get; set; }
    public string? OtatTechnician { get; set; }
    public string? AnaesthesiaAssistant { get; set; }
    public string? PgAnaesthesia { get; set; }
    public string? PostponedFromStatus { get; set; }
    public string? PostponementReason { get; set; }
    public string? ActualStartTime { get; set; }
    public string? ActualEndTime { get; set; }
    public string? PmrStatus { get; set; }
    public string? HpeStatus { get; set; }
    public string? IntraOpNotes { get; set; }
    public List<PatientRequest> Requests { get; set; } = new();
}

public class OTRoom
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "available"; // available | occupied | cleaning | maintenance
    public string? CurrentPatient { get; set; }
    public string? CurrentSurgery { get; set; }
    public string? NextPatient { get; set; }
    public string? NextTime { get; set; }
    public string Specialization { get; set; } = string.Empty;
}

public class OTSlot
{
    public string Id { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientId { get; set; } = string.Empty;
    public string Uhid { get; set; } = string.Empty;
    public string Surgeon { get; set; } = string.Empty;
    public string Anaesthesiologist { get; set; } = string.Empty;
    public string Procedure { get; set; } = string.Empty;
    public double StartHour { get; set; }
    public double DurationHours { get; set; }
    public string Status { get; set; } = "scheduled";
}

public class Surgeon
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public bool Available { get; set; } = true;
    public int ScheduledSurgeries { get; set; }
}

public class ModuleInfo
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}

public class HistoryEntryDto
{
    public string Action { get; set; } = string.Empty;
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class PortalRequestCreateDto
{
    public string FromPortal { get; set; } = string.Empty;
    public string ToPortal { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public class PortalRequestResolveDto
{
    public string Status { get; set; } = "resolved";
    public string? Reply { get; set; }
}
