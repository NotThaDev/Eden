namespace Eden.Api.DTOs
{
    public record FamilyDistributionDto
    {
        public int FamilyId { get; set; }
        public int DistributionId { get; set; }
        public DateTime DistributionDate { get; set; }
        // null = not recorded
        public bool? Present { get; set; }
    }
}
