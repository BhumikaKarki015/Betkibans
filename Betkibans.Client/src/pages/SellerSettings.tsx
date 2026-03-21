import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const SellerSettings = () => {
    const { user, isLoading, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'store' | 'security'>('account');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Notification preferences (local state)
    const [notifications, setNotifications] = useState({
        newOrder: true,
        orderStatusChange: true,
        newReview: true,
        newRepairRequest: true,
        lowStock: true,
        promotions: false,
    });

    // Store visibility
    const [storeVisible, setStoreVisible] = useState(true);

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'Seller') { navigate('/login'); return; }
        api.get('/Seller/profile')
            .then(res => setProfile(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user, isLoading]);

    const handleSaveNotifications = () => {
        // Save to localStorage for persistence
        localStorage.setItem('sellerNotifications', JSON.stringify(notifications));
        showToast('Notification preferences saved!', 'success');
    };

    // Load saved preferences
    useEffect(() => {
        const saved = localStorage.getItem('sellerNotifications');
        if (saved) setNotifications(JSON.parse(saved));
    }, []);

    const green = '#2D6A4F';
    const cardStyle = { backgroundColor: '#FDFAF5', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none' };

    const tabs = [
        { key: 'account', label: 'Account', icon: 'bi-person' },
        { key: 'notifications', label: 'Notifications', icon: 'bi-bell' },
        { key: 'store', label: 'Store', icon: 'bi-shop' },
        { key: 'security', label: 'Security', icon: 'bi-shield-lock' },
    ] as const;

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: green }} />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 800 }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Settings</h4>
                        <small className="text-muted">Manage your account and store preferences</small>
                    </div>
                    <button className="btn btn-sm fw-medium"
                            onClick={() => navigate('/seller/dashboard')}
                            style={{ border: '1px solid #CCC', borderRadius: 8, color: '#555', backgroundColor: 'white' }}>
                        <i className="bi bi-arrow-left me-1"></i>Dashboard
                    </button>
                </div>

                <div className="row g-3">
                    {/* Sidebar Tabs */}
                    <div className="col-md-3">
                        <div className="rounded-3 p-2" style={cardStyle}>
                            {tabs.map(tab => (
                                <button key={tab.key}
                                        className="btn w-100 text-start d-flex align-items-center gap-2 mb-1 fw-medium"
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            borderRadius: 8, fontSize: 13, padding: '10px 12px',
                                            backgroundColor: activeTab === tab.key ? '#E8F5E9' : 'transparent',
                                            color: activeTab === tab.key ? green : '#555',
                                            border: 'none',
                                        }}>
                                    <i className={`bi ${tab.icon}`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-md-9">

                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div className="rounded-3 p-4" style={cardStyle}>
                                <h6 className="fw-bold mb-4">Account Information</h6>
                                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3"
                                     style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                         style={{ width: 52, height: 52, backgroundColor: green, fontSize: 20 }}>
                                        {profile?.ownerName?.[0] || user?.email?.[0]?.toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                        <p className="fw-bold mb-0">{profile?.ownerName || 'Seller'}</p>
                                        <small className="text-muted">{profile?.ownerEmail}</small>
                                        {profile?.isVerified && (
                                            <div>
                                                <span className="badge mt-1"
                                                      style={{ backgroundColor: '#D4EDDA', color: green, fontSize: 10 }}>
                                                    <i className="bi bi-patch-check-fill me-1"></i>Verified Seller
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    {[
                                        { label: 'Business Name', value: profile?.businessName || '—' },
                                        { label: 'City', value: profile?.city || '—' },
                                        { label: 'Phone', value: profile?.phoneNumber || '—' },
                                        { label: 'Website', value: profile?.website || '—' },
                                        { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'long' }) : '—' },
                                    ].map(f => (
                                        <div key={f.label} className="d-flex justify-content-between py-2"
                                             style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                            <small className="text-muted fw-medium">{f.label}</small>
                                            <small className="fw-semibold">{f.value}</small>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <Link to="/seller/profile"
                                          className="btn fw-semibold text-white px-4"
                                          style={{ backgroundColor: green, border: 'none', borderRadius: 8, fontSize: 13 }}>
                                        <i className="bi bi-pencil me-2"></i>Edit Business Profile
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="rounded-3 p-4" style={cardStyle}>
                                <h6 className="fw-bold mb-4">Notification Preferences</h6>
                                <div className="d-flex flex-column gap-1">
                                    {[
                                        { key: 'newOrder', label: 'New Order Received', desc: 'Get notified when a customer places an order' },
                                        { key: 'orderStatusChange', label: 'Order Status Changes', desc: 'Updates when order status is modified' },
                                        { key: 'newReview', label: 'New Product Review', desc: 'When a customer reviews your product' },
                                        { key: 'newRepairRequest', label: 'Repair Requests', desc: 'New repair requests from customers' },
                                        { key: 'lowStock', label: 'Low Stock Alert', desc: 'When product stock falls below 5 units' },
                                        { key: 'promotions', label: 'Platform Promotions', desc: 'Updates about Betkibans promotions and events' },
                                    ].map(n => (
                                        <div key={n.key} className="d-flex justify-content-between align-items-center py-3"
                                             style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                            <div>
                                                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{n.label}</p>
                                                <small className="text-muted">{n.desc}</small>
                                            </div>
                                            <div className="form-check form-switch mb-0 ms-3">
                                                <input className="form-check-input" type="checkbox"
                                                       style={{ width: 40, height: 22, cursor: 'pointer' }}
                                                       checked={(notifications as any)[n.key]}
                                                       onChange={e => setNotifications(prev => ({ ...prev, [n.key]: e.target.checked }))} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <button className="btn fw-semibold text-white px-4"
                                            style={{ backgroundColor: green, border: 'none', borderRadius: 8, fontSize: 13 }}
                                            onClick={handleSaveNotifications}>
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Store Tab */}
                        {activeTab === 'store' && (
                            <div className="rounded-3 p-4" style={cardStyle}>
                                <h6 className="fw-bold mb-4">Store Settings</h6>

                                <div className="d-flex justify-content-between align-items-center py-3"
                                     style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                    <div>
                                        <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Store Visibility</p>
                                        <small className="text-muted">Show your store on public listings</small>
                                    </div>
                                    <div className="form-check form-switch mb-0">
                                        <input className="form-check-input" type="checkbox"
                                               style={{ width: 40, height: 22, cursor: 'pointer' }}
                                               checked={storeVisible}
                                               onChange={e => {
                                                   setStoreVisible(e.target.checked);
                                                   showToast(e.target.checked ? 'Store is now visible' : 'Store is now hidden', 'info');
                                               }} />
                                    </div>
                                </div>

                                <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#E8F5E9' }}>
                                    <h6 className="fw-semibold mb-3" style={{ fontSize: 13, color: green }}>
                                        <i className="bi bi-info-circle me-2"></i>Store Stats
                                    </h6>
                                    <div className="row g-2">
                                        {[
                                            { label: 'Seller ID', value: `SEL-${profile?.sellerId || '—'}` },
                                            { label: 'Verified', value: profile?.isVerified ? 'Yes ✓' : 'Pending' },
                                            { label: 'KYC Status', value: profile?.kycDocumentPath ? 'Submitted' : 'Not Submitted' },
                                            { label: 'Location', value: `${profile?.city || '—'}, Nepal` },
                                        ].map(s => (
                                            <div key={s.label} className="col-6">
                                                <small className="text-muted d-block">{s.label}</small>
                                                <small className="fw-semibold">{s.value}</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2 flex-wrap">
                                    <Link to="/seller/profile"
                                          className="btn fw-medium text-white px-4"
                                          style={{ backgroundColor: green, border: 'none', borderRadius: 8, fontSize: 13 }}>
                                        <i className="bi bi-shop me-2"></i>Edit Store Profile
                                    </Link>
                                    {!profile?.kycDocumentPath && (
                                        <Link to="/seller/upload-kyc"
                                              className="btn fw-medium px-4"
                                              style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, fontSize: 13, backgroundColor: 'transparent' }}>
                                            <i className="bi bi-file-earmark-check me-2"></i>Upload KYC
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="rounded-3 p-4" style={cardStyle}>
                                <h6 className="fw-bold mb-4">Security Settings</h6>

                                <div className="d-flex flex-column gap-3">
                                    <div className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                                         style={{ backgroundColor: '#F5F2EC', border: '1px solid #E5E1D8' }}>
                                        <div>
                                            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Password</p>
                                            <small className="text-muted">Change your account password</small>
                                        </div>
                                        <Link to="/change-password"
                                              className="btn btn-sm fw-medium"
                                              style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, fontSize: 12, backgroundColor: 'transparent' }}>
                                            Change Password
                                        </Link>
                                    </div>

                                    <div className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                                         style={{ backgroundColor: '#F5F2EC', border: '1px solid #E5E1D8' }}>
                                        <div>
                                            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Active Sessions</p>
                                            <small className="text-muted">You are currently logged in</small>
                                        </div>
                                        <span className="badge" style={{ backgroundColor: '#D4EDDA', color: green, fontSize: 11 }}>
                                            <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }}></i>Active
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                                         style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
                                        <div>
                                            <p className="fw-semibold mb-0" style={{ fontSize: 14, color: '#C62828' }}>Sign Out</p>
                                            <small className="text-muted">Sign out from your account</small>
                                        </div>
                                        <button className="btn btn-sm fw-medium"
                                                onClick={logout}
                                                style={{ border: '1px solid #C62828', color: '#C62828', borderRadius: 8, fontSize: 12, backgroundColor: 'transparent' }}>
                                            <i className="bi bi-box-arrow-right me-1"></i>Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerSettings;
