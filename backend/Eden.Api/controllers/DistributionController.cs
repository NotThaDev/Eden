using Eden.Api.DTOs;
using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/distribution")]
    public class DistributionController : ControllerBase
    {
        private async Task<IActionResult?> _validateDistributionRequest(DistributionDto distribution)
        {
            if (distribution.GroupedItems == null || distribution.GroupedItems.Count == 0)
            {
                return BadRequest("Distribution must contain at least one item.");
            }

            foreach (var item in distribution.GroupedItems)
            {
                var family = Family.GetFamilyByIdAsync(item.FamilyId);
                if (family is null)
                {
                    return BadRequest($"Family not {item.FamilyId} found");
                }

                foreach (var distributionItem in item.Items)
                {
                    var food = await Food.GetFoodByIdAsync(distributionItem.FoodId);
                    if (food is null)
                    {
                        return BadRequest($"Food with id {distributionItem.FoodId} not found");
                    }

                    if (food.Quantity < distributionItem.Quantity)
                    {
                        return BadRequest($"Not enough quantity for food {food.Name}. Available: {food.Quantity}, requested: {distributionItem.Quantity}");
                    }

                    if (distributionItem.Quantity < 0)
                    {
                        return BadRequest("Quantity cannot be negative.");
                    }
                }
            }

            return null;
        }

        private Distribution _mapToDistribution(DistributionDto distributionDto)
        {
            return new Distribution
            {
                Id = distributionDto.Id,
                DistributionDate = distributionDto.DistributionDate,
                Items = [.. distributionDto.GroupedItems.SelectMany(groupedItem => groupedItem.Items.Select(item => new DistributionItem
                {
                    FamilyId = groupedItem.FamilyId,
                    FoodId = item.FoodId,
                    Quantity = item.Quantity
                }))]
            };
        }

        private DistributionDto _mapToDistributionDto(Distribution distribution)
        {
            var items = distribution.Items
                .GroupBy(i => i.FamilyId)
                .Select(g => new GroupedItems
                {
                    FamilyId = g.Key ?? 0,
                    Family = g.First().Family,
                    Items = [.. g.Select(i => new DistributionItemDto
                    {
                        FoodId = i.FoodId ?? 0,
                        Quantity = i.Quantity,
                        Food = i.Food
                    })]
                }).ToList();

            return new DistributionDto
            {
                Id = distribution.Id,
                DistributionDate = distribution.DistributionDate,
                GroupedItems = items
            };
        }

        [HttpGet()]
        public async Task<IActionResult> GetAll()
        {
            var distributions = await Distribution.GetDistributionsAsync();
            var distributionDtos = distributions.Select(_mapToDistributionDto).ToList();
            return Ok(distributionDtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var distribution = await Distribution.GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return NotFound();
            }

            return Ok(_mapToDistributionDto(distribution));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DistributionDto distribution)
        {
            if (await _validateDistributionRequest(distribution) is IActionResult errorResult)
            {
                return errorResult;
            }

            var existingDistribution = await Distribution.GetDistributionByIdAsync(id);
            if (existingDistribution == null)
            {
                return NotFound();
            }

            var updatedDistribution = _mapToDistribution(distribution);
            updatedDistribution.Id = id;

            var result = await Distribution.UpdateDistributionAsync(updatedDistribution);
            if (result == null)
            {
                return BadRequest("Failed to update distribution.");
            }

            return Ok(_mapToDistributionDto(result));
        }

        [HttpPost()]
        public async Task<IActionResult> Create([FromBody] DistributionDto distribution)
        {
            if (await _validateDistributionRequest(distribution) is IActionResult errorResult)
            {
                return errorResult;
            }

            // Build the proper Distribution request from the DTO
            var newDistribution = _mapToDistribution(distribution);
            var createdDistribution = await Distribution.AddDistribution(newDistribution);
            if (createdDistribution == null)
            {
                return BadRequest("Failed to create distribution.");
            }

            return Ok(_mapToDistributionDto(createdDistribution));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var distribution = await Distribution.GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return NotFound();
            }

            await Distribution.DeleteDistributionAsync(id);

            return NoContent();
        }

        [HttpPost("preview")]
        public async Task<IActionResult> GetDistributionPreview([FromBody] DistributionPreviewDto previewRequest)
        {
            var families = previewRequest.FamilyIds.Count > 0 ? await Family.GetFamilyByIdsAsync(previewRequest.FamilyIds) : await Family.GetFamiliesAsync();
            var foods = previewRequest.FoodIds.Count > 0 ? await Food.GetFoodsByIdsAsync(previewRequest.FoodIds) : await Food.GetFoodsAsync();

            if (families == null || families.Count == 0)
            {
                return BadRequest("No families found to build distribution preview.");
            }

            if (foods == null || foods.Count == 0)
            {
                return BadRequest("No foods found to build distribution preview.");
            }

            var distributionPreview = await Distribution.BuildDistributionFromFamilies(families, foods);
            if (distributionPreview == null)
            {
                return BadRequest("Failed to build distribution preview.");
            }

            return Ok(_mapToDistributionDto(distributionPreview));
        }
    }
}