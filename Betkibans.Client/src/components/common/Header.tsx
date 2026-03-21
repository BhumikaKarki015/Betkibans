import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const cartCount = cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // ─────────────────────────────────────────────
    // ADMIN HEADER
    // ─────────────────────────────────────────────
    if (user?.role === 'Admin') {
        return (
            <nav className="navbar navbar-expand-lg navbar-dark sticky-top py-2" style={{ backgroundColor: '#1a3a2a' }}>
                <div className="container-fluid px-3 px-lg-4">
                    {/* Brand */}
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/admin/panel">
                        <img src="/logo.jpeg" alt="Logo" style={{ height: 36, objectFit: 'contain' }} />
                        <span className="fw-bold fs-6">BETKIBANS</span>
                        <span className="badge bg-danger ms-1 small">Admin</span>
                    </Link>

                    <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav me-auto gap-1 small mt-2 mt-lg-0">
                            {[
                                { to: '/admin/panel', label: 'Dashboard' },
                                { to: '/admin/users', label: 'Users' },
                                { to: '/admin/sellers', label: 'Sellers' },
                                { to: '/admin/verify-sellers', label: 'Verifications' },
                                { to: '/admin/products', label: 'Products' },
                                { to: '/admin/orders', label: 'Orders' },
                                { to: '/admin/analytics', label: 'Reports' },
                                { to: '/admin/settings', label: 'Settings' },
                            ].map(link => (
                                <li className="nav-item" key={link.to}>
                                    <Link className="nav-link px-2 fw-medium" to={link.to}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>

                        <div className="d-flex align-items-center gap-3 mt-2 mt-lg-0">
                            <form onSubmit={handleSearch} className="d-flex w-100 w-lg-auto">
                                <input
                                    type="text"
                                    className="form-control form-control-sm bg-white bg-opacity-10 border-0 text-white"
                                    placeholder="Search users, products, orders..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ minWidth: 0, width: '100%', maxWidth: 220 } as any}
                                />
                            </form>
                            <div className="dropdown">
                                <button
                                    className="btn btn-outline-light btn-sm rounded-pill dropdown-toggle px-3"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-person-circle me-1"></i>Admin
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                    <li><button className="dropdown-item text-danger" onClick={logout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                                    </button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    // ─────────────────────────────────────────────
    // SELLER HEADER
    // ─────────────────────────────────────────────
    if (user?.role === 'Seller') {
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2" style={{ borderBottom: '2px solid #2D6A4F !important' }}>
                <div className="container">
                    {/* Brand */}
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/seller/dashboard">
                        <img src="/logo.jpeg" alt="Logo" style={{ height: 44, objectFit: 'contain' }} />
                        <span className="fw-bold text-success fs-6 d-none d-sm-block">BETKIBANS</span>
                    </Link>

                    <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#sellerNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Seller Nav Links */}
                    <div className="collapse navbar-collapse" id="sellerNav">
                        <ul className="navbar-nav me-auto gap-1 mt-2 mt-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link fw-semibold" to="/seller/dashboard">
                                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link fw-semibold" to="/seller/products">
                                    <i className="bi bi-box-seam me-1"></i>My Products
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link fw-semibold" to="/seller/orders">
                                    <i className="bi bi-bag-check me-1"></i>Orders
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link fw-semibold" to="/seller/repairs">
                                    <i className="bi bi-tools me-1"></i>Repair Requests
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link fw-semibold" to="/seller/analytics">
                                    <i className="bi bi-bar-chart me-1"></i>Analytics
                                </Link>
                            </li>
                        </ul>

                        {/* Seller Account */}
                        <div className="dropdown mt-2 mt-lg-0">
                            <button
                                className="btn btn-outline-success btn-sm rounded-pill dropdown-toggle px-3"
                                data-bs-toggle="dropdown"
                            >
                                <i className="bi bi-person-badge me-1"></i>
                                {user.fullName?.split(' ')[0] || user.email || 'Seller Account'}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li className="px-3 py-2 border-bottom">
                                    <small className="text-muted d-block">Signed in as</small>
                                    <span className="fw-semibold small">{user.email}</span>
                                </li>
                                <li><Link className="dropdown-item" to="/seller/profile">
                                    <i className="bi bi-building me-2"></i>Business Profile
                                </Link></li>
                                <li><Link className="dropdown-item" to="/seller/settings">
                                    <i className="bi bi-gear me-2"></i>Settings
                                </Link></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item text-danger" onClick={logout}>
                                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                                </button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    // ─────────────────────────────────────────────
    // CONSUMER / PUBLIC HEADER (default)
    // ─────────────────────────────────────────────
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2">
            <div className="container">
                {/* Brand */}
                <Link className="navbar-brand d-flex align-items-center gap-2 flex-shrink-0" to="/">
                    <img src="/logo.jpeg" alt="Betkibans Logo" style={{ height: 48, objectFit: 'contain' }} />
                    <span className="fw-bold text-success fs-6 d-none d-sm-block">BETKIBANS</span>
                </Link>

                {/*
                  ── Mobile-only: cart icon always visible, beside the toggler ──
                  On large screens this is hidden; the cart inside the collapse is shown.
                */}
                <div className="d-flex align-items-center gap-2 ms-auto me-2 d-lg-none">
                    <Link to="/cart" className="text-dark position-relative text-decoration-none px-1">
                        <i className="bi bi-cart3 fs-5"></i>
                        {cartCount > 0 && (
                            <span
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                style={{ fontSize: '0.6rem', padding: '0.3em 0.5em' }}
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>

                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#consumerNav" aria-controls="consumerNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="consumerNav">
                    {/* Center: Search bar — full-width on mobile */}
                    <form
                        className="search-form-consumer mx-auto d-flex"
                        style={{ width: '100%', maxWidth: 400 }}
                        onSubmit={handleSearch}
                    >
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control border-end-0"
                                placeholder="Search bamboo & cane furniture..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ borderRadius: '20px 0 0 20px' }}
                            />
                            <button
                                type="submit"
                                className="btn btn-success border-start-0"
                                style={{ borderRadius: '0 20px 20px 0', backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}
                            >
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </form>

                    {/* Nav Links */}
                    <ul className="navbar-nav nav-links-consumer mx-lg-3">
                        <li className="nav-item">
                            <Link className="nav-link fw-semibold" to="/products">Shop All</Link>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle fw-semibold" href="#" data-bs-toggle="dropdown">
                                Categories
                            </a>
                            <ul className="dropdown-menu border-0 shadow-sm">
                                <li><Link className="dropdown-item" to="/products?category=Chairs">
                                    <i className="bi bi-grid me-2 text-success"></i>Chairs
                                </Link></li>
                                <li><Link className="dropdown-item" to="/products?category=Tables">
                                    <i className="bi bi-grid me-2 text-success"></i>Tables
                                </Link></li>
                                <li><Link className="dropdown-item" to="/products?category=Beds">
                                    <i className="bi bi-grid me-2 text-success"></i>Beds
                                </Link></li>
                                <li><Link className="dropdown-item" to="/products?category=Outdoor">
                                    <i className="bi bi-grid me-2 text-success"></i>Outdoor
                                </Link></li>
                                <li><Link className="dropdown-item" to="/products?category=Storage">
                                    <i className="bi bi-grid me-2 text-success"></i>Storage
                                </Link></li>
                                <li><Link className="dropdown-item" to="/products?category=Decor">
                                    <i className="bi bi-grid me-2 text-success"></i>Decor
                                </Link></li>
                            </ul>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link fw-semibold" to="/care-guide">Care Guide</Link>
                        </li>
                    </ul>

                    {/* Right: Cart + Account — hidden on mobile (cart shown above toggler) */}
                    <div className="nav-actions-consumer d-flex align-items-center gap-3">
                        {/* Cart icon — desktop only (mobile version is above the toggler) */}
                        <Link to="/cart" className="text-dark position-relative text-decoration-none d-none d-lg-block">
                            <i className="bi bi-cart3 fs-5"></i>
                            {cartCount > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.6rem', padding: '0.3em 0.5em' }}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="dropdown">
                                <button
                                    className="btn btn-outline-success btn-sm rounded-pill dropdown-toggle px-3"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-person-circle me-1"></i>
                                    {user.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'My Account'}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style={{ minWidth: 200 }}>
                                    <li className="px-3 py-2 border-bottom">
                                        <small className="text-muted d-block">Signed in as</small>
                                        <span className="fw-semibold small">{user.email}</span>
                                    </li>
                                    <li><Link className="dropdown-item" to="/profile">
                                        <i className="bi bi-person me-2"></i>My Profile
                                    </Link></li>
                                    <li><Link className="dropdown-item" to="/orders">
                                        <i className="bi bi-bag me-2"></i>My Orders
                                    </Link></li>
                                    <li><Link className="dropdown-item" to="/addresses">
                                        <i className="bi bi-geo-alt me-2"></i>Addresses
                                    </Link></li>
                                    <li><Link className="dropdown-item" to="/wishlist">
                                        <i className="bi bi-heart me-2"></i>Wishlist
                                    </Link></li>
                                    <li><Link className="dropdown-item" to="/my-repairs">
                                        <i className="bi bi-tools me-2"></i>Repair Requests
                                    </Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={logout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                                    </button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link className="btn btn-success btn-sm rounded-pill px-4" to="/login"
                                  style={{ backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' }}>
                                Login / Sign Up
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
