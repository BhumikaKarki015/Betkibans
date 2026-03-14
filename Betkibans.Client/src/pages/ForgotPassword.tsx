import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const brandGreen = '#2E4F3E';
    const beigeBg = '#FAF8F5';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            await axios.post('http://localhost:5192/api/Auth/forgot-password', { email });
            setSent(true);
        } catch (err: any) {
            setIsError(true);
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
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
                    <div style={{ fontSize: 64 }}>📧</div>
                    <h5 className="fw-bold mt-3" style={{ color: brandGreen }}>Check Your Email</h5>
                    <p className="text-muted small">We'll send a reset link to your inbox.</p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white">
                <div style={{ width: 450, padding: '2rem' }}>
                    {sent ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: 80 }}>📬</div>
                            <h3 className="fw-bold mt-3 mb-2">Email Sent!</h3>
                            <p className="text-muted mb-1">A password reset link has been sent to:</p>
                            <p className="fw-semibold mb-4" style={{ color: brandGreen }}>{email}</p>
                            <p className="text-muted small mb-4">
                                Check your inbox and click the link to reset your password.
                                The link expires in 24 hours.
                            </p>
                            <button
                                className="btn w-100 p-3 text-white fw-bold mb-3"
                                style={{ backgroundColor: brandGreen }}
                                onClick={() => navigate('/login')}
                            >
                                Back to Login
                            </button>
                            <button
                                className="btn btn-outline-secondary w-100 p-2 small"
                                onClick={() => { setSent(false); setEmail(''); }}
                            >
                                Try a different email
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-5">
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                                <h2 className="fw-bold mb-2">Forgot Password?</h2>
                                <p className="text-muted small">
                                    Enter your registered email and we'll send you a reset link.
                                </p>
                            </div>

                            {message && (
                                <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} text-center`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label fw-bold small">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control p-3"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn w-100 p-3 text-white fw-bold mb-4"
                                    style={{ backgroundColor: brandGreen }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Sending reset link...</>
                                    ) : 'Send Reset Link'}
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

export default ForgotPassword;
