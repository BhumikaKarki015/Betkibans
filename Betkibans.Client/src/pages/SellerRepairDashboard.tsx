import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface RepairRequest {
    repairRequestId: number;
    productName: string;
    description: string;
    damageImageUrl: string;
    status: string;
    createdAt: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
}

const SellerRepairDashboard = () => {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<RepairRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [quoteData, setQuoteData] = useState({ cost: 0, days: 0, desc: '' });
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState<number | null>(null);
    const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/Repair/available-requests');
            setRequests(res.data);
        } catch {
            console.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/Repair/submit-quote', {
                repairRequestId: selectedReqId,
                estimatedCost: quoteData.cost,
                estimatedDays: quoteData.days,
                description: quoteData.desc
            });
            setSelectedReqId(null);
            setQuoteData({ cost: 0, days: 0, desc: '' });
            await fetchRequests();
        } catch {
            showToast('Error submitting quote. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!confirmCompleteId) return;
        setCompleting(confirmCompleteId);
        setConfirmCompleteId(null);
        try {
            await api.post(`/Repair/complete/${confirmCompleteId}`);
            showToast('Repair marked as completed!', 'success');
            setTimeout(() => fetchRequests(), 1000);
        } catch {
            showToast('Failed to mark as completed. Please try again.', 'error');
        } finally {
            setCompleting(null);
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', border: 'none', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };

    const pending = requests.filter(r => r.status === 'Pending');
    const accepted = requests.filter(r => r.status === 'Accepted');
    const completed = requests.filter(r => r.status === 'Completed');

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 900 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/seller/dashboard" className="text-decoration-none text-muted">Seller Dashboard</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>Repair Jobs</span>
                </nav>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Repair Jobs</h4>
                        <small className="text-muted">Review customer repair requests and submit quotes</small>
                    </div>
                    <div className="d-flex gap-2">
                        <span className="badge px-3 py-2" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: 13 }}>
                            {pending.length} Open
                        </span>
                        <span className="badge px-3 py-2" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 13 }}>
                            {accepted.length} Accepted
                        </span>
                        <span className="badge px-3 py-2" style={{ backgroundColor: '#F3E5F5', color: '#6A1B9A', fontSize: 13 }}>
                            {completed.length} Completed
                        </span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Open Requests', value: pending.length, icon: 'bi-inbox', color: '#B45309', bg: '#FEF3C7' },
                        { label: 'Jobs Accepted', value: accepted.length, icon: 'bi-check-circle', color: '#2D6A4F', bg: '#E8F5E9' },
                        { label: 'Completed', value: completed.length, icon: 'bi-patch-check', color: '#6A1B9A', bg: '#F3E5F5' },
                        { label: 'Total Visible', value: requests.length, icon: 'bi-tools', color: '#1565C0', bg: '#E3F2FD' },
                    ].map(s => (
                        <div key={s.label} className="col-6 col-md-3">
                            <div className="p-3 rounded-3 d-flex align-items-center gap-3" style={{ backgroundColor: s.bg }}>
                                <i className={`bi ${s.icon}`} style={{ fontSize: 24, color: s.color }}></i>
                                <div>
                                    <div className="fw-bold" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
                                    <small style={{ color: s.color, opacity: 0.8 }}>{s.label}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {requests.length === 0 ? (
                    <div className="p-5 text-center" style={cardStyle}>
                        <i className="bi bi-inbox" style={{ fontSize: 48, color: '#C5BFB4' }}></i>
                        <h6 className="fw-bold mt-3 mb-1">No repair requests yet</h6>
                        <p className="text-muted" style={{ fontSize: 14 }}>Customers haven't submitted any repair requests yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Open Requests */}
                        {pending.length > 0 && (
                            <>
                                <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 12, letterSpacing: 1 }}>
                                    Open Requests — Submit Your Quote
                                </h6>
                                <div className="d-flex flex-column gap-3 mb-4">
                                    {pending.map(req => (
                                        <div key={req.repairRequestId} className="p-4" style={cardStyle}>
                                            <div className="d-flex gap-3">
                                                {req.damageImageUrl ? (
                                                    <img src={`${import.meta.env.VITE_API_URL}${req.damageImageUrl}`}
                                                         alt="Damage" className="rounded-2"
                                                         style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div className="rounded-2 d-flex align-items-center justify-content-center"
                                                         style={{ width: 80, height: 80, backgroundColor: '#F0EBE1', flexShrink: 0 }}>
                                                        <i className="bi bi-image" style={{ fontSize: 28, color: '#C5BFB4' }}></i>
                                                    </div>
                                                )}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <h6 className="fw-bold mb-0">{req.productName}</h6>
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar me-1"></i>
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>{req.description}</p>
                                                    <button className="btn fw-semibold text-white"
                                                            onClick={() => setSelectedReqId(req.repairRequestId)}
                                                            style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8, fontSize: 14 }}>
                                                        <i className="bi bi-send me-2"></i>Submit Quote
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Accepted Jobs */}
                        {accepted.length > 0 && (
                            <>
                                <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 12, letterSpacing: 1 }}>
                                    Accepted Jobs — Customer Chose You!
                                </h6>
                                <div className="d-flex flex-column gap-3">
                                    {accepted.map(req => (
                                        <div key={req.repairRequestId} className="p-4"
                                             style={{ ...cardStyle, border: '2px solid #2D6A4F' }}>
                                            <div className="d-flex gap-3">
                                                {req.damageImageUrl ? (
                                                    <img src={`${import.meta.env.VITE_API_URL}${req.damageImageUrl}`}
                                                         alt="Damage" className="rounded-2"
                                                         style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div className="rounded-2 d-flex align-items-center justify-content-center"
                                                         style={{ width: 80, height: 80, backgroundColor: '#E8F5E9', flexShrink: 0 }}>
                                                        <i className="bi bi-tools" style={{ fontSize: 28, color: '#2D6A4F' }}></i>
                                                    </div>
                                                )}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h6 className="fw-bold mb-0">{req.productName}</h6>
                                                        <span className="badge" style={{ backgroundColor: '#2D6A4F', color: 'white', fontSize: 11 }}>
                                                            🎉 Job Confirmed
                                                        </span>
                                                    </div>
                                                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>{req.description}</p>
                                                    <div className="d-flex flex-column gap-2">
                                                        <div className="rounded-3 p-2 d-inline-flex align-items-center gap-2"
                                                             style={{ backgroundColor: '#E8F5E9', fontSize: 13 }}>
                                                            <i className="bi bi-info-circle" style={{ color: '#2D6A4F' }}></i>
                                                            <span style={{ color: '#1B4332' }}>Customer accepted your quote. Coordinate with them to arrange pickup/delivery.</span>
                                                        </div>
                                                        {/* Customer Contact Details */}
                                                        {req.customerName && (
                                                            <div className="rounded-3 p-3" style={{ backgroundColor: '#F0F4FF', border: '1px solid #C7D7F9', fontSize: 13 }}>
                                                                <p className="fw-bold mb-2" style={{ color: '#1565C0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                                    <i className="bi bi-person-circle me-1"></i>Customer Contact
                                                                </p>
                                                                <div className="d-flex flex-column gap-1">
                                                                    <span><i className="bi bi-person me-2 text-muted"></i>{req.customerName}</span>
                                                                    {req.customerPhone && <span><i className="bi bi-telephone me-2 text-muted"></i>+977 {req.customerPhone}</span>}
                                                                    {req.customerEmail && <span><i className="bi bi-envelope me-2 text-muted"></i>{req.customerEmail}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <button
                                                                className="btn fw-semibold text-white"
                                                                onClick={() => setConfirmCompleteId(req.repairRequestId)}
                                                                disabled={completing === req.repairRequestId}
                                                                style={{ backgroundColor: '#1565C0', border: 'none', borderRadius: 8, fontSize: 14 }}>
                                                                {completing === req.repairRequestId
                                                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Completing...</>
                                                                    : <><i className="bi bi-check2-circle me-2"></i>Mark as Completed</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Completed Jobs */}
                {completed.length > 0 && (
                    <>
                        <h6 className="fw-bold mb-3 mt-4 text-muted text-uppercase" style={{ fontSize: 12, letterSpacing: 1 }}>
                            Completed Jobs — Well Done!
                        </h6>
                        <div className="d-flex flex-column gap-3">
                            {completed.map(req => (
                                <div key={req.repairRequestId} className="p-4"
                                     style={{ backgroundColor: '#FDFAF5', border: '2px solid #CE93D8', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                    <div className="d-flex gap-3">
                                        {req.damageImageUrl ? (
                                            <img src={`${import.meta.env.VITE_API_URL}${req.damageImageUrl}`}
                                                 alt="Damage" className="rounded-2"
                                                 style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0, opacity: 0.85 }} />
                                        ) : (
                                            <div className="rounded-2 d-flex align-items-center justify-content-center"
                                                 style={{ width: 80, height: 80, backgroundColor: '#F3E5F5', flexShrink: 0 }}>
                                                <i className="bi bi-patch-check" style={{ fontSize: 28, color: '#6A1B9A' }}></i>
                                            </div>
                                        )}
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h6 className="fw-bold mb-0">{req.productName}</h6>
                                                <span className="badge" style={{ backgroundColor: '#6A1B9A', color: 'white', fontSize: 11 }}>
                                                            ✅ Completed
                                                        </span>
                                            </div>
                                            <p className="text-muted mb-2" style={{ fontSize: 14 }}>{req.description}</p>
                                            <small className="text-muted">
                                                <i className="bi bi-calendar me-1"></i>
                                                Submitted {new Date(req.createdAt).toLocaleDateString()}
                                            </small>
                                            {req.customerName && (
                                                <div className="rounded-3 p-2 mt-2 d-inline-flex align-items-center gap-2"
                                                     style={{ backgroundColor: '#F3E5F5', fontSize: 12 }}>
                                                    <i className="bi bi-person" style={{ color: '#6A1B9A' }}></i>
                                                    <span style={{ color: '#4A148C' }}>{req.customerName}</span>
                                                    {req.customerEmail && <span className="text-muted">· {req.customerEmail}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Confirm Complete Modal */}
            {confirmCompleteId && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
                                <div className="modal-header border-0 pb-0 pt-4 px-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                             style={{ width: 44, height: 44, backgroundColor: '#E3F2FD', flexShrink: 0 }}>
                                            <i className="bi bi-check2-circle" style={{ fontSize: 22, color: '#1565C0' }}></i>
                                        </div>
                                        <h5 className="modal-title fw-bold mb-0">Mark as Completed?</h5>
                                    </div>
                                </div>
                                <div className="modal-body px-4 py-3">
                                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                                        This will mark the repair job as completed. The customer will be able to see the updated status.
                                    </p>
                                </div>
                                <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
                                    <button type="button" className="btn fw-medium px-4"
                                            onClick={() => setConfirmCompleteId(null)}
                                            style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn fw-semibold px-4 text-white"
                                            onClick={handleMarkComplete}
                                            style={{ backgroundColor: '#1565C0', border: 'none', borderRadius: 8 }}>
                                        <i className="bi bi-check2-circle me-2"></i>Yes, Mark as Completed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Quote Modal */}
            {selectedReqId && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
                                <form onSubmit={handleQuoteSubmit}>
                                    <div className="modal-header text-white border-0 rounded-top-3"
                                         style={{ backgroundColor: '#2D6A4F' }}>
                                        <h5 className="modal-title fw-bold">
                                            <i className="bi bi-send me-2"></i>Submit Professional Quote
                                        </h5>
                                        <button type="button" className="btn-close btn-close-white"
                                                onClick={() => setSelectedReqId(null)}></button>
                                    </div>
                                    <div className="modal-body p-4" style={{ backgroundColor: '#FDFAF5' }}>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>Estimated Cost (NPR) *</label>
                                            <div className="input-group">
                                                <span className="input-group-text" style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', fontSize: 13 }}>NPR</span>
                                                <input type="number" className="form-control" placeholder="1500" required
                                                       style={inputStyle}
                                                       onChange={e => setQuoteData({ ...quoteData, cost: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>Days to Complete *</label>
                                            <input type="number" className="form-control" placeholder="3" required
                                                   style={inputStyle}
                                                   onChange={e => setQuoteData({ ...quoteData, days: Number(e.target.value) })} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium" style={{ fontSize: 14 }}>Repair Plan / Details *</label>
                                            <textarea className="form-control" rows={4}
                                                      placeholder="Describe how you will fix the item, materials you'll use..."
                                                      required style={inputStyle}
                                                      onChange={e => setQuoteData({ ...quoteData, desc: e.target.value })} />
                                        </div>
                                        <div className="rounded-3 p-3 d-flex align-items-center gap-2"
                                             style={{ backgroundColor: '#E8F5E9', fontSize: 13 }}>
                                            <i className="bi bi-shield-check" style={{ color: '#2D6A4F' }}></i>
                                            <span style={{ color: '#1B4332' }}>Your quote will be reviewed by the customer. Only submit if you can genuinely fulfill it.</span>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0" style={{ backgroundColor: '#F5F2EC' }}>
                                        <button type="button" className="btn fw-medium px-4"
                                                onClick={() => setSelectedReqId(null)}
                                                style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn fw-semibold px-4 text-white"
                                                disabled={submitting}
                                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                                            {submitting
                                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                                                : <><i className="bi bi-send me-2"></i>Send Quote</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerRepairDashboard;
