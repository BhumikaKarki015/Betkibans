import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate(); // This was unused before

    const handleLogout = () => {
        logout();
        navigate('/login'); // ✅ Now 'navigate' is used!
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
            <div className="container">
                {/* Brand */}
                <Link className="navbar-brand fw-bold text-success" to="/" style={{ fontFamily: 'serif', fontSize: '1.5rem' }}>
                    Betkibans
                </Link>

                {/* Toggler for Mobile */}
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/products">Shop All</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/categories">Categories</Link>
                        </li>
                    </ul>

                    {/* Right Side Icons */}
                    <div className="d-flex align-items-center gap-3">

                        {/* Search Icon (Optional Feature) */}
                        <button className="btn btn-link text-dark p-0">
                            <i className="bi bi-search" style={{ fontSize: '1.2rem' }}></i>
                        </button>

                        {/* Cart Icon */}
                        <Link to="/cart" className="btn btn-link text-dark p-0 position-relative text-decoration-none">
                            <i className="bi bi-cart" style={{ fontSize: '1.5rem' }}></i>
                            {cartCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Dropdown */}
                        {isAuthenticated ? (
                            <div className="dropdown">
                                <button className="btn btn-outline-success dropdown-toggle btn-sm" type="button" id="userMenu" data-bs-toggle="dropdown">
                                    <i className="bi bi-person-circle me-1"></i>
                                    {user?.fullName?.split(' ')[0] || 'Account'}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    {user?.role === 'Seller' && (
                                        <li><Link className="dropdown-item" to="/seller/dashboard">Seller Dashboard</Link></li>
                                    )}
                                    {user?.role === 'Admin' && (
                                        <li><Link className="dropdown-item" to="/admin/panel">Admin Panel</Link></li>
                                    )}
                                    <li><Link className="dropdown-item" to="/profile">My Profile</Link></li>
                                    <li><hr className="dropdown-divider" /></li>

                                    {/* ✅ Use handleLogout here */}
                                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-success btn-sm px-3">Login</Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;