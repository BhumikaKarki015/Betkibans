import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();

    if (cartItems.length === 0) {
        return (
            <>
                <div className="container py-5 text-center">
                    <i className="bi bi-cart-x display-1 text-muted"></i>
                    <h2 className="mt-4">Your cart is empty</h2>
                    <p className="text-muted">Looks like you haven't added any bamboo treasures yet.</p>
                    <button className="btn btn-success mt-3" onClick={() => navigate('/products')}>
                        Start Shopping
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="container py-5">
                <h2 className="fw-bold mb-4">Shopping Cart</h2>
                <div className="row g-4">
                    {/* Cart Items List */}
                    <div className="col-lg-8">
                        {cartItems.map((item) => (
                            <div key={item.cartItemId} className="card border-0 shadow-sm mb-3">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-3 col-md-2">
                                            <img
                                                src={`http://localhost:5192${item.product.productImages[0]?.imageUrl}`}
                                                alt={item.product.name}
                                                className="img-fluid rounded"
                                            />
                                        </div>
                                        <div className="col-9 col-md-5">
                                            <h5 className="mb-1">{item.product.name}</h5>
                                            <p className="text-success fw-bold mb-0">NPR {item.product.price.toLocaleString()}</p>
                                        </div>
                                        <div className="col-6 col-md-3 mt-3 mt-md-0">
                                            <div className="input-group input-group-sm w-75">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="input-group-text bg-white px-3">{item.quantity}</span>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-2 text-end mt-3 mt-md-0">
                                            <button
                                                className="btn btn-link text-danger p-0"
                                                onClick={() => removeFromCart(item.cartItemId)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-4">Order Summary</h5>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal</span>
                                    <span>NPR {cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span>Shipping</span>
                                    <span className="text-success">Free</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-4">
                                    <span className="fw-bold fs-5">Total</span>
                                    <span className="fw-bold fs-5 text-success">NPR {cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    className="btn btn-success w-100 py-3 fw-bold"
                                    onClick={() => navigate('/checkout')}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Cart;