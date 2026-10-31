using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/event")]
    public class EventController : ControllerBase
    {
        private const string DistributionConflict = "Distribution events are managed from the Distribuzioni page.";

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            if (from is null || to is null || to <= from)
            {
                return BadRequest("Valid 'from' and 'to' are required.");
            }

            return Ok(await Event.GetEventsAsync(from.Value.ToUniversalTime(), to.Value.ToUniversalTime()));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ev = await Event.GetEventByIdAsync(id);
            return ev == null ? NotFound() : Ok(ev);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Event request)
        {
            if (_validate(request) is string error)
            {
                return BadRequest(error);
            }

            // Distribution events can only be created by the distribution flow
            request.Id = null;
            request.DistributionId = null;
            request.Title = request.Title.Trim();
            return Ok(await Event.AddEventAsync(request));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Event request)
        {
            if (_validate(request) is string error)
            {
                return BadRequest(error);
            }

            var existing = await Event.GetEventByIdAsync(id);
            if (existing == null)
            {
                return NotFound();
            }
            if (existing.DistributionId != null)
            {
                return Conflict(DistributionConflict);
            }

            existing.Title = request.Title.Trim();
            existing.Description = request.Description;
            existing.Start = request.Start;
            existing.End = request.End;
            existing.AllDay = request.AllDay;
            existing.Icon = request.Icon;
            existing.Color = request.Color;
            return Ok(await Event.UpdateEventAsync(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await Event.GetEventByIdAsync(id);
            if (existing == null)
            {
                return NotFound();
            }
            if (existing.DistributionId != null)
            {
                return Conflict(DistributionConflict);
            }

            await Event.DeleteEventAsync(id);
            return NoContent();
        }

        private static string? _validate(Event e)
        {
            if (e.Start == default) return "Start is required.";
            if (string.IsNullOrWhiteSpace(e.Title)) return "Title is required.";
            if (e.Title.Trim().Length > 200) return "Title is too long.";
            if (e.Description?.Length > 2000) return "Description is too long.";
            if (e.End != null && e.End < e.Start) return "End must not be before start.";
            if (e.Icon != null && !Event.Icons.Contains(e.Icon)) return "Unknown icon.";
            if (e.Color != null && !Event.Colors.Contains(e.Color)) return "Unknown color.";
            return null;
        }
    }
}
