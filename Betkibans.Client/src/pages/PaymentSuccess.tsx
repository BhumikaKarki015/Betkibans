import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

    useEffect(() => {
        const pidx = searchParams.get('pidx');
        const paymentStatus = searchParams.get('status');

        // If Khalti returned a failed/cancelled status, don't even verify
        if (paymentStatus && (paymentStatus === 'User canceled' || paymentStatus === 'Expired')) {
            setStatus('failed');
            return;
        }

        if (!pidx) { setStatus('failed'); return; }

        api.post('/Payment/verify', { pidx })
            .then(() => {
                setStatus('success');
            })
            .catch(() => setStatus('failed'));
    }, []);

    if (status === 'verifying') return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }}
             className="d-flex justify-content-center align-items-center">
            <div className="text-center p-5 rounded-3" style={{ backgroundColor: '#FDFAF5' }}>
                <div className="spinner-border mb-3" style={{ color: '#5C2D91', width: 48, height: 48 }}></div>
                <h5 className="fw-bold mb-1">Verifying your payment...</h5>
                <p className="text-muted mb-0" style={{ fontSize: 14 }}>Please wait, do not close this page.</p>
            </div>
        </div>
    );

    if (status === 'success') return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-5">
            <div className="container" style={{ maxWidth: 500 }}>
                <div className="p-5 text-center rounded-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                    {/* Success animation */}
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                         style={{ width: 80, height: 80, backgroundColor: '#E8F5E9' }}>
                        <i className="bi bi-check-circle-fill" style={{ fontSize: 44, color: '#2D6A4F' }}></i>
                    </div>

                    <h4 className="fw-bold mb-2">Payment Successful! 🎉</h4>
                    <p className="text-muted mb-4" style={{ fontSize: 14 }}>
                        Your Khalti payment was confirmed and your order is now being processed by the seller.
                    </p>

                    {/* Khalti badge */}
                    <div className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 mb-4"
                         style={{ backgroundColor: '#F3E5F5' }}>
                        <span className="badge rounded-pill fw-bold text-white px-2"
                              style={{ backgroundColor: '#5C2D91', fontSize: 11 }}>khalti</span>
                        <small style={{ color: '#4A148C', fontSize: 12 }}>Payment Verified</small>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        <button className="btn fw-semibold text-white py-2"
                                onClick={() => navigate('/orders')}
                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-bag-check me-2"></i>View My Orders
                        </button>
                        <Link to="/products" className="btn fw-medium py-2"
                              style={{ borderColor: '#DDD9D2', color: '#555', borderRadius: 8 }}>
                            <i className="bi bi-shop me-2"></i>Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    // Failed state
    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-5">
            <div className="container" style={{ maxWidth: 500 }}>
                <div className="p-5 text-center rounded-3" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                         style={{ width: 80, height: 80, backgroundColor: '#FFEBEE' }}>
                        <i className="bi bi-x-circle-fill" style={{ fontSize: 44, color: '#E53935' }}></i>
                    </div>

                    <h4 className="fw-bold mb-2">Payment Failed</h4>
                    <p className="text-muted mb-4" style={{ fontSize: 14 }}>
                        Your payment could not be verified. Your order has still been placed — you can pay on delivery or try again from your orders page.
                    </p>

                    <div className="d-flex flex-column gap-2">
                        <button className="btn fw-semibold text-white py-2"
                                onClick={() => navigate('/orders')}
                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-bag-check me-2"></i>View My Orders
                        </button>
                        <button className="btn fw-medium py-2"
                                onClick={() => navigate('/checkout')}
                                style={{ borderColor: '#DDD9D2', color: '#555', borderRadius: 8 }}>
                            <i className="bi bi-arrow-left me-2"></i>Back to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
