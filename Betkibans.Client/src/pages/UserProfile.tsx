import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ProfileData {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
}

interface AccountStats {
    totalOrders: number;
    reviewsWritten: number;
    repairsRequested: number;
    wishlistItems: number;
}

const UserProfile = () => {
    const { showToast } = useToast();
    const { user, login, token, isLoading } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<AccountStats>({ totalOrders: 0, reviewsWritten: 0, repairsRequested: 0, wishlistItems: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({ fullName: '', phoneNumber: '' });

    const [notifPrefs, setNotifPrefs] = useState({
        orderUpdates: true,
        paymentConfirmations: true,
        repairUpdates: true,
        newArrivals: false,
        specialOffers: false,
        newsletter: false,
    });

    useEffect(() => {
        if (isLoading) return;
        if (!user) { navigate('/login'); return; }
        fetchProfile();
        fetchStats();
    }, [user, navigate]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/User/profile');
            setProfile(res.data);
            setFormData({
                fullName: res.data.fullName || '',
                phoneNumber: res.data.phoneNumber || '',
            });
        } catch {
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/Order/my-orders');
            setStats(prev => ({ ...prev, totalOrders: res.data.length }));
        } catch {
            // stats are non-critical, fail silently
        }
    };

    const handleSave = async () => {
        if (!formData.fullName.trim()) { setError('Full name is required'); return; }
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.put('/User/profile', {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
            });
            setProfile(prev => prev ? { ...prev, ...res.data } : res.data);

            if (user && token) {
                login(token, { ...user, fullName: res.data.fullName });
            }
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setError('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    const cardStyle = { backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none', borderRadius: 12 };
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };
    const sectionNumStyle = { width: 28, height: 28, backgroundColor: '#2D6A4F', color: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 as const };

    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-1">
                    <span className="text-muted">Home</span>
                    <span className="text-muted mx-2">›</span>
                    <span className="text-muted">My Account</span>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>My Profile</span>
                </nav>
                <h4 className="fw-bold mb-4">My Profile</h4>

                {successMsg && (
                    <div className="alert d-flex align-items-center gap-2 mb-3" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', fontSize: 14 }}>
                        <i className="bi bi-check-circle-fill"></i>{successMsg}
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}

                {/* ── 1. Profile Information ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-4">
                        <div style={sectionNumStyle}>1</div>
                        <h6 className="fw-bold mb-0">Profile Information</h6>
                    </div>

                    {/* Avatar */}
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                             style={{ width: 64, height: 64, backgroundColor: '#2D6A4F', color: 'white', fontSize: 24, flexShrink: 0 }}>
                            {formData.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="fw-semibold mb-0" style={{ fontSize: 16 }}>{formData.fullName || '—'}</p>
                            <small className="text-muted">{profile?.email}</small>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Full Name *</label>
                            <input type="text" className="form-control" value={formData.fullName}
                                   onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                   style={inputStyle} placeholder="Your full name" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                Email Address
                                <span className="ms-2 badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 10 }}>
                                    <i className="bi bi-check-circle-fill me-1"></i>Verified
                                </span>
                            </label>
                            <input type="email" className="form-control" value={profile?.email || ''}
                                   disabled style={{ ...inputStyle, backgroundColor: '#F0EBE1', color: '#888' }} />
                            <small className="text-muted">Email cannot be changed</small>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Phone Number</label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', fontSize: 13 }}>+977</span>
                                <input type="tel" className="form-control"
                                       value={formData.phoneNumber.replace('+977', '').replace(/^\+977-?/, '')}
                                       onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                       style={inputStyle} placeholder="9841234567" />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button className="btn fw-medium px-4"
                                onClick={() => setFormData({ fullName: profile?.fullName || '', phoneNumber: profile?.phoneNumber || '' })}
                                style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 14 }}>
                            Cancel
                        </button>
                        <button className="btn fw-semibold px-4 text-white"
                                onClick={handleSave} disabled={saving}
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8, fontSize: 14 }}>
                            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* ── 2. Quick Links ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={sectionNumStyle}>2</div>
                        <h6 className="fw-bold mb-0">My Account</h6>
                    </div>
                    <div className="row g-2">
                        {[
                            { icon: 'bi-bag-check', label: 'My Orders', path: '/orders' },
                            { icon: 'bi-geo-alt', label: 'Addresses', path: '/addresses' },
                            { icon: 'bi-star', label: 'My Reviews', path: '/my-reviews' },
                            { icon: 'bi-tools', label: 'Repair Requests', path: '/my-repairs' },
                            { icon: 'bi-heart', label: 'Wishlist', path: '/wishlist' },
                            { icon: 'bi-lock', label: 'Change Password', path: '/change-password' },
                        ].map(item => (
                            <div key={item.label} className="col-6 col-md-4">
                                <button className="btn w-100 d-flex align-items-center gap-2 py-2 px-3"
                                        onClick={() => navigate(item.path)}
                                        style={{ backgroundColor: '#F5F2EC', border: 'none', borderRadius: 8, fontSize: 13, color: '#444', textAlign: 'left' }}>
                                    <i className={`bi ${item.icon}`} style={{ color: '#2D6A4F', fontSize: 16 }}></i>
                                    {item.label}
                                    <i className="bi bi-chevron-right ms-auto" style={{ fontSize: 11, color: '#AAA' }}></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 3. Account Statistics ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={sectionNumStyle}>3</div>
                        <h6 className="fw-bold mb-0">Account Statistics</h6>
                    </div>
                    <div className="row g-3">
                        {[
                            { label: 'Total Orders', value: stats.totalOrders, icon: 'bi-bag-check', color: '#2D6A4F' },
                            { label: 'Reviews Written', value: stats.reviewsWritten, icon: 'bi-star-fill', color: '#E8A000' },
                            { label: 'Repairs Requested', value: stats.repairsRequested, icon: 'bi-tools', color: '#1565C0' },
                            { label: 'Wishlist Items', value: stats.wishlistItems, icon: 'bi-heart-fill', color: '#C62828' },
                        ].map(s => (
                            <div key={s.label} className="col-6 col-md-3">
                                <div className="text-center p-3 rounded-2" style={{ backgroundColor: '#F5F2EC' }}>
                                    <i className={`bi ${s.icon} d-block mb-1`} style={{ color: s.color, fontSize: 22 }}></i>
                                    <div className="fw-bold" style={{ fontSize: 22 }}>{s.value}</div>
                                    <small className="text-muted">{s.label}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 4. Notification Preferences ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={sectionNumStyle}>4</div>
                        <h6 className="fw-bold mb-0">Notification Preferences</h6>
                    </div>
                    <div className="d-flex flex-column gap-2">
                        {[
                            { key: 'orderUpdates', label: 'Order updates (placed, shipped, delivered)' },
                            { key: 'paymentConfirmations', label: 'Payment confirmations' },
                            { key: 'repairUpdates', label: 'Repair request updates' },
                            { key: 'newArrivals', label: 'New product arrivals from favourite sellers' },
                            { key: 'specialOffers', label: 'Special offers and promotions' },
                            { key: 'newsletter', label: 'Newsletter subscription' },
                        ].map(pref => (
                            <div key={pref.key} className="d-flex justify-content-between align-items-center py-2"
                                 style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                <span style={{ fontSize: 14, color: '#444' }}>{pref.label}</span>
                                <div className="form-check form-switch mb-0">
                                    <input className="form-check-input" type="checkbox"
                                           checked={notifPrefs[pref.key as keyof typeof notifPrefs]}
                                           onChange={e => setNotifPrefs(prev => ({ ...prev, [pref.key]: e.target.checked }))} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button className="btn fw-medium text-white px-4"
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8, fontSize: 14 }}>
                            Save Preferences
                        </button>
                    </div>
                </div>

                {/* ── 5. Account Information ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={sectionNumStyle}>5</div>
                        <h6 className="fw-bold mb-0">Account Information</h6>
                    </div>
                    <div className="row g-2" style={{ fontSize: 14 }}>
                        <div className="col-md-6">
                            <small className="text-muted d-block">Member Since</small>
                            <span className="fw-medium">{memberSince}</span>
                        </div>
                        <div className="col-md-6">
                            <small className="text-muted d-block">Account ID</small>
                            <span className="fw-medium" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                USR-{profile?.id?.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Account Actions ── */}
                <div className="p-4 mb-4 rounded-3" style={{ border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5' }}>
                    <h6 className="fw-bold mb-3" style={{ color: '#C62828' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>Account Actions
                    </h6>
                    <div className="d-flex flex-wrap gap-3">
                        <div>
                            <p className="fw-medium mb-0" style={{ fontSize: 14 }}>Download My Data</p>
                            <small className="text-muted">Request a copy of all your personal data</small>
                            <div className="mt-1">
                                <button className="btn btn-sm fw-medium"
                                        style={{ borderColor: '#999', color: '#555', borderRadius: 8, fontSize: 12 }}>
                                    <i className="bi bi-download me-1"></i>Download
                                </button>
                            </div>
                        </div>
                        <div className="ms-md-5">
                            <p className="fw-medium mb-0" style={{ fontSize: 14, color: '#C62828' }}>Delete My Account</p>
                            <small className="text-muted">Permanently delete your account and data</small>
                            <div className="mt-1">
                                <button className="btn btn-sm fw-medium"
                                        onClick={() => { showToast('To delete your account, please contact support@betkibans.com', 'info'); }}
                                        style={{ backgroundColor: '#C62828', color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}>
                                    <i className="bi bi-trash3 me-1"></i>Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfile;
