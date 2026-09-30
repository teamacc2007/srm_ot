using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<PatientDbEntity> Patients => Set<PatientDbEntity>();
    public DbSet<WorkflowHistoryDbEntity> WorkflowHistories => Set<WorkflowHistoryDbEntity>();
    public DbSet<PatientRequestDbEntity> PatientRequests => Set<PatientRequestDbEntity>();
    public DbSet<OTRoomDbEntity> OTRooms => Set<OTRoomDbEntity>();
    public DbSet<SurgeonDbEntity> Surgeons => Set<SurgeonDbEntity>();
    public DbSet<ModuleDbEntity> Modules => Set<ModuleDbEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PatientDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Uhid).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Department);

            entity.HasMany(e => e.History)
                  .WithOne(h => h.Patient)
                  .HasForeignKey(h => h.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Requests)
                  .WithOne(r => r.Patient)
                  .HasForeignKey(r => r.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkflowHistoryDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PatientId);
        });

        modelBuilder.Entity<PatientRequestDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PatientId);
        });

        modelBuilder.Entity<OTRoomDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<SurgeonDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<ModuleDbEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
        });
    }
}

public class PatientDbEntity
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
    public string Status { get; set; } = "pending_fitness";
    public string PacStatus { get; set; } = "pending";
    public string Priority { get; set; } = "elective";
    public string Ward { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string AdmissionDate { get; set; } = string.Empty;
    public string AnaesthesiaType { get; set; } = "GA";
    public string AnaesthesiaRisk { get; set; } = "ASA-I";
    public string Notes { get; set; } = string.Empty;
    public string SurgeryCategory { get; set; } = "elective";

    // Workflow state fields
    public string? PatientFitness { get; set; }
    public string? FitnessReason { get; set; }
    public string? ReviewDate { get; set; }
    public string? UnitChief { get; set; }
    public string? PrimarySurgeon { get; set; }
    public string? AssistantSurgeon { get; set; }
    public string? PgSurgery { get; set; }
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

    // JSON columns for complex structures
    public string VitalsJson { get; set; } = "{}";
    public string ChecklistJson { get; set; } = "{}";
    public string AllergiesJson { get; set; } = "[]";
    public string ComorbiditiesJson { get; set; } = "[]";
    public string EquipmentRequirementsJson { get; set; } = "[]";

    // Navigation
    public List<WorkflowHistoryDbEntity> History { get; set; } = new();
    public List<PatientRequestDbEntity> Requests { get; set; } = new();

    public Patient ToDomain()
    {
        return new Patient
        {
            Id = Id,
            Uhid = Uhid,
            Name = Name,
            Age = Age,
            Gender = Gender,
            BloodGroup = BloodGroup,
            Phone = Phone,
            Department = Department,
            Diagnosis = Diagnosis,
            SurgeryType = SurgeryType,
            Surgeon = Surgeon,
            SurgeonId = SurgeonId,
            Anaesthesiologist = Anaesthesiologist,
            AnaesthesiologistId = AnaesthesiologistId,
            OtRoom = OtRoom,
            ScheduledDate = ScheduledDate,
            ScheduledTime = ScheduledTime,
            EstimatedDuration = EstimatedDuration,
            Status = Status,
            PacStatus = PacStatus,
            Priority = Priority,
            Ward = Ward,
            BedNumber = BedNumber,
            AdmissionDate = AdmissionDate,
            AnaesthesiaType = AnaesthesiaType,
            AnaesthesiaRisk = AnaesthesiaRisk,
            Notes = Notes,
            SurgeryCategory = SurgeryCategory,
            PatientFitness = PatientFitness,
            FitnessReason = FitnessReason,
            ReviewDate = ReviewDate,
            UnitChief = UnitChief,
            PrimarySurgeon = PrimarySurgeon,
            AssistantSurgeon = AssistantSurgeon,
            PgSurgery = PgSurgery,
            ScrubNurse = ScrubNurse,
            FloorNurse = FloorNurse,
            OtatTechnician = OtatTechnician,
            AnaesthesiaAssistant = AnaesthesiaAssistant,
            PgAnaesthesia = PgAnaesthesia,
            PostponedFromStatus = PostponedFromStatus,
            PostponementReason = PostponementReason,
            ActualStartTime = ActualStartTime,
            ActualEndTime = ActualEndTime,
            PmrStatus = PmrStatus,
            HpeStatus = HpeStatus,
            IntraOpNotes = IntraOpNotes,
            Vitals = JsonSerializer.Deserialize<Vitals>(VitalsJson) ?? new Vitals(),
            Checklist = JsonSerializer.Deserialize<PreOpChecklist>(ChecklistJson) ?? new PreOpChecklist(),
            Allergies = JsonSerializer.Deserialize<List<string>>(AllergiesJson) ?? new List<string>(),
            Comorbidities = JsonSerializer.Deserialize<List<string>>(ComorbiditiesJson) ?? new List<string>(),
            EquipmentRequirements = JsonSerializer.Deserialize<List<string>>(EquipmentRequirementsJson) ?? new List<string>(),
            History = History.Select(h => new WorkflowHistoryEntry
            {
                Action = h.Action,
                Timestamp = h.Timestamp,
                FromStatus = h.FromStatus,
                ToStatus = h.ToStatus,
                PerformedBy = h.PerformedBy,
                Notes = h.Notes
            }).ToList(),
            Requests = Requests.Select(r => new PatientRequest
            {
                Id = r.Id,
                FromPortal = r.FromPortal,
                ToPortal = r.ToPortal,
                Comment = r.Comment,
                Timestamp = r.Timestamp,
                Status = r.Status,
                Reply = r.Reply,
                ReplyTimestamp = r.ReplyTimestamp
            }).ToList()
        };
    }

    public static PatientDbEntity FromDomain(Patient p)
    {
        return new PatientDbEntity
        {
            Id = p.Id,
            Uhid = p.Uhid,
            Name = p.Name,
            Age = p.Age,
            Gender = p.Gender,
            BloodGroup = p.BloodGroup,
            Phone = p.Phone,
            Department = p.Department,
            Diagnosis = p.Diagnosis,
            SurgeryType = p.SurgeryType,
            Surgeon = p.Surgeon,
            SurgeonId = p.SurgeonId,
            Anaesthesiologist = p.Anaesthesiologist,
            AnaesthesiologistId = p.AnaesthesiologistId,
            OtRoom = p.OtRoom,
            ScheduledDate = p.ScheduledDate,
            ScheduledTime = p.ScheduledTime,
            EstimatedDuration = p.EstimatedDuration,
            Status = p.Status,
            PacStatus = p.PacStatus,
            Priority = p.Priority,
            Ward = p.Ward,
            BedNumber = p.BedNumber,
            AdmissionDate = p.AdmissionDate,
            AnaesthesiaType = p.AnaesthesiaType,
            AnaesthesiaRisk = p.AnaesthesiaRisk,
            Notes = p.Notes,
            SurgeryCategory = p.SurgeryCategory,
            PatientFitness = p.PatientFitness,
            FitnessReason = p.FitnessReason,
            ReviewDate = p.ReviewDate,
            UnitChief = p.UnitChief,
            PrimarySurgeon = p.PrimarySurgeon,
            AssistantSurgeon = p.AssistantSurgeon,
            PgSurgery = p.PgSurgery,
            ScrubNurse = p.ScrubNurse,
            FloorNurse = p.FloorNurse,
            OtatTechnician = p.OtatTechnician,
            AnaesthesiaAssistant = p.AnaesthesiaAssistant,
            PgAnaesthesia = p.PgAnaesthesia,
            PostponedFromStatus = p.PostponedFromStatus,
            PostponementReason = p.PostponementReason,
            ActualStartTime = p.ActualStartTime,
            ActualEndTime = p.ActualEndTime,
            PmrStatus = p.PmrStatus,
            HpeStatus = p.HpeStatus,
            IntraOpNotes = p.IntraOpNotes,
            VitalsJson = JsonSerializer.Serialize(p.Vitals),
            ChecklistJson = JsonSerializer.Serialize(p.Checklist),
            AllergiesJson = JsonSerializer.Serialize(p.Allergies),
            ComorbiditiesJson = JsonSerializer.Serialize(p.Comorbidities),
            EquipmentRequirementsJson = JsonSerializer.Serialize(p.EquipmentRequirements ?? new List<string>()),
            History = p.History.Select(h => new WorkflowHistoryDbEntity
            {
                PatientId = p.Id,
                Action = h.Action,
                Timestamp = h.Timestamp,
                FromStatus = h.FromStatus,
                ToStatus = h.ToStatus,
                PerformedBy = h.PerformedBy,
                Notes = h.Notes
            }).ToList(),
            Requests = p.Requests.Select(r => new PatientRequestDbEntity
            {
                Id = r.Id,
                PatientId = p.Id,
                FromPortal = r.FromPortal,
                ToPortal = r.ToPortal,
                Comment = r.Comment,
                Timestamp = r.Timestamp,
                Status = r.Status,
                Reply = r.Reply,
                ReplyTimestamp = r.ReplyTimestamp
            }).ToList()
        };
    }
}

public class WorkflowHistoryDbEntity
{
    public int Id { get; set; }
    public string PatientId { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
    public string Action { get; set; } = string.Empty;
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public PatientDbEntity? Patient { get; set; }
}

public class PatientRequestDbEntity
{
    public string Id { get; set; } = string.Empty;
    public string PatientId { get; set; } = string.Empty;
    public string FromPortal { get; set; } = string.Empty;
    public string ToPortal { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
    public string Status { get; set; } = "pending";
    public string? Reply { get; set; }
    public string? ReplyTimestamp { get; set; }

    public PatientDbEntity? Patient { get; set; }
}

public class OTRoomDbEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "available";
    public string? CurrentPatient { get; set; }
    public string? CurrentSurgery { get; set; }
    public string? NextPatient { get; set; }
    public string? NextTime { get; set; }
    public string Specialization { get; set; } = string.Empty;
}

public class SurgeonDbEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public bool Available { get; set; } = true;
    public int ScheduledSurgeries { get; set; }
}

public class ModuleDbEntity
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}
