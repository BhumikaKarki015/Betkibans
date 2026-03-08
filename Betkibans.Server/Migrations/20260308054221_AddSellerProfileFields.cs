using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Betkibans.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessHours",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FacebookUrl",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstagramUrl",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Sellers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessHours",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "FacebookUrl",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "InstagramUrl",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Sellers");
        }
    }
}
