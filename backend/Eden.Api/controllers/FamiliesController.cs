using System.Threading.Tasks;
using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/family")]
    public class FamilyController : ControllerBase
    {
        [HttpGet()]
        public async Task<IActionResult> GetAll()
        {
            var families = await Family.GetFamiliesAsync();
            return Ok(families);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var family = await Family.GetFamilyByIdAsync(id);
            if (family == null)
            {
                return NotFound();
            }
            return Ok(family);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFamilyRequest family)
        {
            var existingFamily = await Family.GetFamilyByIdAsync(id);
            if (existingFamily == null)
            {
                return NotFound();
            }

            existingFamily.Name = family.Name ?? existingFamily.Name;
            existingFamily.Members = family.Members ?? existingFamily.Members;
            existingFamily.Children = family.Children ?? existingFamily.Children;
            existingFamily.Isee = family.Isee ?? existingFamily.Isee;

            if (existingFamily.Members < existingFamily.Children)
            {
                return BadRequest("Number of children cannot exceed number of members.");
            }

           await existingFamily.UpdateFamilyAsync();

            return Ok(existingFamily);
        }

        [HttpPost()]
        public async Task<IActionResult> Create([FromBody] Family family)
        {
            if (family == null)
            {
                return BadRequest("Family data is required.");
            }

            if (string.IsNullOrWhiteSpace(family.Name))
            {
                return BadRequest("Family name is required.");
            }

            if (family.Isee < 0)
            {
                return BadRequest("Isee must be a non-negative value.");
            }
            if(family.Members == 0)
            {
                return BadRequest("Family must have at least one member.");
            }

            if (family.Members <= family.Children)
            {
                return BadRequest("Number of children cannot exceed number of members.");
            }

            var newFamily = await Family.AddFamily(family);
            if (newFamily == null)
            {
                return StatusCode(500, "Failed to create new family.");
            }

            return Ok(newFamily);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var family = await Family.GetFamilyByIdAsync(id);
            if (family == null)
            {
                return NotFound();
            }

            await Family.DeleteFamilyAsync(id);
            return NoContent();
        }
    }
}