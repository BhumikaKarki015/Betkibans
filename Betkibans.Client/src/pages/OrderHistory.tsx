import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

interface OrderItem {
    orderItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
}

interface Order {
    orderId: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    trackingNumber?: string;
    orderItems: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: '#FFF8E1', color: '#E65100' },
    Processing: { bg: '#E3F2FD', color: '#1565C0' },
    Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
    Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
    Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
};

const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const OrderHistory = () => {
    const { isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchOrders = async () => {
            try {
                const res = await api.get('/Order/my-orders');
                setOrders(res.data);
            } catch (err) {
                console.error('Error fetching orders', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [isAuthenticated]);

    const filtered = activeFilter === 'All'
        ? orders
        : orders.filter(o => o.status === activeFilter);

    const handleCancelOrder = async (orderId: number) => {
        try {
            await api.post(`/Order/cancel/${orderId}`);
            setOrders(prev =>
                prev.map(o => o.orderId === orderId ? { ...o, status: 'Cancelled' } : o)
            );
            setConfirmCancelId(null);
            showToast('Order cancelled successfully', 'success');
        } catch {
            showToast('Failed to cancel order. Please try again.', 'error');
            setConfirmCancelId(null);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div className="container py-5" style={{ maxWidth: 860 }}>

            {/* Header */}
            <div className="mb-4">
                <h4 className="fw-bold mb-1">My Orders</h4>
                <small className="text-muted">Track and manage your purchases</small>
            </div>

            {/* Filter Tabs */}
            <div className="d-flex gap-2 flex-wrap mb-4">
                {FILTERS.map(f => (
                    <button key={f}
                            className="btn btn-sm fw-medium px-3"
                            onClick={() => setActiveFilter(f)}
                            style={{
                                borderRadius: 20, fontSize: 13,
                                backgroundColor: activeFilter === f ? '#2D6A4F' : '#EDEAE3',
                                color: activeFilter === f ? 'white' : '#555',
                                border: 'none',
                            }}>
                        {f}
                        <span className="ms-1 badge rounded-pill"
                              style={{
                                  backgroundColor: activeFilter === f ? 'rgba(255,255,255,0.25)' : '#CCC',
                                  color: activeFilter === f ? 'white' : '#666', fontSize: 10,
                              }}>
                            {f === 'All' ? orders.length : orders.filter(o => o.status === f).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 ? (
                <div className="text-center py-5 rounded-3" style={{ backgroundColor: '#FDFAF5' }}>
                    <i className="bi bi-bag-x" style={{ fontSize: 52, color: '#CCC' }}></i>
                    <p className="mt-3 fw-medium text-muted mb-2">No orders found</p>
                    <button className="btn fw-medium px-4 mt-1 text-white"
                            style={{ backgroundColor: '#2D6A4F', borderRadius: 8 }}
                            onClick={() => navigate('/products')}>
                        Shop Now
                    </button>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filtered.map(order => {
                        const style = STATUS_STYLES[order.status] || STATUS_STYLES['Pending'];
                        const isDelivered = order.status === 'Delivered';
                        const isShipped = order.status === 'Shipped';
                        const isPending = order.status === 'Pending';

                        return (
                            <div key={order.orderId} className="rounded-3 overflow-hidden"
                                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>

                                {/* Order Header */}
                                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom"
                                     style={{ backgroundColor: '#F5F2EC' }}>
                                    <div>
                                        <small className="text-muted d-block">
                                            Order Date: {new Date(order.createdAt).toLocaleDateString('en-NP', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                        </small>
                                        <span className="fw-bold" style={{ fontSize: 14 }}>
                                            #{order.orderNumber}
                                        </span>
                                    </div>
                                    <span className="badge px-3 py-2 fw-semibold"
                                          style={{ backgroundColor: style.bg, color: style.color, fontSize: 12 }}>
                                        {order.status}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="px-4 py-3">
                                    {order.orderItems.map((item, i) => (
                                        <div key={item.orderItemId}
                                             className="d-flex justify-content-between align-items-center py-3"
                                             style={{ borderBottom: i < order.orderItems.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                            <div>
                                                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>
                                                    {item.productName}
                                                </p>
                                                <small className="text-muted">
                                                    Quantity: {item.quantity} · NPR {(item.unitPrice * item.quantity).toLocaleString()}
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2 flex-wrap justify-content-end">
                                                <button
                                                    className="btn btn-sm fw-medium"
                                                    onClick={() => navigate('/care-guide')}
                                                    style={{ fontSize: 12, borderRadius: 20, border: '1px solid #2D6A4F', color: '#2D6A4F', backgroundColor: 'transparent' }}>
                                                    <i className="bi bi-leaf me-1"></i>Care Guide
                                                </button>
                                                {isDelivered && (
                                                    <button
                                                        className="btn btn-sm fw-medium text-white"
                                                        onClick={() => navigate(`/product/${item.productId}?tab=reviews`)}
                                                        style={{ fontSize: 12, borderRadius: 20, backgroundColor: '#2D6A4F', border: 'none' }}>
                                                        <i className="bi bi-pencil me-1"></i>Write Review
                                                    </button>
                                                )}
                                                {isDelivered && (
                                                    <button
                                                        className="btn btn-sm fw-medium"
                                                        onClick={() => navigate('/request-repair', { state: { productId: item.productId, productName: item.productName } })}
                                                        style={{ fontSize: 12, borderRadius: 20, border: '1px solid #E65100', color: '#E65100', backgroundColor: 'transparent' }}>
                                                        <i className="bi bi-tools me-1"></i>Repair
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Order Footer */}
                                    <div className="d-flex justify-content-between align-items-center pt-3 mt-1">
                                        <div className="d-flex gap-2">
                                            {/* Track Order — Shipped or Delivered */}
                                            {(isShipped || isDelivered) && (
                                                <button className="btn btn-sm fw-medium text-white"
                                                        onClick={() => setTrackingOrder(order)}
                                                        style={{ fontSize: 12, borderRadius: 20, backgroundColor: '#6A1B9A', border: 'none' }}>
                                                    <i className="bi bi-truck me-1"></i>Track Order
                                                </button>
                                            )}
                                            {isPending && (
                                                <button className="btn btn-sm fw-medium"
                                                        onClick={() => setConfirmCancelId(order.orderId)}
                                                        style={{ fontSize: 12, borderRadius: 20, border: '1px solid #C62828', color: '#C62828', backgroundColor: 'transparent' }}>
                                                    <i className="bi bi-x-circle me-1"></i>Cancel Order
                                                </button>
                                            )}
                                            <button className="btn btn-sm fw-medium"
                                                    onClick={() => navigate(`/orders/${order.orderId}`)}
                                                    style={{ fontSize: 12, borderRadius: 20, border: '1px solid #999', color: '#666', backgroundColor: 'transparent' }}>
                                                <i className="bi bi-receipt me-1"></i>View Details
                                            </button>
                                        </div>
                                        <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 15 }}>
                                            Total: NPR {order.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Tracking Modal ── */}
            {trackingOrder && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: 16, padding: '32px 28px',
                        maxWidth: 480, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    }}>
                        {/* Modal Header */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold mb-0">Order Tracking</h5>
                                <small className="text-muted">#{trackingOrder.orderNumber}</small>
                            </div>
                            <button onClick={() => setTrackingOrder(null)}
                                    style={{ background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer', lineHeight: 1 }}>
                                ×
                            </button>
                        </div>

                        {/* Tracking Number */}
                        {trackingOrder.trackingNumber ? (
                            <div className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
                                 style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                                <i className="bi bi-truck fs-4" style={{ color: '#2D6A4F' }}></i>
                                <div>
                                    <small className="text-muted d-block" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Tracking Number</small>
                                    <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 15, letterSpacing: 1 }}>
                                        {trackingOrder.trackingNumber}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3 p-3 mb-4 text-muted text-center"
                                 style={{ backgroundColor: '#F5F5F5', fontSize: 13 }}>
                                <i className="bi bi-info-circle me-2"></i>
                                Tracking number will be provided by the seller shortly.
                            </div>
                        )}

                        {/* Status Timeline */}
                        <div className="mb-4">
                            <small className="fw-bold text-muted d-block mb-3" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                                Order Progress
                            </small>
                            {STATUS_FLOW.map((step, i) => {
                                const currentIdx = STATUS_FLOW.indexOf(trackingOrder.status);
                                const isCancelled = trackingOrder.status === 'Cancelled';
                                const isDone = !isCancelled && i <= currentIdx;
                                const isCurrent = !isCancelled && i === currentIdx;

                                const STEP_ICONS = ['bi-clock', 'bi-gear', 'bi-truck', 'bi-house-check'];
                                const STEP_LABELS = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

                                return (
                                    <div key={step} className="d-flex align-items-center gap-3 mb-3">
                                        {/* Icon */}
                                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                             style={{
                                                 width: 40, height: 40,
                                                 backgroundColor: isDone ? '#2D6A4F' : '#F0F0F0',
                                                 border: isCurrent ? '2px solid #2D6A4F' : 'none',
                                             }}>
                                            <i className={`bi ${STEP_ICONS[i]}`}
                                               style={{ color: isDone ? 'white' : '#BBBBBB', fontSize: 16 }}></i>
                                        </div>
                                        {/* Label */}
                                        <div className="flex-grow-1">
                                            <p className="mb-0 fw-semibold" style={{
                                                fontSize: 13,
                                                color: isDone ? '#1a1a1a' : '#AAAAAA'
                                            }}>
                                                {STEP_LABELS[i]}
                                                {isCurrent && (
                                                    <span className="ms-2 badge rounded-pill"
                                                          style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 10 }}>
                                                        Current
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        {/* Check */}
                                        {isDone && !isCurrent && (
                                            <i className="bi bi-check-circle-fill" style={{ color: '#2D6A4F', fontSize: 18 }}></i>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Cancelled state */}
                            {trackingOrder.status === 'Cancelled' && (
                                <div className="d-flex align-items-center gap-3 mt-2">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                         style={{ width: 40, height: 40, backgroundColor: '#FFEBEE' }}>
                                        <i className="bi bi-x-circle-fill" style={{ color: '#C62828', fontSize: 18 }}></i>
                                    </div>
                                    <p className="mb-0 fw-semibold" style={{ fontSize: 13, color: '#C62828' }}>
                                        Order Cancelled
                                    </p>
                                </div>
                            )}
                        </div>

                        <button className="btn w-100 fw-semibold"
                                onClick={() => { setTrackingOrder(null); navigate(`/orders/${trackingOrder.orderId}`); }}
                                style={{ backgroundColor: '#2D6A4F', color: 'white', borderRadius: 8, border: 'none' }}>
                            View Full Order Details
                        </button>
                    </div>
                </div>
            )}

            {/* ── Cancel Confirm Modal ── */}
            {confirmCancelId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: 14, padding: '32px 28px',
                        maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                        <h5 className="fw-bold mb-2">Cancel this order?</h5>
                        <p className="text-muted small mb-4">This action cannot be undone.</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <button className="btn btn-outline-secondary rounded-pill px-4"
                                    onClick={() => setConfirmCancelId(null)}>Cancel</button>
                            <button className="btn rounded-pill px-4 fw-semibold"
                                    style={{ backgroundColor: '#E53E3E', color: 'white', border: 'none' }}
                                    onClick={() => handleCancelOrder(confirmCancelId)}>
                                Yes, Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
