namespace Eden.Api.DTOs
{
    public record FamilyDistributionDto
    {
        public int FamilyId { get; set; }
        public int DistributionId { get; set; }
        public DateTime DistributionDate { get; set; }
        // Unrecorded attendance is reported as absent (false).
        public bool Present { get; set; }
    }
}
