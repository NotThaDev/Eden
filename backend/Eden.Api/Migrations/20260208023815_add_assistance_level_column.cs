using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eden.Api.Migrations
{
    /// <inheritdoc />
    public partial class add_assistance_level_column : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NecessityLevel",
                table: "Families",
                type: "integer",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NecessityLevel",
                table: "Families");
        }
    }
}
