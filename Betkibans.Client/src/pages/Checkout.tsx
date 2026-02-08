import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, refreshCart } = useCart();
    const [loading, setLoading] = useState(false);

    // Form state matching your OrderRequestDto
    const [formData, setFormData] = useState({
        fullName: '',
        shippingAddress: '',
        city: '',
        phone: '',
        paymentMethod: 'COD',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // In a real app, you'd save the Address first and get an AddressId
            // For your MVP/Demo, we will pass a placeholder AddressId: 1
            const orderPayload = {
                addressId: 1,
                paymentMethod: formData.paymentMethod,
                notes: `Delivery to: ${formData.fullName}, ${formData.shippingAddress}, ${formData.city}. Phone: ${formData.phone}. Notes: ${formData.notes}`
            };

            const response = await api.post('/Order/place-order', orderPayload);

            if (response.status === 200) {
                alert(`Success! Order ${response.data.orderNumber} placed.`);
                refreshCart(); // Empty the cart UI
                navigate('/order-success'); // We'll create this next
            }
        } catch (err) {
            console.error(err);
            alert("Order failed. Check if your Backend is running!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="row g-5">
                    {/* Left: Shipping Form */}
                    <div className="col-md-7">
                        <h4 className="mb-4 fw-bold">Shipping Details</h4>
                        <form onSubmit={handlePlaceOrder} className="card border-0 shadow-sm p-4">
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input type="text" name="fullName" className="form-control" onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Street Address</label>
                                <input type="text" name="shippingAddress" className="form-control" onChange={handleChange} required />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">City</label>
                                    <input type="text" name="city" className="form-control" onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Phone</label>
                                    <input type="tel" name="phone" className="form-control" onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Order Notes (Optional)</label>
                                <textarea name="notes" className="form-control" rows={2} onChange={handleChange}></textarea>
                            </div>
                            <hr className="my-4" />
                            <h5 className="mb-3">Payment Method</h5>
                            <div className="form-check mb-2">
                                <input className="form-check-input" type="radio" name="paymentMethod" value="COD" defaultChecked onChange={handleChange} />
                                <label className="form-check-label">Cash on Delivery (COD)</label>
                            </div>
                            <div className="form-check mb-4">
                                <input className="form-check-input" type="radio" name="paymentMethod" value="eSewa" disabled />
                                <label className="form-check-label text-muted">eSewa (Coming Soon)</label>
                            </div>
                            <button type="submit" className="btn btn-success btn-lg w-100" disabled={loading || cartItems.length === 0}>
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>
                        </form>
                    </div>

                    {/* Right: Summary */}
                    <div className="col-md-5">
                        <div className="card border-0 bg-light p-4 sticky-top" style={{ top: '100px' }}>
                            <h4 className="mb-4 fw-bold">Order Summary</h4>
                            {cartItems.map(item => (
                                <div key={item.cartItemId} className="d-flex justify-content-between mb-2">
                                    <span>{item.product.name} x {item.quantity}</span>
                                    <span className="fw-bold">NPR {(item.product.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                            <hr />
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>NPR {cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Shipping</span>
                                <span>NPR 150</span>
                            </div>
                            <div className="d-flex justify-content-between mt-3 fs-4 fw-bold text-success">
                                <span>Total</span>
                                <span>NPR {(cartTotal + 150).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Checkout;