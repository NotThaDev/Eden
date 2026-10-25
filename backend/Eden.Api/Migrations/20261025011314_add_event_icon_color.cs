using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eden.Api.Migrations
{
    /// <inheritdoc />
    public partial class add_event_icon_color : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Events",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Events",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Events");
        }
    }
}
