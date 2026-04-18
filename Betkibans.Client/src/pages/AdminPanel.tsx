import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

type AdminTab = 'dashboard' | 'sellers' | 'users' | 'products' | 'orders' | 'repairs' | 'analytics' | 'messages' | 'coupons' | 'settings';

interface AdminRepairRequest {
    repairRequestId: number;
    productName: string;
    description: string;
    damageImageUrl: string;
    status: string;
    createdAt: string;
    userName: string;
    quotesCount: number;
}

interface PendingSeller {
    sellerId: number;
    email: string;
    fullName: string;
    businessName: string;
    businessDescription: string;
    city: string;
    district: string;
    isVerified: boolean;
    kycDocumentPath: string;
    createdAt: string;
}

interface AdminUser {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
    isActive: boolean;
}

interface AdminProduct {
    productId: number;
    name: string;
    price: number;
    stockQuantity: number;
    categoryName: string;
    sellerBusinessName: string;
    isActive: boolean;
    createdAt: string;
    averageRating: number;
    totalReviews: number;
}

interface AdminOrder {
    orderId: number;
    orderNumber: string;
    userName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    city: string;
}


interface PlatformSettings {
    platformName: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    commissionRate: number;
    repairCommissionRate: number;
    minOrderAmount: number;
    maxOrderAmount: number;
    requireSellerVerification: boolean;
    autoApproveVerifiedSellers: boolean;
    allowDiscounts: boolean;
    enableSellerAnalytics: boolean;
    minProductPrice: number;
    maxProductImages: number;
    minDescriptionLength: number;
    allowGuestCheckout: boolean;
    enableWishlist: boolean;
    enableProductReviews: boolean;
    enablePurchaseForReview: boolean;
    enableRepairRequests: boolean;
    updatedAt?: string;
}

interface DashboardStats {
    totalUsers: number;
    totalSellers: number;
    pendingSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const { showToast } = useToast();

    // Map URL path to tab
    const getTabFromPath = (path: string): AdminTab => {
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/sellers') || path.includes('/admin/verify-sellers')) return 'sellers';
        if (path.includes('/admin/products')) return 'products';
        if (path.includes('/admin/orders')) return 'orders';
        if (path.includes('/admin/analytics')) return 'analytics';
        if (path.includes('/admin/messages')) return 'messages';
        if (path.includes('/admin/coupons')) return 'coupons';
        if (path.includes('/admin/settings')) return 'settings';
        return 'dashboard';
    };

    const [activeTab, setActiveTab] = useState<AdminTab>(() => getTabFromPath(location.pathname));

    // Data states
    const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalSellers: 0, pendingSellers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
    const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
    const [allRepairs, setAllRepairs] = useState<AdminRepairRequest[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [couponForm, setCouponForm] = useState({
        code: '', discountType: 'Percentage', discountValue: 10,
        minOrderAmount: 0, maxDiscountAmount: '', usageLimit: 100,
        isActive: true, expiresAt: '', description: ''
    });
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // UI states
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | string | null>(null);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'Admin') { navigate('/login'); return; }
        fetchDashboardData();
    }, [user, navigate, isLoading]);

    useEffect(() => {
        const tab = getTabFromPath(location.pathname);
        setActiveTab(tab);
        if (tab === 'users' && allUsers.length === 0) fetchUsers();
        if (tab === 'products' && allProducts.length === 0) fetchProducts();
        if (tab === 'orders' && allOrders.length === 0) fetchOrders();
        if (tab === 'repairs' && allRepairs.length === 0) fetchRepairs();
        if (tab === 'settings' && !settings) fetchSettings();
        if (tab === 'analytics' && !analytics) fetchAnalytics();
        if (tab === 'messages' && messages.length === 0) fetchMessages();
        if (tab === 'coupons' && coupons.length === 0) fetchCoupons();
    }, [location.pathname]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [sellersRes, statsRes] = await Promise.allSettled([
                api.get('/Seller/pending'),
                api.get('/Admin/stats'),
            ]);
            if (sellersRes.status === 'fulfilled')
                setPendingSellers(sellersRes.value.data);
            if (statsRes.status === 'fulfilled') {
                const s = statsRes.value.data;
                setStats({
                    totalUsers: s.totalUsers,
                    totalSellers: s.totalSellers,
                    pendingSellers: sellersRes.status === 'fulfilled' ? sellersRes.value.data.length : 0,
                    totalProducts: s.totalProducts,
                    totalOrders: s.totalOrders,
                    totalRevenue: s.totalRevenue,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/Admin/users');
            setAllUsers(res.data);
        } catch {
            setError('Failed to load users.');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/Admin/products');
            setAllProducts(res.data);
        } catch {
            setError('Failed to load products.');
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/Admin/orders');
            setAllOrders(res.data);
        } catch {
            setError('Failed to load orders.');
        }
    };

    const fetchRepairs = async () => {
        try {
            const res = await api.get('/Admin/repairs');
            setAllRepairs(res.data);
        } catch {
            setError('Failed to load repairs.');
        }
    };

    const tabToPath: Record<AdminTab, string> = {
        dashboard: '/admin/panel',
        sellers: '/admin/sellers',
        users: '/admin/users',
        products: '/admin/products',
        orders: '/admin/orders',
        repairs: '/admin/repairs',
        analytics: '/admin/analytics',
        messages: '/admin/messages',
        coupons: '/admin/coupons',
        settings: '/admin/settings',
    };


    const fetchCoupons = async () => {
        setLoadingCoupons(true);
        try {
            const res = await api.get('/Coupon');
            setCoupons(res.data);
        } catch {
            showToast('Failed to load coupons', 'error');
        } finally {
            setLoadingCoupons(false);
        }
    };

    const openCreateCoupon = () => {
        setEditingCoupon(null);
        setCouponForm({
            code: '', discountType: 'Percentage', discountValue: 10,
            minOrderAmount: 0, maxDiscountAmount: '', usageLimit: 100,
            isActive: true, expiresAt: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
            description: ''
        });
        setShowCouponModal(true);
    };

    const openEditCoupon = (c: any) => {
        setEditingCoupon(c);
        setCouponForm({
            code: c.code, discountType: c.discountType, discountValue: c.discountValue,
            minOrderAmount: c.minOrderAmount, maxDiscountAmount: c.maxDiscountAmount || '',
            usageLimit: c.usageLimit, isActive: c.isActive,
            expiresAt: new Date(c.expiresAt).toISOString().split('T')[0],
            description: c.description || ''
        });
        setShowCouponModal(true);
    };

    const handleSaveCoupon = async () => {
        try {
            const payload = {
                ...couponForm,
                discountValue: parseFloat(String(couponForm.discountValue)),
                minOrderAmount: parseFloat(String(couponForm.minOrderAmount)),
                maxDiscountAmount: couponForm.maxDiscountAmount ? parseFloat(String(couponForm.maxDiscountAmount)) : null,
                usageLimit: parseInt(String(couponForm.usageLimit)),
                expiresAt: new Date(couponForm.expiresAt).toISOString(),
            };
            if (editingCoupon) {
                await api.put(`/Coupon/${editingCoupon.couponId}`, payload);
                showToast('Coupon updated!', 'success');
            } else {
                await api.post('/Coupon', payload);
                showToast('Coupon created!', 'success');
            }
            setShowCouponModal(false);
            fetchCoupons();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to save coupon', 'error');
        }
    };

    const handleDeleteCoupon = async (id: number) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await api.delete(`/Coupon/${id}`);
            setCoupons(prev => prev.filter(c => c.couponId !== id));
            showToast('Coupon deleted', 'success');
        } catch {
            showToast('Failed to delete coupon', 'error');
        }
    };

    const handleToggleCoupon = async (id: number) => {
        try {
            await api.patch(`/Coupon/${id}/toggle`);
            setCoupons(prev => prev.map(c => c.couponId === id ? { ...c, isActive: !c.isActive } : c));
        } catch {
            showToast('Failed to toggle coupon', 'error');
        }
    };

    const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
            const res = await api.get('/Contact/messages');
            setMessages(res.data);
        } catch {
            showToast('Failed to load messages', 'error');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await api.put(`/Contact/messages/${id}/read`);
            setMessages(prev => prev.map(m => m.contactMessageId === id ? { ...m, isRead: true } : m));
        } catch {
            showToast('Failed to mark as read', 'error');
        }
    };

    const handleDeleteMessage = async (id: number) => {
        try {
            await api.delete(`/Contact/messages/${id}`);
            setMessages(prev => prev.filter(m => m.contactMessageId !== id));
            showToast('Message deleted', 'success');
        } catch {
            showToast('Failed to delete message', 'error');
        }
    };

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await api.get('/Admin/analytics');
            setAnalytics(res.data);
        } catch {
            showToast('Failed to load analytics', 'error');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/Admin/settings');
            setSettings(res.data);
        } catch {
            showToast('Failed to load settings', 'error');
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSavingSettings(true);
        try {
            await api.put('/Admin/settings', settings);
            showToast('Settings saved successfully!', 'success');
        } catch {
            showToast('Failed to save settings', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        navigate(tabToPath[tab]);
        setError('');
        setSearchQuery('');
        if (tab === 'users' && allUsers.length === 0) fetchUsers();
        if (tab === 'products' && allProducts.length === 0) fetchProducts();
        if (tab === 'orders' && allOrders.length === 0) fetchOrders();
        if (tab === 'repairs' && allRepairs.length === 0) fetchRepairs();
        if (tab === 'settings' && !settings) fetchSettings();
        if (tab === 'analytics' && !analytics) fetchAnalytics();
        if (tab === 'messages' && messages.length === 0) fetchMessages();
        if (tab === 'coupons' && coupons.length === 0) fetchCoupons();
    };

    const handleVerify = async (sellerId: number, isApproved: boolean) => {
        const rejectionReason = isApproved ? null : prompt('Please enter rejection reason:');
        if (!isApproved && !rejectionReason) return;

        setActionLoading(sellerId);
        try {
            await api.put(`/Seller/verify/${sellerId}`, { isApproved, rejectionReason });
            await fetchDashboardData();
            showToast(isApproved ? 'Seller verified successfully!' : 'Seller rejected', isApproved ? 'success' : 'error');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to process verification', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleProduct = async (productId: number, isActive: boolean) => {
        setActionLoading(productId);
        try {
            await api.patch(`/Admin/products/${productId}/toggle`);
            setAllProducts(prev => prev.map(p => p.productId === productId ? { ...p, isActive: !isActive } : p));
        } catch {
            showToast('Failed to update product status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            Pending: 'warning', Processing: 'info', Shipped: 'primary',
            Delivered: 'success', Cancelled: 'danger'
        };
        return `badge bg-${map[status] || 'secondary'}`;
    };

    const sidebarItems: { id: AdminTab; label: string; icon: string; badge?: number }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'sellers', label: 'Seller Verification', icon: 'bi-shop', badge: pendingSellers.length },
        { id: 'users', label: 'User Management', icon: 'bi-people' },
        { id: 'products', label: 'Product Moderation', icon: 'bi-box-seam' },
        { id: 'orders', label: 'Order Dashboard', icon: 'bi-bag-check' },
        { id: 'repairs', label: 'Repair Management', icon: 'bi-tools' },
        { id: 'messages', label: 'Contact Messages', icon: 'bi-envelope', badge: messages.filter(m => !m.isRead).length },
        { id: 'coupons', label: 'Coupon Management', icon: 'bi-tag' },
        { id: 'analytics', label: 'Analytics & Reports', icon: 'bi-graph-up' },
        { id: 'settings', label: 'Settings', icon: 'bi-gear' },
    ];

    const navStyle = { backgroundColor: '#1a3a2a', minHeight: '100vh' };
    const cardStyle = { backgroundColor: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none', borderRadius: 10 };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border text-success" role="status" />
        </div>
    );

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#F0F2F5' }}>

            {/* ── Sidebar ── */}
            <div style={{ ...navStyle, width: 240, flexShrink: 0 }} className="py-4 px-3">
                <div className="mb-4 px-2">
                    <p className="text-white fw-bold mb-0" style={{ fontSize: 13 }}>ADMIN PANEL</p>
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{user?.email}</small>
                </div>
                <nav className="d-flex flex-column gap-1">
                    {sidebarItems.map(item => (
                        <button key={item.id}
                                className="btn d-flex align-items-center gap-2 text-start fw-medium px-3 py-2"
                                onClick={() => handleTabChange(item.id)}
                                style={{
                                    borderRadius: 8, fontSize: 14, border: 'none',
                                    backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.65)',
                                }}>
                            <i className={`bi ${item.icon}`}></i>
                            <span className="flex-grow-1">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto pt-4 px-2">
                    <button className="btn btn-sm w-100 fw-medium"
                            onClick={() => navigate('/')}
                            style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 13 }}>
                        <i className="bi bi-arrow-left me-2"></i>Back to Site
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>

                {error && (
                    <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}

                {/* ──── DASHBOARD TAB ──── */}
                {activeTab === 'dashboard' && (
                    <>
                        <div className="mb-4">
                            <h4 className="fw-bold mb-0">Admin Dashboard</h4>
                            <small className="text-muted">Welcome back, {user?.email}</small>
                        </div>

                        {/* Stat Cards — using ?? so 0 shows correctly instead of '—' */}
                        <div className="row g-3 mb-4">
                            {[
                                { label: 'Total Users',          value: stats.totalUsers ?? '—',    icon: 'bi-people-fill',     color: '#1565C0', bg: '#E3F2FD' },
                                { label: 'Total Sellers',        value: stats.totalSellers ?? '—',  icon: 'bi-shop',            color: '#2D6A4F', bg: '#E8F5E9' },
                                { label: 'Pending Verification', value: pendingSellers.length,       icon: 'bi-hourglass-split', color: '#E65100', bg: '#FFF3E0' },
                                { label: 'Total Products',       value: stats.totalProducts ?? '—', icon: 'bi-box-seam',        color: '#6A1B9A', bg: '#F3E5F5' },
                                { label: 'Total Orders',         value: stats.totalOrders ?? '—',   icon: 'bi-bag-check',       color: '#00695C', bg: '#E0F2F1' },
                                { label: 'Total Revenue',        value: stats.totalRevenue != null ? `Rs. ${stats.totalRevenue.toLocaleString()}` : '—', icon: 'bi-currency-rupee', color: '#C62828', bg: '#FFEBEE' },
                            ].map(s => (
                                <div key={s.label} className="col-6 col-md-4 col-lg-2">
                                    <div className="p-3 rounded-3 text-center h-100" style={{ backgroundColor: s.bg }}>
                                        <i className={`bi ${s.icon} d-block mb-1`} style={{ color: s.color, fontSize: 24 }}></i>
                                        <div className="fw-bold" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
                                        <small className="text-muted" style={{ fontSize: 11 }}>{s.label}</small>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="p-4 mb-4" style={cardStyle}>
                            <h6 className="fw-bold mb-3">Quick Actions</h6>
                            <div className="row g-2">
                                {sidebarItems.filter(i => i.id !== 'dashboard').map(item => (
                                    <div key={item.id} className="col-6 col-md-3">
                                        <button className="btn w-100 py-3 d-flex flex-column align-items-center gap-1"
                                                onClick={() => handleTabChange(item.id)}
                                                style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD9D2', borderRadius: 8 }}>
                                            <i className={`bi ${item.icon}`} style={{ fontSize: 20, color: '#2D6A4F' }}></i>
                                            <small className="fw-medium" style={{ fontSize: 12 }}>{item.label}</small>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>{item.badge} pending</span>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Pending Sellers Preview */}
                        {pendingSellers.length > 0 && (
                            <div className="p-4" style={cardStyle}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">⚠️ Pending Seller Verifications</h6>
                                    <button className="btn btn-sm fw-medium"
                                            onClick={() => handleTabChange('sellers')}
                                            style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}>
                                        View All ({pendingSellers.length})
                                    </button>
                                </div>
                                {pendingSellers.slice(0, 3).map(s => (
                                    <div key={s.sellerId} className="d-flex align-items-center gap-3 py-2 border-bottom">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                             style={{ width: 36, height: 36, backgroundColor: '#E8F5E9', flexShrink: 0 }}>
                                            <i className="bi bi-shop" style={{ color: '#2D6A4F' }}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>{s.businessName}</p>
                                            <small className="text-muted">{s.email} — {s.city}</small>
                                        </div>
                                        <small className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ──── SELLER VERIFICATION TAB ──── */}
                {activeTab === 'sellers' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Seller Verification</h4>
                                <small className="text-muted">Review and approve seller applications</small>
                            </div>
                            <span className="badge bg-warning text-dark px-3 py-2" style={{ fontSize: 13 }}>
                                {pendingSellers.length} Pending
                            </span>
                        </div>

                        {pendingSellers.length === 0 ? (
                            <div className="p-5 text-center" style={cardStyle}>
                                <i className="bi bi-check-circle" style={{ fontSize: 48, color: '#2D6A4F' }}></i>
                                <h5 className="mt-3 fw-bold">All Caught Up!</h5>
                                <p className="text-muted">No pending seller verifications.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {pendingSellers.map(seller => (
                                    <div key={seller.sellerId} className="p-4" style={cardStyle}>
                                        <div className="row">
                                            <div className="col-md-8">
                                                <div className="d-flex align-items-start gap-3 mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                         style={{ width: 52, height: 52, backgroundColor: '#E8F5E9', flexShrink: 0 }}>
                                                        <i className="bi bi-shop" style={{ color: '#2D6A4F', fontSize: 20 }}></i>
                                                    </div>
                                                    <div>
                                                        <h5 className="fw-bold mb-1">{seller.businessName}</h5>
                                                        <p className="text-muted small mb-0">
                                                            <i className="bi bi-person me-1"></i>{seller.fullName}
                                                            <span className="mx-2">·</span>
                                                            <i className="bi bi-envelope me-1"></i>{seller.email}
                                                        </p>
                                                        <p className="text-muted small mb-0">
                                                            <i className="bi bi-geo-alt me-1"></i>{seller.city}, {seller.district}
                                                            <span className="mx-2">·</span>
                                                            <i className="bi bi-calendar me-1"></i>Applied {new Date(seller.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mb-2" style={{ fontSize: 14 }}>{seller.businessDescription}</p>
                                                {seller.kycDocumentPath && (
                                                    <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                                                        <i className="bi bi-file-earmark-check me-1"></i>KYC Documents Uploaded
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-md-4 d-flex flex-column gap-2 mt-3 mt-md-0">
                                                <button className="btn fw-semibold text-white"
                                                        onClick={() => handleVerify(seller.sellerId, true)}
                                                        disabled={actionLoading === seller.sellerId}
                                                        style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                                    {actionLoading === seller.sellerId
                                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                                                        : <><i className="bi bi-check-circle me-2"></i>Approve</>}
                                                </button>
                                                <button className="btn btn-danger fw-semibold"
                                                        onClick={() => handleVerify(seller.sellerId, false)}
                                                        disabled={actionLoading === seller.sellerId}
                                                        style={{ borderRadius: 8 }}>
                                                    <i className="bi bi-x-circle me-2"></i>Reject
                                                </button>
                                                {seller.kycDocumentPath && (
                                                    <a href={`${import.meta.env.VITE_API_URL}${seller.kycDocumentPath}`}
                                                       target="_blank" rel="noopener noreferrer"
                                                       className="btn fw-medium"
                                                       style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                                                        <i className="bi bi-folder2-open me-2"></i>View Documents
                                                    </a>
                                                )}
                                                <div className="alert alert-warning py-2 mb-0 small">
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    Once approved, seller can list products.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ──── USER MANAGEMENT TAB ──── */}
                {activeTab === 'users' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">User Management</h4>
                                <small className="text-muted">View all registered users</small>
                            </div>
                        </div>

                        <div className="p-4" style={cardStyle}>
                            <div className="mb-3">
                                <input type="text" className="form-control" placeholder="Search by name or email..."
                                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                       style={{ maxWidth: 360, fontSize: 14 }} />
                            </div>

                            {allUsers.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-people" style={{ fontSize: 48, color: '#CCC' }}></i>
                                    <p className="text-muted mt-2">No users loaded.</p>
                                    <button className="btn btn-sm fw-medium"
                                            onClick={fetchUsers}
                                            style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8 }}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle" style={{ fontSize: 14 }}>
                                        <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {allUsers
                                            .filter(u => !searchQuery ||
                                                u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(u => (
                                                <tr key={u.id}>
                                                    <td className="fw-medium">{u.fullName || '—'}</td>
                                                    <td className="text-muted">{u.email}</td>
                                                    <td className="text-muted">{u.phoneNumber || '—'}</td>
                                                    <td>
                                                        <span className={`badge ${u.role === 'Admin' ? 'bg-danger' : u.role === 'Seller' ? 'bg-success' : 'bg-primary'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                                    <td>
                                                        <span className={`badge ${u.isActive !== false ? 'bg-success' : 'bg-secondary'}`}>
                                                            {u.isActive !== false ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ──── PRODUCT MODERATION TAB ──── */}
                {activeTab === 'products' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Product Moderation</h4>
                                <small className="text-muted">Review and manage all products</small>
                            </div>
                        </div>

                        <div className="p-4" style={cardStyle}>
                            <div className="mb-3">
                                <input type="text" className="form-control" placeholder="Search products..."
                                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                       style={{ maxWidth: 360, fontSize: 14 }} />
                            </div>

                            {allProducts.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-box-seam" style={{ fontSize: 48, color: '#CCC' }}></i>
                                    <p className="text-muted mt-2">No products loaded.</p>
                                    <button className="btn btn-sm fw-medium" onClick={fetchProducts}
                                            style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8 }}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle" style={{ fontSize: 14 }}>
                                        <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th>Seller</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {allProducts
                                            .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(p => (
                                                <tr key={p.productId}>
                                                    <td className="fw-medium" style={{ maxWidth: 160 }}>
                                                        <span className="d-block text-truncate">{p.name}</span>
                                                    </td>
                                                    <td className="text-muted">{p.sellerBusinessName || '—'}</td>
                                                    <td><span className="badge bg-light text-dark">{p.categoryName || '—'}</span></td>
                                                    <td>Rs. {p.price?.toLocaleString()}</td>
                                                    <td>
                                                        <span className={p.stockQuantity === 0 ? 'text-danger fw-medium' : ''}>
                                                            {p.stockQuantity}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: '#E8A000' }}>★</span> {p.averageRating?.toFixed(1) ?? '0.0'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${p.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                            {p.isActive ? 'Active' : 'Hidden'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-sm fw-medium"
                                                                    onClick={() => navigate(`/product/${p.productId}`)}
                                                                    style={{ borderColor: '#DDD', color: '#555', borderRadius: 6, fontSize: 12 }}>
                                                                View
                                                            </button>
                                                            <button className="btn btn-sm fw-medium"
                                                                    onClick={() => handleToggleProduct(p.productId, p.isActive)}
                                                                    disabled={actionLoading === p.productId}
                                                                    style={{
                                                                        borderRadius: 6, fontSize: 12, border: 'none',
                                                                        backgroundColor: p.isActive ? '#FFEBEE' : '#E8F5E9',
                                                                        color: p.isActive ? '#C62828' : '#2E7D32',
                                                                    }}>
                                                                {p.isActive ? 'Hide' : 'Show'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ──── ORDER DASHBOARD TAB ──── */}
                {activeTab === 'orders' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Order Dashboard</h4>
                                <small className="text-muted">View and manage all orders</small>
                            </div>
                        </div>

                        <div className="p-4" style={cardStyle}>
                            <div className="mb-3">
                                <input type="text" className="form-control" placeholder="Search by order number or customer..."
                                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                       style={{ maxWidth: 360, fontSize: 14 }} />
                            </div>

                            {allOrders.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-bag-check" style={{ fontSize: 48, color: '#CCC' }}></i>
                                    <p className="text-muted mt-2">No orders loaded.</p>
                                    <button className="btn btn-sm fw-medium" onClick={fetchOrders}
                                            style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8 }}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle" style={{ fontSize: 14 }}>
                                        <thead className="table-light">
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>City</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {allOrders
                                            .filter(o => !searchQuery ||
                                                o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                o.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(o => (
                                                <tr key={o.orderId}>
                                                    <td className="fw-medium" style={{ color: '#2D6A4F' }}>#{o.orderNumber?.slice(0, 8).toUpperCase()}</td>
                                                    <td>{o.userName || '—'}</td>
                                                    <td className="text-muted">{o.city || '—'}</td>
                                                    <td className="fw-medium">Rs. {o.totalAmount?.toLocaleString()}</td>
                                                    <td><span className={getStatusBadge(o.status)}>{o.status}</span></td>
                                                    <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ──── REPAIR MANAGEMENT TAB ──── */}



                {activeTab === 'messages' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Contact Messages</h4>
                                <small className="text-muted">Messages submitted via the Contact Us form</small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-warning text-dark">
                                        {messages.filter(m => !m.isRead).length} Unread
                                    </span>
                                <button className="btn btn-sm fw-medium" onClick={fetchMessages}
                                        style={{ border: '1px solid #2D6A4F', color: '#2D6A4F', borderRadius: 8, backgroundColor: 'white' }}>
                                    <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                                </button>
                            </div>
                        </div>

                        {loadingMessages ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" style={{ color: '#2D6A4F' }} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="p-5 text-center" style={cardStyle}>
                                <i className="bi bi-envelope-open" style={{ fontSize: 48, color: '#CCC' }}></i>
                                <h5 className="mt-3 fw-bold">No Messages Yet</h5>
                                <p className="text-muted">Contact form submissions will appear here.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {messages.map(m => (
                                    <div key={m.contactMessageId} className="p-4" style={{
                                        ...cardStyle,
                                        borderLeft: m.isRead ? '4px solid #E5E1D8' : '4px solid #2D6A4F'
                                    }}>
                                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                                     style={{ width: 42, height: 42, backgroundColor: m.isRead ? '#9CA3AF' : '#2D6A4F', fontSize: 16 }}>
                                                    {m.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <p className="fw-bold mb-0" style={{ fontSize: 14 }}>{m.name}</p>
                                                        {!m.isRead && <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 10 }}>New</span>}
                                                    </div>
                                                    <small className="text-muted">{m.email}{m.phone ? ' · +977 ' + m.phone : ''}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="badge" style={{ backgroundColor: '#F0EBE1', color: '#555', fontSize: 11 }}>{m.inquiryType}</span>
                                                <small className="text-muted">{new Date(m.createdAt).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        {m.subject && (
                                            <p className="fw-semibold mt-3 mb-1" style={{ fontSize: 14 }}>
                                                <i className="bi bi-chat-left-text me-2 text-muted"></i>{m.subject}
                                            </p>
                                        )}
                                        <p className="text-muted mb-3 mt-2" style={{ fontSize: 14, lineHeight: 1.7 }}>
                                            {m.message}
                                        </p>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <a href={"mailto:" + m.email + "?subject=Re: " + (m.subject || 'Your inquiry')}
                                               className="btn btn-sm fw-medium text-white"
                                               style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8, fontSize: 12 }}>
                                                <i className="bi bi-reply me-1"></i>Reply via Email
                                            </a>
                                            {!m.isRead && (
                                                <button className="btn btn-sm fw-medium"
                                                        onClick={() => handleMarkRead(m.contactMessageId)}
                                                        style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 12 }}>
                                                    <i className="bi bi-check2 me-1"></i>Mark as Read
                                                </button>
                                            )}
                                            <button className="btn btn-sm fw-medium"
                                                    onClick={() => handleDeleteMessage(m.contactMessageId)}
                                                    style={{ borderColor: '#C62828', color: '#C62828', borderRadius: 8, fontSize: 12 }}>
                                                <i className="bi bi-trash me-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}


                {activeTab === 'coupons' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Coupon Management</h4>
                                <small className="text-muted">Create and manage discount coupons</small>
                            </div>
                            <button className="btn fw-semibold text-white"
                                    onClick={openCreateCoupon}
                                    style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                <i className="bi bi-plus-circle me-2"></i>Create Coupon
                            </button>
                        </div>

                        {/* Coupon Modal */}
                        {showCouponModal && (
                            <>
                                <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}
                                     onClick={() => setShowCouponModal(false)} />
                                <div className="modal d-block" style={{ zIndex: 1050 }}>
                                    <div className="modal-dialog modal-dialog-centered">
                                        <div className="modal-content border-0 rounded-3 shadow">
                                            <div className="modal-header border-0 pb-0">
                                                <h5 className="modal-title fw-bold">
                                                    {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                                                </h5>
                                                <button className="btn-close" onClick={() => setShowCouponModal(false)} />
                                            </div>
                                            <div className="modal-body">
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">Code *</label>
                                                        <input type="text" className="form-control text-uppercase"
                                                               placeholder="e.g. SAVE10"
                                                               value={couponForm.code}
                                                               onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">Discount Type *</label>
                                                        <select className="form-select"
                                                                value={couponForm.discountType}
                                                                onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                                                            <option value="Percentage">Percentage (%)</option>
                                                            <option value="Fixed">Fixed Amount (NPR)</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">
                                                            Discount Value * {couponForm.discountType === 'Percentage' ? '(%)' : '(NPR)'}
                                                        </label>
                                                        <input type="number" className="form-control"
                                                               value={couponForm.discountValue}
                                                               onChange={e => setCouponForm({...couponForm, discountValue: parseFloat(e.target.value)})} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">Min Order Amount (NPR)</label>
                                                        <input type="number" className="form-control"
                                                               value={couponForm.minOrderAmount}
                                                               onChange={e => setCouponForm({...couponForm, minOrderAmount: parseFloat(e.target.value)})} />
                                                    </div>
                                                    {couponForm.discountType === 'Percentage' && (
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-medium small">Max Discount Cap (NPR)</label>
                                                            <input type="number" className="form-control"
                                                                   placeholder="Leave empty for no cap"
                                                                   value={couponForm.maxDiscountAmount}
                                                                   onChange={e => setCouponForm({...couponForm, maxDiscountAmount: e.target.value})} />
                                                        </div>
                                                    )}
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">Usage Limit</label>
                                                        <input type="number" className="form-control"
                                                               value={couponForm.usageLimit}
                                                               onChange={e => setCouponForm({...couponForm, usageLimit: parseInt(e.target.value)})} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium small">Expires At *</label>
                                                        <input type="date" className="form-control"
                                                               value={couponForm.expiresAt}
                                                               onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-medium small">Description</label>
                                                        <input type="text" className="form-control"
                                                               placeholder="e.g. 10% off for new customers"
                                                               value={couponForm.description}
                                                               onChange={e => setCouponForm({...couponForm, description: e.target.value})} />
                                                    </div>
                                                    <div className="col-12 d-flex justify-content-between align-items-center">
                                                        <label className="form-label fw-medium small mb-0">Active</label>
                                                        <div className="form-check form-switch mb-0">
                                                            <input className="form-check-input" type="checkbox"
                                                                   checked={couponForm.isActive}
                                                                   onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0">
                                                <button className="btn btn-outline-secondary" onClick={() => setShowCouponModal(false)}>Cancel</button>
                                                <button className="btn fw-semibold text-white"
                                                        style={{ backgroundColor: '#2D6A4F', border: 'none' }}
                                                        onClick={handleSaveCoupon}>
                                                    {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {loadingCoupons ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" style={{ color: '#2D6A4F' }} />
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="p-5 text-center" style={cardStyle}>
                                <i className="bi bi-tag" style={{ fontSize: 48, color: '#CCC' }}></i>
                                <h5 className="mt-3 fw-bold">No Coupons Yet</h5>
                                <p className="text-muted">Create your first coupon to offer discounts.</p>
                                <button className="btn fw-semibold text-white" onClick={openCreateCoupon}
                                        style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                    <i className="bi bi-plus-circle me-2"></i>Create Coupon
                                </button>
                            </div>
                        ) : (
                            <div className="p-4" style={cardStyle}>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle" style={{ fontSize: 14 }}>
                                        <thead className="table-light">
                                        <tr>
                                            <th>Code</th>
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Min Order</th>
                                            <th>Used / Limit</th>
                                            <th>Expires</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {coupons.map(c => (
                                            <tr key={c.couponId}>
                                                <td>
                                                            <span className="fw-bold" style={{ color: '#2D6A4F', fontFamily: 'monospace', fontSize: 15 }}>
                                                                {c.code}
                                                            </span>
                                                    {c.description && <small className="text-muted d-block">{c.description}</small>}
                                                </td>
                                                <td>
                                                            <span className="badge" style={{ backgroundColor: c.discountType === 'Percentage' ? '#E8F5E9' : '#E3F2FD', color: c.discountType === 'Percentage' ? '#2D6A4F' : '#1565C0' }}>
                                                                {c.discountType}
                                                            </span>
                                                </td>
                                                <td className="fw-semibold">
                                                    {c.discountType === 'Percentage'
                                                        ? `${c.discountValue}%${c.maxDiscountAmount ? ` (max NPR ${c.maxDiscountAmount})` : ''}`
                                                        : `NPR ${c.discountValue}`}
                                                </td>
                                                <td>NPR {c.minOrderAmount.toLocaleString()}</td>
                                                <td>
                                                            <span className={c.usedCount >= c.usageLimit ? 'text-danger fw-medium' : ''}>
                                                                {c.usedCount} / {c.usageLimit}
                                                            </span>
                                                </td>
                                                <td className={new Date(c.expiresAt) < new Date() ? 'text-danger' : 'text-muted'}>
                                                    {new Date(c.expiresAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="form-check form-switch mb-0">
                                                        <input className="form-check-input" type="checkbox"
                                                               checked={c.isActive}
                                                               onChange={() => handleToggleCoupon(c.couponId)} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <button className="btn btn-sm fw-medium"
                                                                onClick={() => openEditCoupon(c)}
                                                                style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 6, fontSize: 12 }}>
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button className="btn btn-sm fw-medium"
                                                                onClick={() => handleDeleteCoupon(c.couponId)}
                                                                style={{ borderColor: '#C62828', color: '#C62828', borderRadius: 6, fontSize: 12 }}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'analytics' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-1">Analytics & Reports</h4>
                                <p className="text-muted small mb-0">Platform performance overview</p>
                            </div>
                            <button
                                className="btn btn-sm fw-medium"
                                onClick={fetchAnalytics}
                                style={{ border: '1px solid #2D6A4F', color: '#2D6A4F', borderRadius: 8, backgroundColor: 'white' }}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                        </div>

                        {loadingAnalytics || !analytics ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" style={{ color: '#2D6A4F' }} />
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="row g-3 mb-4">
                                    {[
                                        { icon: 'bi-currency-rupee', label: 'Total Revenue', value: `NPR ${analytics.totalRevenue.toLocaleString()}`, sub: `NPR ${analytics.monthlyRevenue.toLocaleString()} this month`, color: '#2D6A4F' },
                                        { icon: 'bi-bag-check', label: 'Total Orders', value: analytics.totalOrders.toLocaleString(), sub: `${analytics.ordersByStatus.find((s: any) => s.status === 'Pending')?.count || 0} pending`, color: '#1565C0' },
                                        { icon: 'bi-people', label: 'Total Users', value: analytics.totalUsers.toLocaleString(), sub: `${analytics.totalSellers} verified sellers`, color: '#6A1B9A' },
                                        { icon: 'bi-shop', label: 'Pending Sellers', value: analytics.pendingSellers.toLocaleString(), sub: `${analytics.totalProducts} active products`, color: '#E65100' },
                                    ].map(s => (
                                        <div key={s.label} className="col-6 col-md-3">
                                            <div className="rounded-3 p-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <div className="rounded-2 d-flex align-items-center justify-content-center"
                                                         style={{ width: 36, height: 36, backgroundColor: s.color + '20' }}>
                                                        <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
                                                    </div>
                                                    <small className="text-muted fw-medium">{s.label}</small>
                                                </div>
                                                <div className="fw-bold mb-1" style={{ fontSize: 20 }}>{s.value}</div>
                                                <small className="text-muted">{s.sub}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="row g-3 mb-4">
                                    {/* Revenue Chart */}
                                    <div className="col-lg-8">
                                        <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                            <h6 className="fw-bold mb-4">Revenue — Last 6 Months</h6>
                                            {(() => {
                                                const maxRev = Math.max(...analytics.monthlyData.map((m: any) => m.revenue), 1);
                                                return (
                                                    <div className="d-flex align-items-end gap-2" style={{ height: 160 }}>
                                                        {analytics.monthlyData.map((m: any, i: number) => {
                                                            const h = maxRev > 0 ? Math.max((m.revenue / maxRev) * 140, m.revenue > 0 ? 8 : 4) : 4;
                                                            return (
                                                                <div key={i} className="d-flex flex-column align-items-center flex-grow-1 gap-1">
                                                                    <small className="text-muted" style={{ fontSize: 10 }}>
                                                                        {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(0)}k` : '0'}
                                                                    </small>
                                                                    <div className="rounded-top w-100"
                                                                         title={`${m.month}: NPR ${m.revenue.toLocaleString()}`}
                                                                         style={{ height: h, backgroundColor: i === analytics.monthlyData.length - 1 ? '#2D6A4F' : '#A5D6A7', minHeight: 4 }} />
                                                                    <small className="text-muted" style={{ fontSize: 9 }}>{m.month.split(' ')[0]}</small>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Orders by Status */}
                                    <div className="col-lg-4">
                                        <div className="rounded-3 p-4 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                            <h6 className="fw-bold mb-4">Orders by Status</h6>
                                            <div className="d-flex flex-column gap-3">
                                                {analytics.ordersByStatus.map((s: any) => {
                                                    const colors: Record<string, string> = { Pending: '#E65100', Processing: '#1565C0', Shipped: '#6A1B9A', Delivered: '#2E7D32', Cancelled: '#C62828' };
                                                    const color = colors[s.status] || '#999';
                                                    const pct = analytics.totalOrders > 0 ? Math.round((s.count / analytics.totalOrders) * 100) : 0;
                                                    return (
                                                        <div key={s.status}>
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <small className="fw-medium" style={{ color }}>{s.status}</small>
                                                                <small className="text-muted">{s.count} ({pct}%)</small>
                                                            </div>
                                                            <div className="rounded-pill" style={{ height: 6, backgroundColor: '#EEE' }}>
                                                                <div className="rounded-pill" style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    {/* Top Sellers */}
                                    <div className="col-lg-6">
                                        <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                            <h6 className="fw-bold mb-3">Top Sellers by Revenue</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {analytics.topSellers.map((s: any, i: number) => (
                                                    <div key={s.sellerId} className="d-flex align-items-center gap-3 py-2"
                                                         style={{ borderBottom: i < analytics.topSellers.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                                             style={{ width: 28, height: 28, backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : '#CD7C32', fontSize: 12 }}>
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>{s.businessName || '—'}</p>
                                                            <small className="text-muted">{s.city} · {s.totalProducts} products</small>
                                                        </div>
                                                        <span className="fw-bold" style={{ fontSize: 13, color: '#2D6A4F' }}>NPR {s.revenue.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Breakdown */}
                                    <div className="col-lg-6">
                                        <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                            <h6 className="fw-bold mb-3">Products by Category</h6>
                                            <div className="d-flex flex-column gap-3">
                                                {analytics.categoryBreakdown.map((c: any) => {
                                                    const pct = analytics.totalProducts > 0 ? Math.round((c.count / analytics.totalProducts) * 100) : 0;
                                                    return (
                                                        <div key={c.category}>
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <small className="fw-medium">{c.category}</small>
                                                                <small className="text-muted">{c.count} ({pct}%)</small>
                                                            </div>
                                                            <div className="rounded-pill" style={{ height: 6, backgroundColor: '#EEE' }}>
                                                                <div className="rounded-pill" style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2D6A4F' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-1">Platform Settings</h4>
                                <p className="text-muted small mb-0">Manage platform configuration</p>
                            </div>
                            <button
                                className="btn fw-semibold text-white px-4"
                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}
                                onClick={handleSaveSettings}
                                disabled={savingSettings || !settings}
                            >
                                {savingSettings ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>

                        {!settings ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" style={{ color: '#2D6A4F' }} />
                            </div>
                        ) : (
                            <div className="row g-4">
                                {/* Platform Info */}
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm rounded-3">
                                        <div className="card-header fw-bold" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}>
                                            🏪 Platform Information
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                {[
                                                    { label: 'Platform Name', key: 'platformName' },
                                                    { label: 'Tagline', key: 'tagline' },
                                                    { label: 'Support Email', key: 'supportEmail' },
                                                    { label: 'Support Phone', key: 'supportPhone' },
                                                    { label: 'Address', key: 'address' },
                                                ].map(f => (
                                                    <div key={f.key} className="col-md-6">
                                                        <label className="form-label fw-medium small">{f.label}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={(settings as any)[f.key]}
                                                            onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission & Order Limits */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-3 h-100">
                                        <div className="card-header fw-bold" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}>
                                            💰 Commission & Order Limits
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                {[
                                                    { label: 'Commission Rate (%)', key: 'commissionRate' },
                                                    { label: 'Repair Commission (%)', key: 'repairCommissionRate' },
                                                    { label: 'Min Order (Rs.)', key: 'minOrderAmount' },
                                                    { label: 'Max Order (Rs.)', key: 'maxOrderAmount' },
                                                ].map(f => (
                                                    <div key={f.key} className="col-6">
                                                        <label className="form-label fw-medium small">{f.label}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={(settings as any)[f.key]}
                                                            onChange={e => setSettings({ ...settings, [f.key]: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seller Settings */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-3 h-100">
                                        <div className="card-header fw-bold" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}>
                                            🏪 Seller Settings
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                {[
                                                    { label: 'Require Seller Verification', key: 'requireSellerVerification' },
                                                    { label: 'Auto-approve Verified Sellers', key: 'autoApproveVerifiedSellers' },
                                                    { label: 'Allow Discounts', key: 'allowDiscounts' },
                                                    { label: 'Enable Seller Analytics', key: 'enableSellerAnalytics' },
                                                ].map(f => (
                                                    <div key={f.key} className="col-12 d-flex justify-content-between align-items-center py-1 border-bottom">
                                                        <span className="small fw-medium">{f.label}</span>
                                                        <div className="form-check form-switch mb-0">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={(settings as any)[f.key]}
                                                                onChange={e => setSettings({ ...settings, [f.key]: e.target.checked })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {[
                                                    { label: 'Min Product Price (Rs.)', key: 'minProductPrice' },
                                                    { label: 'Max Product Images', key: 'maxProductImages' },
                                                    { label: 'Min Description Length', key: 'minDescriptionLength' },
                                                ].map(f => (
                                                    <div key={f.key} className="col-6">
                                                        <label className="form-label fw-medium small">{f.label}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={(settings as any)[f.key]}
                                                            onChange={e => setSettings({ ...settings, [f.key]: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Settings */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-3 h-100">
                                        <div className="card-header fw-bold" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}>
                                            👥 Customer Settings
                                        </div>
                                        <div className="card-body">
                                            {[
                                                { label: 'Allow Guest Checkout', key: 'allowGuestCheckout' },
                                                { label: 'Enable Wishlist', key: 'enableWishlist' },
                                                { label: 'Enable Product Reviews', key: 'enableProductReviews' },
                                                { label: 'Require Purchase for Review', key: 'enablePurchaseForReview' },
                                                { label: 'Enable Repair Requests', key: 'enableRepairRequests' },
                                            ].map(f => (
                                                <div key={f.key} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                    <span className="small fw-medium">{f.label}</span>
                                                    <div className="form-check form-switch mb-0">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={(settings as any)[f.key]}
                                                            onChange={e => setSettings({ ...settings, [f.key]: e.target.checked })}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* System Info */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-3 h-100">
                                        <div className="card-header fw-bold" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}>
                                            ⚙️ System Info
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex flex-column gap-3">
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Version</span>
                                                    <span className="fw-semibold small">1.0.0</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Last Settings Update</span>
                                                    <span className="fw-semibold small">
                                                        {settings.updatedAt ? new Date(settings.updatedAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                                    </span>
                                                </div>
                                                <hr />
                                                <button
                                                    className="btn btn-outline-danger btn-sm rounded-pill"
                                                    onClick={() => showToast('Cache cleared successfully', 'success')}
                                                >
                                                    🗑️ Clear Cache
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'repairs' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-0">Repair Management</h4>
                                <small className="text-muted">Overview of all customer repair requests</small>
                            </div>
                        </div>

                        <div className="p-4" style={cardStyle}>
                            <div className="mb-3">
                                <input type="text" className="form-control" placeholder="Search by customer or product..."
                                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                       style={{ maxWidth: 360, fontSize: 14 }} />
                            </div>

                            {allRepairs.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-tools" style={{ fontSize: 48, color: '#CCC' }}></i>
                                    <p className="text-muted mt-2">No repairs loaded.</p>
                                    <button className="btn btn-sm fw-medium" onClick={fetchRepairs}
                                            style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8 }}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle" style={{ fontSize: 14 }}>
                                        <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Item</th>
                                            <th>Description</th>
                                            <th>Quotes</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {allRepairs
                                            .filter(r => !searchQuery ||
                                                r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                r.productName?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(r => {
                                                const statusColors: Record<string, { bg: string; color: string }> = {
                                                    Pending:        { bg: '#FEF3C7', color: '#B45309' },
                                                    QuotesReceived: { bg: '#E3F2FD', color: '#1565C0' },
                                                    Accepted:       { bg: '#E8F5E9', color: '#2E7D32' },
                                                    Completed:      { bg: '#E8F5E9', color: '#2D6A4F' },
                                                    Cancelled:      { bg: '#FFEBEE', color: '#C62828' },
                                                };
                                                const sc = statusColors[r.status] || { bg: '#F5F5F5', color: '#666' };
                                                return (
                                                    <tr key={r.repairRequestId}>
                                                        <td className="text-muted">#{r.repairRequestId}</td>
                                                        <td className="fw-medium">{r.userName || '—'}</td>
                                                        <td>{r.productName || 'General Item'}</td>
                                                        <td style={{ maxWidth: 200 }}>
                                                            <span className="d-block text-truncate text-muted" style={{ maxWidth: 180 }}>
                                                                {r.description}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                                                                {r.quotesCount ?? 0} quotes
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge px-2 py-1"
                                                                  style={{ backgroundColor: sc.bg, color: sc.color, fontSize: 12 }}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
