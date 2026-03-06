using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.Dtos.Review;

public class CreateReviewDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [StringLength(100)]
    public string? Title { get; set; }

    [Required]
    [StringLength(1500)]
    public string ReviewText { get; set; } = string.Empty;
}