import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Address {
    addressId: number;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    landmark?: string;
    postalCode?: string;
    isDefault: boolean;
}

const emptyForm = {
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Kathmandu',
    district: 'Kathmandu',
    landmark: '',
    postalCode: '',
    isDefault: false,
};

const nepalDistricts = [
    'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski', 'Rupandehi',
    'Morang', 'Sunsari', 'Jhapa', 'Bara', 'Parsa', 'Makwanpur',
    'Kavrepalanchok', 'Sindhupalchok', 'Nuwakot', 'Rasuwa', 'Dhading',
    'Gorkha', 'Lamjung', 'Tanahu', 'Syangja', 'Parbat', 'Baglung',
    'Myagdi', 'Mustang', 'Manang', 'Nawalpur', 'Palpa', 'Arghakhanchi'
];

const majorCities = [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar',
    'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Itahari', 'Dhangadhi',
    'Nepalgunj', 'Bharatpur', 'Janakpur', 'Baglung'
];

const AddressManagement = () => {
    const { showToast } = useToast();
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user) { navigate('/login'); return; }
        fetchAddresses();
    }, [user, navigate, isLoading]);

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/Address');
            setAddresses(res.data);
        } catch {
            setError('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const openAddForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError('');
    };

    const openEditForm = (addr: Address) => {
        setFormData({
            fullName: addr.fullName,
            phoneNumber: addr.phoneNumber,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || '',
            city: addr.city,
            district: addr.district,
            landmark: addr.landmark || '',
            postalCode: addr.postalCode || '',
            isDefault: addr.isDefault,
        });
        setEditingId(addr.addressId);
        setShowForm(true);
        setError('');
    };

    const handleSave = async () => {
        if (!formData.fullName || !formData.phoneNumber || !formData.addressLine1 || !formData.city || !formData.district) {
            setError('Please fill in all required fields');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/Address/${editingId}`, formData);
            } else {
                await api.post('/Address', formData);
            }
            await fetchAddresses();
            setShowForm(false);
            setEditingId(null);
        } catch {
            setError('Failed to save address. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/Address/${id}`);
            setAddresses(prev => prev.filter(a => a.addressId !== id));
            setConfirmDeleteId(null);
            showToast('Address deleted successfully', 'success');
        } catch {
            showToast('Failed to delete address', 'error');
            setConfirmDeleteId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await api.patch(`/Address/${id}/set-default`);
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.addressId === id })));
        } catch {
            showToast('Failed to set default address', 'error');
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none', borderRadius: 12 };
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Header */}
                <nav style={{ fontSize: 13 }} className="mb-1">
                    <button className="btn btn-link p-0 text-decoration-none text-muted" onClick={() => navigate('/profile')}>My Account</button>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>My Addresses</span>
                </nav>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">My Addresses</h4>
                        <small className="text-muted">Manage your delivery addresses</small>
                    </div>
                    {!showForm && (
                        <button className="btn fw-semibold text-white"
                                onClick={openAddForm}
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8, fontSize: 14 }}>
                            <i className="bi bi-plus-circle me-2"></i>Add New Address
                        </button>
                    )}
                </div>

                {/* ── Add / Edit Form ── */}
                {showForm && (
                    <div className="p-4 mb-4" style={cardStyle}>
                        <h6 className="fw-bold mb-4">
                            {editingId ? '✏️ Edit Address' : '➕ Add New Address'}
                        </h6>

                        {error && (
                            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13 }}>
                                <i className="bi bi-exclamation-triangle-fill"></i>{error}
                            </div>
                        )}

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Full Name *</label>
                                <input type="text" className="form-control" name="fullName"
                                       value={formData.fullName} onChange={handleChange}
                                       style={inputStyle} placeholder="Recipient full name" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Phone Number *</label>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', fontSize: 13 }}>+977</span>
                                    <input type="tel" className="form-control" name="phoneNumber"
                                           value={formData.phoneNumber} onChange={handleChange}
                                           style={inputStyle} placeholder="98XXXXXXXX" />
                                </div>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Address Line 1 *</label>
                                <input type="text" className="form-control" name="addressLine1"
                                       value={formData.addressLine1} onChange={handleChange}
                                       style={inputStyle} placeholder="Street, tole, ward number" />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                    Address Line 2 <small className="text-muted fw-normal">(optional)</small>
                                </label>
                                <input type="text" className="form-control" name="addressLine2"
                                       value={formData.addressLine2} onChange={handleChange}
                                       style={inputStyle} placeholder="Apartment, floor, building name" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>City *</label>
                                <select className="form-select" name="city" value={formData.city}
                                        onChange={handleChange} style={inputStyle}>
                                    {majorCities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>District *</label>
                                <select className="form-select" name="district" value={formData.district}
                                        onChange={handleChange} style={inputStyle}>
                                    {nepalDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                    Landmark <small className="text-muted fw-normal">(optional)</small>
                                </label>
                                <input type="text" className="form-control" name="landmark"
                                       value={formData.landmark} onChange={handleChange}
                                       style={inputStyle} placeholder="Near school, temple..." />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                    Postal Code <small className="text-muted fw-normal">(optional)</small>
                                </label>
                                <input type="text" className="form-control" name="postalCode"
                                       value={formData.postalCode} onChange={handleChange}
                                       style={inputStyle} placeholder="e.g. 44600" />
                            </div>
                            <div className="col-12">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" name="isDefault"
                                           checked={formData.isDefault}
                                           onChange={handleChange} id="isDefault" />
                                    <label className="form-check-label" htmlFor="isDefault" style={{ fontSize: 14 }}>
                                        Set as default delivery address
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button className="btn fw-medium px-4"
                                    onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}
                                    style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 14 }}>
                                Cancel
                            </button>
                            <button className="btn fw-semibold px-4 text-white"
                                    onClick={handleSave} disabled={saving}
                                    style={{ backgroundColor: '#2D6A4F', borderRadius: 8, fontSize: 14 }}>
                                {saving
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                    : <><i className="bi bi-check-circle me-2"></i>{editingId ? 'Update Address' : 'Save Address'}</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Address List ── */}
                {addresses.length === 0 && !showForm ? (
                    <div className="p-5 text-center" style={cardStyle}>
                        <i className="bi bi-geo-alt" style={{ fontSize: 48, color: '#C5BFB4' }}></i>
                        <h6 className="fw-bold mt-3 mb-1">No addresses yet</h6>
                        <p className="text-muted mb-4" style={{ fontSize: 14 }}>Add a delivery address to make checkout faster</p>
                        <button className="btn fw-semibold text-white px-4"
                                onClick={openAddForm}
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8 }}>
                            <i className="bi bi-plus-circle me-2"></i>Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {addresses.map(addr => (
                            <div key={addr.addressId} className="p-4" style={{
                                ...cardStyle,
                                border: addr.isDefault ? '2px solid #2D6A4F' : 'none',
                            }}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="fw-semibold" style={{ fontSize: 15 }}>{addr.fullName}</span>
                                            {addr.isDefault && (
                                                <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 11 }}>
                                                    <i className="bi bi-check-circle-fill me-1"></i>Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted mb-1" style={{ fontSize: 14 }}>
                                            <i className="bi bi-telephone me-1"></i>+977 {addr.phoneNumber}
                                        </p>
                                        <p className="mb-1" style={{ fontSize: 14 }}>
                                            {addr.addressLine1}
                                            {addr.addressLine2 && `, ${addr.addressLine2}`}
                                        </p>
                                        <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                                            {addr.city}, {addr.district}
                                            {addr.landmark && ` — Near ${addr.landmark}`}
                                            {addr.postalCode && ` — ${addr.postalCode}`}
                                        </p>
                                    </div>
                                    <div className="d-flex flex-column gap-1 ms-3">
                                        <button className="btn btn-sm fw-medium"
                                                onClick={() => openEditForm(addr)}
                                                style={{ borderColor: '#DDD9D2', color: '#555', borderRadius: 8, fontSize: 12 }}>
                                            <i className="bi bi-pencil me-1"></i>Edit
                                        </button>
                                        {!addr.isDefault && (
                                            <button className="btn btn-sm fw-medium"
                                                    onClick={() => handleSetDefault(addr.addressId)}
                                                    style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 12 }}>
                                                <i className="bi bi-star me-1"></i>Set Default
                                            </button>
                                        )}
                                        <button className="btn btn-sm fw-medium"
                                                onClick={() => setConfirmDeleteId(addr.addressId)}
                                                style={{ borderColor: '#FFCDD2', color: '#C62828', borderRadius: 8, fontSize: 12 }}>
                                            <i className="bi bi-trash3 me-1"></i>Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 text-center">
                    <button className="btn fw-medium"
                            onClick={() => navigate('/profile')}
                            style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 14 }}>
                        <i className="bi bi-arrow-left me-2"></i>Back to Profile
                    </button>
                </div>
            </div>
            {/* ── Confirm Delete Modal ── */}
            {confirmDeleteId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: 14, padding: '32px 28px',
                        maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <h5 className="fw-bold mb-2">Delete Address?</h5>
                        <p className="text-muted small mb-4">This action cannot be undone.</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <button
                                className="btn btn-outline-secondary rounded-pill px-4"
                                onClick={() => setConfirmDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn rounded-pill px-4 fw-semibold"
                                style={{ backgroundColor: '#E53E3E', color: 'white', border: 'none' }}
                                onClick={() => handleDelete(confirmDeleteId)}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AddressManagement;