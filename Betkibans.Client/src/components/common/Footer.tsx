import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Footer = () => {
    const { user } = useAuth();
    const brandGreen = '#2E4F3E';

    // ─────────────────────────────────────────────
    // ADMIN FOOTER — minimal
    // ─────────────────────────────────────────────
    if (user?.role === 'Admin') {
        return (
            <footer style={{ backgroundColor: '#1a3a2a', color: '#FAF8F5' }} className="py-3 mt-auto">
                <div className="container-fluid px-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small opacity-75">
                        <span>© 2026 Betkibans Admin Panel. All Rights Reserved.</span>
                        <div className="d-flex gap-3">
                            <span>Version 1.0.5</span>
                            <Link to='/privacy-policy' className='text-reset text-decoration-none'>Privacy Policy</Link>
                            <Link to='/privacy-policy#terms' className='text-reset text-decoration-none'>Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    // ─────────────────────────────────────────────
    // SELLER FOOTER — focused on seller links
    // ─────────────────────────────────────────────
    if (user?.role === 'Seller') {
        return (
            <footer style={{ backgroundColor: brandGreen, color: '#FAF8F5' }} className="py-4 mt-auto">
                <div className="container">
                    <div className="row g-3 align-items-start">
                        <div className="col-md-4">
                            <h6 className="fw-bold mb-2" style={{ fontFamily: 'serif' }}>BETKIBANS</h6>
                            <p className="small opacity-75 mb-0">
                                Empowering local artisans through sustainable bamboo and cane furniture.
                            </p>
                        </div>
                        <div className="col-6 col-md-2">
                            <h6 className="fw-bold mb-2 text-uppercase small">Seller</h6>
                            <ul className="list-unstyled small opacity-75 mb-0">
                                <li className="mb-1"><Link to="/seller/dashboard" className="text-reset text-decoration-none">Dashboard</Link></li>
                                <li className="mb-1"><Link to="/seller/products" className="text-reset text-decoration-none">My Products</Link></li>
                                <li className="mb-1"><Link to="/seller/orders" className="text-reset text-decoration-none">Orders</Link></li>
                                <li className="mb-1"><Link to="/seller/profile" className="text-reset text-decoration-none">Business Profile</Link></li>
                            </ul>
                        </div>
                        <div className="col-6 col-md-2">
                            <h6 className="fw-bold mb-2 text-uppercase small">Guidelines</h6>
                            <ul className="list-unstyled small opacity-75 mb-0">
                                <li className="mb-1"><Link to="/care-guide" className="text-reset text-decoration-none">Care Guide</Link></li>
                                <li className="mb-1"><span className="text-reset" style={{ cursor: 'pointer' }}>Seller Policies</span></li>
                                <li className="mb-1"><span className="text-reset" style={{ cursor: 'pointer' }}>Payments</span></li>
                            </ul>
                        </div>
                        <div className="col-md-4">
                            <h6 className="fw-bold mb-2 text-uppercase small">Support</h6>
                            <ul className="list-unstyled small opacity-75 mb-0">
                                <li className="mb-1"><span>Contact Us</span></li>
                                <li className="mb-1"><span>FAQ</span></li>
                                <li className="mb-1"><span>Help Center</span></li>
                            </ul>
                        </div>
                    </div>
                    <hr className="my-3 opacity-25" />
                    <div className="d-flex justify-content-between align-items-center small opacity-50">
                        <span>© 2026 Betkibans. All Rights Reserved.</span>
                        <div className="d-flex gap-3">
                            <Link to='/privacy-policy' className='text-reset text-decoration-none'>Privacy Policy</Link>
                            <Link to='/privacy-policy#terms' className='text-reset text-decoration-none'>Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    // ─────────────────────────────────────────────
    // CONSUMER / PUBLIC FOOTER (default)
    // ─────────────────────────────────────────────
    return (
        <footer style={{ backgroundColor: brandGreen, color: '#FAF8F5' }} className="py-5 mt-auto">
            <div className="container">
                <div className="row g-4">
                    {/* Brand */}
                    <div className="col-lg-4">
                        <h4 className="fw-bold mb-2" style={{ fontFamily: 'serif' }}>BETKIBANS</h4>
                        <p className="small opacity-75 mb-4">
                            Empowering local artisans through sustainable bamboo and cane furniture.
                            Crafted with care, delivered with love.
                        </p>
                        <div className="d-flex gap-2 flex-wrap mb-4">
                            <span className="badge border border-light border-opacity-50 px-2 py-1 small">🌱 100% Eco-Friendly</span>
                            <span className="badge border border-light border-opacity-50 px-2 py-1 small">🇳🇵 Made in Nepal</span>
                        </div>
                        {/* Social icons */}
                        <div className="d-flex gap-2">
                            <a href="#" className="btn btn-sm btn-outline-light rounded-circle" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a href="#" className="btn btn-sm btn-outline-light rounded-circle" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-instagram"></i>
                            </a>
                            <a href="#" className="btn btn-sm btn-outline-light rounded-circle" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-twitter-x"></i>
                            </a>
                        </div>
                    </div>

                    {/* About */}
                    <div className="col-6 col-lg-2">
                        <h6 className="fw-bold mb-3 text-uppercase small">About</h6>
                        <ul className="list-unstyled small opacity-75">
                            <li className="mb-2"><Link to="/about" className="text-reset text-decoration-none">Our Story</Link></li>
                            <li className="mb-2"><Link to="/about#mission" className="text-reset text-decoration-none">Mission</Link></li>
                            <li className="mb-2"><Link to="/about#team" className="text-reset text-decoration-none">Team</Link></li>
                            <li className="mb-2"><Link to="/contact" className="text-reset text-decoration-none">Contact</Link></li>
                        </ul>
                    </div>

                    {/* For Buyers */}
                    <div className="col-6 col-lg-2">
                        <h6 className="fw-bold mb-3 text-uppercase small">For Buyers</h6>
                        <ul className="list-unstyled small opacity-75">
                            <li className="mb-2"><Link to="/products" className="text-reset text-decoration-none">Shop</Link></li>
                            <li className="mb-2"><Link to="/cart" className="text-reset text-decoration-none">Cart</Link></li>
                            <li className="mb-2"><Link to="/orders" className="text-reset text-decoration-none">Orders</Link></li>
                            <li className="mb-2"><Link to="/wishlist" className="text-reset text-decoration-none">Wishlist</Link></li>
                        </ul>
                    </div>

                    {/* For Sellers */}
                    <div className="col-6 col-lg-1">
                        <h6 className="fw-bold mb-3 text-uppercase small">For Sellers</h6>
                        <ul className="list-unstyled small opacity-75">
                            <li className="mb-2"><Link to="/register?type=seller" className="text-reset text-decoration-none">Sell</Link></li>
                            <li className="mb-2"><Link to="/seller/dashboard" className="text-reset text-decoration-none">Dashboard</Link></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>Guidelines</span></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>Payments</span></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>Policies</span></li>
                        </ul>
                    </div>

                    {/* Support + Newsletter */}
                    <div className="col-6 col-lg-1">
                        <h6 className="fw-bold mb-3 text-uppercase small">Support</h6>
                        <ul className="list-unstyled small opacity-75 mb-0">
                            <li className="mb-2"><Link to="/contact" className="text-reset text-decoration-none">Contact Us</Link></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>FAQ</span></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>Help Center</span></li>
                            <li className="mb-2"><Link to="/care-guide" className="text-reset text-decoration-none">Shipping</Link></li>
                            <li className="mb-2"><span className="text-reset" style={{ cursor: 'pointer' }}>Returns</span></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="col-lg-2">
                        <h6 className="fw-bold mb-3 text-uppercase small">Join Our Community</h6>
                        <p className="small opacity-75">Get exclusive offers and tips on sustainable living.</p>
                        <div className="input-group">
                            <input
                                type="email"
                                className="form-control form-control-sm bg-transparent text-white border-light"
                                placeholder="Email Address"
                            />
                            <button className="btn btn-outline-light btn-sm px-3" type="button">Join</button>
                        </div>
                    </div>
                </div>

                <hr className="my-4 opacity-25" />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 small opacity-50">
                    <p className="mb-0">© 2026 Betkibans. All Rights Reserved.</p>
                    <div className="d-flex gap-4">
                        <Link to='/privacy-policy' className='text-reset text-decoration-none'>Privacy Policy</Link>
                        <Link to='/privacy-policy#terms' className='text-reset text-decoration-none'>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
