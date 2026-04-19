import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const RequestRepair = () => {
    const { showToast } = useToast();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            showToast('Please log in to submit a repair request.', 'warning');
            navigate('/login');
        }
    }, [user, isLoading]);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);
        if (file) setPreview(URL.createObjectURL(file));
        else setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('description', description);
        if (image) formData.append('image', image);
        try {
            await api.post('/Repair/submit-request', formData);
            
            navigate('/my-repairs');
        } catch {
            showToast('Error submitting request. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', border: 'none', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 680 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/" className="text-decoration-none text-muted">Home</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>Request Repair</span>
                </nav>

                {/* Hero Banner */}
                <div className="rounded-3 p-4 mb-4 text-white"
                     style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-tools" style={{ fontSize: 36 }}></i>
                        <div>
                            <h4 className="fw-bold mb-1">Request a Bamboo Repair</h4>
                            <p className="mb-0 small" style={{ opacity: 0.85 }}>
                                Describe your damaged item and our verified artisans will send you quotes
                            </p>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="p-4 mb-4" style={cardStyle}>
                    <h6 className="fw-bold mb-3">How it works</h6>
                    <div className="row g-3 text-center">
                        {[
                            { step: '1', icon: 'bi-pencil-square', label: 'Describe Damage', desc: 'Tell us what needs fixing' },
                            { step: '2', icon: 'bi-shop', label: 'Sellers Quote', desc: 'Artisans review & quote' },
                            { step: '3', icon: 'bi-check-circle', label: 'You Decide', desc: 'Accept the best quote' },
                        ].map(s => (
                            <div key={s.step} className="col-4">
                                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                                     style={{ width: 40, height: 40, backgroundColor: '#E8F5E9' }}>
                                    <i className={`bi ${s.icon}`} style={{ color: '#2D6A4F' }}></i>
                                </div>
                                <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>{s.label}</p>
                                <small className="text-muted">{s.desc}</small>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="p-4" style={cardStyle}>
                    <h6 className="fw-bold mb-4">Repair Request Details</h6>
                    <form onSubmit={handleSubmit}>

                        <div className="mb-4">
                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>
                                Describe the damage *
                            </label>
                            <textarea
                                className="form-control"
                                rows={5}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Example: The leg of my bamboo chair is cracked near the joint. The cane weaving on the seat has come loose on one side..."
                                required
                                style={inputStyle}
                            />
                            <small className="text-muted">Be as detailed as possible — better descriptions get better quotes</small>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>
                                Upload a photo of the damage <span className="text-muted fw-normal">(optional but recommended)</span>
                            </label>

                            {/* Drop zone */}
                            <label className="d-block rounded-3 text-center p-4"
                                   style={{ border: '2px dashed #C5BFB4', cursor: 'pointer', backgroundColor: preview ? 'transparent' : '#FAF7F2' }}>
                                <input type="file" className="d-none" accept="image/*" onChange={handleImageChange} />
                                {preview ? (
                                    <img src={preview} alt="Preview" className="img-fluid rounded-2" style={{ maxHeight: 200 }} />
                                ) : (
                                    <>
                                        <i className="bi bi-camera d-block mb-2" style={{ fontSize: 32, color: '#C5BFB4' }}></i>
                                        <p className="mb-0 fw-medium" style={{ fontSize: 14, color: '#888' }}>Click to upload a photo</p>
                                        <small className="text-muted">JPG, PNG up to 10MB</small>
                                    </>
                                )}
                            </label>
                            {preview && (
                                <button type="button" className="btn btn-sm mt-2"
                                        onClick={() => { setImage(null); setPreview(null); }}
                                        style={{ borderColor: '#DDD9D2', color: '#888', fontSize: 13, borderRadius: 8 }}>
                                    <i className="bi bi-x me-1"></i>Remove photo
                                </button>
                            )}
                        </div>

                        {/* Info notice */}
                        <div className="rounded-3 p-3 mb-4 d-flex align-items-start gap-2"
                             style={{ backgroundColor: '#E8F5E9', fontSize: 13 }}>
                            <i className="bi bi-info-circle-fill mt-1" style={{ color: '#2D6A4F', flexShrink: 0 }}></i>
                            <p className="mb-0" style={{ color: '#1B4332' }}>
                                Your request will be visible to all verified artisan sellers. You'll be notified when quotes arrive and you can compare them before accepting.
                            </p>
                        </div>

                        <div className="d-flex gap-3">
                            <button type="button" className="btn fw-medium px-4"
                                    onClick={() => navigate('/')}
                                    style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn fw-semibold flex-grow-1 text-white py-2"
                                    disabled={loading}
                                    style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                {loading
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                                    : <><i className="bi bi-send me-2"></i>Send Request to Artisans</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestRepair;
