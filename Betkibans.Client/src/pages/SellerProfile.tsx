import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface SellerProfile {
    sellerId: number;
    businessName: string;
    businessDescription: string;
    businessAddress: string;
    city: string;
    district: string;
    phoneNumber: string;
    website: string;
    businessHours: string;
    logoUrl: string;
    facebookUrl: string;
    instagramUrl: string;
    isVerified: boolean;
    kycDocumentPath: string;
    createdAt: string;
    verifiedAt: string;
    rejectionReason: string;
    ownerName: string;
    ownerEmail: string;
}

const SellerProfile = () => {
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoDeleting, setLogoDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        city: '',
        district: '',
        phoneNumber: '',
        website: '',
        businessHours: '',
        facebookUrl: '',
        instagramUrl: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Seller/profile');
            setProfile(res.data);
            setForm({
                businessName:        res.data.businessName       || '',
                businessDescription: res.data.businessDescription || '',
                businessAddress:     res.data.businessAddress     || '',
                city:                res.data.city                || '',
                district:            res.data.district            || '',
                phoneNumber:         res.data.phoneNumber         || '',
                website:             res.data.website             || '',
                businessHours:       res.data.businessHours       || '',
                facebookUrl:         res.data.facebookUrl         || '',
                instagramUrl:        res.data.instagramUrl        || '',
            });
        } catch {
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.put('/Seller/profile', form);
            setSuccess('Profile updated successfully!');
            setEditMode(false);
            fetchProfile();
        } catch {
            setError('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogoUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await api.post('/Seller/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Logo updated!');
            setProfile(prev => prev ? { ...prev, logoUrl: res.data.logoUrl } : prev);
        } catch {
            setError('Failed to upload logo. Max 5MB, JPEG/PNG/WebP only.');
        } finally {
            setLogoUploading(false);
        }
    };

    const handleLogoDelete = async () => {
        if (!window.confirm('Remove your store logo?')) return;
        setLogoDeleting(true);
        setError('');
        try {
            await api.delete('/Seller/delete-logo');
            setSuccess('Logo removed.');
            setProfile(prev => prev ? { ...prev, logoUrl: '' } : prev);
        } catch {
            setError('Failed to delete logo.');
        } finally {
            setLogoDeleting(false);
        }
    };

    const nepalDistricts = [
        'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Butwal',
        'Biratnagar', 'Birgunj', 'Dharan', 'Hetauda', 'Dhangadhi', 'Nepalgunj',
    ];

    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        border: 'none',
    };

    const sectionHeadStyle = {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
        color: '#2D6A4F',
        borderBottom: '2px solid #E8F5E9',
        paddingBottom: 8,
        marginBottom: 20,
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border text-success" role="status" />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F5F0', minHeight: '100vh', paddingTop: 32, paddingBottom: 48 }}>
            <div className="container" style={{ maxWidth: 900 }}>

                {/* Breadcrumb */}
                <nav className="mb-3">
                    <ol className="breadcrumb small mb-0">
                        <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-success">Home</Link></li>
                        <li className="breadcrumb-item"><Link to="/seller/dashboard" className="text-decoration-none text-success">Dashboard</Link></li>
                        <li className="breadcrumb-item active">Business Profile</li>
                    </ol>
                </nav>

                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Business Profile</h4>
                        <small className="text-muted">Manage your store information</small>
                    </div>
                    {!editMode ? (
                        <button className="btn fw-semibold px-4"
                                onClick={() => setEditMode(true)}
                                style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-pencil me-2"></i>Edit Profile
                        </button>
                    ) : (
                        <div className="d-flex gap-2">
                            <button className="btn fw-medium px-4"
                                    onClick={() => { setEditMode(false); setError(''); setSuccess(''); }}
                                    style={{ border: '1px solid #CCC', color: '#555', borderRadius: 8 }}>
                                Cancel
                            </button>
                            <button className="btn fw-semibold px-4"
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8 }}>
                                {saving
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                    : <><i className="bi bi-check2 me-2"></i>Save Changes</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14, borderRadius: 10 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}
                {success && (
                    <div className="alert alert-success d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14, borderRadius: 10 }}>
                        <i className="bi bi-check-circle-fill"></i>{success}
                    </div>
                )}

                {/* Verification Status Banner */}
                {profile && (
                    <div className="mb-4 p-3 rounded-3 d-flex align-items-center gap-3"
                         style={{
                             backgroundColor: profile.isVerified ? '#E8F5E9' : profile.rejectionReason ? '#FFEBEE' : '#FFF8E1',
                             border: `1px solid ${profile.isVerified ? '#A5D6A7' : profile.rejectionReason ? '#FFCDD2' : '#FFE082'}`,
                         }}>
                        <i className={`bi ${profile.isVerified ? 'bi-patch-check-fill' : profile.rejectionReason ? 'bi-x-circle-fill' : 'bi-hourglass-split'} fs-4`}
                           style={{ color: profile.isVerified ? '#2E7D32' : profile.rejectionReason ? '#C62828' : '#F57F17' }}></i>
                        <div className="flex-grow-1">
                            <p className="mb-0 fw-semibold" style={{ fontSize: 14, color: profile.isVerified ? '#2E7D32' : profile.rejectionReason ? '#C62828' : '#F57F17' }}>
                                {profile.isVerified
                                    ? '✅ Verified Seller'
                                    : profile.rejectionReason
                                        ? '❌ Verification Rejected'
                                        : profile.kycDocumentPath
                                            ? '⏳ Verification Pending Review'
                                            : '⚠️ KYC Documents Not Submitted'}
                            </p>
                            <small className="text-muted">
                                {profile.isVerified && profile.verifiedAt
                                    ? `Verified on ${new Date(profile.verifiedAt).toLocaleDateString()}`
                                    : profile.rejectionReason
                                        ? `Reason: ${profile.rejectionReason}`
                                        : profile.kycDocumentPath
                                            ? 'Your documents are under review by our team.'
                                            : 'Upload KYC documents to get verified and start selling.'}
                            </small>
                        </div>
                        {!profile.isVerified && !profile.kycDocumentPath && (
                            <Link to="/seller/upload-kyc"
                                  className="btn btn-sm fw-semibold"
                                  style={{ backgroundColor: '#F57F17', color: 'white', border: 'none', borderRadius: 8, whiteSpace: 'nowrap' }}>
                                Upload KYC
                            </Link>
                        )}
                    </div>
                )}

                <div className="row g-4">

                    {/* LEFT COLUMN */}
                    <div className="col-lg-4">

                        {/* Logo Card */}
                        <div className="p-4 mb-4 text-center" style={cardStyle}>
                            <div style={sectionHeadStyle}>Store Logo</div>

                            <div className="position-relative d-inline-block mb-3">
                                {profile?.logoUrl ? (
                                    <img
                                        src={`http://localhost:5192${profile.logoUrl}`}
                                        alt="Business Logo"
                                        className="rounded-circle"
                                        style={{ width: 110, height: 110, objectFit: 'cover', border: '3px solid #E8F5E9' }}
                                    />
                                ) : (
                                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                                         style={{ width: 110, height: 110, backgroundColor: '#E8F5E9', border: '3px solid #C8E6C9' }}>
                                        <i className="bi bi-shop" style={{ fontSize: 40, color: '#2D6A4F' }}></i>
                                    </div>
                                )}
                                <button
                                    className="position-absolute bottom-0 end-0 btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={logoUploading}
                                    style={{ width: 32, height: 32, backgroundColor: '#2D6A4F', border: '2px solid white', padding: 0 }}>
                                    {logoUploading
                                        ? <span className="spinner-border spinner-border-sm text-white" style={{ width: 14, height: 14 }}></span>
                                        : <i className="bi bi-camera-fill text-white" style={{ fontSize: 13 }}></i>}
                                </button>
                            </div>

                            <input ref={logoInputRef} type="file" accept="image/*" className="d-none" onChange={handleLogoChange} />
                            <p className="text-muted mb-2" style={{ fontSize: 12 }}>Click camera to upload<br />JPEG, PNG, WebP · Max 5MB</p>

                            {profile?.logoUrl && (
                                <button
                                    className="btn btn-sm fw-medium"
                                    onClick={handleLogoDelete}
                                    disabled={logoDeleting}
                                    style={{ borderColor: '#C62828', color: '#C62828', borderRadius: 8, fontSize: 12 }}>
                                    {logoDeleting
                                        ? <><span className="spinner-border spinner-border-sm me-1"></span>Removing...</>
                                        : <><i className="bi bi-trash me-1"></i>Remove Logo</>}
                                </button>
                            )}
                        </div>

                        {/* Store Info Summary Card */}
                        <div className="p-4" style={cardStyle}>
                            <div style={sectionHeadStyle}>Quick Info</div>
                            <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="bi bi-person" style={{ color: '#2D6A4F', width: 16 }}></i>
                                    <span>{profile?.ownerName || '—'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="bi bi-envelope" style={{ color: '#2D6A4F', width: 16 }}></i>
                                    <span className="text-truncate">{profile?.ownerEmail || '—'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="bi bi-telephone" style={{ color: '#2D6A4F', width: 16 }}></i>
                                    <span>{profile?.phoneNumber || 'Not set'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="bi bi-geo-alt" style={{ color: '#2D6A4F', width: 16 }}></i>
                                    <span>{profile?.city ? `${profile.city}, ${profile.district}` : 'Not set'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="bi bi-calendar3" style={{ color: '#2D6A4F', width: 16 }}></i>
                                    <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
                                </div>
                                {profile?.website && (
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-globe" style={{ color: '#2D6A4F', width: 16 }}></i>
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                           className="text-decoration-none text-truncate" style={{ color: '#2D6A4F', fontSize: 13 }}>
                                            {profile.website}
                                        </a>
                                    </div>
                                )}
                                {/* Social Links */}
                                <div className="d-flex gap-2 mt-1">
                                    {profile?.facebookUrl && (
                                        <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer"
                                           className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                           style={{ width: 32, height: 32, backgroundColor: '#E3F2FD', color: '#1565C0' }}>
                                            <i className="bi bi-facebook" style={{ fontSize: 14 }}></i>
                                        </a>
                                    )}
                                    {profile?.instagramUrl && (
                                        <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                                           className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                           style={{ width: 32, height: 32, backgroundColor: '#FCE4EC', color: '#AD1457' }}>
                                            <i className="bi bi-instagram" style={{ fontSize: 14 }}></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-lg-8">

                        {/* Business Information */}
                        <div className="p-4 mb-4" style={cardStyle}>
                            <div style={sectionHeadStyle}>
                                <i className="bi bi-shop me-2"></i>Business Information
                            </div>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fw-medium small">Business Name *</label>
                                    {editMode ? (
                                        <input type="text" name="businessName" className="form-control"
                                               value={form.businessName} onChange={handleChange} />
                                    ) : (
                                        <p className="mb-0 fw-semibold">{profile?.businessName || '—'}</p>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-medium small">Business Description</label>
                                    {editMode ? (
                                        <textarea name="businessDescription" className="form-control" rows={3}
                                                  placeholder="Describe your business, products, and what makes you unique..."
                                                  value={form.businessDescription} onChange={handleChange} />
                                    ) : (
                                        <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                                            {profile?.businessDescription || 'No description added yet.'}
                                        </p>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-medium small">Business Address</label>
                                    {editMode ? (
                                        <input type="text" name="businessAddress" className="form-control"
                                               placeholder="Street address, tole, ward..."
                                               value={form.businessAddress} onChange={handleChange} />
                                    ) : (
                                        <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                                            {profile?.businessAddress || '—'}
                                        </p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">City</label>
                                    {editMode ? (
                                        <input type="text" name="city" className="form-control"
                                               value={form.city} onChange={handleChange} />
                                    ) : (
                                        <p className="mb-0 text-muted" style={{ fontSize: 14 }}>{profile?.city || '—'}</p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">District</label>
                                    {editMode ? (
                                        <select name="district" className="form-select" value={form.district} onChange={handleChange}>
                                            <option value="">Select District</option>
                                            {nepalDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <p className="mb-0 text-muted" style={{ fontSize: 14 }}>{profile?.district || '—'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact & Hours */}
                        <div className="p-4 mb-4" style={cardStyle}>
                            <div style={sectionHeadStyle}>
                                <i className="bi bi-telephone me-2"></i>Contact & Business Hours
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">Phone Number</label>
                                    {editMode ? (
                                        <div className="input-group">
                                            <span className="input-group-text text-muted small">+977</span>
                                            <input type="tel" name="phoneNumber" className="form-control"
                                                   placeholder="98XXXXXXXX"
                                                   value={form.phoneNumber} onChange={handleChange} />
                                        </div>
                                    ) : (
                                        <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                                            {profile?.phoneNumber ? `+977 ${profile.phoneNumber}` : '—'}
                                        </p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">Website</label>
                                    {editMode ? (
                                        <input type="url" name="website" className="form-control"
                                               placeholder="https://yourstore.com"
                                               value={form.website} onChange={handleChange} />
                                    ) : (
                                        profile?.website
                                            ? <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                                 className="text-decoration-none" style={{ color: '#2D6A4F', fontSize: 14 }}>
                                                {profile.website}
                                            </a>
                                            : <p className="mb-0 text-muted" style={{ fontSize: 14 }}>—</p>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-medium small">Business Hours</label>
                                    {editMode ? (
                                        <input type="text" name="businessHours" className="form-control"
                                               placeholder="e.g. 9:00 AM – 6:00 PM, Sunday–Friday"
                                               value={form.businessHours} onChange={handleChange} />
                                    ) : (
                                        <p className="mb-0 text-muted d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                                            {profile?.businessHours
                                                ? <><i className="bi bi-clock" style={{ color: '#2D6A4F' }}></i>{profile.businessHours}</>
                                                : '—'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="p-4" style={cardStyle}>
                            <div style={sectionHeadStyle}>
                                <i className="bi bi-share me-2"></i>Social Media
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">
                                        <i className="bi bi-facebook me-1" style={{ color: '#1565C0' }}></i>Facebook
                                    </label>
                                    {editMode ? (
                                        <input type="url" name="facebookUrl" className="form-control"
                                               placeholder="https://facebook.com/yourpage"
                                               value={form.facebookUrl} onChange={handleChange} />
                                    ) : (
                                        profile?.facebookUrl
                                            ? <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer"
                                                 className="text-decoration-none d-flex align-items-center gap-1"
                                                 style={{ color: '#1565C0', fontSize: 14 }}>
                                                <i className="bi bi-box-arrow-up-right" style={{ fontSize: 11 }}></i>
                                                {profile.facebookUrl.replace('https://', '').replace('http://', '')}
                                            </a>
                                            : <p className="mb-0 text-muted" style={{ fontSize: 14 }}>Not set</p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-medium small">
                                        <i className="bi bi-instagram me-1" style={{ color: '#AD1457' }}></i>Instagram
                                    </label>
                                    {editMode ? (
                                        <input type="url" name="instagramUrl" className="form-control"
                                               placeholder="https://instagram.com/yourhandle"
                                               value={form.instagramUrl} onChange={handleChange} />
                                    ) : (
                                        profile?.instagramUrl
                                            ? <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                                                 className="text-decoration-none d-flex align-items-center gap-1"
                                                 style={{ color: '#AD1457', fontSize: 14 }}>
                                                <i className="bi bi-box-arrow-up-right" style={{ fontSize: 11 }}></i>
                                                {profile.instagramUrl.replace('https://', '').replace('http://', '')}
                                            </a>
                                            : <p className="mb-0 text-muted" style={{ fontSize: 14 }}>Not set</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Save button at bottom for convenience */}
                {editMode && (
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button className="btn fw-medium px-4"
                                onClick={() => { setEditMode(false); setError(''); setSuccess(''); }}
                                style={{ border: '1px solid #CCC', color: '#555', borderRadius: 8 }}>
                            Cancel
                        </button>
                        <button className="btn fw-semibold px-5"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8 }}>
                            {saving
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                : <><i className="bi bi-check2 me-2"></i>Save Changes</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerProfile;
