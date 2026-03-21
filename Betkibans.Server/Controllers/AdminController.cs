using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Betkibans.Server.Models;
using Microsoft.AspNetCore.Identity;

namespace Betkibans.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/Admin/pending-sellers
        [HttpGet("pending-sellers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingSellers()
        {
            var pendingSellers = await _context.Sellers
                .Include(s => s.User)
                .Where(s => !s.IsVerified && s.KycDocumentPath != null && s.RejectionReason == null)
                .Select(s => new
                {
                    s.SellerId,
                    s.BusinessName,
                    s.City,
                    s.District,
                    s.KycDocumentPath,
                    s.CreatedAt,
                    UserEmail = s.User.Email,
                    UserFullName = s.User.FullName
                })
                .ToListAsync();

            return Ok(pendingSellers);
        }

        // PUT: api/Admin/verify-seller/{sellerId}
        [HttpPut("verify-seller/{sellerId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> VerifySeller(int sellerId, [FromBody] VerificationDto dto)
        {
            var seller = await _context.Sellers.FindAsync(sellerId);
            if (seller == null) return NotFound("Seller not found");

            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (dto.IsApproved)
            {
                seller.IsVerified = true;
                seller.VerifiedAt = DateTime.UtcNow;
                seller.VerifiedBy = adminId;
                seller.RejectionReason = null;
            }
            else
            {
                seller.IsVerified = false;
                seller.RejectionReason = dto.RejectionReason;
                seller.KycDocumentPath = null;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = dto.IsApproved ? "Seller Verified" : "Seller Rejected" });
        }

        // GET: api/Admin/users
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .OfType<ApplicationUser>()
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var result = new List<object>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                result.Add(new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    u.CreatedAt,
                    Role = roles.FirstOrDefault() ?? "Buyer",
                    IsActive = true
                });
            }
            return Ok(result);
        }

        // GET: api/Admin/products
        [HttpGet("products")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.ProductId,
                    p.Name,
                    p.Price,
                    p.StockQuantity,
                    p.IsActive,
                    p.CreatedAt,
                    CategoryName = p.Category != null ? p.Category.CategoryName : "—",
                    SellerBusinessName = p.Seller != null ? p.Seller.BusinessName : "—",
                    AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0.0,
                    TotalReviews = p.Reviews.Count
                })
                .ToListAsync();

            return Ok(products);
        }

        // PATCH: api/Admin/products/{productId}/toggle
        [HttpPatch("products/{productId}/toggle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleProduct(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound();
            product.IsActive = !product.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product status updated.", isActive = product.IsActive });
        }

        // GET: api/Admin/orders
        [HttpGet("orders")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.Address)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = orders.Select(o => {
                var user = _context.Users.Find(o.UserId) as ApplicationUser;
                return new
                {
                    o.OrderId,
                    o.OrderNumber,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt,
                    UserName = user?.FullName ?? "—",
                    City = o.Address?.City ?? "—"
                };
            });

            return Ok(result);
        }

        // GET: api/Admin/repairs
        [HttpGet("repairs")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRepairs()
        {
            var repairs = await _context.RepairRequests
                .Include(r => r.Product)
                .Include(r => r.RepairQuotes)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = repairs.Select(r => {
                var user = _context.Users.Find(r.UserId) as ApplicationUser;
                return new
                {
                    r.RepairRequestId,
                    ProductName = r.Product != null ? r.Product.Name : "General Item",
                    r.Description,
                    r.DamageImageUrl,
                    r.Status,
                    r.CreatedAt,
                    r.UserId,
                    UserName = user?.FullName ?? "—",
                    QuotesCount = r.RepairQuotes.Count
                };
            });

            return Ok(result);
        }

        // GET: api/Admin/stats
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            return Ok(new
            {
                TotalUsers    = await _context.Users.CountAsync(),
                TotalSellers  = await _context.Sellers.CountAsync(s => s.IsVerified),
                TotalProducts = await _context.Products.CountAsync(p => p.IsActive),
                TotalOrders   = await _context.Orders.CountAsync(),
                TotalRevenue  = await _context.Orders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0
            });
        }


        // GET: api/Admin/analytics
        [HttpGet("analytics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAnalytics()
        {
            var now = DateTime.UtcNow;

            var monthlyData = Enumerable.Range(0, 6).Select(i => {
                var date = now.AddMonths(-i);
                var rev = _context.Orders
                    .Where(o => o.Status != "Cancelled" && o.CreatedAt.Month == date.Month && o.CreatedAt.Year == date.Year)
                    .Sum(o => (decimal?)o.TotalAmount) ?? 0;
                return new { month = date.ToString("MMM yyyy"), revenue = rev };
            }).Reverse().ToList();

            var ordersByStatus = await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync();

            var topSellers = await _context.Sellers
                .Include(s => s.Products)
                .ThenInclude(p => p.OrderItems)
                .Where(s => s.IsVerified)
                .Select(s => new {
                    s.SellerId,
                    s.BusinessName,
                    s.City,
                    TotalProducts = s.Products.Count(p => p.IsActive),
                    Revenue = s.Products
                        .SelectMany(p => p.OrderItems)
                        .Sum(oi => (decimal?)(oi.UnitPrice * oi.Quantity)) ?? 0
                })
                .OrderByDescending(s => s.Revenue)
                .Take(5)
                .ToListAsync();

            var categoryBreakdown = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive)
                .GroupBy(p => p.Category.CategoryName)
                .Select(g => new { category = g.Key, count = g.Count() })
                .OrderByDescending(c => c.count)
                .ToListAsync();

            var thisMonth = now.Month;
            var thisYear = now.Year;

            return Ok(new {
                totalRevenue = await _context.Orders.Where(o => o.Status != "Cancelled").SumAsync(o => (decimal?)o.TotalAmount) ?? 0,
                monthlyRevenue = await _context.Orders.Where(o => o.Status != "Cancelled" && o.CreatedAt.Month == thisMonth && o.CreatedAt.Year == thisYear).SumAsync(o => (decimal?)o.TotalAmount) ?? 0,
                totalOrders = await _context.Orders.CountAsync(),
                totalUsers = await _context.Users.CountAsync(),
                totalSellers = await _context.Sellers.CountAsync(s => s.IsVerified),
                pendingSellers = await _context.Sellers.CountAsync(s => !s.IsVerified && s.KycDocumentPath != null),
                totalProducts = await _context.Products.CountAsync(p => p.IsActive),
                totalRepairs = await _context.RepairRequests.CountAsync(),
                monthlyData,
                ordersByStatus,
                topSellers,
                categoryBreakdown
            });
        }

        // GET: api/Admin/settings
        [HttpGet("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.PlatformSettings.FindAsync(1);
            if (settings == null)
            {
                settings = new PlatformSettings { Id = 1 };
                _context.PlatformSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return Ok(settings);
        }

        // PUT: api/Admin/settings
        [HttpPut("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSettings([FromBody] PlatformSettings dto)
        {
            var settings = await _context.PlatformSettings.FindAsync(1);
            if (settings == null) return NotFound();

            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            settings.PlatformName = dto.PlatformName;
            settings.Tagline = dto.Tagline;
            settings.SupportEmail = dto.SupportEmail;
            settings.SupportPhone = dto.SupportPhone;
            settings.Address = dto.Address;
            settings.CommissionRate = dto.CommissionRate;
            settings.RepairCommissionRate = dto.RepairCommissionRate;
            settings.MinOrderAmount = dto.MinOrderAmount;
            settings.MaxOrderAmount = dto.MaxOrderAmount;
            settings.RequireSellerVerification = dto.RequireSellerVerification;
            settings.AutoApproveVerifiedSellers = dto.AutoApproveVerifiedSellers;
            settings.AllowDiscounts = dto.AllowDiscounts;
            settings.EnableSellerAnalytics = dto.EnableSellerAnalytics;
            settings.MinProductPrice = dto.MinProductPrice;
            settings.MaxProductImages = dto.MaxProductImages;
            settings.MinDescriptionLength = dto.MinDescriptionLength;
            settings.AllowGuestCheckout = dto.AllowGuestCheckout;
            settings.EnableWishlist = dto.EnableWishlist;
            settings.EnableProductReviews = dto.EnableProductReviews;
            settings.EnablePurchaseForReview = dto.EnablePurchaseForReview;
            settings.EnableRepairRequests = dto.EnableRepairRequests;
            settings.UpdatedAt = DateTime.UtcNow;
            settings.UpdatedBy = adminId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings saved successfully." });
        }

    }

    public class VerificationDto
    {
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }
}