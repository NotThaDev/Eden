namespace Eden.Api.DTOs
{
    public record DistributionAttendanceDto
    {
        public int FamilyId { get; set; }
        public string? FamilyName { get; set; }
        // null = not recorded yet (response); required on PUT
        public bool? Present { get; set; }
    }
}
