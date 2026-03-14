import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [success, setSuccess] = useState(false);

    const brandGreen = '#2E4F3E';
    const beigeBg = '#FAF8F5';

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const tokenParam = searchParams.get('token');
        if (emailParam) setEmail(emailParam);
        if (tokenParam) setToken(tokenParam);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (newPassword !== confirmPassword) {
            setIsError(true);
            setMessage('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setIsError(true);
            setMessage('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:5192/api/Auth/reset-password', { email, token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setIsError(true);
            setMessage(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex p-0">
            {/* Left panel */}
            <div className="d-none d-lg-flex col-lg-6 flex-column justify-content-center align-items-center"
                 style={{ backgroundColor: beigeBg }}>
                <div className="w-75 mb-4">
                    <h2 className="fw-bold" style={{ color: brandGreen, fontFamily: 'serif', letterSpacing: '1px' }}>Betkibans</h2>
                    <p className="text-muted small mb-0">Authentic Bamboo & Cane Furniture</p>
                </div>
                <img src="/login-illustration.png" alt="Betkibans"
                     style={{ maxWidth: '80%', height: 'auto' }}
                     onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                <div className="mt-5 w-75 text-center">
                    <div style={{ fontSize: 64 }}>🔐</div>
                    <h5 className="fw-bold mt-3" style={{ color: brandGreen }}>Almost There!</h5>
                    <p className="text-muted small">Set your new secure password below.</p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white">
                <div style={{ width: 450, padding: '2rem' }}>
                    {success ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: 80 }}>✅</div>
                            <h3 className="fw-bold mt-3 mb-2">Password Reset!</h3>
                            <p className="text-muted mb-4">Your password has been updated successfully. Redirecting to login...</p>
                            <Link to="/login" className="btn text-white fw-bold px-5 p-3"
                                  style={{ backgroundColor: brandGreen }}>
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-5">
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                                <h2 className="fw-bold mb-2">Set New Password</h2>
                                <p className="text-muted small">Enter your new password below.</p>
                            </div>

                            {message && (
                                <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} text-center`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Email Address</label>
                                    <input type="email" className="form-control p-3 bg-light"
                                           value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small">New Password</label>
                                    <div className="input-group">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-control p-3 border-end-0"
                                            placeholder="At least 6 characters"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="btn btn-outline-secondary border-start-0"
                                                onClick={() => setShowPassword(p => !p)}>
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold small">Confirm New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control p-3"
                                        placeholder="Re-enter your new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn w-100 p-3 text-white fw-bold mb-4"
                                        style={{ backgroundColor: brandGreen }} disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Resetting...</>
                                    ) : 'Reset Password'}
                                </button>

                                <div className="text-center">
                                    <Link to="/login" className="text-decoration-none fw-semibold small"
                                          style={{ color: brandGreen }}>
                                        ← Back to Login
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
