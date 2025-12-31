using Eden.Api.DTOs;
using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/load")]
    public class LoadController : ControllerBase
    {
        private async Task<IActionResult?> _validateLoadItems(List<LoadItem> loadItems)
        {
            if (loadItems == null || !loadItems.Any())
            {
                return BadRequest("Load must contain at least one item.");
            }

            foreach (var item in loadItems)
            {
                if (item.Quantity <= 0)
                {
                    return BadRequest("Item quantity must be greater than zero.");
                }

                if (await Food.GetFoodByIdAsync(item.FoodId) == null)
                {
                    return BadRequest($"Food with ID {item.FoodId} does not exist.");
                }
            }

            return null;
        }

        [HttpGet()]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await Load.GetLoadsAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var load = await Load.GetLoadByIdAsync(id);
            if (load == null)
            {
                return NotFound();
            }

            return Ok(load);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateLoadRequest load)
        {
            var existingLoad = await Load.GetLoadByIdAsync(id);
            if (existingLoad == null)
            {
                return NotFound();
            }

            // Update properties
            if (load.LoadDate.HasValue)
            {
                existingLoad.LoadDate = load.LoadDate.Value;
            }

            var validationResult = await _validateLoadItems(existingLoad.Items);

            if (validationResult is not null)
            {
                return validationResult;
            }

            if (load.Items != null)
            {
                // Clear existing items and add new ones
                existingLoad.Items.Clear();
                foreach (var item in load.Items)
                {
                    existingLoad.Items.Add(new LoadItem
                    {
                        FoodId = item.FoodId,
                        LoadId = existingLoad.Id ?? 0,
                        Quantity = item.Quantity
                    });
                }
            }

            return Ok(await existingLoad.UpdateLoadAsync());
        }

        [HttpPost()]
        public async Task<IActionResult> Create([FromBody] Load load)
        {
            var validationResult = await _validateLoadItems(load.Items);
            if (validationResult is not null)
            {
                return validationResult;
            }

            var newLoad = await Load.AddLoad(load);
            return Ok(newLoad);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await Load.DeleteLoadAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}