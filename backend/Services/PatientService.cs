using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Services;

public class PatientService : IPatientService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PatientService> _logger;

    public PatientService(AppDbContext db, IWebHostEnvironment env, ILogger<PatientService> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    public async Task InitializeDatabaseAsync()
    {
        // Ensure SQL database is created
        await _db.Database.EnsureCreatedAsync();

        // Seed initial data if database is empty
        if (!await _db.Patients.AnyAsync())
        {
            _logger.LogInformation("Database empty. Seeding initial SQL tables from JSON...");
            await SeedInitialDataAsync();
        }
    }

    private async Task SeedInitialDataAsync()
    {
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var dataDir = Path.Combine(_env.ContentRootPath, "Data");

        try
        {
            // Seed Patients
            var patientsPath = Path.Combine(dataDir, "patients.json");
            if (File.Exists(patientsPath))
            {
                var json = await File.ReadAllTextAsync(patientsPath);
                var list = JsonSerializer.Deserialize<List<Patient>>(json, jsonOptions) ?? new();
                foreach (var p in list)
                {
                    _db.Patients.Add(PatientDbEntity.FromDomain(p));
                }
            }

            // Seed Rooms
            var roomsPath = Path.Combine(dataDir, "otRooms.json");
            if (File.Exists(roomsPath))
            {
                var json = await File.ReadAllTextAsync(roomsPath);
                var list = JsonSerializer.Deserialize<List<OTRoom>>(json, jsonOptions) ?? new();
                foreach (var r in list)
                {
                    _db.OTRooms.Add(new OTRoomDbEntity
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Status = r.Status,
                        Specialization = r.Specialization,
                        CurrentPatient = r.CurrentPatient,
                        CurrentSurgery = r.CurrentSurgery,
                        NextPatient = r.NextPatient,
                        NextTime = r.NextTime
                    });
                }
            }

            // Seed Surgeons
            var surgeonsPath = Path.Combine(dataDir, "surgeons.json");
            if (File.Exists(surgeonsPath))
            {
                var json = await File.ReadAllTextAsync(surgeonsPath);
                var list = JsonSerializer.Deserialize<List<Surgeon>>(json, jsonOptions) ?? new();
                foreach (var s in list)
                {
                    _db.Surgeons.Add(new SurgeonDbEntity
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Department = s.Department,
                        Designation = s.Designation,
                        Available = s.Available,
                        ScheduledSurgeries = s.ScheduledSurgeries
                    });
                }
            }

            // Seed Modules
            var modulesPath = Path.Combine(dataDir, "modules.json");
            if (File.Exists(modulesPath))
            {
                var json = await File.ReadAllTextAsync(modulesPath);
                var list = JsonSerializer.Deserialize<List<ModuleInfo>>(json, jsonOptions) ?? new();
                foreach (var m in list)
                {
                    _db.Modules.Add(new ModuleDbEntity
                    {
                        Id = m.Id,
                        Label = m.Label,
                        Role = m.Role,
                        User = m.User,
                        Department = m.Department
                    });
                }
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("SQL database seeded successfully with patients, rooms, surgeons, and modules");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed SQL database");
        }
    }

    public async Task<IEnumerable<Patient>> GetPatientsAsync(string? search = null, string? department = null, string? status = null, string? priority = null)
    {
        var query = _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(department))
        {
            query = query.Where(p => p.Department.ToLower() == department.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(p => p.Priority.ToLower() == priority.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status.Equals("requested", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Requests.Any(r => r.Status == "pending"));
            }
            else
            {
                query = query.Where(p => p.Status.ToLower() == status.ToLower());
            }
        }

        var list = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            list = list.Where(p =>
                p.Name.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                p.Uhid.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                p.Diagnosis.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                p.SurgeryType.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                p.Surgeon.Contains(s, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        return list.Select(p => p.ToDomain()).OrderBy(p => p.Name).ToList();
    }

    public async Task<Patient?> GetPatientByIdAsync(string id)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return entity?.ToDomain();
    }

    public async Task<Patient> CreatePatientAsync(Patient patient)
    {
        if (string.IsNullOrWhiteSpace(patient.Id))
        {
            var count = await _db.Patients.CountAsync();
            patient.Id = $"P{count + 101:D3}";
        }
        if (string.IsNullOrWhiteSpace(patient.Uhid))
        {
            var count = await _db.Patients.CountAsync();
            patient.Uhid = $"SRM{DateTime.UtcNow:yyyyMMdd}{count + 1:D3}";
        }

        var entity = PatientDbEntity.FromDomain(patient);
        _db.Patients.Add(entity);
        await _db.SaveChangesAsync();

        return entity.ToDomain();
    }

    public async Task<Patient?> UpdatePatientAsync(string id, Patient update, WorkflowHistoryEntry? historyEntry = null)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (entity == null) return null;

        // Update fields
        entity.Name = update.Name ?? entity.Name;
        entity.Age = update.Age > 0 ? update.Age : entity.Age;
        entity.Gender = update.Gender ?? entity.Gender;
        entity.Department = update.Department ?? entity.Department;
        entity.Diagnosis = update.Diagnosis ?? entity.Diagnosis;
        entity.SurgeryType = update.SurgeryType ?? entity.SurgeryType;
        entity.Surgeon = update.Surgeon ?? entity.Surgeon;
        entity.Anaesthesiologist = update.Anaesthesiologist ?? entity.Anaesthesiologist;
        entity.OtRoom = update.OtRoom ?? entity.OtRoom;
        entity.ScheduledDate = update.ScheduledDate ?? entity.ScheduledDate;
        entity.ScheduledTime = update.ScheduledTime ?? entity.ScheduledTime;
        entity.EstimatedDuration = update.EstimatedDuration > 0 ? update.EstimatedDuration : entity.EstimatedDuration;
        entity.Status = update.Status ?? entity.Status;
        entity.PacStatus = update.PacStatus ?? entity.PacStatus;
        entity.Priority = update.Priority ?? entity.Priority;
        entity.Ward = update.Ward ?? entity.Ward;
        entity.BedNumber = update.BedNumber ?? entity.BedNumber;
        entity.AdmissionDate = update.AdmissionDate ?? entity.AdmissionDate;
        entity.Notes = update.Notes ?? entity.Notes;
        entity.SurgeryCategory = update.SurgeryCategory ?? entity.SurgeryCategory;

        if (update.PatientFitness != null) entity.PatientFitness = update.PatientFitness;
        if (update.FitnessReason != null) entity.FitnessReason = update.FitnessReason;
        if (update.ReviewDate != null) entity.ReviewDate = update.ReviewDate;
        if (update.UnitChief != null) entity.UnitChief = update.UnitChief;
        if (update.PrimarySurgeon != null) entity.PrimarySurgeon = update.PrimarySurgeon;
        if (update.AssistantSurgeon != null) entity.AssistantSurgeon = update.AssistantSurgeon;
        if (update.PgSurgery != null) entity.PgSurgery = update.PgSurgery;
        if (update.ScrubNurse != null) entity.ScrubNurse = update.ScrubNurse;
        if (update.FloorNurse != null) entity.FloorNurse = update.FloorNurse;
        if (update.OtatTechnician != null) entity.OtatTechnician = update.OtatTechnician;
        if (update.AnaesthesiaAssistant != null) entity.AnaesthesiaAssistant = update.AnaesthesiaAssistant;
        if (update.PgAnaesthesia != null) entity.PgAnaesthesia = update.PgAnaesthesia;
        if (update.PostponedFromStatus != null) entity.PostponedFromStatus = update.PostponedFromStatus;
        if (update.PostponementReason != null) entity.PostponementReason = update.PostponementReason;
        if (update.ActualStartTime != null) entity.ActualStartTime = update.ActualStartTime;
        if (update.ActualEndTime != null) entity.ActualEndTime = update.ActualEndTime;
        if (update.PmrStatus != null) entity.PmrStatus = update.PmrStatus;
        if (update.HpeStatus != null) entity.HpeStatus = update.HpeStatus;
        if (update.IntraOpNotes != null) entity.IntraOpNotes = update.IntraOpNotes;

        if (update.Vitals != null) entity.VitalsJson = JsonSerializer.Serialize(update.Vitals);
        if (update.Checklist != null) entity.ChecklistJson = JsonSerializer.Serialize(update.Checklist);
        if (update.Allergies?.Count > 0) entity.AllergiesJson = JsonSerializer.Serialize(update.Allergies);
        if (update.Comorbidities?.Count > 0) entity.ComorbiditiesJson = JsonSerializer.Serialize(update.Comorbidities);
        if (update.EquipmentRequirements != null) entity.EquipmentRequirementsJson = JsonSerializer.Serialize(update.EquipmentRequirements);

        if (historyEntry != null)
        {
            entity.History.Add(new WorkflowHistoryDbEntity
            {
                PatientId = id,
                Action = historyEntry.Action,
                FromStatus = historyEntry.FromStatus,
                ToStatus = historyEntry.ToStatus,
                PerformedBy = historyEntry.PerformedBy,
                Notes = historyEntry.Notes,
                Timestamp = historyEntry.Timestamp ?? DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            });
        }

        await _db.SaveChangesAsync();
        return entity.ToDomain();
    }

    public async Task<bool> DeletePatientAsync(string id)
    {
        var entity = await _db.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null) return false;

        _db.Patients.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<WorkflowHistoryEntry?> AddHistoryEntryAsync(string id, HistoryEntryDto dto)
    {
        var entity = await _db.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null) return null;

        var entry = new WorkflowHistoryDbEntity
        {
            PatientId = id,
            Action = dto.Action,
            FromStatus = dto.FromStatus,
            ToStatus = dto.ToStatus,
            PerformedBy = dto.PerformedBy,
            Notes = dto.Notes,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        _db.WorkflowHistories.Add(entry);
        entity.Status = dto.ToStatus;
        await _db.SaveChangesAsync();

        return new WorkflowHistoryEntry
        {
            Action = entry.Action,
            FromStatus = entry.FromStatus,
            ToStatus = entry.ToStatus,
            PerformedBy = entry.PerformedBy,
            Notes = entry.Notes,
            Timestamp = entry.Timestamp
        };
    }

    public async Task<PatientRequest?> AddPortalRequestAsync(string id, PortalRequestCreateDto dto)
    {
        var entity = await _db.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null) return null;

        var req = new PatientRequestDbEntity
        {
            Id = $"REQ-{Guid.NewGuid():N}"[..10],
            PatientId = id,
            FromPortal = dto.FromPortal,
            ToPortal = dto.ToPortal,
            Comment = dto.Comment,
            Status = "pending",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        _db.PatientRequests.Add(req);
        await _db.SaveChangesAsync();

        return new PatientRequest
        {
            Id = req.Id,
            FromPortal = req.FromPortal,
            ToPortal = req.ToPortal,
            Comment = req.Comment,
            Status = req.Status,
            Timestamp = req.Timestamp
        };
    }

    public async Task<PatientRequest?> ResolvePortalRequestAsync(string id, string requestId, PortalRequestResolveDto dto)
    {
        var req = await _db.PatientRequests.FirstOrDefaultAsync(r => r.PatientId == id && r.Id == requestId);
        if (req == null) return null;

        req.Status = dto.Status ?? "resolved";
        req.Reply = dto.Reply;
        req.ReplyTimestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        await _db.SaveChangesAsync();

        return new PatientRequest
        {
            Id = req.Id,
            FromPortal = req.FromPortal,
            ToPortal = req.ToPortal,
            Comment = req.Comment,
            Status = req.Status,
            Timestamp = req.Timestamp,
            Reply = req.Reply,
            ReplyTimestamp = req.ReplyTimestamp
        };
    }

    public async Task<IEnumerable<OTRoom>> GetRoomsAsync()
    {
        var list = await _db.OTRooms.AsNoTracking().ToListAsync();
        return list.Select(r => new OTRoom
        {
            Id = r.Id,
            Name = r.Name,
            Status = r.Status,
            Specialization = r.Specialization,
            CurrentPatient = r.CurrentPatient,
            CurrentSurgery = r.CurrentSurgery,
            NextPatient = r.NextPatient,
            NextTime = r.NextTime
        }).OrderBy(r => r.Name).ToList();
    }

    public async Task<OTRoom> AddOrUpdateRoomAsync(OTRoom room)
    {
        var entity = await _db.OTRooms.FirstOrDefaultAsync(r => r.Id == room.Id);
        if (entity == null)
        {
            entity = new OTRoomDbEntity
            {
                Id = string.IsNullOrWhiteSpace(room.Id) ? $"ot-{await _db.OTRooms.CountAsync() + 1}" : room.Id,
                Name = room.Name,
                Status = room.Status,
                Specialization = room.Specialization,
                CurrentPatient = room.CurrentPatient,
                CurrentSurgery = room.CurrentSurgery,
                NextPatient = room.NextPatient,
                NextTime = room.NextTime
            };
            _db.OTRooms.Add(entity);
        }
        else
        {
            entity.Name = room.Name;
            entity.Status = room.Status;
            entity.Specialization = room.Specialization;
            entity.CurrentPatient = room.CurrentPatient;
            entity.CurrentSurgery = room.CurrentSurgery;
            entity.NextPatient = room.NextPatient;
            entity.NextTime = room.NextTime;
        }

        await _db.SaveChangesAsync();
        room.Id = entity.Id;
        return room;
    }

    public async Task<IEnumerable<OTSlot>> GetScheduleSlotsAsync(string? date = null)
    {
        var patients = await _db.Patients.AsNoTracking().ToListAsync();
        var rooms = await _db.OTRooms.AsNoTracking().ToListAsync();

        var slots = new List<OTSlot>();

        foreach (var p in patients)
        {
            if (string.IsNullOrWhiteSpace(p.OtRoom) || string.IsNullOrWhiteSpace(p.ScheduledTime))
                continue;

            var parts = p.ScheduledTime.Split(':');
            if (parts.Length < 2 || !double.TryParse(parts[0], out var h) || !double.TryParse(parts[1], out var m))
                continue;

            var roomObj = rooms.FirstOrDefault(r =>
                r.Name.Equals(p.OtRoom, StringComparison.OrdinalIgnoreCase) ||
                r.Id.Equals(p.OtRoom, StringComparison.OrdinalIgnoreCase));

            var roomId = roomObj?.Id ?? p.OtRoom.ToLower().Replace(" ", "-");
            var roomName = roomObj?.Name ?? p.OtRoom;

            slots.Add(new OTSlot
            {
                Id = $"slot-{p.Id}",
                RoomId = roomId,
                RoomName = roomName,
                PatientId = p.Id,
                PatientName = p.Name,
                Uhid = p.Uhid,
                Surgeon = p.Surgeon,
                Anaesthesiologist = p.Anaesthesiologist,
                Procedure = p.SurgeryType,
                StartHour = h + (m / 60.0),
                DurationHours = (p.EstimatedDuration > 0 ? p.EstimatedDuration : 90) / 60.0,
                Status = p.Status
            });
        }

        return slots;
    }

    public async Task<IEnumerable<Surgeon>> GetSurgeonsAsync()
    {
        var list = await _db.Surgeons.AsNoTracking().ToListAsync();
        return list.Select(s => new Surgeon
        {
            Id = s.Id,
            Name = s.Name,
            Department = s.Department,
            Designation = s.Designation,
            Available = s.Available,
            ScheduledSurgeries = s.ScheduledSurgeries
        }).OrderBy(s => s.Name).ToList();
    }

    public async Task<IEnumerable<ModuleInfo>> GetModulesAsync()
    {
        var list = await _db.Modules.AsNoTracking().ToListAsync();
        return list.Select(m => new ModuleInfo
        {
            Id = m.Id,
            Label = m.Label,
            Role = m.Role,
            User = m.User,
            Department = m.Department
        }).ToList();
    }

    public async Task<object> GetAnalyticsSummaryAsync()
    {
        var patients = await _db.Patients.AsNoTracking().ToListAsync();
        var total = patients.Count;
        var completed = patients.Count(p => p.Status is "completed");
        var scheduled = patients.Count(p => p.Status is "scheduled" or "confirmed");
        var inProgress = patients.Count(p => p.Status is "in-progress" or "in_progress");
        var cancelled = patients.Count(p => p.Status is "cancelled");
        var postponed = patients.Count(p => p.Status is "postponed");

        var byDepartment = patients
            .GroupBy(p => p.Department)
            .Select(g => new { Department = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();

        var byStatus = patients
            .GroupBy(p => p.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToList();

        return new
        {
            TotalPatients = total,
            Completed = completed,
            Scheduled = scheduled,
            InProgress = inProgress,
            Cancelled = cancelled,
            Postponed = postponed,
            Departments = byDepartment,
            Statuses = byStatus,
            AverageSurgeryMinutes = patients.Any()
                ? Math.Round(patients.Average(p => p.EstimatedDuration), 1)
                : 90
        };
    }

    // =========================================================================
    // WORKFLOW PIPELINE IMPLEMENTATION (Matching User's Exact Workflow)
    // =========================================================================

    // STEP 1: Surgery OP Ward adds a new patient for OT slot
    public async Task<Patient> RequestOtSlotAsync(SurgeryOpWardRequestDto dto)
    {
        var existingIds = await _db.Patients.Select(p => p.Id).ToListAsync();
        var existingUhids = await _db.Patients.Select(p => p.Uhid).ToListAsync();

        int nextNum = 1;
        while (existingIds.Contains($"P{nextNum:D3}") || existingUhids.Contains($"SRM-2024-{nextNum:D5}"))
        {
            nextNum++;
        }
        var id = $"P{nextNum:D3}";
        var uhid = string.IsNullOrWhiteSpace(dto.Uhid) || existingUhids.Contains(dto.Uhid)
            ? $"SRM-2024-{nextNum:D5}"
            : dto.Uhid;

        var entity = new PatientDbEntity
        {
            Id = id,
            Uhid = uhid,
            Name = dto.Name,
            Age = dto.Age > 0 ? dto.Age : 35,
            Gender = string.IsNullOrWhiteSpace(dto.Gender) ? "M" : dto.Gender,
            BloodGroup = string.IsNullOrWhiteSpace(dto.BloodGroup) ? "O+" : dto.BloodGroup,
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? "9876543210" : dto.Phone,
            Department = string.IsNullOrWhiteSpace(dto.Department) ? "General Surgery" : dto.Department,
            Diagnosis = dto.Diagnosis ?? string.Empty,
            SurgeryType = dto.SurgeryType ?? string.Empty,
            Surgeon = string.IsNullOrWhiteSpace(dto.Surgeon) ? "Dr. Rajesh Kumar" : dto.Surgeon,
            Ward = string.IsNullOrWhiteSpace(dto.Ward) ? "Ward A" : dto.Ward,
            BedNumber = string.IsNullOrWhiteSpace(dto.BedNumber) ? "Bed 101" : dto.BedNumber,
            AdmissionDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ScheduledDate = string.IsNullOrWhiteSpace(dto.ScheduledDate) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : dto.ScheduledDate,
            ScheduledTime = string.IsNullOrWhiteSpace(dto.ScheduledTime) ? "09:00" : dto.ScheduledTime,
            EstimatedDuration = dto.EstimatedDuration > 0 ? dto.EstimatedDuration : 90,
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "elective" : dto.Priority,
            SurgeryCategory = string.IsNullOrWhiteSpace(dto.SurgeryCategory) ? "elective" : dto.SurgeryCategory,
            Notes = dto.Notes ?? string.Empty,
            UnitChief = dto.UnitChief ?? "Dr. Ramakrishnan S.",
            PrimarySurgeon = dto.PrimarySurgeon ?? (dto.Surgeon ?? "Dr. Rajesh Kumar"),
            AssistantSurgeon = dto.AssistantSurgeon ?? "Dr. Suresh Babu",
            EquipmentRequirementsJson = dto.SpecialRequirements != null ? JsonSerializer.Serialize(dto.SpecialRequirements) : "[]",
            Status = "pending_fitness", // First step moves patient to pending_fitness for Anaesthesia OP/PAC
            PacStatus = "pending",
            PatientFitness = "pending"
        };

        // Add history audit
        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = id,
            Action = "OT Slot Request Created",
            FromStatus = "draft",
            ToStatus = "pending_fitness",
            PerformedBy = "Surgery OP Ward",
            Notes = $"New patient {dto.Name} submitted for OT slot. Diagnosis: {dto.Diagnosis}, Procedure: {dto.SurgeryType}. Forwarded to Anaesthesia OP/PAC.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        _db.Patients.Add(entity);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Workflow Step 1: Surgery OP Ward created OT Slot request for {PatientId} ({Uhid})", id, uhid);
        return entity.ToDomain();
    }

    // STEP 2: Anaesthesia OP / PAC marks patient Fit or Unfit
    public async Task<Patient?> AssessAnaesthesiaFitnessAsync(string patientId, AnaesthesiaFitnessDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        if (dto.IsFit)
        {
            // IF FIT: Patient returns to Surgery OP Ward for scheduling (Date, Duration, Surgeons, Equipment)
            entity.PatientFitness = "fit";
            entity.PacStatus = "cleared";
            entity.Status = "pending_scheduling"; // Returns to Surgery OP Ward!
            if (!string.IsNullOrWhiteSpace(dto.AnaesthesiaType)) entity.AnaesthesiaType = dto.AnaesthesiaType;
            if (!string.IsNullOrWhiteSpace(dto.AnaesthesiaRisk)) entity.AnaesthesiaRisk = dto.AnaesthesiaRisk;

            entity.History.Add(new WorkflowHistoryDbEntity
            {
                PatientId = patientId,
                Action = "PAC Cleared - Marked Fit",
                FromStatus = prevStatus,
                ToStatus = "pending_scheduling",
                PerformedBy = dto.AssessedBy,
                Notes = dto.Notes ?? "Patient assessed and marked FIT for anaesthesia. Returned to Surgery OP Ward for scheduling date, duration, surgeons, and equipment.",
                Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            });

            _logger.LogInformation("Workflow Step 2 (FIT): Patient {PatientId} marked FIT by PAC. Returned to Surgery OP Ward for scheduling.", patientId);
        }
        else
        {
            // IF UNFIT: Must give reason and review date
            entity.PatientFitness = "unfit";
            entity.PacStatus = "deferred";
            entity.FitnessReason = dto.FitnessReason ?? "Medical condition requires stabilization";
            entity.ReviewDate = dto.ReviewDate ?? DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd");
            entity.Status = "pending_fitness"; // Stays pending fitness until next review

            entity.History.Add(new WorkflowHistoryDbEntity
            {
                PatientId = patientId,
                Action = "PAC Unfit - Review Scheduled",
                FromStatus = prevStatus,
                ToStatus = entity.Status,
                PerformedBy = dto.AssessedBy,
                Notes = $"Patient marked UNFIT for anaesthesia. Reason: {entity.FitnessReason}. Next review date scheduled for {entity.ReviewDate}.",
                Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            });

            _logger.LogInformation("Workflow Step 2 (UNFIT): Patient {PatientId} marked UNFIT by PAC. Reason: {Reason}, Review Date: {ReviewDate}",
                patientId, entity.FitnessReason, entity.ReviewDate);
        }

        await _db.SaveChangesAsync();
        return entity.ToDomain();
    }

    // STEP 3: Surgery OP Ward picks Date, Duration, Surgeons, and Equipment -> submits to Dept HOD
    public async Task<Patient?> SubmitScheduleAsync(string patientId, SurgeryScheduleDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        if (!string.IsNullOrWhiteSpace(dto.ScheduledDate)) entity.ScheduledDate = dto.ScheduledDate;
        if (!string.IsNullOrWhiteSpace(dto.ScheduledTime)) entity.ScheduledTime = dto.ScheduledTime;
        if (dto.EstimatedDuration > 0) entity.EstimatedDuration = dto.EstimatedDuration;
        if (!string.IsNullOrWhiteSpace(dto.UnitChief)) entity.UnitChief = dto.UnitChief;
        if (!string.IsNullOrWhiteSpace(dto.PrimarySurgeon))
        {
            entity.PrimarySurgeon = dto.PrimarySurgeon;
            entity.Surgeon = dto.PrimarySurgeon;
        }
        if (!string.IsNullOrWhiteSpace(dto.AssistantSurgeon)) entity.AssistantSurgeon = dto.AssistantSurgeon;
        if (!string.IsNullOrWhiteSpace(dto.PgSurgery)) entity.PgSurgery = dto.PgSurgery;
        if (dto.EquipmentRequirements != null)
        {
            entity.EquipmentRequirementsJson = JsonSerializer.Serialize(dto.EquipmentRequirements);
        }

        // Moves to Department HOD!
        entity.Status = "pending_dept_approval";

        var equipSummary = dto.EquipmentRequirements != null && dto.EquipmentRequirements.Any()
            ? string.Join(", ", dto.EquipmentRequirements)
            : "Standard instrumentation";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Surgery Scheduled & Submitted to Dept HOD",
            FromStatus = prevStatus,
            ToStatus = "pending_dept_approval",
            PerformedBy = dto.ScheduledBy,
            Notes = dto.Notes ?? $"Scheduled for {entity.ScheduledDate} {entity.ScheduledTime} ({entity.EstimatedDuration}m). Surgeon: {entity.Surgeon}. Equipment: {equipSummary}. Submitted to Department HOD for approval.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 3: Surgery OP Ward scheduled {PatientId} and submitted to Department HOD.", patientId);

        return entity.ToDomain();
    }

    // STEP 4A: Department HOD approves surgery -> moves to OT Matron
    public async Task<Patient?> DeptHodApproveAsync(string patientId, DeptHODApprovalDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        // Moves to OT Matron!
        entity.Status = "pending_ot_assignment";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Approved by Department HOD",
            FromStatus = prevStatus,
            ToStatus = "pending_ot_assignment",
            PerformedBy = dto.ApprovedBy,
            Notes = dto.Remarks ?? "Department HOD reviewed and approved the surgery. Forwarded to OT Matron for room and staff assignment.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 4A: Department HOD approved {PatientId}. Forwarded to OT Matron.", patientId);

        return entity.ToDomain();
    }

    // STEP 4B: Department HOD postpones surgery -> sets review date and reason
    public async Task<Patient?> DeptHodPostponeAsync(string patientId, DeptHODPostponeDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        entity.PostponedFromStatus = prevStatus;
        entity.PostponementReason = dto.PostponementReason;
        if (!string.IsNullOrWhiteSpace(dto.ReviewDate)) entity.ReviewDate = dto.ReviewDate;

        entity.Status = "postponed";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Surgery Postponed by Department HOD",
            FromStatus = prevStatus,
            ToStatus = "postponed",
            PerformedBy = dto.PostponedBy,
            Notes = $"Surgery postponed by Department HOD. Reason: {dto.PostponementReason}. Next Review Date: {dto.ReviewDate}. Remarks: {dto.Remarks ?? "None"}",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 4B: Department HOD postponed {PatientId}. Reason: {Reason}, Review Date: {Date}", patientId, dto.PostponementReason, dto.ReviewDate);

        return entity.ToDomain();
    }

    // STEP 5: OT Matron assigns the OT Room, Time, Scrub Nurse, and Floor Nurse -> moves to HOD Anaesthesia
    public async Task<Patient?> AssignOtAndStaffAsync(string patientId, OTMatronAssignDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        // Assign OT Room and staff
        entity.OtRoom = dto.OtRoom;
        entity.ScrubNurse = dto.ScrubNurse;
        entity.FloorNurse = dto.FloorNurse;
        entity.OtatTechnician = dto.OtatTechnician;

        if (!string.IsNullOrWhiteSpace(dto.ScheduledDate)) entity.ScheduledDate = dto.ScheduledDate;
        if (!string.IsNullOrWhiteSpace(dto.ScheduledTime)) entity.ScheduledTime = dto.ScheduledTime;

        // Moves to HOD Anaesthesia!
        entity.Status = "pending_anaes_approval";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "OT Room & Staff Assigned by OT Matron",
            FromStatus = prevStatus,
            ToStatus = "pending_anaes_approval",
            PerformedBy = dto.AssignedBy,
            Notes = $"OT Room assigned: {dto.OtRoom}, Time: {dto.ScheduledTime ?? entity.ScheduledTime}. Staff assigned: Scrub Nurse={dto.ScrubNurse}, Floor Nurse={dto.FloorNurse}, OTAT Tech={dto.OtatTechnician}. Transferred to HOD Anaesthesia.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 5: OT Matron assigned room {Room} and staff for {PatientId}. Transferred to HOD Anaesthesia.", dto.OtRoom, patientId);

        return entity.ToDomain();
    }

    // STEP 6: HOD Anaesthesia assigns Anaesthesiologist, Assistant, PG Doctor and gives FINAL APPROVAL
    public async Task<Patient?> ApproveForSurgeryAsync(string patientId, HODApprovalDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        // Assign anaesthesia team
        entity.Anaesthesiologist = dto.Anaesthesiologist;
        if (!string.IsNullOrWhiteSpace(dto.AnaesthesiaAssistant)) entity.AnaesthesiaAssistant = dto.AnaesthesiaAssistant;
        if (!string.IsNullOrWhiteSpace(dto.PgAnaesthesia)) entity.PgAnaesthesia = dto.PgAnaesthesia;

        // Approved for surgery -> READY FOR SURGERY
        entity.Status = "scheduled";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Final Approval by HOD Anaesthesia",
            FromStatus = prevStatus,
            ToStatus = "scheduled",
            PerformedBy = dto.ApprovedBy,
            Notes = $"HOD Anaesthesia approved surgery. Anaesthesiologist assigned: {dto.Anaesthesiologist}, Assistant: {dto.AnaesthesiaAssistant ?? "Assigned"}, PG: {dto.PgAnaesthesia ?? "Assigned"}. Patient is READY FOR SURGERY.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 6: HOD Anaesthesia approved {PatientId} for surgery with Anaesthesiologist {Dr}.", patientId, dto.Anaesthesiologist);

        return entity.ToDomain();
    }

    // STEP 6-ALT: HOD Anaesthesia POSTPONES surgery
    public async Task<Patient?> PostponeSurgeryAsync(string patientId, HODPostponeDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        entity.PostponedFromStatus = prevStatus;
        entity.PostponementReason = dto.PostponementReason;
        if (!string.IsNullOrWhiteSpace(dto.ReviewDate)) entity.ReviewDate = dto.ReviewDate;
        if (!string.IsNullOrWhiteSpace(dto.NewScheduledDate)) entity.ScheduledDate = dto.NewScheduledDate;

        entity.Status = "postponed";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Surgery Postponed by HOD Anaesthesia",
            FromStatus = prevStatus,
            ToStatus = "postponed",
            PerformedBy = dto.PostponedBy,
            Notes = $"Surgery postponed by HOD Anaesthesia. Reason: {dto.PostponementReason}. Next Review Date: {dto.ReviewDate ?? "TBD"}.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 6-ALT: HOD Anaesthesia postponed {PatientId}. Reason: {Reason}", patientId, dto.PostponementReason);

        return entity.ToDomain();
    }

    // STEP 7A: OT Matron starts surgery on surgery day (Start Button)
    public async Task<Patient?> StartSurgeryAsync(string patientId, StartSurgeryDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        entity.ActualStartTime = !string.IsNullOrWhiteSpace(dto.ActualStartTime) ? dto.ActualStartTime : DateTime.UtcNow.ToString("HH:mm");
        entity.Status = "in_progress";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Surgery Started",
            FromStatus = prevStatus,
            ToStatus = "in_progress",
            PerformedBy = dto.StartedBy,
            Notes = dto.Notes ?? $"Patient transferred to OT {entity.OtRoom}. Surgery started at {entity.ActualStartTime}.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 7A: Surgery STARTED for patient {PatientId} at {Time}.", patientId, entity.ActualStartTime);

        return entity.ToDomain();
    }

    // STEP 7B: OT Matron completes surgery after operation finishes (Complete Button - Final Step)
    public async Task<Patient?> CompleteSurgeryAsync(string patientId, CompleteSurgeryDto dto)
    {
        var entity = await _db.Patients
            .Include(p => p.History)
            .Include(p => p.Requests)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (entity == null) return null;

        var prevStatus = entity.Status;

        entity.ActualEndTime = !string.IsNullOrWhiteSpace(dto.ActualEndTime) ? dto.ActualEndTime : DateTime.UtcNow.ToString("HH:mm");
        if (!string.IsNullOrWhiteSpace(dto.ActualStartTime)) entity.ActualStartTime = dto.ActualStartTime;
        if (!string.IsNullOrWhiteSpace(dto.IntraOpNotes)) entity.IntraOpNotes = dto.IntraOpNotes;
        if (!string.IsNullOrWhiteSpace(dto.PmrStatus)) entity.PmrStatus = dto.PmrStatus;
        if (!string.IsNullOrWhiteSpace(dto.HpeStatus)) entity.HpeStatus = dto.HpeStatus;

        entity.Status = "completed";

        entity.History.Add(new WorkflowHistoryDbEntity
        {
            PatientId = patientId,
            Action = "Surgery Completed",
            FromStatus = prevStatus,
            ToStatus = "completed",
            PerformedBy = dto.CompletedBy,
            Notes = dto.IntraOpNotes ?? $"Operation completed at {entity.ActualEndTime}. Patient shifted to Recovery / PACU. Final step complete.",
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Workflow Step 7B: Surgery COMPLETED for patient {PatientId} at {Time}.", patientId, entity.ActualEndTime);

        return entity.ToDomain();
    }
}
