using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OTController : ControllerBase
{
    private readonly IPatientService _patientService;

    public OTController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<IEnumerable<OTRoom>>> GetRooms()
    {
        var rooms = await _patientService.GetRoomsAsync();
        return Ok(rooms);
    }

    [HttpPost("rooms")]
    public async Task<ActionResult<OTRoom>> SaveRoom([FromBody] OTRoom room)
    {
        var saved = await _patientService.AddOrUpdateRoomAsync(room);
        return Ok(saved);
    }

    [HttpGet("slots")]
    public async Task<ActionResult<IEnumerable<OTSlot>>> GetSlots([FromQuery] string? date)
    {
        var slots = await _patientService.GetScheduleSlotsAsync(date);
        return Ok(slots);
    }

    [HttpGet("surgeons")]
    public async Task<ActionResult<IEnumerable<Surgeon>>> GetSurgeons()
    {
        var surgeons = await _patientService.GetSurgeonsAsync();
        return Ok(surgeons);
    }

    [HttpGet("modules")]
    public async Task<ActionResult<IEnumerable<ModuleInfo>>> GetModules()
    {
        var modules = await _patientService.GetModulesAsync();
        return Ok(modules);
    }
}
