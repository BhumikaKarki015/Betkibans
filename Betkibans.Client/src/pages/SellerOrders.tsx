import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

// ─── Types ────────────────────────────────────────────────────────
interface OrderItem {
    orderItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    productImage?: string;
}

interface Order {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    orderItems: OrderItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────
const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: '#FFF8E1', color: '#E65100' },
    Processing: { bg: '#E3F2FD', color: '#1565C0' },
    Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
    Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
    Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
};

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NP', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ─── Main Component ───────────────────────────────────────────────
const SellerOrders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Per-order UI state
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
    const [statusSelections, setStatusSelections] = useState<Record<number, string>>({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/Order/seller-orders');
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (order: Order) => {
        const newStatus = statusSelections[order.orderId];
        if (!newStatus || newStatus === order.status) {
            showToast('Please select a different status.', 'warning');
            return;
        }
        setUpdatingId(order.orderId);
        try {
            await api.post('/Order/update-status', {
                orderId: order.orderId,
                status: newStatus,
                trackingNumber: trackingInputs[order.orderId] || undefined,
            });
            setOrders(prev =>
                prev.map(o => o.orderId === order.orderId ? { ...o, status: newStatus } : o)
            );
            setStatusSelections(prev => { const copy = { ...prev }; delete copy[order.orderId]; return copy; });
            setTrackingInputs(prev => { const copy = { ...prev }; delete copy[order.orderId]; return copy; });
            showToast('Order status updated successfully', 'success');
        } catch {
            showToast('Failed to update status. Please try again.', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        setUpdatingId(orderId);
        try {
            await api.post('/Order/update-status', { orderId, status: 'Cancelled' });
            setOrders(prev =>
                prev.map(o => o.orderId === orderId ? { ...o, status: 'Cancelled' } : o)
            );
        } catch {
            showToast('Failed to cancel order.', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    // Filter + search
    const filtered = orders.filter(o => {
        const matchesFilter = activeFilter === 'All' || o.status === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            o.orderNumber.toLowerCase().includes(q) ||
            o.orderItems.some(i => i.productName.toLowerCase().includes(q));
        return matchesFilter && matchesSearch;
    });

    const counts = FILTERS.reduce((acc, f) => {
        acc[f] = f === 'All' ? orders.length : orders.filter(o => o.status === f).length;
        return acc;
    }, {} as Record<string, number>);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div className="container-fluid py-3 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }}>

            {/* ── Page Header ── */}
            <div className="mb-4">
                <nav className="mb-2" style={{ fontSize: 13 }}>
                    <span className="text-muted">Home</span>
                    <span className="text-muted mx-2">›</span>
                    <span className="text-muted">Seller Dashboard</span>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>Orders</span>
                </nav>
                <h4 className="fw-bold mb-0">Manage Orders</h4>
                <small className="text-muted">View and update your customer orders</small>
            </div>

            {/* ── Search + Filter Bar ── */}
            <div className="rounded-3 p-3 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between"
                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

                {/* Search */}
                <div className="input-group" style={{ maxWidth: 320 }}>
                    <span className="input-group-text border-0" style={{ backgroundColor: '#F0EBE1' }}>
                        <i className="bi bi-search text-muted" style={{ fontSize: 13 }}></i>
                    </span>
                    <input
                        type="text"
                        className="form-control border-0"
                        placeholder="Search by order ID or product..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ backgroundColor: '#F0EBE1', fontSize: 13 }}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="d-flex gap-2 flex-wrap order-filter-scroll" style={{ overflowX: "auto", flexWrap: "nowrap", scrollbarWidth: "none", paddingBottom: 2 }}>
                    {FILTERS.map(f => (
                        <button key={f}
                                className="btn btn-sm fw-medium px-3"
                                onClick={() => setActiveFilter(f)}
                                style={{
                                    borderRadius: 20,
                                    fontSize: 13,
                                    backgroundColor: activeFilter === f ? '#2D6A4F' : '#EDEAE3',
                                    color: activeFilter === f ? 'white' : '#555',
                                    border: 'none',
                                }}>
                            {f}
                            {counts[f] > 0 && (
                                <span className="ms-1 badge rounded-pill"
                                      style={{
                                          backgroundColor: activeFilter === f ? 'rgba(255,255,255,0.3)' : '#CCC',
                                          color: activeFilter === f ? 'white' : '#555',
                                          fontSize: 10,
                                      }}>
                                    {counts[f]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Orders List ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox" style={{ fontSize: 52, color: '#CCC' }}></i>
                    <p className="mt-3 mb-0 fw-medium">No orders found</p>
                    <small>Try changing your filter or search query</small>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filtered.map(order => {
                        const style = STATUS_STYLES[order.status] || STATUS_STYLES['Pending'];
                        const isUpdating = updatingId === order.orderId;
                        const canCancel = ['Pending', 'Processing'].includes(order.status);
                        const nextStatuses = STATUS_FLOW.filter(
                            s => STATUS_FLOW.indexOf(s) > STATUS_FLOW.indexOf(order.status)
                        );
                        const selectedStatus = statusSelections[order.orderId] || '';

                        return (
                            <div key={order.orderId} className="rounded-3 overflow-hidden"
                                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>

                                {/* Order Header */}
                                <div className="d-flex justify-content-between align-items-center px-3 px-md-4 py-3 border-bottom"
                                     style={{ backgroundColor: '#F5F2EC' }}>
                                    <div>
                                        <span className="fw-bold" style={{ fontSize: 14 }}>
                                            #{order.orderNumber}
                                        </span>
                                        <span className="text-muted ms-3" style={{ fontSize: 13 }}>
                                            <i className="bi bi-calendar3 me-1"></i>
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                    <span className="badge px-3 py-2 fw-semibold"
                                          style={{ backgroundColor: style.bg, color: style.color, fontSize: 12, whiteSpace: "nowrap" }}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="px-3 px-md-4 py-3">
                                    {/* Order Items */}
                                    <div className="mb-3">
                                        {order.orderItems.map((item, i) => (
                                            <div key={i}
                                                 className="d-flex justify-content-between align-items-center py-2"
                                                 style={{ borderBottom: i < order.orderItems.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded-2 overflow-hidden flex-shrink-0"
                                                         style={{ width: 48, height: 48, backgroundColor: '#EDEAE3' }}>
                                                        {item.productImage
                                                            ? <img src={item.productImage.startsWith('http') ? item.productImage : `${import.meta.env.VITE_API_URL}${item.productImage}`}
                                                                   alt={item.productName}
                                                                   style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                   onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/no-image.png'; }} />
                                                            : <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                                                <i className="bi bi-box-seam text-muted" style={{ fontSize: 14 }}></i>
                                                            </div>
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="mb-0 fw-medium" style={{ fontSize: 14 }}>{item.productName}</p>
                                                        <small className="text-muted">Qty: {item.quantity}</small>
                                                    </div>
                                                </div>
                                                <span className="fw-semibold" style={{ fontSize: 14, color: '#2D6A4F' }}>
                                                    NPR {(item.unitPrice * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Total */}
                                    <div className="d-flex justify-content-end mb-3">
                                        <div className="text-end">
                                            <small className="text-muted">Order Total</small>
                                            <div className="fw-bold" style={{ fontSize: 16, color: '#2D6A4F' }}>
                                                NPR {order.totalAmount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions — only show if not delivered/cancelled */}
                                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                        <div className="rounded-3 p-3" style={{ backgroundColor: '#F5F2EC' }}>
                                            <div className="row g-2 align-items-end">

                                                {/* Status Update */}
                                                <div className="col-12 col-md-5">
                                                    <label className="form-label fw-medium mb-1" style={{ fontSize: 12, color: '#666' }}>
                                                        Update Status
                                                    </label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedStatus}
                                                        onChange={e => setStatusSelections(prev => ({
                                                            ...prev, [order.orderId]: e.target.value
                                                        }))}
                                                        style={{ fontSize: 13, borderColor: '#DDD9D2', backgroundColor: '#FDFAF5' }}>
                                                        <option value="">Select next status...</option>
                                                        {nextStatuses.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Tracking Info */}
                                                <div className="col-12 col-md-4">
                                                    <label className="form-label fw-medium mb-1" style={{ fontSize: 12, color: '#666' }}>
                                                        Tracking Info <span className="text-muted fw-normal">(optional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. Courier name, tracking no."
                                                        value={trackingInputs[order.orderId] || ''}
                                                        onChange={e => setTrackingInputs(prev => ({
                                                            ...prev, [order.orderId]: e.target.value
                                                        }))}
                                                        style={{ fontSize: 13, borderColor: '#DDD9D2', backgroundColor: '#FDFAF5' }}
                                                    />
                                                </div>

                                                {/* Buttons */}
                                                <div className="col-12 col-md-3 d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm fw-semibold flex-grow-1 text-white"
                                                        onClick={() => handleUpdateStatus(order)}
                                                        disabled={isUpdating || !selectedStatus}
                                                        style={{
                                                            backgroundColor: selectedStatus ? '#2D6A4F' : '#AAA',
                                                            borderColor: selectedStatus ? '#2D6A4F' : '#AAA',
                                                            fontSize: 12,
                                                        }}>
                                                        {isUpdating ? (
                                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                                        ) : (
                                                            <i className="bi bi-check-circle me-1"></i>
                                                        )}
                                                        Update
                                                    </button>
                                                    {canCancel && (
                                                        <button
                                                            className="btn btn-sm fw-medium"
                                                            onClick={() => handleCancelOrder(order.orderId)}
                                                            disabled={isUpdating}
                                                            style={{ fontSize: 12, borderColor: '#E57373', color: '#C62828', backgroundColor: 'transparent' }}>
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivered state message */}
                                    {order.status === 'Delivered' && (
                                        <div className="d-flex align-items-center gap-2 mt-1"
                                             style={{ color: '#2E7D32', fontSize: 13 }}>
                                            <i className="bi bi-check-circle-fill"></i>
                                            <span>Order delivered — customer can now write a review</span>
                                        </div>
                                    )}

                                    {/* Cancelled state message */}
                                    {order.status === 'Cancelled' && (
                                        <div className="d-flex align-items-center gap-2 mt-1"
                                             style={{ color: '#C62828', fontSize: 13 }}>
                                            <i className="bi bi-x-circle-fill"></i>
                                            <span>This order has been cancelled</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SellerOrders;
