using Betkibans.Server.DTOs.Seller;

namespace Betkibans.Server.Interfaces;

public interface ISellerService
{
    Task<SellerResponseDto?> GetSellerProfileAsync(string userId);
    Task<SellerResponseDto> CompleteSellerProfileAsync(string userId, CompleteSellerProfileDto dto);
    Task<SellerResponseDto> UploadKycDocumentsAsync(string userId, IFormFile businessLicense, IFormFile idDocument, IFormFile? taxDocument);
    Task<IEnumerable<SellerListDto>> GetPendingSellersAsync();
    Task<IEnumerable<SellerListDto>> GetAllSellersAsync();
    Task<SellerResponseDto> VerifySellerAsync(int sellerId, string adminUserId, bool isApproved, string? rejectionReason);
}