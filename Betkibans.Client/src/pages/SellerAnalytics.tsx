import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface MonthlyData { month: string; revenue: number; }
interface TopProduct { productId: number; name: string; price: number; stockQuantity: number; totalSold: number; revenue: number; averageRating: number; totalReviews: number; }
interface LowStock { productId: number; name: string; stockQuantity: number; price: number; }
interface OrderByStatus { status: string; count: number; }

interface Analytics {
    totalRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    totalReviews: number;
    ordersByStatus: OrderByStatus[];
    monthlyData: MonthlyData[];
    topProducts: TopProduct[];
    lowStock: LowStock[];
}

const STATUS_COLORS: Record<string, string> = {
    Pending: '#E65100', Processing: '#1565C0', Shipped: '#6A1B9A',
    Delivered: '#2E7D32', Cancelled: '#C62828',
};

const SellerAnalytics = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'Seller') { navigate('/login'); return; }
        api.get('/Seller/analytics')
            .then(res => setAnalytics(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user, isLoading]);

    const formatNPR = (n: number) => `NPR ${n.toLocaleString('en-NP')}`;

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} />
        </div>
    );

    if (!analytics) return null;

    const maxRevenue = Math.max(...analytics.monthlyData.map(m => m.revenue), 1);

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container">

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Analytics</h4>
                        <small className="text-muted">Your store performance overview</small>
                    </div>
                    <button className="btn btn-sm fw-medium"
                            onClick={() => navigate('/seller/dashboard')}
                            style={{ border: '1px solid #CCC', borderRadius: 8, color: '#555', backgroundColor: 'white' }}>
                        <i className="bi bi-arrow-left me-1"></i>Dashboard
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="row g-3 mb-4">
                    {[
                        { icon: 'bi-currency-rupee', label: 'Total Revenue', value: formatNPR(analytics.totalRevenue), sub: `${formatNPR(analytics.monthlyRevenue)} this month`, color: '#2D6A4F' },
                        { icon: 'bi-bag-check', label: 'Total Orders', value: analytics.totalOrders.toString(), sub: `${analytics.ordersByStatus.find(s => s.status === 'Pending')?.count || 0} pending`, color: '#1565C0' },
                        { icon: 'bi-box-seam', label: 'Active Products', value: analytics.totalProducts.toString(), sub: `${analytics.lowStock.length} low stock`, color: '#E65100' },
                        { icon: 'bi-star-fill', label: 'Avg Rating', value: analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '—', sub: `${analytics.totalReviews} reviews`, color: '#F59E0B' },
                    ].map(s => (
                        <div key={s.label} className="col-6 col-md-3">
                            <div className="rounded-3 p-3 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
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
                            <div className="d-flex align-items-end gap-2" style={{ height: 160 }}>
                                {analytics.monthlyData.map((m, i) => {
                                    const height = maxRevenue > 0 ? Math.max((m.revenue / maxRevenue) * 140, m.revenue > 0 ? 8 : 4) : 4;
                                    return (
                                        <div key={i} className="d-flex flex-column align-items-center flex-grow-1 gap-1">
                                            <small className="text-muted" style={{ fontSize: 10 }}>
                                                {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(0)}k` : '0'}
                                            </small>
                                            <div className="rounded-top w-100"
                                                 title={`${m.month}: ${formatNPR(m.revenue)}`}
                                                 style={{
                                                     height: height,
                                                     backgroundColor: i === analytics.monthlyData.length - 1 ? '#2D6A4F' : '#A5D6A7',
                                                     transition: 'height 0.3s',
                                                     minHeight: 4,
                                                     cursor: 'pointer',
                                                 }} />
                                            <small className="text-muted text-center" style={{ fontSize: 9, lineHeight: 1.2 }}>
                                                {m.month.split(' ')[0]}
                                            </small>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Orders by Status */}
                    <div className="col-lg-4">
                        <div className="rounded-3 p-4 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <h6 className="fw-bold mb-4">Orders by Status</h6>
                            {analytics.ordersByStatus.length === 0 ? (
                                <p className="text-muted small text-center py-3">No orders yet</p>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {analytics.ordersByStatus.map(s => {
                                        const color = STATUS_COLORS[s.status] || '#999';
                                        const pct = analytics.totalOrders > 0 ? Math.round((s.count / analytics.totalOrders) * 100) : 0;
                                        return (
                                            <div key={s.status}>
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="fw-medium" style={{ color }}>{s.status}</small>
                                                    <small className="text-muted">{s.count} ({pct}%)</small>
                                                </div>
                                                <div className="rounded-pill" style={{ height: 6, backgroundColor: '#EEE' }}>
                                                    <div className="rounded-pill" style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.5s' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row g-3">
                    {/* Top Products */}
                    <div className="col-lg-7">
                        <div className="rounded-3 p-4" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Top Products by Revenue</h6>
                                <button className="btn btn-sm" onClick={() => navigate('/seller/products')}
                                        style={{ fontSize: 12, color: '#2D6A4F', border: 'none', backgroundColor: 'transparent' }}>
                                    View All →
                                </button>
                            </div>
                            {analytics.topProducts.length === 0 ? (
                                <p className="text-muted small text-center py-3">No products yet</p>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {analytics.topProducts.map((p, i) => (
                                        <div key={p.productId} className="d-flex align-items-center gap-3 py-2"
                                             style={{ borderBottom: i < analytics.topProducts.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                                 style={{ width: 28, height: 28, backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C32' : '#2D6A4F', fontSize: 12 }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13 }}>{p.name}</p>
                                                <small className="text-muted">{p.totalSold} sold · {p.stockQuantity} in stock</small>
                                            </div>
                                            <div className="text-end flex-shrink-0">
                                                <p className="fw-bold mb-0" style={{ fontSize: 13, color: '#2D6A4F' }}>{formatNPR(p.revenue)}</p>
                                                {p.averageRating > 0 && (
                                                    <small className="text-muted">
                                                        <i className="bi bi-star-fill me-1" style={{ color: '#F59E0B', fontSize: 10 }}></i>
                                                        {p.averageRating.toFixed(1)}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="col-lg-5">
                        <div className="rounded-3 p-4 h-100" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">
                                    <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#E65100' }}></i>
                                    Low Stock Alert
                                </h6>
                                <span className="badge rounded-pill" style={{ backgroundColor: '#FFF3E0', color: '#E65100', fontSize: 11 }}>
                                    {analytics.lowStock.length} items
                                </span>
                            </div>
                            {analytics.lowStock.length === 0 ? (
                                <div className="text-center py-3">
                                    <i className="bi bi-check-circle-fill" style={{ fontSize: 32, color: '#2D6A4F' }}></i>
                                    <p className="text-muted small mt-2 mb-0">All products well stocked!</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {analytics.lowStock.map((p, i) => (
                                        <div key={p.productId} className="d-flex justify-content-between align-items-center py-2"
                                             style={{ borderBottom: i < analytics.lowStock.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                            <div>
                                                <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13, maxWidth: 160 }}>{p.name}</p>
                                                <small className="text-muted">{formatNPR(p.price)}</small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="badge rounded-pill"
                                                      style={{ backgroundColor: p.stockQuantity === 0 ? '#FFEBEE' : '#FFF3E0', color: p.stockQuantity === 0 ? '#C62828' : '#E65100', fontSize: 11 }}>
                                                    {p.stockQuantity === 0 ? 'Out of Stock' : `${p.stockQuantity} left`}
                                                </span>
                                                <button className="btn btn-sm" onClick={() => navigate(`/seller/edit-product/${p.productId}`)}
                                                        style={{ fontSize: 11, color: '#2D6A4F', border: '1px solid #2D6A4F', borderRadius: 6, padding: '2px 8px' }}>
                                                    Restock
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerAnalytics;
