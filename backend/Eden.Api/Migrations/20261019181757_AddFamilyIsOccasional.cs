using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eden.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyIsOccasional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOccasional",
                table: "Families",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOccasional",
                table: "Families");
        }
    }
}
