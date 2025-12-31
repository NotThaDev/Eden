using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eden.Api.Migrations
{
    /// <inheritdoc />
    public partial class add_load_latest_id_to_foods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LatestLoadId",
                table: "Foods",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Foods_LatestLoadId",
                table: "Foods",
                column: "LatestLoadId");

            migrationBuilder.AddForeignKey(
                name: "FK_Foods_Loads_LatestLoadId",
                table: "Foods",
                column: "LatestLoadId",
                principalTable: "Loads",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Foods_Loads_LatestLoadId",
                table: "Foods");

            migrationBuilder.DropIndex(
                name: "IX_Foods_LatestLoadId",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "LatestLoadId",
                table: "Foods");
        }
    }
}
