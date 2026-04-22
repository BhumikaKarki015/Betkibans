import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

interface Review {
    reviewId: number;
    productId: number;
    productName: string;
    productImageUrl?: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const MyReviews = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/Review/my-reviews')
            .then(res => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError('Failed to load your reviews.'))
            .finally(() => setLoading(false));
    }, []);

    const cardStyle = {
        backgroundColor: '#FDFAF5',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        border: 'none',
        borderRadius: 12,
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ color: i < rating ? '#F59E0B' : '#DDD', fontSize: 16 }}>★</span>
        ));
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-NP', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-1">
                    <Link to="/" className="text-muted text-decoration-none">Home</Link>
                    <span className="text-muted mx-2">›</span>
                    <Link to="/profile" className="text-muted text-decoration-none">My Account</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>My Reviews</span>
                </nav>

                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="fw-bold mb-0">My Reviews</h4>
                    <button
                        className="btn btn-sm fw-medium"
                        onClick={() => navigate('/profile')}
                        style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}
                    >
                        <i className="bi bi-arrow-left me-1"></i>Back to Profile
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-5 text-center" style={cardStyle}>
                        <div style={{ fontSize: 52 }}>⭐</div>
                        <h5 className="fw-bold mt-3 mb-1">No Reviews Yet</h5>
                        <p className="text-muted small mb-4">
                            You haven't reviewed any products yet. Share your experience after purchasing!
                        </p>
                        <button
                            className="btn fw-semibold px-4 text-white"
                            onClick={() => navigate('/products')}
                            style={{ backgroundColor: '#2D6A4F', borderRadius: 8, fontSize: 14 }}
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary bar */}
                        <div className="p-3 mb-3 d-flex align-items-center gap-3" style={{ ...cardStyle, borderRadius: 10 }}>
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                 style={{ width: 44, height: 44, backgroundColor: '#2D6A4F', fontSize: 18 }}>
                                {reviews.length}
                            </div>
                            <div>
                                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>
                                    {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'} Written
                                </p>
                                <small className="text-muted">
                                    Average rating:{' '}
                                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                                    </span>
                                    {' '}/ 5
                                </small>
                            </div>
                        </div>

                        {/* Review cards */}
                        <div className="d-flex flex-column gap-3">
                            {reviews.map(review => (
                                <div key={review.reviewId} className="p-3 p-md-4" style={cardStyle}>
                                    <div className="d-flex gap-3 align-items-start">
                                        {/* Product image */}
                                        <div
                                            className="rounded-2 flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden"
                                            style={{ width: 64, height: 64, backgroundColor: '#F0EBE1' }}
                                        >
                                            {review.productImageUrl ? (
                                                <img
                                                    src={review.productImageUrl.startsWith('http')
                                                        ? review.productImageUrl
                                                        : `${import.meta.env.VITE_API_URL}${review.productImageUrl}`}
                                                    alt={review.productName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        const t = e.target as HTMLImageElement;
                                                        t.onerror = null;
                                                        t.src = '/no-image.png';
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: 28 }}>🪑</span>
                                            )}
                                        </div>

                                        {/* Review content */}
                                        <div className="flex-grow-1 min-w-0">
                                            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-1">
                                                <h6
                                                    className="fw-semibold mb-0 text-truncate"
                                                    style={{ fontSize: 14, cursor: 'pointer', color: '#2D6A4F' }}
                                                    onClick={() => navigate(`/product/${review.productId}`)}
                                                >
                                                    {review.productName}
                                                </h6>
                                                <small className="text-muted flex-shrink-0">{formatDate(review.createdAt)}</small>
                                            </div>

                                            {/* Stars */}
                                            <div className="mb-2 d-flex align-items-center gap-2">
                                                <div>{renderStars(review.rating)}</div>
                                                <span className="fw-semibold" style={{ fontSize: 13, color: '#444' }}>
                                                    {review.rating}/5
                                                </span>
                                            </div>

                                            {/* Comment */}
                                            {review.comment ? (
                                                <p className="mb-0 text-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
                                                    "{review.comment}"
                                                </p>
                                            ) : (
                                                <p className="mb-0 text-muted fst-italic" style={{ fontSize: 13 }}>
                                                    No comment left.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MyReviews;
