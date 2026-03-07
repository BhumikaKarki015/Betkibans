import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    orderItems: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: '#FFF8E1', color: '#E65100' },
    Processing: { bg: '#E3F2FD', color: '#1565C0' },
    Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
    Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
    Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
};

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const OrderHistory = () => {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
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
                                borderRadius: 20,
                                fontSize: 13,
                                backgroundColor: activeFilter === f ? '#2D6A4F' : '#EDEAE3',
                                color: activeFilter === f ? 'white' : '#555',
                                border: 'none',
                            }}>
                        {f}
                        <span className="ms-1 badge rounded-pill"
                              style={{
                                  backgroundColor: activeFilter === f ? 'rgba(255,255,255,0.25)' : '#CCC',
                                  color: activeFilter === f ? 'white' : '#666',
                                  fontSize: 10,
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

                                            {/* Per-item action buttons */}
                                            <div className="d-flex gap-2 flex-wrap justify-content-end">
                                                {/* Care Guide — always visible */}
                                                <button
                                                    className="btn btn-sm fw-medium"
                                                    onClick={() => navigate('/care-guide')}
                                                    style={{ fontSize: 12, borderRadius: 20, border: '1px solid #2D6A4F', color: '#2D6A4F', backgroundColor: 'transparent' }}>
                                                    <i className="bi bi-leaf me-1"></i>Care Guide
                                                </button>

                                                {/* Write Review — only for Delivered */}
                                                {isDelivered && (
                                                    <button
                                                        className="btn btn-sm fw-medium text-white"
                                                        onClick={() => navigate(`/product/${item.productId}?tab=reviews`)}
                                                        style={{ fontSize: 12, borderRadius: 20, backgroundColor: '#2D6A4F', border: 'none' }}>
                                                        <i className="bi bi-pencil me-1"></i>Write Review
                                                    </button>
                                                )}

                                                {/* Request Repair — only for Delivered */}
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
                                            {/* Track Order — Shipped */}
                                            {isShipped && (
                                                <button className="btn btn-sm fw-medium"
                                                        style={{ fontSize: 12, borderRadius: 20, border: '1px solid #6A1B9A', color: '#6A1B9A', backgroundColor: 'transparent' }}>
                                                    <i className="bi bi-truck me-1"></i>Track Order
                                                </button>
                                            )}
                                            {/* Cancel — Pending only */}
                                            {isPending && (
                                                <button className="btn btn-sm fw-medium"
                                                        style={{ fontSize: 12, borderRadius: 20, border: '1px solid #C62828', color: '#C62828', backgroundColor: 'transparent' }}>
                                                    <i className="bi bi-x-circle me-1"></i>Cancel Order
                                                </button>
                                            )}
                                            {/* View Details */}
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
        </div>
    );
};

export default OrderHistory;
