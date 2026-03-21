import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

type PaymentMethod = 'COD' | 'Khalti';

interface Address {
    addressId: number;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    landmark?: string;
    postalCode?: string;
    isDefault: boolean;
}

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, cartTotal, refreshCart } = useCart();
    const { showToast } = useToast();

    const discountAmount = (location.state as any)?.discountAmount ?? 0;
    const couponCode = (location.state as any)?.couponCode ?? null;

    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', shippingAddress: '', city: 'Kathmandu',
        province: 'Bagmati', postalCode: '', phone: '', notes: '',
    });

    useEffect(() => { fetchSavedAddresses(); }, []);

    const fetchSavedAddresses = async () => {
        try {
            const res = await api.get('/Address');
            setSavedAddresses(res.data);
            const defaultAddr = res.data.find((a: Address) => a.isDefault);
            if (defaultAddr) setSelectedAddressId(defaultAddr.addressId);
            if (res.data.length === 0) setUseNewAddress(true);
        } catch { setUseNewAddress(true); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const shippingCost = 150;
    const taxRate = 0.13;
    const discountedSubtotal = Math.max(cartTotal - discountAmount, 0);
    const taxAmount = Math.round(discountedSubtotal * taxRate);
    const totalAmount = discountedSubtotal + shippingCost + taxAmount;

    const buildOrderPayload = () => {
        const selectedAddr = savedAddresses.find(a => a.addressId === selectedAddressId);
        return useNewAddress ? {
            fullName: formData.fullName,
            shippingAddress: `${formData.shippingAddress}, ${formData.province} Province`,
            city: formData.city, phone: formData.phone,
            paymentMethod, notes: formData.notes,
        } : {
            fullName: selectedAddr!.fullName,
            shippingAddress: `${selectedAddr!.addressLine1}${selectedAddr!.addressLine2 ? ', ' + selectedAddr!.addressLine2 : ''}`,
            city: selectedAddr!.city, phone: selectedAddr!.phoneNumber,
            paymentMethod, notes: formData.notes, addressId: selectedAddressId,
        };
    };

    const handlePlaceOrder = async (e: FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) { showToast('Please agree to the Terms & Conditions before placing your order.', 'warning'); return; }
        if (!useNewAddress && !selectedAddressId) { showToast('Please select a delivery address.', 'warning'); return; }

        setLoading(true);
        try {
            const response = await api.post('/Order/place-order', buildOrderPayload());

            if (response.status === 200) {
                const orderId = response.data.orderId;
                const orderNumber = response.data.orderNumber;

                if (paymentMethod === 'Khalti') {
                    try {
                        const paymentRes = await api.post(`/Payment/initiate/${orderId}`);
                        await refreshCart();
                        window.location.href = paymentRes.data.paymentUrl;
                    } catch {
                        showToast('Failed to initiate Khalti payment. Your order was placed — you can pay on delivery.', 'warning');
                        await refreshCart();
                        navigate('/order-success', { state: { orderNumber } });
                    }
                } else {
                    await refreshCart();
                    navigate('/order-success', { state: { orderNumber } });
                }
            }
        } catch (err: any) {
            showToast(err.response?.data || 'Order failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const nepalProvinces = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
    const majorCities = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Itahari'];

    return (
        <>
            <div className="bg-light border-bottom py-2">
                <div className="container">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-success">Home</Link></li>
                            <li className="breadcrumb-item"><Link to="/products" className="text-decoration-none text-success">Shop</Link></li>
                            <li className="breadcrumb-item active">Checkout</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container py-4">
                <h3 className="fw-bold mb-4">Checkout</h3>

                {/* Progress Stepper */}
                <div className="mb-5">
                    <div className="d-flex align-items-center justify-content-center gap-0">
                        {[
                            { label: 'Cart', done: true },
                            { label: 'Shipping', active: true },
                            { label: 'Payment', active: false },
                            { label: 'Confirmation', active: false },
                        ].map((step, i) => (
                            <div key={step.label} className="d-flex align-items-center">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                         style={{
                                             width: 36, height: 36, fontSize: 14,
                                             backgroundColor: step.done ? '#2D6A4F' : 'transparent',
                                             color: step.done ? 'white' : step.active ? '#2D6A4F' : '#999',
                                             border: step.done ? 'none' : `3px solid ${step.active ? '#2D6A4F' : '#dee2e6'}`,
                                         }}>
                                        {step.done ? <i className="bi bi-check-lg"></i> : i + 1}
                                    </div>
                                    <small className="mt-1 fw-semibold" style={{ color: step.done || step.active ? '#2D6A4F' : '#999' }}>
                                        {step.label}
                                    </small>
                                </div>
                                {i < 3 && <div style={{ height: 3, width: 80, backgroundColor: step.done ? '#2D6A4F' : '#dee2e6', margin: '0 4px 20px' }}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handlePlaceOrder}>
                    <div className="row g-4">
                        <div className="col-lg-7">

                            {/* Shipping Address */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-geo-alt-fill text-success me-2 fs-5"></i>
                                            <h5 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: 1, fontSize: 14 }}>Shipping Address</h5>
                                        </div>
                                        <Link to="/addresses" className="text-decoration-none" style={{ fontSize: 13, color: '#2D6A4F' }}>
                                            <i className="bi bi-plus-circle me-1"></i>Manage Addresses
                                        </Link>
                                    </div>

                                    {savedAddresses.length > 0 && !useNewAddress && (
                                        <div className="mb-3">
                                            <div className="d-flex flex-column gap-2 mb-2">
                                                {savedAddresses.map(addr => (
                                                    <div key={addr.addressId}
                                                         className="p-3 rounded-2 d-flex align-items-start gap-2"
                                                         style={{
                                                             border: selectedAddressId === addr.addressId ? '2px solid #2D6A4F' : '1px solid #DDD9D2',
                                                             cursor: 'pointer',
                                                             backgroundColor: selectedAddressId === addr.addressId ? '#F0F7F4' : '#FDFAF5',
                                                         }}
                                                         onClick={() => setSelectedAddressId(addr.addressId)}>
                                                        <input type="radio" className="form-check-input mt-1" readOnly
                                                               checked={selectedAddressId === addr.addressId} />
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fw-semibold" style={{ fontSize: 14 }}>{addr.fullName}</span>
                                                                {addr.isDefault && (
                                                                    <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 10 }}>Default</span>
                                                                )}
                                                            </div>
                                                            <small className="text-muted d-block">+977 {addr.phoneNumber}</small>
                                                            <small className="text-muted">
                                                                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.district}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" className="btn btn-sm fw-medium"
                                                    onClick={() => setUseNewAddress(true)}
                                                    style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}>
                                                <i className="bi bi-plus me-1"></i>Use a Different Address
                                            </button>
                                        </div>
                                    )}

                                    {useNewAddress && (
                                        <>
                                            {savedAddresses.length > 0 && (
                                                <button type="button" className="btn btn-sm mb-3 fw-medium"
                                                        onClick={() => setUseNewAddress(false)}
                                                        style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 13 }}>
                                                    <i className="bi bi-arrow-left me-1"></i>Use Saved Address
                                                </button>
                                            )}
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label fw-medium small">Full Name *</label>
                                                    <input type="text" name="fullName" className="form-control"
                                                           placeholder="Enter your full name" value={formData.fullName}
                                                           onChange={handleChange} required={useNewAddress} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label fw-medium small">Phone Number *</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text text-muted small">+977</span>
                                                        <input type="tel" name="phone" className="form-control"
                                                               placeholder="98XXXXXXXX" value={formData.phone}
                                                               onChange={handleChange} required={useNewAddress} />
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label fw-medium small">Address Line 1 *</label>
                                                    <input type="text" name="shippingAddress" className="form-control"
                                                           placeholder="Street address, tole, ward number"
                                                           value={formData.shippingAddress}
                                                           onChange={handleChange} required={useNewAddress} />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-medium small">City *</label>
                                                    <select name="city" className="form-select" value={formData.city} onChange={handleChange}>
                                                        {majorCities.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-medium small">Province *</label>
                                                    <select name="province" className="form-select" value={formData.province} onChange={handleChange}>
                                                        {nepalProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="bi bi-credit-card-fill text-success me-2 fs-5"></i>
                                        <h5 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: 1, fontSize: 14 }}>Payment Method</h5>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {[
                                            { id: 'Khalti', label: 'Khalti', desc: 'Pay securely using your Khalti digital wallet', color: '#5C2D91' },
                                            { id: 'COD', label: 'COD', desc: 'Cash on Delivery — pay when your order arrives', color: '#6c757d' },
                                        ].map(pm => (
                                            <div key={pm.id}
                                                 className={`border rounded p-3 d-flex align-items-center gap-3 ${paymentMethod === pm.id ? 'border-success bg-success bg-opacity-10' : 'border-light-subtle'}`}
                                                 style={{ cursor: 'pointer' }}
                                                 onClick={() => setPaymentMethod(pm.id as PaymentMethod)}>
                                                <input type="radio" className="form-check-input mt-0"
                                                       checked={paymentMethod === pm.id}
                                                       onChange={() => setPaymentMethod(pm.id as PaymentMethod)} />
                                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                                    <div className="rounded px-2 py-1 fw-bold text-white small"
                                                         style={{ backgroundColor: pm.color, fontSize: 12 }}>{pm.label}</div>
                                                    <span className="small">{pm.desc}</span>
                                                </div>
                                                {paymentMethod === pm.id && <i className="bi bi-check-circle-fill text-success"></i>}
                                            </div>
                                        ))}
                                    </div>
                                    {paymentMethod === 'Khalti' && (
                                        <div className="rounded-3 p-3 mt-3 d-flex align-items-center gap-2"
                                             style={{ backgroundColor: '#F3E5F5', fontSize: 13 }}>
                                            <i className="bi bi-shield-check" style={{ color: '#5C2D91' }}></i>
                                            <span style={{ color: '#4A148C' }}>
                                                You'll be redirected to Khalti's secure payment page after placing your order.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Notes */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="bi bi-chat-left-text-fill text-success me-2 fs-5"></i>
                                        <h5 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: 1, fontSize: 14 }}>
                                            Order Notes <span className="text-muted fw-normal">(Optional)</span>
                                        </h5>
                                    </div>
                                    <textarea name="notes" className="form-control" rows={3}
                                              placeholder="e.g. Please deliver after 5pm, call before arriving..."
                                              value={formData.notes} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="agreeTerms"
                                           checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                                    <label className="form-check-label small" htmlFor="agreeTerms">
                                        I agree to the <a href="#" className="text-success">Terms & Conditions</a> and <a href="#" className="text-success">Privacy Policy</a>
                                    </label>
                                </div>
                            </div>

                            <div className="d-flex gap-3">
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => navigate('/cart')}>
                                    <i className="bi bi-arrow-left me-2"></i>Back to Cart
                                </button>
                                <button type="submit" className="btn btn-success btn-lg flex-grow-1"
                                        disabled={loading || cartItems.length === 0 || !agreedToTerms}
                                        style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}>
                                    {loading
                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>
                                            {paymentMethod === 'Khalti' ? 'Redirecting to Khalti...' : 'Processing...'}</>
                                        : paymentMethod === 'Khalti'
                                            ? <><i className="bi bi-lock-fill me-2"></i>Place Order & Pay with Khalti</>
                                            : <><i className="bi bi-lock-fill me-2"></i>Place Order</>}
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-5">
                            <div className="sticky-top" style={{ top: 80 }}>
                                <div className="card border-0 shadow-sm mb-3">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold mb-3 text-uppercase" style={{ letterSpacing: 1, fontSize: 14 }}>Order Summary</h5>
                                        {cartItems.length === 0 ? (
                                            <p className="text-muted small">Your cart is empty.</p>
                                        ) : (
                                            <>
                                                {cartItems.map(item => (
                                                    <div key={item.cartItemId} className="d-flex align-items-center gap-3 mb-3">
                                                        <img
                                                            src={item.product.productImages?.[0]?.imageUrl
                                                                ? `http://localhost:5192${item.product.productImages[0].imageUrl}`
                                                                : 'https://via.placeholder.com/60?text=Item'}
                                                            alt={item.product.name} className="rounded"
                                                            style={{ width: 56, height: 56, objectFit: 'cover' }} />
                                                        <div className="flex-grow-1">
                                                            <p className="mb-0 small fw-medium">{item.product.name}</p>
                                                            <small className="text-muted">Qty: {item.quantity}</small>
                                                        </div>
                                                        <span className="fw-bold small">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                <hr />
                                                <div className="d-flex justify-content-between mb-2 small">
                                                    <span className="text-muted">Subtotal</span>
                                                    <span>Rs. {cartTotal.toLocaleString()}</span>
                                                </div>
                                                {discountAmount > 0 && (
                                                    <div className="d-flex justify-content-between mb-2 small">
                                                        <span className="text-success">
                                                            <i className="bi bi-tag-fill me-1"></i>{couponCode}
                                                        </span>
                                                        <span className="text-success fw-semibold">− Rs. {discountAmount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between mb-2 small">
                                                    <span className="text-muted">Shipping</span>
                                                    <span>Rs. {shippingCost.toLocaleString()}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2 small">
                                                    <span className="text-muted">Tax (13%)</span>
                                                    <span>Rs. {taxAmount.toLocaleString()}</span>
                                                </div>
                                                <hr />
                                                <div className="d-flex justify-content-between fw-bold fs-5">
                                                    <span>Total</span>
                                                    <span className="text-success">Rs. {totalAmount.toLocaleString()}</span>
                                                </div>
                                            </>
                                        )}
                                        <button type="submit" className="btn btn-success w-100 mt-3 py-2 fw-semibold"
                                                disabled={loading || cartItems.length === 0 || !agreedToTerms}
                                                style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}
                                                onClick={handlePlaceOrder}>
                                            {loading ? 'Processing...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>

                                <div className="card border-0 shadow-sm">
                                    <div className="card-body p-4">
                                        <p className="text-muted small mb-3 text-center fw-medium">We accept</p>
                                        <div className="d-flex justify-content-center gap-2 mb-3">
                                            <span className="badge rounded-pill px-3 py-2 fw-bold" style={{ backgroundColor: '#5C2D91', fontSize: 12 }}>khalti</span>
                                            <span className="badge rounded-pill px-3 py-2 fw-bold bg-secondary" style={{ fontSize: 12 }}>COD</span>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="d-flex flex-column gap-1">
                                            <div className="d-flex align-items-center gap-2 small text-muted"><i className="bi bi-lock-fill text-success"></i>Secure Checkout</div>
                                            <div className="d-flex align-items-center gap-2 small text-muted"><i className="bi bi-patch-check-fill text-success"></i>Verified Sellers</div>
                                            <div className="d-flex align-items-center gap-2 small text-muted"><i className="bi bi-truck text-success"></i>Fast Delivery</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="border-top py-3 mt-4 bg-light">
                <div className="container">
                    <div className="d-flex justify-content-center gap-4 flex-wrap small text-muted">
                        <span><i className="bi bi-lock-fill text-success me-1"></i>Secure Checkout</span>
                        <span><i className="bi bi-patch-check-fill text-success me-1"></i>Verified Sellers</span>
                        <span><i className="bi bi-truck text-success me-1"></i>Fast Delivery</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Checkout;
