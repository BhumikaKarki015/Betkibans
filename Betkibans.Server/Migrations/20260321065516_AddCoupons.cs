using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Betkibans.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCoupons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformSettings");

            migrationBuilder.CreateTable(
                name: "Coupons",
                columns: table => new
                {
                    CouponId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    DiscountType = table.Column<string>(type: "text", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MinOrderAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MaxDiscountAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    UsageLimit = table.Column<int>(type: "integer", nullable: false),
                    UsedCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.CouponId);
                });

            migrationBuilder.InsertData(
                table: "Coupons",
                columns: new[] { "CouponId", "Code", "CreatedAt", "Description", "DiscountType", "DiscountValue", "ExpiresAt", "IsActive", "MaxDiscountAmount", "MinOrderAmount", "UsageLimit", "UsedCount" },
                values: new object[,]
                {
                    { 1, "WELCOME10", new DateTime(2026, 3, 21, 6, 55, 15, 796, DateTimeKind.Utc).AddTicks(3273), "10% off for new customers", "Percentage", 10m, new DateTime(2028, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 500m, 500m, 100, 0 },
                    { 2, "BAMBOO200", new DateTime(2026, 3, 21, 6, 55, 15, 796, DateTimeKind.Utc).AddTicks(3290), "NPR 200 off on orders above 1000", "Fixed", 200m, new DateTime(2028, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, 1000m, 100, 0 },
                    { 3, "GREEN15", new DateTime(2026, 3, 21, 6, 55, 15, 796, DateTimeKind.Utc).AddTicks(3291), "15% off on orders above NPR 2000", "Percentage", 15m, new DateTime(2028, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1000m, 2000m, 100, 0 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Coupons");

            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Address = table.Column<string>(type: "text", nullable: false),
                    AllowDiscounts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowGuestCheckout = table.Column<bool>(type: "boolean", nullable: false),
                    AutoApproveVerifiedSellers = table.Column<bool>(type: "boolean", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EnableProductReviews = table.Column<bool>(type: "boolean", nullable: false),
                    EnablePurchaseForReview = table.Column<bool>(type: "boolean", nullable: false),
                    EnableRepairRequests = table.Column<bool>(type: "boolean", nullable: false),
                    EnableSellerAnalytics = table.Column<bool>(type: "boolean", nullable: false),
                    EnableWishlist = table.Column<bool>(type: "boolean", nullable: false),
                    MaxOrderAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MaxProductImages = table.Column<int>(type: "integer", nullable: false),
                    MinDescriptionLength = table.Column<int>(type: "integer", nullable: false),
                    MinOrderAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MinProductPrice = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PlatformName = table.Column<string>(type: "text", nullable: false),
                    RepairCommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RequireSellerVerification = table.Column<bool>(type: "boolean", nullable: false),
                    SupportEmail = table.Column<string>(type: "text", nullable: false),
                    SupportPhone = table.Column<string>(type: "text", nullable: false),
                    Tagline = table.Column<string>(type: "text", nullable: false),
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
                values: new object[] { 1, "Thamel, Kathmandu, Nepal", true, false, false, 10m, true, true, true, true, true, 500000m, 10, 50, 500m, 100m, "Betkibans", 10m, true, "support@betkibans.com", "+977-1-4567890", "Authentic Nepali Bamboo & Cane Furniture", new DateTime(2026, 3, 21, 6, 6, 21, 616, DateTimeKind.Utc).AddTicks(247), null });
        }
    }
}
