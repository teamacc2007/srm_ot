using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<WorkflowController> _logger;

    public WorkflowController(IPatientService patientService, ILogger<WorkflowController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    /// <summary>
    /// Step 1: Surgery OP Ward adds a new patient for an OT slot.
    /// Sets status to pending_fitness and forwards to Anaesthesia OP/PAC.
    /// </summary>
    [HttpPost("request-ot-slot")]
    public async Task<ActionResult<Patient>> RequestOtSlot([FromBody] SurgeryOpWardRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Patient name is required" });
        }

        var created = await _patientService.RequestOtSlotAsync(dto);
        return CreatedAtAction("GetById", "Patients", new { id = created.Id }, created);
    }

    /// <summary>
    /// Step 2: Anaesthesia OP / PAC marks patient Fit or Unfit.
    /// If Fit -> moves to OT Matron (status = pending_ot_assignment).
    /// If Unfit -> requires Reason and Review Date for next review (status = pending_fitness).
    /// </summary>
    [HttpPost("anaesthesia-fitness/{patientId}")]
    public async Task<ActionResult<Patient>> AssessAnaesthesiaFitness(string patientId, [FromBody] AnaesthesiaFitnessDto dto)
    {
        if (!dto.IsFit && string.IsNullOrWhiteSpace(dto.FitnessReason))
        {
            return BadRequest(new { message = "Fitness reason is mandatory when marking patient unfit for anaesthesia." });
        }

        var updated = await _patientService.AssessAnaesthesiaFitnessAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 3: Surgery OP Ward picks Date, Duration, Surgeons, and Equipment.
    /// Moves patient to the respective Department HOD (status = pending_dept_approval).
    /// </summary>
    [HttpPost("submit-schedule/{patientId}")]
    public async Task<ActionResult<Patient>> SubmitSchedule(string patientId, [FromBody] SurgeryScheduleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ScheduledDate) || string.IsNullOrWhiteSpace(dto.PrimarySurgeon))
        {
            return BadRequest(new { message = "Scheduled date and primary surgeon are required." });
        }

        var updated = await _patientService.SubmitScheduleAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 4A: Department HOD approves the surgery for their department.
    /// Moves patient to OT Matron (status = pending_ot_assignment).
    /// </summary>
    [HttpPost("dept-hod-approve/{patientId}")]
    public async Task<ActionResult<Patient>> DeptHodApprove(string patientId, [FromBody] DeptHODApprovalDto dto)
    {
        var updated = await _patientService.DeptHodApproveAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 4B: Department HOD postpones the surgery (sets review date and reason).
    /// Sets status to postponed.
    /// </summary>
    [HttpPost("dept-hod-postpone/{patientId}")]
    public async Task<ActionResult<Patient>> DeptHodPostpone(string patientId, [FromBody] DeptHODPostponeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PostponementReason) || string.IsNullOrWhiteSpace(dto.ReviewDate))
        {
            return BadRequest(new { message = "Postponement reason and new review date are required." });
        }

        var updated = await _patientService.DeptHodPostponeAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 5: OT Matron assigns the OT Room, Time, Scrub Nurse, and Floor Nurse.
    /// Moves patient to HOD Anaesthesia (status = pending_anaes_approval).
    /// </summary>
    [HttpPost("assign-ot-staff/{patientId}")]
    public async Task<ActionResult<Patient>> AssignOtAndStaff(string patientId, [FromBody] OTMatronAssignDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.OtRoom))
        {
            return BadRequest(new { message = "OT Room is required for assignment." });
        }

        var updated = await _patientService.AssignOtAndStaffAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 6A: HOD Anaesthesia assigns Anaesthesiologist, Assistant, PG Doctor and gives FINAL APPROVAL.
    /// Patient is READY FOR SURGERY (status = scheduled).
    /// </summary>
    [HttpPost("hod-approve/{patientId}")]
    public async Task<ActionResult<Patient>> ApproveForSurgery(string patientId, [FromBody] HODApprovalDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Anaesthesiologist))
        {
            return BadRequest(new { message = "Anaesthesiologist assignment is required for approval." });
        }

        var updated = await _patientService.ApproveForSurgeryAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 6B: HOD Anaesthesia POSTPONES surgery with reason and review date.
    /// Sets status to postponed.
    /// </summary>
    [HttpPost("hod-postpone/{patientId}")]
    public async Task<ActionResult<Patient>> PostponeSurgery(string patientId, [FromBody] HODPostponeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PostponementReason))
        {
            return BadRequest(new { message = "Postponement reason is required." });
        }

        var updated = await _patientService.PostponeSurgeryAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 7A: OT Matron starts surgery when surgery day comes (Start Surgery Button).
    /// Moves status to in_progress.
    /// </summary>
    [HttpPost("start-surgery/{patientId}")]
    public async Task<ActionResult<Patient>> StartSurgery(string patientId, [FromBody] StartSurgeryDto dto)
    {
        var updated = await _patientService.StartSurgeryAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Step 7B: OT Matron completes surgery after operation completes (Complete Surgery Button - Final Step).
    /// Moves status to completed.
    /// </summary>
    [HttpPost("complete-surgery/{patientId}")]
    public async Task<ActionResult<Patient>> CompleteSurgery(string patientId, [FromBody] CompleteSurgeryDto dto)
    {
        var updated = await _patientService.CompleteSurgeryAsync(patientId, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {patientId} not found." });
        }

        return Ok(updated);
    }
}
