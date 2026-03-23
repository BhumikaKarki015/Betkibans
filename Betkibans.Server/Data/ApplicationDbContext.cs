using Betkibans.Server.Models;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options)
    {
    }
    
    // Tables
    public DbSet<Seller> Sellers { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Material> Materials { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<ProductMaterial> ProductMaterials { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<RepairRequest> RepairRequests { get; set; }
    public DbSet<RepairQuote> RepairQuotes { get; set; }
    public DbSet<Wishlist> Wishlists { get; set; }
    public DbSet<PlatformSettings> PlatformSettings { get; set; }
    public DbSet<Coupon> Coupons { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); 
        
        modelBuilder.Entity<Seller>(entity =>
        {
            entity.HasKey(e => e.SellerId);
            entity.Property(e => e.BusinessName).IsRequired().HasMaxLength(200);
            
            // This tells EF: "The 'User' property uses the 'UserId' column."
            entity.HasOne(e => e.User) 
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade); 
        });
        
        // Address Configuration
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId);
            entity.Property(e => e.AddressLine1).IsRequired().HasMaxLength(200);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.District).IsRequired().HasMaxLength(100);
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(e => e.UserId);
        });
        
        // Category Configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId);
            entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.CategoryName).IsUnique();
        });
        
        // Material Configuration
        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasKey(e => e.MaterialId);
            entity.Property(e => e.MaterialName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.MaterialName).IsUnique();
        });
        
        // Product Configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Length).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Width).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Height).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Weight).HasColumnType("decimal(10,2)");
            entity.Property(e => e.AverageRating).HasColumnType("decimal(3,2)");
            
            entity.HasOne(e => e.Seller).WithMany(s => s.Products).HasForeignKey(e => e.SellerId);
            entity.HasOne(e => e.Category).WithMany(c => c.Products).HasForeignKey(e => e.CategoryId);
        });
        
        // ProductImage Configuration
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ProductImageId);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Product).WithMany(p => p.ProductImages).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Cascade);
        });
        
        // ProductMaterial Configuration
        modelBuilder.Entity<ProductMaterial>(entity =>
        {
            entity.HasKey(e => e.ProductMaterialId);
            entity.HasOne(e => e.Product).WithMany(p => p.ProductMaterials).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Material).WithMany(m => m.ProductMaterials).HasForeignKey(e => e.MaterialId).OnDelete(DeleteBehavior.Cascade);
        });
        
        // Cart Configuration
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.CartId);
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(e => e.UserId);
        });
        
        // CartItem Configuration
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.CartItemId);
            entity.HasOne(e => e.Cart).WithMany(c => c.CartItems).HasForeignKey(e => e.CartId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany(p => p.CartItems).HasForeignKey(e => e.ProductId);
        });
        
        // Order Configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId);
            entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(10,2)");
            entity.Property(e => e.ShippingCost).HasColumnType("decimal(10,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(10,2)");
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Address).WithMany(a => a.Orders).HasForeignKey(e => e.AddressId);
        });
        
        // OrderItem Configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.OrderItemId);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(10,2)");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(10,2)");
            entity.HasOne(e => e.Order).WithMany(o => o.OrderItems).HasForeignKey(e => e.OrderId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany(p => p.OrderItems).HasForeignKey(e => e.ProductId);
        });
        
        // Payment Configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Order).WithOne(o => o.Payment).HasForeignKey<Payment>(e => e.OrderId).OnDelete(DeleteBehavior.Cascade);
        });
        
        // Review Configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.HasOne(e => e.Product).WithMany(p => p.Reviews).HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
        });
        
        // RepairRequest Configuration
        modelBuilder.Entity<RepairRequest>(entity =>
        {
            entity.HasKey(e => e.RepairRequestId);
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.SetNull);
        });
        
        // RepairQuote Configuration
        modelBuilder.Entity<RepairQuote>(entity =>
        {
            entity.HasKey(e => e.RepairQuoteId);
            entity.Property(e => e.EstimatedCost).HasColumnType("decimal(10,2)");
            entity.HasOne(e => e.RepairRequest).WithMany(r => r.RepairQuotes).HasForeignKey(e => e.RepairRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Seller).WithMany(s => s.RepairQuotes).HasForeignKey(e => e.SellerId);
        });
        
        // Seed Data
        modelBuilder.Entity<Category>().HasData(
            new Category { CategoryId = 1, CategoryName = "Chairs", Description = "Bamboo and cane chairs", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { CategoryId = 2, CategoryName = "Tables", Description = "Bamboo and cane tables", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { CategoryId = 3, CategoryName = "Storage", Description = "Storage furniture", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { CategoryId = 4, CategoryName = "Decorative", Description = "Decorative items", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { CategoryId = 5, CategoryName = "Outdoor", Description = "Outdoor furniture", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        modelBuilder.Entity<Material>().HasData(
            new Material { MaterialId = 1, MaterialName = "Bamboo", Description = "Natural bamboo", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Material { MaterialId = 2, MaterialName = "Cane", Description = "Natural cane", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Material { MaterialId = 3, MaterialName = "Rattan", Description = "Natural rattan", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Material { MaterialId = 4, MaterialName = "Mixed", Description = "Mixed materials", CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasKey(e => e.WishlistId);
            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(e => e.UserId);
        });
        
        // Coupons
        modelBuilder.Entity<Coupon>(entity => {
            entity.HasKey(e => e.CouponId);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MinOrderAmount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MaxDiscountAmount).HasColumnType("decimal(10,2)");
            entity.HasData(
                new Coupon { CouponId = 1, Code = "WELCOME10", DiscountType = "Percentage", DiscountValue = 10, MinOrderAmount = 500, MaxDiscountAmount = 500, Description = "10% off for new customers", ExpiresAt = new DateTime(2028, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Coupon { CouponId = 2, Code = "BAMBOO200", DiscountType = "Fixed", DiscountValue = 200, MinOrderAmount = 1000, Description = "NPR 200 off on orders above 1000", ExpiresAt = new DateTime(2028, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Coupon { CouponId = 3, Code = "GREEN15", DiscountType = "Percentage", DiscountValue = 15, MinOrderAmount = 2000, MaxDiscountAmount = 1000, Description = "15% off on orders above NPR 2000", ExpiresAt = new DateTime(2028, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });
        
        // ContactMessage Configuration
        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasKey(e => e.ContactMessageId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired();
        });
    }
}