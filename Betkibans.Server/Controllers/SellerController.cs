using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ISellerService _sellerService;

    public SellerController(ISellerService sellerService)
    {
        _sellerService = sellerService;
    }

    // GET: api/seller/profile
    [HttpGet("profile")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<SellerResponseDto>> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var profile = await _sellerService.GetSellerProfileAsync(userId);
            if (profile == null)
                return NotFound(new { message = "Seller profile not found" });

            return Ok(profile);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving profile", error = ex.Message });
        }
    }

    // POST: api/seller/complete-profile
    [HttpPost("complete-profile")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<SellerResponseDto>> CompleteProfile([FromBody] CompleteSellerProfileDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var profile = await _sellerService.CompleteSellerProfileAsync(userId, dto);
            return Ok(new 
            { 
                message = "Profile completed successfully. Please upload KYC documents for verification.",
                profile 
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error completing profile", error = ex.Message });
        }
    }

    // POST: api/seller/upload-kyc
    // POST: api/seller/upload-kyc
    [HttpPost("upload-kyc")]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SellerResponseDto>> UploadKyc([FromForm] UploadKycDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            if (dto.BusinessLicense == null || dto.IdDocument == null)
                return BadRequest(new { message = "Business license and ID document are required" });

            var profile = await _sellerService.UploadKycDocumentsAsync(
                userId,
                dto.BusinessLicense,
                dto.IdDocument,
                dto.TaxDocument
            );

            return Ok(new
            {
                message = "KYC documents uploaded successfully. Your profile is under review.",
                profile
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error uploading documents", error = ex.Message });
        }
    }

    // GET: api/seller/pending (Admin only)
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<SellerListDto>>> GetPendingSellers()
    {
        try
        {
            var sellers = await _sellerService.GetPendingSellersAsync();
            return Ok(sellers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving pending sellers", error = ex.Message });
        }
    }

    // GET: api/seller/all (Admin only)
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<SellerListDto>>> GetAllSellers()
    {
        try
        {
            var sellers = await _sellerService.GetAllSellersAsync();
            return Ok(sellers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving sellers", error = ex.Message });
        }
    }

    // PUT: api/seller/verify
    [HttpPut("verify")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SellerResponseDto>> VerifySeller([FromBody] VerifySellerDto dto)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminUserId))
                return Unauthorized(new { message = "Admin not authenticated" });

            var seller = await _sellerService.VerifySellerAsync(dto.SellerId, adminUserId, dto.IsApproved, dto.RejectionReason);
            
            var message = dto.IsApproved 
                ? "Seller verified successfully" 
                : "Seller verification rejected";

            return Ok(new { message, seller });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error verifying seller", error = ex.Message });
        }
    }
}