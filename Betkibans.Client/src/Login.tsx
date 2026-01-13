import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const brandGreen = '#2E4F3E'; 
    const beigeBg = '#FAF8F5';   

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const response = await axios.post('http://localhost:5192/api/auth/login', {
                email: email,
                password: password
            });

            localStorage.setItem('token', response.data.token);
            setMessage("Login Successful! Redirecting...");
            

        } catch (err: any) {
            setIsError(true);
            if (err.response) {
                setMessage("Invalid Email or Password.");
            } else {
                setMessage("Server is not running. Check Backend.");
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
                </div>

                {/* The Illustration Image */}
                <div className="mb-5 ps-lg-5">
                    <img
                        src="/login-illustration.png"
                        alt="Bamboo Furniture Shopping"
                        style={{ maxWidth: '90%', height: 'auto'}}
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

                        {/* 2. Updated Sign Up Link to use navigate() */}
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
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="d-flex align-items-center mb-4">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted small">OR</span>
                            <hr className="flex-grow-1" />
                        </div>

                        <button type="button" className="btn btn-outline-secondary w-100 p-2 mb-2 d-flex align-items-center justify-content-center gap-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" />
                            Continue with Google
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;