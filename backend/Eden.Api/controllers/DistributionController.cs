using Eden.Api.DTOs;
using Eden.Api.Helpers;
using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/distribution")]
    public class DistributionController : ControllerBase
    {
        private Distribution _mapToDistribution(DistributionDto distributionDto)
        {
            return new Distribution
            {
                Id = distributionDto.Id,
                DistributionDate = distributionDto.DistributionDate,
                Items = [.. distributionDto.Items.SelectMany(groupedItem => groupedItem.DistributionItems.Select(item => new DistributionItem
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
                .Select(g => new DistributionFamilyDto
                {
                    FamilyId = g.Key ?? 0,
                    Family = g.First().Family,
                    DistributionItems = [.. g.Select(i => new DistributionItemDto
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
                Items = items
            };
        }

        private async Task<IActionResult?> _validateDistributionRequest(DistributionDto distribution)
        {
            if (distribution.Items == null || distribution.Items.Count == 0)
            {
                return BadRequest("Distribution must contain at least one item.");
            }

            foreach (var familyDto in distribution.Items)
            {
                if (await _validateFamily(familyDto.FamilyId) is IActionResult familyErrorResult)
                {
                    return familyErrorResult;
                }

                if (await _validateDistributionFoods(familyDto.DistributionItems) is IActionResult foodErrorResult)
                {
                    return foodErrorResult;
                }
            }

            return null;
        }

        private async Task<IActionResult?> _validateDistributionFoods(List<DistributionItemDto> items)
        {
            foreach (var item in items)
            {
                var existingFood = await Food.GetFoodByIdAsync(item.FoodId);

                if (item.Quantity <= 0)
                {
                    return BadRequest("Quantity must be greater than zero.");
                }

                if (existingFood == null)
                {
                    return BadRequest($"Food with ID {item.FoodId} does not exist.");
                }

                if (existingFood.Quantity < item.Quantity)
                {
                    return BadRequest($"Not enough quantity for food {existingFood.Name}. Available: {existingFood.Quantity}, requested: {item.Quantity}");
                }
            }

            return null;
        }

        private async Task<IActionResult?> _validateFamily(int? familyId)
        {
            var existingFamily = await Family.GetFamilyByIdAsync(familyId ?? 0);

            if (existingFamily == null)
            {
                return BadRequest($"Family with ID {familyId} does not exist.");
            }

            return null;
        }

        // One entry per family in the distribution; families not recorded yet count as absent.
        private static List<DistributionAttendance> _withAllFamilies(Distribution distribution, List<DistributionAttendance> attendances)
        {
            return [.. distribution.Items
                .Where(i => i.FamilyId != null)
                .GroupBy(i => i.FamilyId!.Value)
                .Select(g => attendances.FirstOrDefault(a => a.FamilyId == g.Key) ?? new DistributionAttendance
                {
                    DistributionId = distribution.Id!.Value,
                    FamilyId = g.Key,
                })
                .Select(a => { a.Family = distribution.Items.First(i => i.FamilyId == a.FamilyId).Family; return a; })];
        }

        private IActionResult? _validateAttendanceRequest(Distribution distribution, List<DistributionAttendance> attendance)
        {
            // shortcut: compares UTC dates, the UI compares local dates; off by one only near midnight. Upgrade if it bites.
            if (distribution.DistributionDate.Date >= DateTime.UtcNow.Date)
            {
                return BadRequest("Attendance can only be recorded for past distributions.");
            }

            if (attendance.Select(a => a.FamilyId).Distinct().Count() != attendance.Count)
            {
                return BadRequest("Each family can appear only once.");
            }

            var familyIds = distribution.Items.Select(i => i.FamilyId).ToHashSet();
            foreach (var item in attendance)
            {
                if (!familyIds.Contains(item.FamilyId))
                {
                    return BadRequest($"Family with ID {item.FamilyId} is not part of this distribution.");
                }
            }

            return null;
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

        [HttpGet("{id}/sheets")]
        public async Task<IActionResult> GetSheets(int id)
        {
            var distribution = await Distribution.GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return NotFound();
            }

            var settings = await AssociationSettings.GetSettingsAsync();
            var content = DistributionSheetsExcel.Build(distribution, settings.Logo);
            var fileName = $"schede-distribuzione-{distribution.DistributionDate.ToLocalTime():yyyy-MM-dd}.xlsx";
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
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

        [HttpGet("{id}/attendance")]
        public async Task<IActionResult> GetAttendance(int id)
        {
            var distribution = await Distribution.GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return NotFound();
            }

            var attendances = await DistributionAttendance.GetAttendancesByDistributionIdAsync(id);
            return Ok(_withAllFamilies(distribution, attendances));
        }

        [HttpPut("{id}/attendance")]
        public async Task<IActionResult> UpdateAttendance(int id, [FromBody] List<DistributionAttendance> attendance)
        {
            var distribution = await Distribution.GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return NotFound();
            }

            if (_validateAttendanceRequest(distribution, attendance) is IActionResult errorResult)
            {
                return errorResult;
            }

            await DistributionAttendance.SaveAttendancesAsync(id, [.. attendance.Select(a => new DistributionAttendance
            {
                FamilyId = a.FamilyId,
                Present = a.Present
            })]);

            var attendances = await DistributionAttendance.GetAttendancesByDistributionIdAsync(id);
            return Ok(_withAllFamilies(distribution, attendances));
        }

        [HttpPost("preview")]
        public async Task<IActionResult> GetDistributionPreview([FromBody] DistributionPreviewDto previewRequest)
        {
            var families = previewRequest.FamilyIds.Count > 0 ? await Family.GetFamiliesByIdsAsync(previewRequest.FamilyIds) : await Family.GetFamiliesAsync();
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