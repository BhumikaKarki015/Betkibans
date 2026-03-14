import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import api from '../services/api';
import type { Product } from '../types/Product';
import { useToast } from '../contexts/ToastContext';

interface Review {
    reviewId: number;
    reviewerName: string;
    rating: number;
    title?: string;
    reviewText: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

// ─── Reusable Star Component ──────────────────────────────────────
const Stars = ({
                   rating, size = 16, interactive = false, hovered = 0, onHover, onClick,
               }: {
    rating: number; size?: number; interactive?: boolean; hovered?: number;
    onHover?: (n: number) => void; onClick?: (n: number) => void;
}) => (
    <span className="d-inline-flex" style={{ gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => {
            const filled = s <= (interactive ? hovered || rating : rating);
            return (
                <i key={s}
                   className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`}
                   style={{
                       fontSize: size, cursor: interactive ? 'pointer' : 'default',
                       color: filled ? '#FFC107' : '#CCCCCC',
                       transition: interactive ? 'color 0.1s' : undefined,
                   }}
                   onMouseEnter={() => interactive && onHover?.(s)}
                   onMouseLeave={() => interactive && onHover?.(0)}
                   onClick={() => interactive && onClick?.(s)}
                />
            );
        })}
    </span>
);

// ─── Main Component ───────────────────────────────────────────────
const ProductDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'care' | 'shipping' | 'reviews'>('description');
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewHovered, setReviewHovered] = useState(0);
    const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', reviewText: '' });

    useEffect(() => {
        if (id) {
            fetchProduct(parseInt(id));
            fetchReviews(parseInt(id));
        }
    }, [id]);

    const fetchProduct = async (productId: number) => {
        try {
            const data = await productService.getProductById(productId);
            setProduct(data);
            if (data.productImages?.length > 0) {
                setSelectedImage(`http://localhost:5192${data.productImages[0].imageUrl}`);
            }
            try {
                const all = await productService.getAllProducts({ categoryIds: [data.categoryId] });
                setRelatedProducts(all.filter((p: Product) => p.productId !== productId).slice(0, 4));
            } catch { /* related products optional */ }
        } catch (err) {
            console.error('Failed to load product', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (productId: number) => {
        try {
            const res = await api.get(`/Review/product/${productId}`);
            setReviews(res.data);
        } catch { /* silently skip */ }
    };

    const handleAddToCart = async () => {
        if (!user) { navigate('/login'); return; }
        if (!product) return;
        setIsAdding(true);
        try {
            await addToCart(product.productId, quantity);
            showToast(`${product.name} added to cart!`, 'success');
        } catch { showToast('Could not add to cart. Please try again.', 'error'); }
        finally { setIsAdding(false); }
    };

    const handleBuyNow = async () => {
        if (!user) { navigate('/login'); return; }
        if (!product) return;
        setIsAdding(true);
        try {
            await addToCart(product.productId, quantity);
            navigate('/checkout');
        } catch { showToast('Could not proceed. Please try again.', 'error'); }
        finally { setIsAdding(false); }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reviewForm.rating === 0) { showToast('Please select a rating.', 'warning'); return; }
        setSubmittingReview(true);
        try {
            await api.post('/Review', { productId: parseInt(id!), ...reviewForm });
            setShowReviewForm(false);
            setReviewForm({ rating: 0, title: '', reviewText: '' });
            await fetchReviews(parseInt(id!));
            showToast('Review submitted successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
        } finally { setSubmittingReview(false); }
    };

    const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    // Discount calculation
    const hasDiscount = product?.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product!.price - product!.discountPrice!) / product!.price) * 100) : 0;

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    if (!product) return (
        <div className="container py-5 text-center">
            <i className="bi bi-exclamation-circle" style={{ fontSize: 48, color: '#ccc' }}></i>
            <h4 className="mt-3">Product not found</h4>
            <Link to="/products" className="btn mt-3" style={{ backgroundColor: '#2D6A4F', color: 'white' }}>
                Back to Shop
            </Link>
        </div>
    );

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'specs', label: 'Specifications' },
        { key: 'care', label: 'Care Guide' },
        { key: 'shipping', label: 'Shipping' },
        { key: 'reviews', label: `Reviews (${reviews.length})` },
    ] as const;

    return (
        <>
            {/* ── Breadcrumb ── */}
            <div className="py-2 border-bottom" style={{ backgroundColor: '#EDEAE3' }}>
                <div className="container">
                    <ol className="breadcrumb mb-0 small">
                        <li className="breadcrumb-item">
                            <Link to="/" className="text-decoration-none" style={{ color: '#2D6A4F' }}>Home</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link to="/products" className="text-decoration-none" style={{ color: '#2D6A4F' }}>Shop</Link>
                        </li>
                        {product.categoryName && (
                            <li className="breadcrumb-item">
                                <Link to={`/products?category=${product.categoryName}`}
                                      className="text-decoration-none" style={{ color: '#2D6A4F' }}>
                                    {product.categoryName}
                                </Link>
                            </li>
                        )}
                        <li className="breadcrumb-item active" style={{ maxWidth: 200 }} aria-current="page">
                            {product.name}
                        </li>
                    </ol>
                </div>
            </div>

            <div className="container py-4">

                {/* ── Product Section ── */}
                <div className="row g-4 mb-5">

                    {/* LEFT: Image gallery */}
                    <div className="col-lg-5">
                        {/* Main image */}
                        <div className="rounded-3 overflow-hidden mb-3 d-flex align-items-center justify-content-center"
                             style={{ backgroundColor: '#FDFAF5', height: 420, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
                            <img
                                src={selectedImage || '/placeholder.jpg'}
                                alt={product.name}
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: 16 }}
                            />
                        </div>
                        {/* Thumbnails */}
                        {(product.productImages?.length ?? 0) > 1 && (
                            <div className="d-flex gap-2 flex-wrap">
                                {product.productImages?.map((img) => (
                                    <button key={img.productImageId}
                                            onClick={() => setSelectedImage(`http://localhost:5192${img.imageUrl}`)}
                                            className="p-0 border-0 rounded-2 overflow-hidden"
                                            style={{
                                                width: 68, height: 68,
                                                outline: selectedImage.includes(img.imageUrl) ? `2px solid #2D6A4F` : '2px solid transparent',
                                                cursor: 'pointer', backgroundColor: '#FDFAF5',
                                            }}>
                                        <img src={`http://localhost:5192${img.imageUrl}`}
                                             alt="thumb"
                                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Product info */}
                    <div className="col-lg-7">

                        {/* Title */}
                        <h1 className="fw-bold mb-2" style={{ fontSize: '1.6rem', lineHeight: 1.3 }}>
                            {product.name}
                        </h1>

                        {/* Stars + review count */}
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Stars rating={Math.round(avgRating)} size={18} />
                            <span className="fw-semibold" style={{ color: '#2D6A4F' }}>
                                {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
                            </span>
                            <span className="text-muted small">({reviews.length} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <span className="fw-bold" style={{ fontSize: '1.8rem', color: '#2D6A4F' }}>
                                NPR {(hasDiscount ? product.discountPrice! : product.price).toLocaleString()}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-muted text-decoration-line-through" style={{ fontSize: '1.1rem' }}>
                                        NPR {product.price.toLocaleString()}
                                    </span>
                                    <span className="badge fw-semibold px-2 py-1"
                                          style={{ backgroundColor: '#FDECEA', color: '#C0392B', fontSize: 13 }}>
                                        {discountPercent}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Seller card */}
                        <div className="rounded-3 p-3 mb-3 d-flex align-items-center justify-content-between"
                             style={{ backgroundColor: '#EDEAE3', border: '1px solid #DDD9D2' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-circle d-flex align-items-center justify-content-center"
                                     style={{ width: 40, height: 40, backgroundColor: '#2D6A4F' }}>
                                    <i className="bi bi-shop text-white" style={{ fontSize: 18 }}></i>
                                </div>
                                <div>
                                    <div className="fw-semibold" style={{ fontSize: 14 }}>
                                        {product.sellerBusinessName || 'Verified Artisan'}
                                        &nbsp;
                                        <span className="badge" style={{ backgroundColor: '#D4EDDA', color: '#2D6A4F', fontSize: 11 }}>
                                            <i className="bi bi-patch-check-fill me-1"></i>Verified Seller
                                        </span>
                                    </div>
                                    <small className="text-muted">
                                        <i className="bi bi-geo-alt me-1"></i>Nepal
                                    </small>
                                </div>
                            </div>
                            {/* Seller rating */}
                            <div className="text-end">
                                <div className="d-flex align-items-center gap-1 justify-content-end">
                                    <i className="bi bi-star-fill" style={{ color: '#FFC107', fontSize: 13 }}></i>
                                    <span className="fw-bold small">{product.averageRating?.toFixed(1) || '4.9'}</span>
                                </div>
                                <small className="text-muted">({product.totalReviews || 0} reviews)</small>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="mb-3">
                            {product.stockQuantity > 0 ? (
                                <span className="fw-semibold" style={{ color: '#2D6A4F', fontSize: 14 }}>
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    In Stock ({product.stockQuantity} units available)
                                </span>
                            ) : (
                                <span className="text-danger fw-semibold" style={{ fontSize: 14 }}>
                                    <i className="bi bi-x-circle-fill me-1"></i>Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Quantity selector */}
                        {product.stockQuantity > 0 && (
                            <div className="mb-4">
                                <label className="fw-medium small text-muted d-block mb-2">Quantity</label>
                                <div className="d-flex align-items-center gap-0"
                                     style={{ border: '1px solid #CCC', borderRadius: 8, display: 'inline-flex', overflow: 'hidden' }}>
                                    <button className="btn btn-sm px-3 py-2 border-0"
                                            style={{ backgroundColor: '#EDEAE3', borderRadius: 0 }}
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                        −
                                    </button>
                                    <span className="px-4 fw-bold" style={{ fontSize: 15, minWidth: 48, textAlign: 'center' }}>
                                        {quantity}
                                    </span>
                                    <button className="btn btn-sm px-3 py-2 border-0"
                                            style={{ backgroundColor: '#EDEAE3', borderRadius: 0 }}
                                            onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}>
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart + Wishlist + Buy Now */}
                        <div className="d-grid gap-2 mb-3" style={{ maxWidth: 480 }}>
                            <div className="d-flex gap-2">
                                <button className="btn btn-lg fw-semibold text-white flex-grow-1"
                                        onClick={handleAddToCart}
                                        disabled={product.stockQuantity === 0 || isAdding}
                                        style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F', borderRadius: 8 }}>
                                    <i className="bi bi-cart-plus me-2"></i>
                                    {isAdding ? 'Adding...' : product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button className="btn btn-lg"
                                        onClick={() => user ? toggleWishlist(product.productId) : navigate('/login')}
                                        title={isWishlisted(product.productId) ? 'Remove from wishlist' : 'Save to wishlist'}
                                        style={{
                                            border: `2px solid #E53935`,
                                            borderRadius: 8, minWidth: 52,
                                            backgroundColor: isWishlisted(product.productId) ? '#FFEBEE' : 'transparent',
                                            color: '#E53935',
                                        }}>
                                    <i className={`bi ${isWishlisted(product.productId) ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                                </button>
                            </div>
                            {product.stockQuantity > 0 && (
                                <button className="btn btn-lg fw-semibold"
                                        onClick={handleBuyNow}
                                        disabled={isAdding}
                                        style={{ border: '2px solid #2D6A4F', color: '#2D6A4F', backgroundColor: 'transparent', borderRadius: 8 }}>
                                    Buy Now
                                </button>
                            )}
                        </div>

                        {/* Key Features */}
                        <div className="rounded-3 p-3" style={{ backgroundColor: '#EDEAE3' }}>
                            <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: 1, color: '#666' }}>
                                Key Features
                            </h6>
                            <ul className="list-unstyled mb-0">
                                <li className="mb-1 small">
                                    <i className="bi bi-dot me-1" style={{ color: '#2D6A4F', fontSize: 18, verticalAlign: 'middle' }}></i>
                                    Handcrafted from premium bamboo
                                </li>
                                <li className="mb-1 small">
                                    <i className="bi bi-dot me-1" style={{ color: '#2D6A4F', fontSize: 18, verticalAlign: 'middle' }}></i>
                                    Eco-friendly and sustainable materials
                                </li>
                                <li className="mb-1 small">
                                    <i className="bi bi-dot me-1" style={{ color: '#2D6A4F', fontSize: 18, verticalAlign: 'middle' }}></i>
                                    Natural finish, no harsh chemicals
                                </li>
                                {product.weight && (
                                    <li className="mb-1 small">
                                        <i className="bi bi-dot me-1" style={{ color: '#2D6A4F', fontSize: 18, verticalAlign: 'middle' }}></i>
                                        Weight capacity: {product.weight} kg
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="mb-5">
                    {/* Tab headers */}
                    <div className="border-bottom mb-4">
                        <div className="d-flex gap-0">
                            {tabs.map(tab => (
                                <button key={tab.key}
                                        className="btn border-0 pb-3 px-4 fw-medium"
                                        style={{
                                            borderRadius: 0,
                                            color: activeTab === tab.key ? '#2D6A4F' : '#888',
                                            borderBottom: activeTab === tab.key ? '2px solid #2D6A4F' : '2px solid transparent',
                                            fontSize: 14,
                                            marginBottom: -1,
                                            backgroundColor: 'transparent',
                                        }}
                                        onClick={() => setActiveTab(tab.key)}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {activeTab === 'description' && (
                        <div className="row">
                            <div className="col-lg-8">
                                <p className="text-muted" style={{ lineHeight: 1.9, fontSize: 15 }}>
                                    {product.description || 'No description available.'}
                                </p>
                                {(product.productMaterials?.length ?? 0) > 0 && (
                                    <div className="mt-4">
                                        <h6 className="fw-bold mb-3">Materials Used</h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {product.productMaterials?.map((pm: any, i: number) => (
                                                <span key={i} className="badge px-3 py-2"
                                                      style={{ backgroundColor: '#D4EDDA', color: '#2D6A4F', fontSize: 13 }}>
                                                    {pm.material?.materialName || pm.materialName || 'Bamboo'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Specifications */}
                    {activeTab === 'specs' && (
                        <div className="row">
                            <div className="col-lg-5">
                                <table className="table table-sm" style={{ fontSize: 14 }}>
                                    <tbody>
                                    {product.categoryName && (
                                        <tr className="border-bottom">
                                            <td className="text-muted py-2" style={{ width: '45%' }}>Category</td>
                                            <td className="py-2 fw-medium">{product.categoryName}</td>
                                        </tr>
                                    )}
                                    {product.length && (
                                        <tr className="border-bottom">
                                            <td className="text-muted py-2">Length</td>
                                            <td className="py-2 fw-medium">{product.length} cm</td>
                                        </tr>
                                    )}
                                    {product.width && (
                                        <tr className="border-bottom">
                                            <td className="text-muted py-2">Width</td>
                                            <td className="py-2 fw-medium">{product.width} cm</td>
                                        </tr>
                                    )}
                                    {product.height && (
                                        <tr className="border-bottom">
                                            <td className="text-muted py-2">Height</td>
                                            <td className="py-2 fw-medium">{product.height} cm</td>
                                        </tr>
                                    )}
                                    {product.weight && (
                                        <tr className="border-bottom">
                                            <td className="text-muted py-2">Weight</td>
                                            <td className="py-2 fw-medium">{product.weight} kg</td>
                                        </tr>
                                    )}
                                    <tr className="border-bottom">
                                        <td className="text-muted py-2">Stock</td>
                                        <td className="py-2 fw-medium">{product.stockQuantity} units</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted py-2">Assembly Required</td>
                                        <td className="py-2 fw-medium">No</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Care Guide */}
                    {activeTab === 'care' && (
                        <div className="row">
                            <div className="col-lg-7">
                                {[
                                    {
                                        icon: 'bi-droplet', color: '#2D6A4F', title: 'Daily Care',
                                        items: ['Wipe with a soft dry cloth to remove dust regularly', 'Keep away from direct sunlight to prevent fading', 'Avoid placing in damp or wet environments'],
                                    },
                                    {
                                        icon: 'bi-brush', color: '#2D6A4F', title: 'Cleaning',
                                        items: ['Use mild soap solution with a damp cloth', 'Never soak or use excessive water', 'Dry thoroughly after cleaning'],
                                    },
                                    {
                                        icon: 'bi-exclamation-triangle', color: '#856404', title: 'Warnings',
                                        items: ['Do not drag across rough floors', 'Avoid harsh chemical cleaners', 'Keep away from heat sources'],
                                    },
                                ].map((s, i) => (
                                    <div key={i} className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#EDEAE3' }}>
                                        <h6 className="fw-bold mb-3">
                                            <i className={`bi ${s.icon} me-2`} style={{ color: s.color }}></i>{s.title}
                                        </h6>
                                        <ul className="text-muted small mb-0 ps-3">
                                            {s.items.map((item, j) => <li key={j} className="mb-1">{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shipping */}
                    {activeTab === 'shipping' && (
                        <div className="row">
                            <div className="col-lg-7">
                                <div className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#EDEAE3' }}>
                                    <h6 className="fw-bold mb-3">
                                        <i className="bi bi-truck me-2" style={{ color: '#2D6A4F' }}></i>
                                        Delivery Information
                                    </h6>
                                    <ul className="text-muted small mb-0 ps-3">
                                        <li className="mb-1">3–5 business days (Kathmandu Valley)</li>
                                        <li className="mb-1">5–10 business days (Outside valley)</li>
                                        <li className="mb-1">Free shipping on orders above NPR 50,000</li>
                                        <li>Standard shipping: NPR 500</li>
                                    </ul>
                                </div>
                                <div className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#EDEAE3' }}>
                                    <h6 className="fw-bold mb-3">
                                        <i className="bi bi-arrow-return-left me-2" style={{ color: '#2D6A4F' }}></i>
                                        Returns & Refunds
                                    </h6>
                                    <ul className="text-muted small mb-0 ps-3">
                                        <li className="mb-1">7-day return policy for damaged products</li>
                                        <li className="mb-1">Original packaging required for returns</li>
                                        <li>Contact seller within 48 hours of receiving</li>
                                    </ul>
                                </div>
                                <div className="rounded-3 p-4" style={{ backgroundColor: '#EDEAE3' }}>
                                    <h6 className="fw-bold mb-3">
                                        <i className="bi bi-shield-check me-2" style={{ color: '#2D6A4F' }}></i>
                                        Payment Methods
                                    </h6>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {['eSewa', 'Khalti', 'Cash on Delivery'].map(p => (
                                            <span key={p} className="badge px-3 py-2"
                                                  style={{ backgroundColor: '#D4EDDA', color: '#2D6A4F', fontSize: 13 }}>
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    {activeTab === 'reviews' && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                {reviews.length > 0 ? (
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="text-center">
                                            <div className="fw-bold" style={{ fontSize: 52, color: '#2D6A4F', lineHeight: 1 }}>
                                                {avgRating.toFixed(1)}
                                            </div>
                                            <Stars rating={Math.round(avgRating)} size={20} />
                                            <div className="small text-muted mt-1">
                                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No reviews yet — be the first!</p>
                                )}
                                {user?.role === 'Consumer' && !showReviewForm && (
                                    <button className="btn fw-semibold text-white px-4"
                                            onClick={() => setShowReviewForm(true)}
                                            style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F', borderRadius: 8 }}>
                                        <i className="bi bi-pencil me-2"></i>Write a Review
                                    </button>
                                )}
                            </div>

                            {/* Review form */}
                            {showReviewForm && (
                                <div className="rounded-3 p-4 mb-4"
                                     style={{ backgroundColor: '#FDFAF5', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                    <h5 className="fw-bold mb-4">Write Your Review</h5>
                                    <form onSubmit={handleSubmitReview}>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Overall Rating *</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <Stars rating={reviewForm.rating} size={34} interactive
                                                       hovered={reviewHovered}
                                                       onHover={setReviewHovered}
                                                       onClick={(s) => setReviewForm({ ...reviewForm, rating: s })} />
                                                {(reviewHovered || reviewForm.rating) > 0 && (
                                                    <span className="text-muted small fw-medium">
                                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewHovered || reviewForm.rating]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Review Title</label>
                                            <input type="text" className="form-control"
                                                   placeholder="Summarize your experience in one line"
                                                   maxLength={100}
                                                   value={reviewForm.title}
                                                   onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} />
                                            <div className="text-end small text-muted mt-1">{reviewForm.title.length}/100</div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-medium">Your Review *</label>
                                            <textarea className="form-control" rows={4}
                                                      placeholder="Share your experience with this product..."
                                                      maxLength={1500} required
                                                      value={reviewForm.reviewText}
                                                      onChange={e => setReviewForm({ ...reviewForm, reviewText: e.target.value })} />
                                            <div className="text-end small text-muted mt-1">{reviewForm.reviewText.length}/1500</div>
                                        </div>
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button type="button" className="btn btn-outline-secondary"
                                                    onClick={() => setShowReviewForm(false)}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn px-4 fw-semibold text-white"
                                                    style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}
                                                    disabled={submittingReview}>
                                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Reviews list */}
                            {reviews.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-chat-square-text" style={{ fontSize: 48, color: '#ccc' }}></i>
                                    <p className="mt-3 mb-0">No reviews yet. Be the first to review this product!</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {reviews.map(review => (
                                        <div key={review.reviewId} className="rounded-3 p-4"
                                             style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <Stars rating={review.rating} size={15} />
                                                    {review.title && (
                                                        <h6 className="fw-bold mt-2 mb-0" style={{ fontSize: 14 }}>{review.title}</h6>
                                                    )}
                                                </div>
                                                <div className="text-end">
                                                    <small className="text-muted">
                                                        {new Date(review.createdAt).toLocaleDateString('en-NP', {
                                                            year: 'numeric', month: 'short', day: 'numeric'
                                                        })}
                                                    </small>
                                                    {review.isVerifiedPurchase && (
                                                        <div className="mt-1">
                                                            <span className="badge"
                                                                  style={{ backgroundColor: '#D4EDDA', color: '#2D6A4F', fontSize: 11 }}>
                                                                <i className="bi bi-check-circle-fill me-1"></i>Verified Purchase
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-muted mb-2" style={{ fontSize: 14, lineHeight: 1.7 }}>
                                                {review.reviewText}
                                            </p>
                                            <small className="text-muted">— {review.reviewerName}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── You May Also Like ── */}
                {relatedProducts.length > 0 && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0">You May Also Like</h4>
                            <Link to="/products" className="text-decoration-none small fw-medium"
                                  style={{ color: '#2D6A4F' }}>
                                View All →
                            </Link>
                        </div>
                        <div className="row g-3">
                            {relatedProducts.map(rp => (
                                <div key={rp.productId} className="col-6 col-md-3">
                                    <div className="rounded-3 h-100 hover-lift"
                                         style={{ backgroundColor: '#FDFAF5', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}
                                         onClick={() => navigate(`/product/${rp.productId}`)}>
                                        {/* Image */}
                                        <div style={{ paddingTop: '75%', position: 'relative', overflow: 'hidden', backgroundColor: '#F0ECE5' }}>
                                            <img
                                                src={(rp.productImages?.length ?? 0) > 0
                                                    ? `http://localhost:5192${rp.productImages![0].imageUrl}`
                                                    : '/placeholder.jpg'}
                                                alt={rp.name}
                                                className="position-absolute top-0 start-0 w-100 h-100"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </div>
                                        {/* Info */}
                                        <div className="p-3">
                                            <p className="fw-semibold mb-1 text-truncate" style={{ fontSize: 13 }}>{rp.name}</p>
                                            <p className="fw-bold mb-1" style={{ color: '#2D6A4F', fontSize: 13 }}>
                                                NPR {rp.price.toLocaleString()}
                                            </p>
                                            <div className="d-flex align-items-center gap-1 mb-2">
                                                <i className="bi bi-star-fill" style={{ color: '#FFC107', fontSize: 11 }}></i>
                                                <small className="text-muted">
                                                    {rp.averageRating?.toFixed(1) || '0.0'} ({rp.totalReviews || 0})
                                                </small>
                                            </div>
                                            <button
                                                className="btn btn-sm w-100 fw-medium"
                                                style={{ border: '1px solid #2D6A4F', color: '#2D6A4F', backgroundColor: 'transparent', fontSize: 12, borderRadius: 6 }}
                                                onClick={(e) => { e.stopPropagation(); navigate(`/product/${rp.productId}`); }}>
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProductDetailPage;
