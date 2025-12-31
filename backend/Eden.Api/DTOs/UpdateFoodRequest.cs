namespace Eden.Api.DTOs
{
    public record UpdateFoodRequest
    {
        public string? Name { get; set; }
        public int? Quantity { get; set; }
        public float? UnitSize { get; set; }
        public string? Unit { get; set; }
    }
}