using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(IPatientService patientService, ILogger<PatientsController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Patient>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? department,
        [FromQuery] string? status,
        [FromQuery] string? priority)
    {
        var patients = await _patientService.GetPatientsAsync(search, department, status, priority);
        return Ok(patients);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Patient>> GetById(string id)
    {
        var patient = await _patientService.GetPatientByIdAsync(id);
        if (patient == null)
        {
            return NotFound(new { message = $"Patient with ID {id} not found" });
        }
        return Ok(patient);
    }

    [HttpPost]
    public async Task<ActionResult<Patient>> Create([FromBody] Patient patient)
    {
        var created = await _patientService.CreatePatientAsync(patient);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Patient>> Update(string id, [FromBody] Patient update)
    {
        var updated = await _patientService.UpdatePatientAsync(id, update);
        if (updated == null)
        {
            return NotFound(new { message = $"Patient with ID {id} not found" });
        }
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _patientService.DeletePatientAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"Patient with ID {id} not found" });
        }
        return NoContent();
    }

    [HttpPost("{id}/history")]
    public async Task<ActionResult<WorkflowHistoryEntry>> AddHistory(string id, [FromBody] HistoryEntryDto dto)
    {
        var entry = await _patientService.AddHistoryEntryAsync(id, dto);
        if (entry == null)
        {
            return NotFound(new { message = $"Patient with ID {id} not found" });
        }
        return Ok(entry);
    }

    [HttpPost("{id}/requests")]
    public async Task<ActionResult<PatientRequest>> AddRequest(string id, [FromBody] PortalRequestCreateDto dto)
    {
        var req = await _patientService.AddPortalRequestAsync(id, dto);
        if (req == null)
        {
            return NotFound(new { message = $"Patient with ID {id} not found" });
        }
        return Ok(req);
    }

    [HttpPut("{id}/requests/{requestId}")]
    public async Task<ActionResult<PatientRequest>> ResolveRequest(string id, string requestId, [FromBody] PortalRequestResolveDto dto)
    {
        var req = await _patientService.ResolvePortalRequestAsync(id, requestId, dto);
        if (req == null)
        {
            return NotFound(new { message = $"Patient {id} or request {requestId} not found" });
        }
        return Ok(req);
    }
}
