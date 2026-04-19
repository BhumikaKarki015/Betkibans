import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

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
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    totalAmount: number;
    subTotal: number;
    shippingCost: number;
    taxAmount: number;
    notes?: string;
    trackingNumber?: string;
    createdAt: string;
    shippingAddress: string;
    city: string;
    fullName: string;
    phone: string;
    orderItems: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: '#FFF8E1', color: '#E65100' },
    Processing: { bg: '#E3F2FD', color: '#1565C0' },
    Shipped:    { bg: '#F3E5F5', color: '#6A1B9A' },
    Delivered:  { bg: '#E8F5E9', color: '#2E7D32' },
    Cancelled:  { bg: '#FFEBEE', color: '#C62828' },
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/Order/${orderId}`);
                setOrder(res.data);
            } catch {
                setError('Order not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const cardStyle = { backgroundColor: '#FDFAF5', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none' };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} />
        </div>
    );

    if (error || !order) return (
        <div className="container py-5 text-center">
            <i className="bi bi-exclamation-circle" style={{ fontSize: 48, color: '#CCC' }}></i>
            <p className="text-muted mt-3">{error || 'Order not found.'}</p>
            <button className="btn fw-medium text-white px-4"
                    onClick={() => navigate('/orders')}
                    style={{ backgroundColor: '#2D6A4F', borderRadius: 8, border: 'none' }}>
                Back to Orders
            </button>
        </div>
    );

    const style = STATUS_STYLES[order.status] || STATUS_STYLES['Pending'];

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/orders" className="text-decoration-none text-muted">My Orders</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>#{order.orderNumber}</span>
                </nav>

                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                    <div>
                        <h5 className="fw-bold mb-0">Order #{order.orderNumber}</h5>
                        <small className="text-muted">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-NP', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        </small>
                    </div>
                    <span className="badge px-3 py-2 fw-semibold"
                          style={{ backgroundColor: style.bg, color: style.color, fontSize: 13 }}>
                        {order.status}
                    </span>
                </div>

                <div className="row g-3">
                    <div className="col-lg-8">

                        {/* Order Items */}
                        <div className="p-4 mb-3" style={cardStyle}>
                            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                <i className="bi bi-bag me-2" style={{ color: '#2D6A4F' }}></i>Items Ordered
                            </h6>
                            {order.orderItems.map((item, i) => (
                                <div key={item.orderItemId}
                                     className="d-flex align-items-center gap-3 py-3"
                                     style={{ borderBottom: i < order.orderItems.length - 1 ? '1px dashed #E5E1D8' : 'none' }}>
                                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                         style={{ width: 56, height: 56, backgroundColor: '#F0EBE1' }}>
                                        {item.productImage
                                            ? <img src={item.productImage.startsWith('http') ? item.productImage : `${import.meta.env.VITE_API_URL}${item.productImage}`}
                                                   onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/no-image.png'; }}
                                                   alt={item.productName}
                                                   className="rounded-2"
                                                   style={{ width: 56, height: 56, objectFit: 'cover' }} />
                                            : <i className="bi bi-image text-muted"></i>}
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>
                                            {item.productName}
                                        </p>
                                        <small className="text-muted">Qty: {item.quantity} × NPR {item.unitPrice.toLocaleString()}</small>
                                    </div>
                                    <span className="fw-bold" style={{ fontSize: 14, color: '#2D6A4F' }}>
                                        NPR {(item.unitPrice * item.quantity).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Delivery Address */}
                        <div className="p-4 mb-3" style={cardStyle}>
                            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                <i className="bi bi-geo-alt-fill me-2" style={{ color: '#2D6A4F' }}></i>Delivery Address
                            </h6>
                            <p className="fw-semibold mb-1" style={{ fontSize: 14 }}>{order.fullName}</p>
                            <p className="text-muted mb-1" style={{ fontSize: 13 }}>{order.shippingAddress}</p>
                            <p className="text-muted mb-1" style={{ fontSize: 13 }}>{order.city}</p>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                <i className="bi bi-telephone me-1"></i>{order.phone}
                            </p>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="p-4 mb-3" style={cardStyle}>
                                <h6 className="fw-bold mb-2 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                    <i className="bi bi-chat-left-text me-2" style={{ color: '#2D6A4F' }}></i>Order Notes
                                </h6>
                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>{order.notes}</p>
                            </div>
                        )}

                        {/* Tracking Info */}
                        {(order.status === 'Shipped' || order.status === 'Delivered') && (
                            <div className="p-4 mb-3" style={cardStyle}>
                                <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                    <i className="bi bi-truck me-2" style={{ color: '#2D6A4F' }}></i>Order Tracking
                                </h6>
                                {order.trackingNumber && (
                                    <div className="rounded-3 p-3 mb-3 d-flex align-items-center gap-3"
                                         style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                                        <div>
                                            <small className="text-muted d-block" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Tracking Number</small>
                                            <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 15, letterSpacing: 1 }}>
                                                {order.trackingNumber}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Status Timeline */}
                                {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
                                    const currentIdx = ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status);
                                    const isDone = i <= currentIdx;
                                    const isCurrent = i === currentIdx;
                                    const ICONS = ['bi-clock', 'bi-gear', 'bi-truck', 'bi-house-check'];
                                    const LABELS = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
                                    return (
                                        <div key={step} className="d-flex align-items-center gap-3 mb-2">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                 style={{ width: 36, height: 36, backgroundColor: isDone ? '#2D6A4F' : '#F0F0F0' }}>
                                                <i className={"bi " + ICONS[i]} style={{ color: isDone ? 'white' : '#BBBBBB', fontSize: 14 }}></i>
                                            </div>
                                            <p className="mb-0 fw-semibold" style={{ fontSize: 13, color: isDone ? '#1a1a1a' : '#AAAAAA' }}>
                                                {LABELS[i]}
                                                {isCurrent && <span className="ms-2 badge rounded-pill" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 10 }}>Current</span>}
                                            </p>
                                            {isDone && !isCurrent && <i className="bi bi-check-circle-fill ms-auto" style={{ color: '#2D6A4F' }}></i>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4">

                        {/* Order Summary */}
                        <div className="p-4 mb-3" style={cardStyle}>
                            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                Order Summary
                            </h6>
                            <div className="d-flex justify-content-between mb-2" style={{ fontSize: 13 }}>
                                <span className="text-muted">Subtotal</span>
                                <span>NPR {order.subTotal?.toLocaleString() ?? '—'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2" style={{ fontSize: 13 }}>
                                <span className="text-muted">Shipping</span>
                                <span>NPR {order.shippingCost?.toLocaleString() ?? '—'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3" style={{ fontSize: 13 }}>
                                <span className="text-muted">Tax (13%)</span>
                                <span>NPR {order.taxAmount?.toLocaleString() ?? '—'}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between fw-bold">
                                <span>Total</span>
                                <span style={{ color: '#2D6A4F' }}>NPR {order.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="p-4 mb-3" style={cardStyle}>
                            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: 13, letterSpacing: 1 }}>
                                Payment
                            </h6>
                            <div className="d-flex justify-content-between mb-2" style={{ fontSize: 13 }}>
                                <span className="text-muted">Method</span>
                                <span className="fw-medium">{order.paymentMethod}</span>
                            </div>
                            <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                                <span className="text-muted">Status</span>
                                <span className="fw-medium"
                                      style={{ color: order.paymentStatus === 'Paid' ? '#2E7D32' : '#E65100' }}>
                                    {order.paymentStatus ?? 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="d-flex flex-column gap-2">
                            <button className="btn fw-medium text-white py-2"
                                    onClick={() => navigate('/care-guide')}
                                    style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8, fontSize: 13 }}>
                                <i className="bi bi-leaf me-2"></i>View Care Guide
                            </button>
                            <button className="btn fw-medium py-2"
                                    onClick={() => navigate('/orders')}
                                    style={{ borderColor: '#DDD9D2', color: '#555', borderRadius: 8, fontSize: 13 }}>
                                <i className="bi bi-arrow-left me-2"></i>Back to Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
