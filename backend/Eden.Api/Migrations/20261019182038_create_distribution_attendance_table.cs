using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Eden.Api.Migrations
{
    /// <inheritdoc />
    public partial class create_distribution_attendance_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DistributionAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DistributionId = table.Column<int>(type: "integer", nullable: false),
                    FamilyId = table.Column<int>(type: "integer", nullable: false),
                    Present = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistributionAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DistributionAttendances_Distributions_DistributionId",
                        column: x => x.DistributionId,
                        principalTable: "Distributions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DistributionAttendances_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DistributionAttendances_DistributionId_FamilyId",
                table: "DistributionAttendances",
                columns: new[] { "DistributionId", "FamilyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DistributionAttendances_FamilyId",
                table: "DistributionAttendances",
                column: "FamilyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DistributionAttendances");
        }
    }
}
