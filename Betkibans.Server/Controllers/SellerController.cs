using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public SellerController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // ===========================
    // SELLER ACTIONS
    // ===========================

    // GET: api/Seller/profile
    [HttpGet("profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Seller profile not found" });

        return Ok(new 
        {
            sellerId = seller.SellerId,
            businessName = seller.BusinessName,
            businessDescription = seller.BusinessDescription,
            city = seller.City,
            district = seller.District,
            isVerified = seller.IsVerified,
            kycDocumentPath = seller.KycDocumentPath,
            createdAt = seller.CreatedAt,
            verifiedAt = seller.VerifiedAt,
            rejectionReason = seller.RejectionReason
        });
    }

    // POST: api/Seller/complete-profile
    [HttpPost("complete-profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> CompleteProfile([FromBody] CompleteSellerProfileDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        
        if (seller == null) return NotFound("Seller not found");

        seller.BusinessName = dto.BusinessName;
        seller.BusinessDescription = dto.BusinessDescription;
        seller.BusinessAddress = dto.BusinessAddress;
        seller.City = dto.City;
        seller.District = dto.District;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile updated.", profile = seller });
    }

    // POST: api/Seller/upload-kyc
    [HttpPost("upload-kyc")]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadKyc([FromForm] UploadKycDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

        if (dto.BusinessLicense == null || dto.IdDocument == null)
            return BadRequest("Missing documents");

        // Save Files Logic
        var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "kyc", $"seller_{seller.SellerId}");
        if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

        async Task<string> SaveFile(IFormFile file)
        {
            var fileName = $"{DateTime.Now.Ticks}_{file.FileName}";
            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create)) { await file.CopyToAsync(stream); }
            return $"/uploads/kyc/seller_{seller.SellerId}/{fileName}";
        }

        seller.KycDocumentPath = await SaveFile(dto.BusinessLicense);
        await SaveFile(dto.IdDocument); // Save ID but we only store one path in DB for now
        
        seller.IsVerified = false; 
        seller.RejectionReason = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "KYC Uploaded", profile = seller });
    }

    // ===========================
    // ADMIN ACTIONS (Restored!)
    // ===========================

    // GET: api/Seller/pending
    // This is the endpoint your Frontend was looking for (Error 404 fixed!)
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")] 
    public async Task<IActionResult> GetPendingSellers()
    {
        var pendingSellers = await _context.Sellers
            .Include(s => s.User) // <--- This requires Step 1 to be done!
            .Where(s => !s.IsVerified && s.KycDocumentPath != null && s.RejectionReason == null)
            .Select(s => new
            {
                s.SellerId,
                s.BusinessName,
                s.City,
                s.District,
                s.KycDocumentPath,
                s.CreatedAt,
                // These names must match what your Frontend expects
                UserEmail = s.User.Email,
                UserFullName = s.User.FullName
            })
            .ToListAsync();

        return Ok(pendingSellers);
    }
    
    // PUT: api/Seller/verify/{sellerId}
    [HttpPut("verify/{sellerId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> VerifySeller(int sellerId, [FromBody] VerificationDto dto)
    {
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.SellerId == sellerId);
        if (seller == null) return NotFound("Seller not found");

        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
            // Optional: reset KYC path to force re-upload
            // seller.KycDocumentPath = null; 
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = dto.IsApproved ? "Seller Verified" : "Seller Rejected" });
    }
}