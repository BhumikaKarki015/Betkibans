import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ChangePassword = () => {
    useAuth(); // ensures auth context is available
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Password strength checker
    const getStrength = (pwd: string) => {
        if (!pwd) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        const levels = [
            { label: 'Too short', color: '#E53935' },
            { label: 'Weak', color: '#E53935' },
            { label: 'Fair', color: '#FB8C00' },
            { label: 'Good', color: '#FDD835' },
            { label: 'Strong', color: '#2D6A4F' },
        ];
        return { score, ...levels[score] };
    };

    const strength = getStrength(formData.newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (formData.newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        if (formData.currentPassword === formData.newPassword) {
            setError('New password must be different from current password.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/User/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            setSuccess(true);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', border: 'none', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };

    if (success) return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 480 }}>
                <div className="p-5 text-center" style={cardStyle}>
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                         style={{ width: 72, height: 72, backgroundColor: '#E8F5E9' }}>
                        <i className="bi bi-check-circle-fill" style={{ fontSize: 36, color: '#2D6A4F' }}></i>
                    </div>
                    <h5 className="fw-bold mb-2">Password Changed!</h5>
                    <p className="text-muted mb-4" style={{ fontSize: 14 }}>
                        Your password has been updated successfully. Please use your new password next time you log in.
                    </p>
                    <button className="btn fw-semibold text-white px-4"
                            onClick={() => navigate('/profile')}
                            style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                        <i className="bi bi-arrow-left me-2"></i>Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 480 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/profile" className="text-decoration-none text-muted">My Account</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>Change Password</span>
                </nav>

                <div className="p-4" style={cardStyle}>
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                             style={{ width: 44, height: 44, backgroundColor: '#E8F5E9', flexShrink: 0 }}>
                            <i className="bi bi-lock-fill" style={{ color: '#2D6A4F', fontSize: 18 }}></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0">Change Password</h5>
                            <small className="text-muted">Keep your account secure</small>
                        </div>
                    </div>

                    {error && (
                        <div className="alert d-flex align-items-center gap-2 mb-4 py-2"
                             style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, fontSize: 13 }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#C62828' }}></i>
                            <span style={{ color: '#C62828' }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Current Password */}
                        <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>Current Password *</label>
                            <div className="input-group">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    className="form-control"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    placeholder="Enter your current password"
                                    required
                                    style={inputStyle}
                                />
                                <button type="button" className="input-group-text"
                                        onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                                        style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', cursor: 'pointer' }}>
                                    <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="mb-2">
                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>New Password *</label>
                            <div className="input-group">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    className="form-control"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter a new password"
                                    required
                                    style={inputStyle}
                                />
                                <button type="button" className="input-group-text"
                                        onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                        style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', cursor: 'pointer' }}>
                                    <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
                                </button>
                            </div>
                        </div>

                        {/* Password strength bar */}
                        {formData.newPassword && (
                            <div className="mb-3">
                                <div className="d-flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex-grow-1 rounded-pill"
                                             style={{
                                                 height: 4,
                                                 backgroundColor: i <= strength.score ? strength.color : '#E0E0E0',
                                                 transition: 'background-color 0.3s',
                                             }} />
                                    ))}
                                </div>
                                <small style={{ color: strength.color, fontSize: 12 }}>
                                    {strength.label}
                                    {strength.score < 4 && (
                                        <span className="text-muted"> — use uppercase, numbers & symbols for a stronger password</span>
                                    )}
                                </small>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className="mb-4">
                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>Confirm New Password *</label>
                            <div className="input-group">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    className="form-control"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repeat your new password"
                                    required
                                    style={{
                                        ...inputStyle,
                                        borderColor: formData.confirmPassword
                                            ? formData.confirmPassword === formData.newPassword ? '#2D6A4F' : '#E53935'
                                            : '#DDD9D2',
                                    }}
                                />
                                <button type="button" className="input-group-text"
                                        onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                        style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', cursor: 'pointer' }}>
                                    <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
                                </button>
                            </div>
                            {formData.confirmPassword && formData.confirmPassword !== formData.newPassword && (
                                <small style={{ color: '#E53935', fontSize: 12 }}>
                                    <i className="bi bi-x-circle me-1"></i>Passwords do not match
                                </small>
                            )}
                            {formData.confirmPassword && formData.confirmPassword === formData.newPassword && (
                                <small style={{ color: '#2D6A4F', fontSize: 12 }}>
                                    <i className="bi bi-check-circle me-1"></i>Passwords match
                                </small>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="rounded-3 p-3 mb-4" style={{ backgroundColor: '#F5F2EC', fontSize: 13 }}>
                            <p className="fw-medium mb-2" style={{ fontSize: 13 }}>Password tips:</p>
                            <ul className="text-muted mb-0 ps-3" style={{ fontSize: 12 }}>
                                <li>At least 8 characters long</li>
                                <li>Mix of uppercase and lowercase letters</li>
                                <li>Include numbers and special characters</li>
                                <li>Avoid using your name or email</li>
                            </ul>
                        </div>

                        <div className="d-flex gap-3">
                            <button type="button" className="btn fw-medium px-4"
                                    onClick={() => navigate('/profile')}
                                    style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn fw-semibold flex-grow-1 text-white py-2"
                                    disabled={loading}
                                    style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                {loading
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                    : <><i className="bi bi-lock-fill me-2"></i>Update Password</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
