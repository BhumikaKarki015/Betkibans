using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Seller;

public class UploadKycDto
{
    [Required]
    public IFormFile BusinessLicense { get; set; } = null!;

    [Required]
    public IFormFile IdDocument { get; set; } = null!;

    public IFormFile? TaxDocument { get; set; }
}