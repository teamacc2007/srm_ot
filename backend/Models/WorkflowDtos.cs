namespace Backend.Models;

public class SurgeryOpWardRequestDto
{
    public string? Uhid { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = "M";
    public string BloodGroup { get; set; } = "O+";
    public string Phone { get; set; } = string.Empty;
    public string Department { get; set; } = "General Surgery";
    public string Diagnosis { get; set; } = string.Empty;
    public string SurgeryType { get; set; } = string.Empty;
    public string Surgeon { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string ScheduledDate { get; set; } = string.Empty;
    public string ScheduledTime { get; set; } = "09:00";
    public int EstimatedDuration { get; set; } = 90;
    public string Priority { get; set; } = "elective";
    public string SurgeryCategory { get; set; } = "elective";
    public string? UnitChief { get; set; }
    public string? PrimarySurgeon { get; set; }
    public string? AssistantSurgeon { get; set; }
    public string? Notes { get; set; }
    public List<string>? SpecialRequirements { get; set; }
}

public class AnaesthesiaFitnessDto
{
    public bool IsFit { get; set; }
    public string? FitnessReason { get; set; } // Required if IsFit is false
    public string? ReviewDate { get; set; }    // Required if IsFit is false
    public string AssessedBy { get; set; } = "Dr. Dinesh Patel";
    public string? AnaesthesiaType { get; set; } = "GA";
    public string? AnaesthesiaRisk { get; set; } = "ASA-I";
    public string? Notes { get; set; }
}

public class OTMatronAssignDto
{
    public string OtRoom { get; set; } = string.Empty;
    public string? ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string ScrubNurse { get; set; } = string.Empty;
    public string FloorNurse { get; set; } = string.Empty;
    public string OtatTechnician { get; set; } = string.Empty;
    public string AssignedBy { get; set; } = "Sr. Meenakshi R.";
    public string? Notes { get; set; }
}

public class HODApprovalDto
{
    public string Anaesthesiologist { get; set; } = string.Empty;
    public string? AnaesthesiaAssistant { get; set; }
    public string? PgAnaesthesia { get; set; }
    public string ApprovedBy { get; set; } = "Dr. Sunita Krishnan";
    public string? Notes { get; set; }
}

public class HODPostponeDto
{
    public string PostponementReason { get; set; } = string.Empty; // Required
    public string? ReviewDate { get; set; }
    public string? NewScheduledDate { get; set; }
    public string PostponedBy { get; set; } = "Dr. Sunita Krishnan";
    public string? Notes { get; set; }
}

public class SurgeryScheduleDto
{
    public string ScheduledDate { get; set; } = string.Empty;
    public string ScheduledTime { get; set; } = "09:00";
    public int EstimatedDuration { get; set; } = 90;
    public string? UnitChief { get; set; }
    public string PrimarySurgeon { get; set; } = string.Empty;
    public string? AssistantSurgeon { get; set; }
    public string? PgSurgery { get; set; }
    public List<string>? EquipmentRequirements { get; set; }
    public string ScheduledBy { get; set; } = "Surgery OP Ward";
    public string? Notes { get; set; }
}

public class DeptHODApprovalDto
{
    public string ApprovedBy { get; set; } = "Department HOD";
    public string? Remarks { get; set; }
}

public class DeptHODPostponeDto
{
    public string PostponementReason { get; set; } = string.Empty; // Required
    public string ReviewDate { get; set; } = string.Empty;          // Required
    public string PostponedBy { get; set; } = "Department HOD";
    public string? Remarks { get; set; }
}

public class StartSurgeryDto
{
    public string ActualStartTime { get; set; } = DateTime.UtcNow.ToString("HH:mm");
    public string StartedBy { get; set; } = "OT Matron";
    public string? Notes { get; set; }
}

public class CompleteSurgeryDto
{
    public string ActualEndTime { get; set; } = DateTime.UtcNow.ToString("HH:mm");
    public string? ActualStartTime { get; set; }
    public string? IntraOpNotes { get; set; }
    public string? PmrStatus { get; set; } = "completed";
    public string? HpeStatus { get; set; } = "not_sent";
    public string CompletedBy { get; set; } = "OT Matron";
}
