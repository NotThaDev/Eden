using Eden.Api.DTOs;
using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/food")]
    public class FoodController : ControllerBase
    {
        private IActionResult? _validateFoodRequest(Food food)
        {
            if (food.Quantity < 0)
            {
                return BadRequest("Quantity cannot be negative.");
            }

            if (string.IsNullOrWhiteSpace(food.Name))
            {
                return BadRequest("Food name is required.");
            }

            if (food.UnitSize <= 0 || string.IsNullOrWhiteSpace(food.Unit))
            {
                return BadRequest("Food unit size and unit are required.");
            }

            return null;
        }

        [HttpGet()]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await Food.GetFoodsAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var food = await Food.GetFoodByIdAsync(id);
            if (food == null)
            {
                return NotFound();
            }

            return Ok(food);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFoodRequest food)
        {
            var existingFood = await Food.GetFoodByIdAsync(id);
            if (existingFood == null)
            {
                return NotFound();
            }

            var updatedFood = new Food
            {
                Id = existingFood.Id,
                Name = food.Name ?? existingFood.Name,
                Quantity = food.Quantity ?? existingFood.Quantity,
                UnitSize = food.UnitSize ?? existingFood.UnitSize,
                Unit = food.Unit ?? existingFood.Unit,
                CreatedAt = existingFood.CreatedAt
            };

            var validationResult = _validateFoodRequest(updatedFood);
            if (validationResult is not null)
            {
                return validationResult;
            }

            await updatedFood.UpdateFoodAsync();

            return Ok(updatedFood);
        }

        [HttpPost()]
        public async Task<IActionResult> Create([FromBody] Food food)
        {
            var validationResult = _validateFoodRequest(food);
            if (validationResult is not null)
            {
                return validationResult;
            }

            try
            {
                await Food.AddFood(food);
                return CreatedAtAction(nameof(GetById), new { id = food.Id }, food);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingFood = await Food.GetFoodByIdAsync(id);
            if (existingFood == null)
            {
                return NotFound();
            }

            await Food.DeleteFoodAsync(id);

            return NoContent();
        }
    }
}