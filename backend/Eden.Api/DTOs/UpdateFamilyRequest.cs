namespace Eden.Api.DTOs
{
    public record UpdateFamilyRequest
    {
        public string? Name { get; set; }
        public uint? Members { get; set; }
        public uint? Children { get; set; }
        public int? Isee { get; set; }
        public bool? IsOccasional { get; set; }
    }
}