import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/login`, {
                email, password
            });

            const { token } = response.data;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            const userName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['FullName'] || email;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);

            login(token, { id: userId, email, fullName: userName, role });
            setMessage(`Login Successful! Redirecting to ${role} dashboard...`);

            setTimeout(() => {
                if (role === 'Seller') navigate('/seller/dashboard');
                else if (role === 'Admin') navigate('/admin/panel');
                else navigate('/');
            }, 1500);

        } catch (err: any) {
            setIsError(true);
            console.error('Login Error:', err);
            if (err.code === 'ERR_NETWORK') {
                setMessage('Cannot connect to server. Ensure Backend is running on port 5192.');
            } else if (err.response?.status === 401) {
                setMessage('Invalid email or password.');
            } else {
                setMessage(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/Auth/google-signin`, {
                idToken: credentialResponse.credential
            });
            const { token } = res.data;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            const userName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['FullName'] || '';
            localStorage.setItem('token', token); localStorage.setItem('role', role);
            localStorage.setItem('userId', userId); localStorage.setItem('userName', userName);
            login(token, { id: userId, email: userName, fullName: userName, role });
            navigate('/');
        } catch (err: any) {
            setIsError(true);
            setMessage(err.response?.data?.message || 'Google sign-in failed.');
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex p-0">

            {/* Illustration panel — desktop only */}
            <div className="d-none d-lg-flex col-lg-6 flex-column justify-content-center align-items-center"
                 style={{ backgroundColor: beigeBg }}>
                <div className="w-75 mb-4">
                    <h2 className="fw-bold" style={{ color: brandGreen, fontFamily: 'serif', letterSpacing: '1px' }}>
                        Betkibans
                    </h2>
                    <p className="text-muted small mb-0">Authentic Bamboo & Cane Furniture</p>
                </div>
                <div className="mb-5 ps-lg-5">
                    <img src="/login-illustration.png" alt="Bamboo Furniture Shopping"
                         style={{ maxWidth: '90%', height: 'auto' }}
                         onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="d-flex justify-content-between w-75 mt-4 pt-3 border-top">
                    {[
                        { icon: '📦', title: 'Track Orders', sub: 'View order history' },
                        { icon: '🔧', title: 'Request Repairs', sub: 'Get repair services' },
                        { icon: '⭐', title: 'Write Reviews', sub: 'Share experience' },
                    ].map(f => (
                        <div key={f.title} className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                            <div>
                                <small className="fw-bold d-block text-dark">{f.title}</small>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{f.sub}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Login Form */}
            <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white">
                <div className="auth-form-panel w-100"
                     style={{ maxWidth: 450, padding: 'clamp(1.25rem, 5vw, 2rem)' }}>

                    <div className="text-center mb-4">
                        <div className="d-lg-none mb-3">
                            <img src="/logo.jpeg" alt="Betkibans" style={{ height: 48, objectFit: 'contain' }}
                                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <h2 className="fw-bold mb-2">Welcome Back!</h2>
                        <p className="text-muted small">
                            Don't have an account?{' '}
                            <span style={{ color: brandGreen, fontWeight: 'bold', cursor: 'pointer' }}
                                  onClick={() => navigate('/register')}>
                                Sign up
                            </span>
                        </p>
                    </div>

                    {message && (
                        <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} text-center small`} role="alert">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label fw-bold small">Email Address</label>
                            <input type="email" className="form-control p-3"
                                   placeholder="Enter your email address"
                                   value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Password</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control p-3 border-end-0"
                                    placeholder="Enter your password"
                                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <span className="input-group-text bg-white border-start-0"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => setShowPassword(!showPassword)}>
                                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                </span>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between mb-4 flex-wrap gap-2">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="rememberMe" />
                                <label className="form-check-label text-muted small" htmlFor="rememberMe">Remember me</label>
                            </div>
                            <span className="small fw-bold"
                                  style={{ color: brandGreen, cursor: 'pointer' }}
                                  onClick={() => navigate('/forgot-password')}>
                                Forgot Password?
                            </span>
                        </div>

                        <button type="submit" className="btn w-100 p-3 text-white fw-bold mb-4"
                                style={{ backgroundColor: brandGreen }} disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Logging in...</>
                            ) : 'Login'}
                        </button>

                        <div className="d-flex align-items-center mb-4">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted small">OR</span>
                            <hr className="flex-grow-1" />
                        </div>

                        <div className="d-flex justify-content-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => { setIsError(true); setMessage('Google sign-in failed.'); }}
                                text="continue_with"
                                shape="rectangular"
                                width="400"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
