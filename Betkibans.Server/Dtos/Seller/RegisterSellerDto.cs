using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Seller;

public class RegisterSellerDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    [Phone(ErrorMessage = "Invalid phone number")]
    public string PhoneNumber { get; set; } = string.Empty;

    // Business Information
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
}