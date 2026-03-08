import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const brandGreen = '#2E4F3E';
    const beigeBg = '#FAF8F5';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            // FIX 1: Use the correct HTTP port from your terminal (5192)
            const response = await axios.post('http://localhost:5192/api/Auth/login', {
                email: email,
                password: password
            });

            const { token } = response.data;

            // Decode JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            // Try to get name from standard claim or custom FullName claim
            const userName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['FullName'] || email;

            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);

            // FIX 2: Map to the exact shape your AuthContext expects
            // Your AuthContext User interface has: id, email, fullName, role
            login(token, {
                id: userId,
                email: email,
                fullName: userName, // Mapped 'userName' to 'fullName'
                role: role
            });

            setMessage(`Login Successful! Redirecting to ${role} dashboard...`);

            setTimeout(() => {
                if (role === 'Seller') {
                    navigate('/seller/dashboard');
                } else if (role === 'Admin') {
                    navigate('/admin/panel');
                } else {
                    navigate('/');
                }
            }, 1500);

        } catch (err: any) {
            setIsError(true);
            console.error("Login Error:", err); // Log the real error to console

            if (err.code === 'ERR_NETWORK') {
                setMessage("Cannot connect to server. Ensure Backend is running on port 5192.");
            } else if (err.response?.status === 401) {
                setMessage("Invalid email or password.");
            } else {
                setMessage(err.response?.data?.message || "Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex p-0">

            {/* Illustration & Info */}
            <div className="d-none d-lg-flex col-lg-6 flex-column justify-content-center align-items-center"
                 style={{ backgroundColor: beigeBg }}>

                {/* Logo Area */}
                <div className="w-75 mb-4">
                    <h2 className="fw-bold" style={{ color: brandGreen, fontFamily: 'serif', letterSpacing: '1px' }}>
                        Betkibans
                    </h2>
                    <p className="text-muted small mb-0">Authentic Bamboo & Cane Furniture</p>
                </div>

                {/* The Illustration Image */}
                <div className="mb-5 ps-lg-5">
                    <img
                        src="/login-illustration.png"
                        alt="Bamboo Furniture Shopping"
                        style={{ maxWidth: '90%', height: 'auto'}}
                        onError={(e) => {
                            // Fallback if image doesn't exist
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>

                {/* Bottom Icons (Track Orders, Repairs, Reviews) */}
                <div className="d-flex justify-content-between w-75 mt-4 pt-3 border-top">
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.5rem' }}>📦</span>
                        <div>
                            <small className="fw-bold d-block text-dark">Track Orders</small>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>View order history</small>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.5rem' }}>🔧</span>
                        <div>
                            <small className="fw-bold d-block text-dark">Request Repairs</small>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Get repair services</small>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.5rem' }}>⭐</span>
                        <div>
                            <small className="fw-bold d-block text-dark">Write Reviews</small>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Share experience</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form */}
            <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white">
                <div style={{ width: '450px', padding: '2rem' }}>

                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-2">Welcome Back!</h2>
                        <p className="text-muted">
                            Don't have an account?{' '}
                            <span
                                style={{ color: brandGreen, fontWeight: 'bold', cursor: 'pointer' }}
                                onClick={() => navigate('/register')}
                            >
                                Sign up
                            </span>
                        </p>
                    </div>

                    {message && (
                        <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} text-center`} role="alert">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label fw-bold small">Email Address</label>
                            <input
                                type="email"
                                className="form-control p-3"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Password</label>
                            <div className="input-group">
                                <input
                                    type="password"
                                    className="form-control p-3 border-end-0"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span className="input-group-text bg-white border-start-0">
                                    👁️
                                </span>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between mb-4">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="rememberMe" />
                                <label className="form-check-label text-muted small" htmlFor="rememberMe">
                                    Remember me
                                </label>
                            </div>
                            <a href="#" className="small fw-bold text-decoration-none text-dark">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn w-100 p-3 text-white fw-bold mb-4"
                            style={{ backgroundColor: brandGreen }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                        <div className="d-flex align-items-center mb-4">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted small">OR</span>
                            <hr className="flex-grow-1" />
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100 p-2 mb-2 d-flex align-items-center justify-content-center gap-2"
                            disabled
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" />
                            Continue with Google (Coming Soon)
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
