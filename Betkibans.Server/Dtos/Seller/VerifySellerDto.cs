using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Seller;

public class VerifySellerDto
{
    [Required]
    public int SellerId { get; set; }

    [Required]
    public bool IsApproved { get; set; } // true = approve, false = reject

    public string? RejectionReason { get; set; } // Optional: reason for rejection
}