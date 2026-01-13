using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Services;

public class SellerService : ISellerService
{
    private readonly ISellerRepository _sellerRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public SellerService(
        ISellerRepository sellerRepository, 
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _sellerRepository = sellerRepository;
        _userManager = userManager;
        _context = context;
        _environment = environment;
    }

    public async Task<SellerResponseDto?> GetSellerProfileAsync(string userId)
    {
        var seller = await _sellerRepository.GetByUserIdAsync(userId);
        if (seller == null)
            return null;

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return null;

        return MapToResponseDto(seller, user);
    }

    public async Task<SellerResponseDto> CompleteSellerProfileAsync(string userId, CompleteSellerProfileDto dto)
    {
        var seller = await _sellerRepository.GetByUserIdAsync(userId);
        if (seller == null)
            throw new Exception("Seller profile not found");

        // Update seller profile
        seller.BusinessName = dto.BusinessName;
        seller.BusinessDescription = dto.BusinessDescription;
        seller.BusinessAddress = dto.BusinessAddress;
        seller.City = dto.City;
        seller.District = dto.District;

        await _sellerRepository.UpdateAsync(seller);

        var user = await _userManager.FindByIdAsync(userId);
        return MapToResponseDto(seller, user!);
    }

    public async Task<SellerResponseDto> UploadKycDocumentsAsync(string userId, IFormFile businessLicense, IFormFile idDocument, IFormFile? taxDocument)
    {
        var seller = await _sellerRepository.GetByUserIdAsync(userId);
        if (seller == null)
            throw new Exception("Seller profile not found");

        // Create uploads directory if it doesn't exist
        var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "kyc");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        // Generate unique folder for this seller
        var sellerFolder = Path.Combine(uploadsPath, $"seller_{seller.SellerId}");
        if (!Directory.Exists(sellerFolder))
        {
            Directory.CreateDirectory(sellerFolder);
        }

        // Save business license
        var businessLicensePath = await SaveFileAsync(businessLicense, sellerFolder, "business_license");
        
        // Save ID document
        var idDocumentPath = await SaveFileAsync(idDocument, sellerFolder, "id_document");

        // Save tax document if provided
        string? taxDocumentPath = null;
        if (taxDocument != null)
        {
            taxDocumentPath = await SaveFileAsync(taxDocument, sellerFolder, "tax_document");
        }

        // Update seller with document paths (store relative path)
        seller.KycDocumentPath = $"/uploads/kyc/seller_{seller.SellerId}/";
        
        await _sellerRepository.UpdateAsync(seller);

        var user = await _userManager.FindByIdAsync(userId);
        return MapToResponseDto(seller, user!);
    }

    public async Task<IEnumerable<SellerListDto>> GetPendingSellersAsync()
    {
        var sellers = await _sellerRepository.GetPendingVerificationAsync();
        var sellerDtos = new List<SellerListDto>();

        foreach (var seller in sellers)
        {
            var user = await _userManager.FindByIdAsync(seller.UserId);
            if (user != null)
            {
                sellerDtos.Add(new SellerListDto
                {
                    SellerId = seller.SellerId,
                    Email = user.Email!,
                    FullName = user.FullName,
                    BusinessName = seller.BusinessName,
                    City = seller.City ?? "",
                    District = seller.District ?? "",
                    IsVerified = seller.IsVerified,
                    KycDocumentPath = seller.KycDocumentPath,
                    CreatedAt = seller.CreatedAt,
                    VerifiedAt = seller.VerifiedAt
                });
            }
        }

        return sellerDtos;
    }

    public async Task<IEnumerable<SellerListDto>> GetAllSellersAsync()
    {
        var sellers = await _sellerRepository.GetAllAsync();
        var sellerDtos = new List<SellerListDto>();

        foreach (var seller in sellers)
        {
            var user = await _userManager.FindByIdAsync(seller.UserId);
            if (user != null)
            {
                sellerDtos.Add(new SellerListDto
                {
                    SellerId = seller.SellerId,
                    Email = user.Email!,
                    FullName = user.FullName,
                    BusinessName = seller.BusinessName,
                    City = seller.City ?? "",
                    District = seller.District ?? "",
                    IsVerified = seller.IsVerified,
                    KycDocumentPath = seller.KycDocumentPath,
                    CreatedAt = seller.CreatedAt,
                    VerifiedAt = seller.VerifiedAt
                });
            }
        }

        return sellerDtos;
    }

    public async Task<SellerResponseDto> VerifySellerAsync(int sellerId, string adminUserId, bool isApproved, string? rejectionReason)
    {
        var seller = await _sellerRepository.GetByIdAsync(sellerId);
        if (seller == null)
            throw new Exception("Seller not found");

        if (isApproved)
        {
            seller.IsVerified = true;
            seller.VerifiedAt = DateTime.UtcNow;
            seller.VerifiedBy = adminUserId;
        }
        else
        {
            seller.IsVerified = false;
            seller.VerifiedAt = null;
            seller.VerifiedBy = null;
            // You could add a RejectionReason field to Seller entity if needed
        }

        await _sellerRepository.UpdateAsync(seller);

        var user = await _userManager.FindByIdAsync(seller.UserId);
        return MapToResponseDto(seller, user!);
    }

    private async Task<string> SaveFileAsync(IFormFile file, string folderPath, string filePrefix)
    {
        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{filePrefix}_{DateTime.UtcNow.Ticks}{extension}";
        var filePath = Path.Combine(folderPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return filePath;
    }

    private SellerResponseDto MapToResponseDto(Models.Entities.Seller seller, ApplicationUser user)
    {
        return new SellerResponseDto
        {
            SellerId = seller.SellerId,
            UserId = seller.UserId,
            Email = user.Email!,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? "",
            BusinessName = seller.BusinessName,
            BusinessDescription = seller.BusinessDescription ?? "",
            BusinessAddress = seller.BusinessAddress ?? "",
            City = seller.City ?? "",
            District = seller.District ?? "",
            IsVerified = seller.IsVerified,
            VerifiedAt = seller.VerifiedAt,
            CreatedAt = seller.CreatedAt
        };
    }
}