using Microsoft.AspNetCore.Mvc;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public AnalyticsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _patientService.GetAnalyticsSummaryAsync();
        return Ok(summary);
    }
}
