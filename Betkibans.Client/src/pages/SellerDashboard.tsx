import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { productService } from '../services/productService';

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

// ─── Stat Card ─────────────────────────────────────────────────────
// KEY FIX: value font uses clamp() so it scales down on narrow col-6 cards.
// Icon shrinks on mobile via inline responsive size.
const StatCard = ({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string; sub?: string; color: string;
}) => (
    <div className="rounded-3 p-2 p-md-3 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        <div className="d-flex align-items-center gap-2 mb-1 mb-md-2">
            <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                 style={{ width: 30, height: 30, backgroundColor: color + '20' }}>
                <i className={`bi ${icon}`} style={{ color, fontSize: 14 }}></i>
            </div>
            <small className="text-muted fw-medium lh-sm" style={{ fontSize: 11 }}>{label}</small>
        </div>
        {/* clamp: minimum 15px, preferred 4vw, max 20px — prevents overflow on col-6 */}
        <div className="fw-bold text-truncate" style={{ fontSize: 'clamp(15px, 4vw, 20px)', color: '#1A1A1A' }}>{value}</div>
        {sub && <small className="text-muted" style={{ fontSize: 10 }}>{sub}</small>}
    </div>
);

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
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

    const totalRevenue = orders.filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= 3 && p.stockQuantity > 0);
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
        Pending:    { bg: '#FFF8E1', color: '#E65100' },
        Processing: { bg: '#E3F2FD', color: '#1565C0' },
        Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
        Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
        Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
    };

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }}>
            {/* KEY FIX: px-4 → px-2 px-md-4 so cards have enough room on mobile */}
            <div className="container-fluid px-2 px-md-4 py-3 py-md-4" style={{ maxWidth: 1200 }}>

                {/* Page Header */}
                <div className="mb-3 mb-md-4">
                    <h4 className="fw-bold mb-0">Seller Dashboard</h4>
                    <small className="text-muted">
                        Welcome back, {profile?.businessName || user?.fullName}
                    </small>
                </div>

                {/* ── UNVERIFIED SELLER SETUP ── */}
                {!isVerified && (
                    <div className="row g-3">
                        <div className="col-12 col-md-4">
                            <div className="rounded-3 p-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Seller Menu</h6>
                                <ul className="list-unstyled mb-0">
                                    {[
                                        { icon: 'bi-speedometer2', label: 'Dashboard',       path: '/seller/dashboard',  active: true },
                                        { icon: 'bi-box-seam',     label: 'My Products',     path: '/seller/products',   disabled: !isVerified },
                                        { icon: 'bi-bag-check',    label: 'Orders',          path: '/seller/orders',     disabled: !isVerified },
                                        { icon: 'bi-tools',        label: 'Repair Requests', path: '/seller/repairs',    disabled: !isVerified },
                                        { icon: 'bi-star',         label: 'Reviews',         path: '/seller/reviews',    disabled: !isVerified },
                                        { icon: 'bi-graph-up',     label: 'Analytics',       path: '/seller/analytics',  disabled: !isVerified },
                                    ].map(item => (
                                        <li key={item.label} className="mb-1">
                                            <button
                                                className="btn btn-link text-decoration-none p-1 d-flex align-items-center gap-2 w-100 text-start"
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

                        <div className="col-12 col-md-8">
                            <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Verification Status</h6>
                                {isRejected && (
                                    <div>
                                        <span className="badge bg-danger mb-2">Verification Rejected</span>
                                        <div className="alert alert-danger py-2 small mb-2">{profile?.rejectionReason}</div>
                                        <button className="btn btn-sm fw-semibold text-white"
                                                onClick={() => navigate('/seller/upload-kyc')}
                                                style={{ backgroundColor: '#C62828', border: 'none', borderRadius: 8, fontSize: 13 }}>
                                            <i className="bi bi-upload me-2"></i>Re-upload KYC Documents
                                        </button>
                                    </div>
                                )}
                                {pendingVerification && <span className="badge bg-warning text-dark">⏳ Pending Admin Review</span>}
                                {needsProfileCompletion && <span className="badge bg-secondary">Profile Incomplete</span>}
                                {needsKycUpload && <span className="badge bg-info text-dark">Documents Needed</span>}
                            </div>

                            <div className="rounded-3 p-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <h6 className="fw-bold mb-3">Complete Your Seller Setup</h6>
                                {[
                                    { step: 1, title: 'Complete Business Profile', desc: 'Add your business name, description, and location', done: !needsProfileCompletion, action: () => navigate('/seller/complete-profile'), actionLabel: 'Complete Profile', disabled: false },
                                    { step: 2, title: 'Upload KYC Documents', desc: isRejected ? 'Your documents were rejected. Please re-upload valid documents.' : 'Submit citizenship ID and business registration', done: !needsKycUpload && !needsProfileCompletion && !isRejected, action: () => navigate('/seller/upload-kyc'), actionLabel: isRejected ? 'Re-upload Documents' : 'Upload Documents', disabled: needsProfileCompletion },
                                    { step: 3, title: 'Admin Verification', desc: pendingVerification ? 'Your documents are being reviewed...' : 'Upload documents to begin verification', done: false, action: null, disabled: false },
                                ].map((s) => (
                                    <div key={s.step} className="d-flex align-items-start mb-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                             style={{ width: 34, height: 34, backgroundColor: s.done ? '#2D6A4F' : '#CCC', color: 'white', fontWeight: 700, fontSize: 13 }}>
                                            {s.done ? <i className="bi bi-check"></i> : s.step}
                                        </div>
                                        <div>
                                            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{s.title}</p>
                                            <small className="text-muted">{s.desc}</small>
                                            {s.action && !s.done && (
                                                <div className="mt-1">
                                                    <button className="btn btn-sm text-white fw-medium"
                                                            style={{ backgroundColor: '#2D6A4F', fontSize: 12 }}
                                                            onClick={s.action} disabled={s.disabled ?? false}>
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

                {/* ── VERIFIED SELLER DASHBOARD ── */}
                {isVerified && (
                    <>
                        {/* Stats Row — col-6 col-md-3 gives 2-per-row on mobile */}
                        <div className="row g-2 g-md-3 mb-3 mb-md-4">
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-currency-rupee" label="Total Revenue"
                                          value={`Rs. ${totalRevenue.toLocaleString()}`}
                                          sub="From delivered orders" color="#2D6A4F" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-box-seam" label="Total Products"
                                          value={products.length.toString()}
                                          sub="Active listings" color="#1565C0" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-clock-history" label="Pending Orders"
                                          value={pendingOrders.toString()}
                                          sub="Needs processing" color="#E65100" />
                            </div>
                            <div className="col-6 col-md-3">
                                <StatCard icon="bi-star-fill" label="Avg Rating"
                                          value={
                                              products.length > 0
                                                  ? (products.reduce((s, p) => s + p.averageRating, 0) /
                                                      (products.filter(p => p.averageRating > 0).length || 1)).toFixed(1)
                                                  : '—'
                                          }
                                          sub={`${products.reduce((s, p) => s + p.totalReviews, 0)} total reviews`}
                                          color="#E8A000" />
                            </div>
                        </div>

                        <div className="row g-3">
                            {/* Left Column */}
                            <div className="col-12 col-lg-8">

                                {/* Recent Orders */}
                                <div className="rounded-3 p-3 p-md-4 mb-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
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
                                            <table className="table table-sm mb-0" style={{ fontSize: 12, minWidth: 420 }}>
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
                                                            <td className="border-0 py-2 fw-medium" style={{ color: '#2D6A4F', whiteSpace: 'nowrap' }}>
                                                                #{order.orderNumber.slice(-6)}
                                                            </td>
                                                            <td className="border-0 py-2" style={{ maxWidth: 120 }}>
                                                                <span className="d-block text-truncate" style={{ maxWidth: 110 }}>
                                                                    {order.orderItems[0]?.productName}
                                                                </span>
                                                                {order.orderItems.length > 1 && (
                                                                    <small className="text-muted">+{order.orderItems.length - 1} more</small>
                                                                )}
                                                            </td>
                                                            <td className="border-0 py-2 fw-medium" style={{ whiteSpace: 'nowrap' }}>
                                                                Rs. {order.totalAmount.toLocaleString()}
                                                            </td>
                                                            <td className="border-0 py-2">
                                                                {/* KEY FIX: white-space nowrap prevents badge text wrapping */}
                                                                <span className="badge px-2 py-1"
                                                                      style={{ backgroundColor: s.bg, color: s.color, fontSize: 10, whiteSpace: 'nowrap' }}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="border-0 py-2">
                                                                <button className="btn btn-sm fw-medium"
                                                                        onClick={() => navigate('/seller/orders')}
                                                                        style={{
                                                                            fontSize: 11, borderRadius: 6, padding: '2px 10px',
                                                                            backgroundColor: order.status === 'Pending' ? '#2D6A4F' : 'transparent',
                                                                            color: order.status === 'Pending' ? 'white' : '#666',
                                                                            border: order.status === 'Pending' ? 'none' : '1px solid #CCC',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>
                                                                    {order.status === 'Pending' ? 'Process' : 'View'}
                                                                </button>
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
                                <div className="rounded-3 p-3 p-md-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <h6 className="fw-bold mb-3">Quick Actions</h6>
                                    <div className="row g-2">
                                        {[
                                            { icon: 'bi-plus-circle',  label: 'Add Product',      path: '/seller/create-product', primary: true },
                                            { icon: 'bi-box-seam',     label: 'My Products',       path: '/seller/products',       primary: false },
                                            { icon: 'bi-bag-check',    label: 'Manage Orders',     path: '/seller/orders',         primary: false },
                                            { icon: 'bi-person-badge', label: 'Business Profile',  path: '/seller/profile',        primary: false },
                                        ].map(a => (
                                            <div key={a.label} className="col-6 col-sm-3">
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
                            <div className="col-12 col-lg-4">
                                <div className="rounded-3 p-3 p-md-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#E65100' }}></i>
                                            Low Stock Alert
                                        </h6>
                                        <button className="btn btn-link p-0 text-decoration-none"
                                                style={{ fontSize: 12, color: '#2D6A4F' }}
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
                                            <div key={p.productId}
                                                 className="d-flex justify-content-between align-items-center py-2"
                                                 style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                                <div className="min-w-0 me-2">
                                                    <p className="mb-0 fw-medium text-truncate" style={{ fontSize: 13 }}>{p.name}</p>
                                                    <small style={{ color: '#E65100' }}>{p.stockQuantity} left</small>
                                                </div>
                                                <button className="btn btn-sm fw-medium flex-shrink-0"
                                                        onClick={() => navigate(`/seller/edit-product/${p.productId}`)}
                                                        style={{ fontSize: 11, backgroundColor: '#FFF3E0', color: '#E65100', border: 'none', borderRadius: 6 }}>
                                                    Restock
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
