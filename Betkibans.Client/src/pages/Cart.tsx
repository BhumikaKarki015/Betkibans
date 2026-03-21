import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

interface AppliedCoupon {
    code: string;
    discountAmount: number;
    description: string;
}

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
    const { showToast } = useToast();

    const [promoCode, setPromoCode] = useState('');
    const [applying, setApplying] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

    const discount = appliedCoupon?.discountAmount ?? 0;
    const finalTotal = Math.max(cartTotal - discount, 0);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            showToast('Please enter a coupon code.', 'warning');
            return;
        }
        setApplying(true);
        try {
            const res = await api.post('/Coupon/validate', {
                code: promoCode.trim(),
                orderTotal: cartTotal,
            });
            setAppliedCoupon({
                code: res.data.code,
                discountAmount: res.data.discountAmount,
                description: res.data.description,
            });
            showToast(res.data.message, 'success');
            setPromoCode('');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Invalid coupon code.', 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        showToast('Coupon removed.', 'info');
    };

    if (cartItems.length === 0) {
        return (
            <div className="container py-5 text-center">
                <i className="bi bi-cart-x display-1 text-muted"></i>
                <h2 className="mt-4" style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)' }}>Your cart is empty</h2>
                <p className="text-muted">Looks like you haven't added any bamboo treasures yet.</p>
                <button className="btn btn-success mt-3 px-4 rounded-pill" onClick={() => navigate('/products')}>
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="container py-4 py-md-5">
            <h2 className="cart-page-title fw-bold mb-3 mb-md-4">Shopping Cart</h2>
            <div className="row g-3 g-md-4">

                {/* Cart Items */}
                <div className="col-lg-8">
                    {cartItems.map((item) => (
                        <div key={item.cartItemId} className="card border-0 shadow-sm mb-3">
                            <div className="card-body p-2 p-md-3">
                                <div className="row align-items-center g-0">
                                    {/* Image */}
                                    <div className="cart-item-img-col col-3 col-md-2">
                                        <img
                                            src={`http://localhost:5192${item.product.productImages[0]?.imageUrl}`}
                                            alt={item.product.name}
                                            className="img-fluid rounded"
                                            style={{ aspectRatio: '1', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Name + Price */}
                                    <div className="cart-item-product-col col-9 col-md-5 ps-2 ps-md-3">
                                        <h6 className="cart-item-name mb-1 fw-semibold lh-sm"
                                            style={{ fontSize: '0.9rem' }}>
                                            {item.product.name}
                                        </h6>
                                        <p className="text-success fw-bold mb-0 small">
                                            NPR {item.product.price.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Qty Controls */}
                                    <div className="cart-item-qty-col col-7 col-md-3 mt-2 mt-md-0 ps-2 ps-md-0">
                                        <div className="input-group input-group-sm" style={{ maxWidth: 120 }}>
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                            >−</button>
                                            <span className="input-group-text bg-white px-2 px-md-3 fw-semibold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <div className="cart-item-delete-col col-5 col-md-2 text-end mt-2 mt-md-0 pe-1">
                                        <button
                                            className="btn btn-link text-danger p-0"
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            title="Remove item"
                                        >
                                            <i className="bi bi-trash fs-5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm order-summary-card">
                        <div className="card-body p-3 p-md-4">
                            <h5 className="fw-bold mb-3 mb-md-4">Order Summary</h5>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>NPR {cartTotal.toLocaleString()}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-success small">
                                        <i className="bi bi-tag-fill me-1"></i>
                                        {appliedCoupon.code}
                                    </span>
                                    <span className="text-success fw-semibold">
                                        − NPR {appliedCoupon.discountAmount.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="d-flex justify-content-between mb-3">
                                <span>Shipping</span>
                                <span className="text-success">Free</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between mb-3 mb-md-4">
                                <span className="fw-bold fs-5">Total</span>
                                <span className="fw-bold fs-5 text-success">NPR {finalTotal.toLocaleString()}</span>
                            </div>

                            {/* Promo Code */}
                            <div className="mb-3 mb-md-4">
                                <h6 className="fw-bold mb-2 text-uppercase small" style={{ letterSpacing: 1 }}>Promo Code</h6>
                                {appliedCoupon ? (
                                    <div className="d-flex align-items-center justify-content-between p-2 rounded-2"
                                         style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                                        <div>
                                            <span className="fw-bold text-success small">
                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                {appliedCoupon.code}
                                            </span>
                                            <small className="text-muted d-block" style={{ fontSize: 11 }}>
                                                {appliedCoupon.description}
                                            </small>
                                        </div>
                                        <button className="btn btn-sm text-danger p-0 ms-2"
                                                onClick={handleRemoveCoupon}
                                                style={{ background: 'none', border: 'none' }}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter coupon code"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                                        />
                                        <button
                                            className="btn btn-outline-success fw-semibold"
                                            onClick={handleApplyPromo}
                                            disabled={applying}
                                        >
                                            {applying ? <span className="spinner-border spinner-border-sm" /> : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                <small className="text-muted mt-1 d-block" style={{ fontSize: 11 }}>
                                    Try: WELCOME10 · BAMBOO200 · GREEN15
                                </small>
                            </div>

                            <button
                                className="btn btn-success w-100 py-2 py-md-3 fw-bold rounded-pill"
                                style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}
                                onClick={() => navigate('/checkout', {
                                    state: {
                                        discountAmount: discount,
                                        couponCode: appliedCoupon?.code,
                                        finalTotal,
                                    }
                                })}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
