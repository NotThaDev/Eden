using Eden.Api.Models;

namespace Eden.Api.DTOs
{
    public record DistributionDto
    {
        public int? Id { get; set; }
        public DateTime DistributionDate { get; set; } = DateTime.Now;
        // FamilyId -> DistributionItemDTO
        public List<DistributionFamilyDto> Items { get; set; } = [];
    }

    public record DistributionFamilyDto
    {
        public int FamilyId { get; set; }
        public Family? Family { get; set; }
        public List<DistributionItemDto> DistributionItems { get; set; } = [];
    }

    public record DistributionItemDto
    {
        public int FoodId { get; set; }
        public int Quantity { get; set; }
        public Food? Food { get; set; }
    }

    public record DistributionPreviewDto
    {
        public List<int> FamilyIds { get; set; } = [];
        public List<int> FoodIds { get; set; } = [];
    }
}