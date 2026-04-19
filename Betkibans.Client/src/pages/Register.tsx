import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Consumer');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const brandGreen = '#2E4F3E';
    const beigeBg = '#FAF8F5';

    const handleRegister = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                fullName: fullName,
                email: email,
                phoneNumber: phone,
                password: password,
                role: role
            });

            setMessage("✅ Account Created! Redirecting to Login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            setIsError(true);
            setMessage(err.response?.data?.Message || "Registration Failed. Try a stronger password.");
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
            const userName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);
            login(token, { id: userId, email: userName, fullName: userName, role });
            navigate('/');
        } catch {
            setIsError(true);
            setMessage('Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex p-0">

            {/* LEFT SIDE: Illustration */}
            <div className="d-none d-lg-flex col-lg-6 flex-column justify-content-center align-items-center"
                 style={{ backgroundColor: beigeBg }}>
                <div className="w-75 mb-4">
                    <h2 className="fw-bold" style={{ color: brandGreen, fontFamily: 'serif', letterSpacing: '1px' }}>
                        Betkibans
                    </h2>
                </div>
                <div className="mb-4">
                    <img src="/register-illustration.png" alt="Join Betkibans"
                         style={{ maxWidth: '95%', height: 'auto' }} />
                </div>
                <div className="d-flex justify-content-between w-75 mt-3 pt-3 border-top">
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
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                        <div>
                            <small className="fw-bold d-block text-dark">Exclusive Offers</small>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Deals & discounts</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Registration Form */}
            <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white"
                 style={{ overflowY: 'auto', height: '100vh', scrollbarWidth: 'none' }}>

                <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                <div style={{ width: '500px', padding: '1.5rem' }}>

                    <h2 className="fw-bold mb-1">Create Your Account</h2>
                    <p className="text-muted mb-3 small">Sign up now and discover our bamboo & cane furniture collection!</p>

                    {/* Tabs */}
                    <div className="d-flex mb-3 p-1 rounded-3" style={{ backgroundColor: '#EFEFEF' }}>
                        <button className="btn w-50 border-0 rounded-3 text-muted small"
                                onClick={() => navigate('/login')}>
                            Login
                        </button>
                        <button className="btn w-50 border-0 rounded-3 shadow-sm fw-bold small"
                                style={{ backgroundColor: 'white', color: brandGreen }}>
                            Register
                        </button>
                    </div>

                    {message && (
                        <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} text-center p-2 small`} role="alert">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Full Name *</label>
                            <input type="text" className="form-control p-2" placeholder="Your full name" required
                                   value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Email Address *</label>
                            <input type="email" className="form-control p-2" placeholder="email@example.com" required
                                   value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Phone Number *</label>
                            <input type="text" className="form-control p-2" placeholder="+977-98..." required
                                   value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Password *</label>
                            <div className="input-group">
                                <input type={showPassword ? 'text' : 'password'}
                                       className="form-control p-2 border-end-0" placeholder="••••••" required
                                       value={password} onChange={(e) => setPassword(e.target.value)} />
                                <span className="input-group-text bg-white border-start-0"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => setShowPassword(!showPassword)}>
                                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                </span>
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Confirm Password *</label>
                            <div className="input-group">
                                <input type={showConfirmPassword ? 'text' : 'password'}
                                       className="form-control p-2 border-end-0" placeholder="••••••" required
                                       value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                <span className="input-group-text bg-white border-start-0"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <i className={showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                </span>
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small mb-1">Password *</label>
                            <div className="input-group">
                                <input type={showPassword ? 'text' : 'password'}
                                       className="form-control p-2 border-end-0" placeholder="••••••" required
                                       value={password} onChange={(e) => setPassword(e.target.value)} />
                                <span className="input-group-text bg-white border-start-0"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => setShowPassword(!showPassword)}>
                                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                </span>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="mb-3 mt-3">
                            <label className="form-label fw-bold small d-block mb-1">I want to register as:</label>
                            <div className="d-flex gap-3">
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="role" id="buyer"
                                           value="Consumer" checked={role === 'Consumer'} onChange={() => setRole('Consumer')} />
                                    <label className="form-check-label small" htmlFor="buyer">Customer (Buyer)</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="role" id="seller"
                                           value="Seller" checked={role === 'Seller'} onChange={() => setRole('Seller')} />
                                    <label className="form-check-label small" htmlFor="seller">Seller (Artisan)</label>
                                </div>
                            </div>
                        </div>

                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" required id="terms" />
                            <label className="form-check-label small" htmlFor="terms">I agree to the Terms & Conditions</label>
                        </div>

                        <button type="submit" className="btn w-100 p-2 text-white fw-bold mb-3"
                                style={{ backgroundColor: brandGreen }} disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="text-center small">
                            Already have an account?
                            <span className="fw-bold cursor-pointer"
                                  style={{ cursor: 'pointer', color: brandGreen }}
                                  onClick={() => navigate('/login')}>
                                {' '}Login here
                            </span>
                        </div>

                        <div className="d-flex align-items-center my-3">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted small">OR</span>
                            <hr className="flex-grow-1" />
                        </div>
                        <div className="d-flex justify-content-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => { setIsError(true); setMessage('Google sign-in failed.'); }}
                                text="signup_with"
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

export default Register;
