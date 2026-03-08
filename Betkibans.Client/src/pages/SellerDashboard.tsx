import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { productService } from '../services/productService';

// ─── Types ────────────────────────────────────────────────────────
interface SellerProfile {
    sellerId: number;
    businessName: string | null;
    businessDescription: string | null;
    city: string | null;
    district: string | null;
    isVerified: boolean;
    kycDocumentPath: string | null;
    createdAt: string;
    verifiedAt: string | null;
    rejectionReason: string | null;
}

interface Order {
    orderId: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderItems: { productId: number; productName: string; quantity: number; unitPrice: number }[];
}

interface Product {
    productId: number;
    name: string;
    price: number;
    stockQuantity: number;
    averageRating: number;
    totalReviews: number;
}

/*interface Review {
    reviewId: number;
    rating: number;
    title: string;
    reviewText: string;
    createdAt: string;
    isVerifiedPurchase: boolean;
    userName: string;
    productName?: string;
}*/

// ─── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string; sub?: string; color: string;
}) => (
    <div className="rounded-3 p-3 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
            <div className="rounded-2 d-flex align-items-center justify-content-center"
                 style={{ width: 36, height: 36, backgroundColor: color + '20' }}>
                <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
            </div>
            <small className="text-muted fw-medium">{label}</small>
        </div>
        <div className="fw-bold" style={{ fontSize: 22, color: '#1A1A1A' }}>{value}</div>
        {sub && <small className="text-muted">{sub}</small>}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────
const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    // const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'Seller') { navigate('/login'); return; }
        fetchAll();
    }, [user, navigate]);

    const fetchAll = async () => {
        try {
            const profileData = await sellerService.getProfile();
            setProfile(profileData);

            if (profileData.isVerified) {
                const [ordersRes, productsRes] = await Promise.allSettled([
                    api.get('/Order/seller-orders'),
                    productService.getSellerProducts(),
                ]);
                if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
                if (productsRes.status === 'fulfilled') setProducts(productsRes.value);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    if (error) return (
        <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>
    );

    const needsProfileCompletion = !profile?.businessName;
    const needsKycUpload = profile?.businessName && !profile?.kycDocumentPath;
    const pendingVerification = profile?.kycDocumentPath && !profile?.isVerified && !profile?.rejectionReason;
    const isRejected = !!profile?.rejectionReason;
    const isVerified = profile?.isVerified;

    // Derived stats
    const totalRevenue = orders.filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= 3 && p.stockQuantity > 0);
    const recentOrders = [...orders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
        Pending:    { bg: '#FFF8E1', color: '#E65100' },
        Processing: { bg: '#E3F2FD', color: '#1565C0' },
        Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
        Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
        Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
    };

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }}>
            <div className="container-fluid px-4 py-4" style={{ maxWidth: 1200 }}>

                {/* ── Page Header ── */}
                <div className="mb-4">
                    <h4 className="fw-bold mb-0">Seller Dashboard</h4>
                    <small className="text-muted">
                        Welcome back, {profile?.businessName || user?.fullName}
                    </small>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    VERIFICATION SETUP (unverified sellers)
                ═══════════════════════════════════════════════════════ */}
                {!isVerified && (
                    <div className="row g-3">
                        <div className="col-md-4">
                            {/* Sidebar nav */}
                            <div className="rounded-3 p-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Seller Menu</h6>
                                <ul className="list-unstyled mb-0">
                                    {[
                                        { icon: 'bi-speedometer2', label: 'Dashboard', path: '/seller/dashboard', active: true },
                                        { icon: 'bi-box-seam', label: 'My Products', path: '/seller/products', disabled: !isVerified },
                                        { icon: 'bi-bag-check', label: 'Orders', path: '/seller/orders', disabled: !isVerified },
                                        { icon: 'bi-tools', label: 'Repair Requests', path: '/seller/repairs', disabled: !isVerified },
                                        { icon: 'bi-star', label: 'Reviews', path: '/seller/reviews', disabled: !isVerified },
                                        { icon: 'bi-graph-up', label: 'Analytics', path: '/seller/analytics', disabled: !isVerified },
                                    ].map(item => (
                                        <li key={item.label} className="mb-1">
                                            <button className="btn btn-link text-decoration-none p-1 d-flex align-items-center gap-2 w-100 text-start"
                                                    style={{ color: item.active ? '#2D6A4F' : item.disabled ? '#BBB' : '#444', fontSize: 14 }}
                                                    onClick={() => !item.disabled && navigate(item.path)}
                                                    disabled={item.disabled}>
                                                <i className={`bi ${item.icon}`}></i>{item.label}
                                                {item.disabled && <small className="ms-auto text-muted" style={{ fontSize: 10 }}>Locked</small>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="col-md-8">
                            {/* Verification Status */}
                            <div className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Verification Status</h6>
                                {isRejected && (
                                    <div>
                                        <span className="badge bg-danger mb-2">Verification Rejected</span>
                                        <div className="alert alert-danger py-2 small">{profile?.rejectionReason}</div>
                                    </div>
                                )}
                                {pendingVerification && <span className="badge bg-warning text-dark">⏳ Pending Admin Review — documents are being reviewed</span>}
                                {needsProfileCompletion && <span className="badge bg-secondary">Profile Incomplete</span>}
                                {needsKycUpload && <span className="badge bg-info text-dark">Documents Needed</span>}
                            </div>

                            {/* Setup Steps */}
                            <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Complete Your Seller Setup</h6>
                                {[
                                    { step: 1, title: 'Complete Business Profile', desc: 'Add your business name, description, and location', done: !needsProfileCompletion, action: () => navigate('/seller/complete-profile'), actionLabel: 'Complete Profile' },
                                    { step: 2, title: 'Upload KYC Documents', desc: 'Submit citizenship ID and business registration', done: !needsKycUpload && !needsProfileCompletion, action: () => navigate('/seller/upload-kyc'), actionLabel: isRejected ? 'Re-upload Documents' : 'Upload Documents', disabled: needsProfileCompletion },
                                    { step: 3, title: 'Admin Verification', desc: pendingVerification ? 'Your documents are being reviewed...' : 'Upload documents to begin verification', done: false, action: null },
                                ].map((s) => (
                                    <div key={s.step} className="d-flex align-items-start mb-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                             style={{ width: 36, height: 36, backgroundColor: s.done ? '#2D6A4F' : '#CCC', color: 'white', fontWeight: 700, fontSize: 14 }}>
                                            {s.done ? <i className="bi bi-check"></i> : s.step}
                                        </div>
                                        <div>
                                            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{s.title}</p>
                                            <small className="text-muted">{s.desc}</small>
                                            {s.action && !s.done && (
                                                <div className="mt-1">
                                                    <button className="btn btn-sm text-white fw-medium"
                                                            style={{ backgroundColor: '#2D6A4F', fontSize: 12 }}
                                                            onClick={s.action} disabled={s.disabled}>
                                                        {s.actionLabel}
                                                    </button>
                                                </div>
                                            )}
                                            {s.done && <div className="mt-1"><small style={{ color: '#2D6A4F' }}>✓ Completed</small></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    FULL DASHBOARD (verified sellers)
                ═══════════════════════════════════════════════════════ */}
                {isVerified && (
                    <>
                        {/* Stats Row */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-currency-rupee" label="Total Revenue" value={`Rs. ${totalRevenue.toLocaleString()}`} sub="From delivered orders" color="#2D6A4F" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-box-seam" label="Total Products" value={products.length.toString()} sub="Active listings" color="#1565C0" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-clock-history" label="Pending Orders" value={pendingOrders.toString()} sub="Needs processing" color="#E65100" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-star-fill" label="Avg Rating" value={products.length > 0 ? (products.reduce((s, p) => s + p.averageRating, 0) / products.filter(p => p.averageRating > 0).length || 0).toFixed(1) : '—'} sub={`${products.reduce((s, p) => s + p.totalReviews, 0)} total reviews`} color="#E8A000" />
                            </div>
                        </div>

                        <div className="row g-3">
                            {/* Left Column */}
                            <div className="col-lg-8">

                                {/* Recent Orders */}
                                <div className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">Recent Orders</h6>
                                        <button className="btn btn-sm fw-medium"
                                                onClick={() => navigate('/seller/orders')}
                                                style={{ fontSize: 12, color: '#2D6A4F', border: '1px solid #2D6A4F', borderRadius: 8 }}>
                                            View All Orders
                                        </button>
                                    </div>

                                    {recentOrders.length === 0 ? (
                                        <p className="text-muted text-center py-3 mb-0" style={{ fontSize: 14 }}>No orders yet</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                                                <thead>
                                                <tr style={{ color: '#888', borderBottom: '1px solid #E5E1D8' }}>
                                                    <th className="fw-medium border-0 pb-2">Order ID</th>
                                                    <th className="fw-medium border-0 pb-2">Product(s)</th>
                                                    <th className="fw-medium border-0 pb-2">Amount</th>
                                                    <th className="fw-medium border-0 pb-2">Status</th>
                                                    <th className="fw-medium border-0 pb-2">Action</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {recentOrders.map(order => {
                                                    const s = STATUS_COLORS[order.status] || STATUS_COLORS['Pending'];
                                                    return (
                                                        <tr key={order.orderId} style={{ borderBottom: '1px solid #F0EBE1' }}>
                                                            <td className="border-0 py-2 fw-medium" style={{ color: '#2D6A4F' }}>
                                                                #{order.orderNumber.slice(-6)}
                                                            </td>
                                                            <td className="border-0 py-2">
                                                                {order.orderItems.slice(0, 1).map(i => (
                                                                    <span key={i.productId}>{i.productName}</span>
                                                                ))}
                                                                {order.orderItems.length > 1 && <small className="text-muted"> +{order.orderItems.length - 1} more</small>}
                                                            </td>
                                                            <td className="border-0 py-2 fw-medium">
                                                                Rs. {order.totalAmount.toLocaleString()}
                                                            </td>
                                                            <td className="border-0 py-2">
                                                                    <span className="badge px-2 py-1"
                                                                          style={{ backgroundColor: s.bg, color: s.color, fontSize: 11 }}>
                                                                        {order.status}
                                                                    </span>
                                                            </td>
                                                            <td className="border-0 py-2">
                                                                {order.status === 'Pending' && (
                                                                    <button className="btn btn-sm text-white fw-medium"
                                                                            onClick={() => navigate('/seller/orders')}
                                                                            style={{ fontSize: 11, backgroundColor: '#2D6A4F', borderRadius: 6, padding: '2px 10px' }}>
                                                                        Process
                                                                    </button>
                                                                )}
                                                                {order.status !== 'Pending' && (
                                                                    <button className="btn btn-sm fw-medium"
                                                                            onClick={() => navigate('/seller/orders')}
                                                                            style={{ fontSize: 11, border: '1px solid #CCC', borderRadius: 6, padding: '2px 10px', color: '#666' }}>
                                                                        View
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <h6 className="fw-bold mb-3">Quick Actions</h6>
                                    <div className="row g-2">
                                        {[
                                            { icon: 'bi-plus-circle', label: 'Add Product', path: '/seller/create-product', primary: true },
                                            { icon: 'bi-box-seam', label: 'My Products', path: '/seller/products', primary: false },
                                            { icon: 'bi-bag-check', label: 'Manage Orders', path: '/seller/orders', primary: false },
                                            { icon: 'bi-person-badge', label: 'Business Profile', path: '/seller/profile', primary: false },
                                        ].map(a => (
                                            <div key={a.label} className="col-6 col-md-3">
                                                <button className="btn w-100 py-3 d-flex flex-column align-items-center gap-1 fw-medium"
                                                        onClick={() => navigate(a.path)}
                                                        style={{
                                                            fontSize: 12,
                                                            backgroundColor: a.primary ? '#2D6A4F' : '#F0EBE1',
                                                            color: a.primary ? 'white' : '#444',
                                                            border: 'none',
                                                            borderRadius: 10,
                                                        }}>
                                                    <i className={`bi ${a.icon}`} style={{ fontSize: 20 }}></i>
                                                    {a.label}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-lg-4">

                                {/* Low Stock Alert */}
                                <div className="rounded-3 p-4 mb-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#E65100' }}></i>
                                            Low Stock Alert
                                        </h6>
                                        <button className="btn btn-link p-0 text-decoration-none" style={{ fontSize: 12, color: '#2D6A4F' }}
                                                onClick={() => navigate('/seller/products')}>
                                            View All
                                        </button>
                                    </div>
                                    {lowStockProducts.length === 0 ? (
                                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                                            All products well stocked!
                                        </p>
                                    ) : (
                                        lowStockProducts.slice(0, 4).map(p => (
                                            <div key={p.productId} className="d-flex justify-content-between align-items-center py-2"
                                                 style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                                <div>
                                                    <p className="mb-0 fw-medium" style={{ fontSize: 13 }}>{p.name}</p>
                                                    <small style={{ color: '#E65100' }}>{p.stockQuantity} left</small>
                                                </div>
                                                <button className="btn btn-sm fw-medium"
                                                        onClick={() => navigate(`/seller/edit-product/${p.productId}`)}
                                                        style={{ fontSize: 11, backgroundColor: '#FFF3E0', color: '#E65100', border: 'none', borderRadius: 6 }}>
                                                    Restock
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Recent Reviews 
                                <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <h6 className="fw-bold mb-3">Recent Reviews</h6>
                                    {reviews.length === 0 ? (
                                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>No reviews yet</p>
                                    ) : (
                                        reviews.slice(0, 3).map(r => (
                                            <div key={r.reviewId} className="mb-3 pb-3" style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                                <div className="d-flex gap-1 mb-1">
                                                    {[1,2,3,4,5].map(s => (
                                                        <i key={s} className={`bi bi-star${s <= r.rating ? '-fill' : ''}`}
                                                           style={{ fontSize: 11, color: s <= r.rating ? '#E8A000' : '#DDD' }}></i>
                                                    ))}
                                                </div>
                                                <p className="mb-0" style={{ fontSize: 13, fontStyle: 'italic', color: '#444' }}>
                                                    "{r.reviewText.slice(0, 80)}{r.reviewText.length > 80 ? '...' : ''}"
                                                </p>
                                                <small className="text-muted">— {r.userName}</small>
                                            </div>
                                        ))
                                    )}
                                </div>*/}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
