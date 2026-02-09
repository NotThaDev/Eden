using Eden.Api.Models;

namespace Eden.Api.DTOs
{
    public record DistributionDto
    {
        public int? Id { get; set; }
        public DateTime DistributionDate { get; set; } = DateTime.Now;
        // FamilyId -> DistributionItemDTO
        public List<GroupedItems> GroupedItems { get; set; } = [];
    }

    public record GroupedItems
    {
        public int FamilyId { get; set; }
        public Family? Family { get; set; }
        public List<DistributionItemDto> Items { get; set; } = [];
    }

    public record DistributionItemDto
    {
        public int FoodId { get; set; }
        public int Quantity { get; set; }
        public Food? Food { get; set; }
    }
}