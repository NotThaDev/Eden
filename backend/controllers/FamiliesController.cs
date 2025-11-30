using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/family")]
    public class FamilyController : ControllerBase
    {
        [HttpGet()]
        public IActionResult GetAll()
        {
            var families = Family.GetFamilies();
            return Ok(families);
        }

        [HttpPost()]
        public IActionResult Create([FromBody] Family family)
        {
            if (family == null)
            {
                return BadRequest("Invalid family data.");
            }

            return Ok(Family.AddFamily(family));
        }
    }
}