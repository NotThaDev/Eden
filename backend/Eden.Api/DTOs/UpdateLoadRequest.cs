namespace Eden.Api.DTOs
{
    public record UpdateLoadRequest
    {
        public List<UpdateLoadItemRequest>? Items { get; set; }
        public DateTime? LoadDate { get; set; }
    }

    public record UpdateLoadItemRequest
    {
        public int FoodId { get; set; }
        public int Quantity { get; set; }
    }
}