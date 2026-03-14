using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Betkibans.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlatformName = table.Column<string>(type: "text", nullable: false),
                    Tagline = table.Column<string>(type: "text", nullable: false),
                    SupportEmail = table.Column<string>(type: "text", nullable: false),
                    SupportPhone = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RepairCommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    MinOrderAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MaxOrderAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    RequireSellerVerification = table.Column<bool>(type: "boolean", nullable: false),
                    AutoApproveVerifiedSellers = table.Column<bool>(type: "boolean", nullable: false),
                    AllowDiscounts = table.Column<bool>(type: "boolean", nullable: false),
                    EnableSellerAnalytics = table.Column<bool>(type: "boolean", nullable: false),
                    MinProductPrice = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MaxProductImages = table.Column<int>(type: "integer", nullable: false),
                    MinDescriptionLength = table.Column<int>(type: "integer", nullable: false),
                    AllowGuestCheckout = table.Column<bool>(type: "boolean", nullable: false),
                    EnableWishlist = table.Column<bool>(type: "boolean", nullable: false),
                    EnableProductReviews = table.Column<bool>(type: "boolean", nullable: false),
                    EnablePurchaseForReview = table.Column<bool>(type: "boolean", nullable: false),
                    EnableRepairRequests = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PlatformSettings",
                columns: new[] { "Id", "Address", "AllowDiscounts", "AllowGuestCheckout", "AutoApproveVerifiedSellers", "CommissionRate", "EnableProductReviews", "EnablePurchaseForReview", "EnableRepairRequests", "EnableSellerAnalytics", "EnableWishlist", "MaxOrderAmount", "MaxProductImages", "MinDescriptionLength", "MinOrderAmount", "MinProductPrice", "PlatformName", "RepairCommissionRate", "RequireSellerVerification", "SupportEmail", "SupportPhone", "Tagline", "UpdatedAt", "UpdatedBy" },
                values: new object[] { 1, "Thamel, Kathmandu, Nepal", true, false, false, 10m, true, true, true, true, true, 500000m, 10, 50, 500m, 100m, "Betkibans", 10m, true, "support@betkibans.com", "+977-1-4567890", "Authentic Nepali Bamboo & Cane Furniture", new DateTime(2026, 3, 14, 8, 51, 54, 80, DateTimeKind.Utc).AddTicks(2184), null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformSettings");
        }
    }
}
