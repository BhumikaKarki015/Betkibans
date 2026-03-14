import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

type AdminTab = 'dashboard' | 'sellers' | 'users' | 'products' | 'orders' | 'repairs';

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

interface DashboardStats {
    totalUsers: number;
    totalSellers: number;
    pendingSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

const AdminPanel = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    // Data states
    const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalSellers: 0, pendingSellers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
    const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
    const [allRepairs, setAllRepairs] = useState<AdminRepairRequest[]>([]);

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

    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        setError('');
        setSearchQuery('');
        if (tab === 'users' && allUsers.length === 0) fetchUsers();
        if (tab === 'products' && allProducts.length === 0) fetchProducts();
        if (tab === 'orders' && allOrders.length === 0) fetchOrders();
        if (tab === 'repairs' && allRepairs.length === 0) fetchRepairs();
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
                                                    <a href={`http://localhost:5192${seller.kycDocumentPath}`}
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
