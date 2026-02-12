using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
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
    }

    public class VerificationDto
    {
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }
}