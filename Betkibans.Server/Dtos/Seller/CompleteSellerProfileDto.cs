using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Seller;

public class CompleteSellerProfileDto
{
    [Required(ErrorMessage = "Business name is required")]
    [StringLength(200)]
    public string BusinessName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Business description is required")]
    public string BusinessDescription { get; set; } = string.Empty;

    [Required(ErrorMessage = "Business address is required")]
    public string BusinessAddress { get; set; } = string.Empty;

    [Required(ErrorMessage = "City is required")]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "District is required")]
    public string District { get; set; } = string.Empty;
    
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? BusinessHours { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }

}