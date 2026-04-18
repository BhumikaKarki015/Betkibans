import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface WishlistItem {
    wishlistId: number;
    productId: number;
    productName: string;
    productPrice: number;
    productDiscountPrice?: number;
    productImage?: string;
    stockQuantity: number;
    sellerBusinessName: string;
    averageRating: number;
    totalReviews: number;
    addedAt: string;
}

const Wishlist = () => {
    const { showToast } = useToast();
    const { user, isLoading } = useAuth();
    const { toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!user) { navigate('/login'); return; }
        fetchWishlist();
    }, [user, isLoading, navigate]);

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/Wishlist');
            setItems(res.data);
        } catch {
            console.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId: number) => {
        await toggleWishlist(productId);
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const handleAddToCart = async (productId: number) => {
        if (!user) { navigate('/login'); return; }
        setAddingToCart(productId);
        try {
            await addToCart(productId, 1);
            showToast('Added to cart!', 'success');
        } catch {
            showToast('Could not add to cart.', 'error');
        } finally {
            setAddingToCart(null);
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', border: 'none', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 900 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/" className="text-decoration-none text-muted">Home</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>My Wishlist</span>
                </nav>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">My Wishlist</h4>
                        <small className="text-muted">{items.length} saved item{items.length !== 1 ? 's' : ''}</small>
                    </div>
                    <Link to="/products" className="btn fw-semibold text-white"
                          style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8, fontSize: 14 }}>
                        <i className="bi bi-shop me-2"></i>Continue Shopping
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="p-5 text-center" style={cardStyle}>
                        <i className="bi bi-heart" style={{ fontSize: 52, color: '#C5BFB4' }}></i>
                        <h5 className="fw-bold mt-3 mb-2">Your wishlist is empty</h5>
                        <p className="text-muted mb-4">Save items you love and come back to them anytime.</p>
                        <Link to="/products" className="btn fw-semibold text-white px-4"
                              style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-shop me-2"></i>Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="row g-3">
                        {items.map(item => {
                            const hasDiscount = item.productDiscountPrice && item.productDiscountPrice < item.productPrice;
                            const displayPrice = hasDiscount ? item.productDiscountPrice! : item.productPrice;
                            const discountPct = hasDiscount
                                ? Math.round(((item.productPrice - item.productDiscountPrice!) / item.productPrice) * 100) : 0;

                            return (
                                <div key={item.wishlistId} className="col-12 col-md-6">
                                    <div className="p-3 h-100" style={cardStyle}>
                                        <div className="d-flex gap-3">
                                            {/* Image */}
                                            <div className="rounded-2 overflow-hidden flex-shrink-0"
                                                 style={{ width: 100, height: 100, backgroundColor: '#F0EBE1', cursor: 'pointer' }}
                                                 onClick={() => navigate(`/product/${item.productId}`)}>
                                                <img
                                                    src={item.productImage
                                                        ? `${import.meta.env.VITE_API_URL}${item.productImage}`
                                                        : 'https://via.placeholder.com/100?text=Item'}
                                                    alt={item.productName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-grow-1 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <p className="fw-semibold mb-1"
                                                           style={{ fontSize: 14, cursor: 'pointer', color: '#1a1a1a' }}
                                                           onClick={() => navigate(`/product/${item.productId}`)}>
                                                            {item.productName}
                                                        </p>
                                                        {/* Remove heart */}
                                                        <button className="btn btn-sm p-1 border-0"
                                                                onClick={() => handleRemove(item.productId)}
                                                                title="Remove from wishlist"
                                                                style={{ background: 'none' }}>
                                                            <i className="bi bi-heart-fill" style={{ color: '#E53935', fontSize: 16 }}></i>
                                                        </button>
                                                    </div>
                                                    <small className="text-muted d-block mb-1">
                                                        <i className="bi bi-shop me-1"></i>{item.sellerBusinessName}
                                                    </small>
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="bi bi-star-fill" style={{ color: '#FFC107', fontSize: 11 }}></i>
                                                        <small className="text-muted">
                                                            {item.averageRating?.toFixed(1) || '0.0'} ({item.totalReviews})
                                                        </small>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 15 }}>
                                                            NPR {displayPrice.toLocaleString()}
                                                        </span>
                                                        {hasDiscount && (
                                                            <>
                                                                <span className="text-muted text-decoration-line-through" style={{ fontSize: 12 }}>
                                                                    NPR {item.productPrice.toLocaleString()}
                                                                </span>
                                                                <span className="badge"
                                                                      style={{ backgroundColor: '#FDECEA', color: '#C0392B', fontSize: 10 }}>
                                                                    {discountPct}% OFF
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2 mt-2">
                                                    {item.stockQuantity > 0 ? (
                                                        <button className="btn btn-sm fw-semibold text-white flex-grow-1"
                                                                onClick={() => handleAddToCart(item.productId)}
                                                                disabled={addingToCart === item.productId}
                                                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 6, fontSize: 13 }}>
                                                            {addingToCart === item.productId
                                                                ? <><span className="spinner-border spinner-border-sm me-1"></span>Adding...</>
                                                                : <><i className="bi bi-cart-plus me-1"></i>Add to Cart</>}
                                                        </button>
                                                    ) : (
                                                        <span className="btn btn-sm fw-medium flex-grow-1 disabled"
                                                              style={{ backgroundColor: '#F5F5F5', color: '#999', borderRadius: 6, fontSize: 13 }}>
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
