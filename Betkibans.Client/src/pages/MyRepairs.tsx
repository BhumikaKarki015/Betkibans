import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Quote {
    repairQuoteId: number;
    sellerBusinessName: string;
    estimatedCost: number;
    estimatedDays: number;
    description: string;
    status: string;
    createdAt: string;
}

interface RepairRequest {
    repairRequestId: number;
    productName: string;
    description: string;
    damageImageUrl: string;
    status: string;
    createdAt: string;
    quotes: Quote[];
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    Pending:        { color: '#B45309', bg: '#FEF3C7', label: 'Pending Review', icon: 'bi-hourglass-split' },
    QuotesReceived: { color: '#1565C0', bg: '#E3F2FD', label: 'Quotes Received', icon: 'bi-envelope-open' },
    Accepted:       { color: '#2E7D32', bg: '#E8F5E9', label: 'Accepted', icon: 'bi-check-circle-fill' },
    Completed:      { color: '#2D6A4F', bg: '#E8F5E9', label: 'Completed', icon: 'bi-patch-check-fill' },
    Cancelled:      { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled', icon: 'bi-x-circle' },
};

const MyRepairs = () => {
    const { showToast } = useToast();
    const [confirmAcceptId, setConfirmAcceptId] = useState<number | null>(null);

    const [requests, setRequests] = useState<RepairRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/Repair/my-requests');
                setRequests(res.data);
                // Auto-expand first request with quotes
                const withQuotes = res.data.find((r: RepairRequest) => r.quotes.length > 0);
                if (withQuotes) setExpanded(withQuotes.repairRequestId);
            } catch {
                console.error('Error fetching repairs');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const handleAccept = async (quoteId: number) => {

        try {
            await api.post(`/Repair/accept-quote/${quoteId}`);
            const res = await api.get('/Repair/my-requests');
            setRequests(res.data);
        } catch {
            alert('Failed to accept quote.');
        }
    };

    const cardStyle = { backgroundColor: '#FDFAF5', border: 'none', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 800 }}>

                {/* Breadcrumb */}
                <nav style={{ fontSize: 13 }} className="mb-3">
                    <Link to="/" className="text-decoration-none text-muted">Home</Link>
                    <span className="text-muted mx-2">›</span>
                    <span style={{ color: '#2D6A4F' }}>My Repair Requests</span>
                </nav>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">My Repair Requests</h4>
                        <small className="text-muted">{requests.length} request{requests.length !== 1 ? 's' : ''} submitted</small>
                    </div>
                    <button className="btn fw-semibold text-white"
                            onClick={() => navigate('/request-repair')}
                            style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8, fontSize: 14 }}>
                        <i className="bi bi-plus-circle me-2"></i>New Request
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="p-5 text-center" style={cardStyle}>
                        <i className="bi bi-tools" style={{ fontSize: 48, color: '#C5BFB4' }}></i>
                        <h6 className="fw-bold mt-3 mb-1">No repair requests yet</h6>
                        <p className="text-muted mb-4" style={{ fontSize: 14 }}>Have a damaged bamboo item? Our artisans can help!</p>
                        <button className="btn fw-semibold text-white px-4"
                                onClick={() => navigate('/request-repair')}
                                style={{ backgroundColor: '#2D6A4F', border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-plus-circle me-2"></i>Submit a Repair Request
                        </button>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {requests.map(req => {
                            const sc = statusConfig[req.status] || statusConfig['Pending'];
                            const isExpanded = expanded === req.repairRequestId;
                            const acceptedQuote = req.quotes.find(q => q.status === 'Accepted');

                            return (
                                <div key={req.repairRequestId} style={cardStyle}>
                                    {/* Request Header */}
                                    <div className="p-4"
                                         style={{ cursor: 'pointer' }}
                                         onClick={() => setExpanded(isExpanded ? null : req.repairRequestId)}>
                                        <div className="d-flex gap-3">
                                            {req.damageImageUrl ? (
                                                <img src={`http://localhost:5192${req.damageImageUrl}`}
                                                     alt="Damage" className="rounded-2"
                                                     style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />
                                            ) : (
                                                <div className="rounded-2 d-flex align-items-center justify-content-center"
                                                     style={{ width: 72, height: 72, backgroundColor: '#F0EBE1', flexShrink: 0 }}>
                                                    <i className="bi bi-tools" style={{ fontSize: 24, color: '#C5BFB4' }}></i>
                                                </div>
                                            )}
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <h6 className="fw-bold mb-0">{req.productName}</h6>
                                                    <span className="badge d-flex align-items-center gap-1 px-2 py-1"
                                                          style={{ backgroundColor: sc.bg, color: sc.color, fontSize: 12 }}>
                                                        <i className={`bi ${sc.icon}`}></i>{sc.label}
                                                    </span>
                                                </div>
                                                <p className="text-muted mb-1" style={{ fontSize: 13 }}>{req.description}</p>
                                                <div className="d-flex align-items-center gap-3">
                                                    <small className="text-muted">
                                                        <i className="bi bi-calendar me-1"></i>
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </small>
                                                    <small style={{ color: '#2D6A4F', fontWeight: 600 }}>
                                                        <i className="bi bi-chat-quote me-1"></i>
                                                        {req.quotes.length} quote{req.quotes.length !== 1 ? 's' : ''} received
                                                    </small>
                                                    <small className="text-muted ms-auto">
                                                        {isExpanded ? <><i className="bi bi-chevron-up"></i> Hide</> : <><i className="bi bi-chevron-down"></i> View quotes</>}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quotes Section */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-top pt-4" style={{ borderColor: '#EDE9E2' }}>
                                            {req.quotes.length === 0 ? (
                                                <div className="text-center py-4 rounded-3" style={{ backgroundColor: '#F5F2EC' }}>
                                                    <i className="bi bi-hourglass-split d-block mb-2" style={{ fontSize: 24, color: '#C5BFB4' }}></i>
                                                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                                                        Waiting for artisans to review and send quotes...
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <h6 className="fw-bold mb-3">
                                                        {req.status === 'Accepted' ? '✅ Accepted Quote' : `${req.quotes.length} Quote${req.quotes.length > 1 ? 's' : ''} Received`}
                                                    </h6>
                                                    <div className="d-flex flex-column gap-3">
                                                        {req.quotes.map(quote => {
                                                            const isAccepted = quote.status === 'Accepted';
                                                            const isRejected = quote.status === 'Rejected';
                                                            return (
                                                                <div key={quote.repairQuoteId} className="p-4 rounded-3"
                                                                     style={{
                                                                         border: isAccepted ? '2px solid #2D6A4F' : isRejected ? '1px solid #EEE' : '1px solid #DDD9D2',
                                                                         backgroundColor: isAccepted ? '#F0F7F4' : isRejected ? '#FAFAFA' : '#FDFAF5',
                                                                         opacity: isRejected ? 0.6 : 1,
                                                                     }}>
                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                        <div>
                                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                                <span className="fw-bold" style={{ fontSize: 15 }}>{quote.sellerBusinessName}</span>
                                                                                <span className="badge rounded-pill"
                                                                                      style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 10 }}>
                                                                                    ✓ Verified Artisan
                                                                                </span>
                                                                                {isAccepted && (
                                                                                    <span className="badge rounded-pill"
                                                                                          style={{ backgroundColor: '#2D6A4F', color: 'white', fontSize: 10 }}>
                                                                                        Accepted
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <small className="text-muted">Specialist in Natural Cane & Bamboo</small>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <div className="fw-bold" style={{ fontSize: 18, color: '#2D6A4F' }}>
                                                                                NPR {quote.estimatedCost.toLocaleString()}
                                                                            </div>
                                                                            <small className="text-muted">
                                                                                <i className="bi bi-clock me-1"></i>{quote.estimatedDays} days
                                                                            </small>
                                                                        </div>
                                                                    </div>

                                                                    <div className="rounded-3 p-3 my-3" style={{ backgroundColor: '#F5F2EC' }}>
                                                                        <p className="small mb-0 fst-italic">"{quote.description}"</p>
                                                                    </div>

                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <span className="small fw-semibold" style={{ color: '#2D6A4F' }}>
                                                                            🌱 Eco-Friendly Materials Guaranteed
                                                                        </span>
                                                                        {!isRejected && (
                                                                            <button className="btn fw-semibold px-4 text-white"
                                                                                    onClick={() => handleAccept(quote.repairQuoteId)}
                                                                                    disabled={req.status === 'Accepted'}
                                                                                    style={{
                                                                                        backgroundColor: isAccepted ? '#888' : '#2D6A4F',
                                                                                        border: 'none', borderRadius: 20, fontSize: 14
                                                                                    }}>
                                                                                {isAccepted ? '✓ Accepted' : 'Accept This Quote'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {acceptedQuote && (
                                                        <div className="rounded-3 p-3 mt-3 d-flex align-items-center gap-2"
                                                             style={{ backgroundColor: '#E8F5E9', fontSize: 13 }}>
                                                            <i className="bi bi-info-circle-fill" style={{ color: '#2D6A4F' }}></i>
                                                            <span style={{ color: '#1B4332' }}>
                                                                You've accepted the quote from <strong>{acceptedQuote.sellerBusinessName}</strong>. They will contact you to arrange the repair.
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* ── Confirm Modal ── */}
            {confirmAcceptId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: 14, padding: '32px 28px',
                        maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                        <h5 className="fw-bold mb-2">Accept this quote?</h5>
                        <p className="text-muted small mb-4">Other quotes for this request will be declined.</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <button className="btn btn-outline-secondary rounded-pill px-4"
                                    onClick={() => setConfirmAcceptId(null)}>
                                Cancel
                            </button>
                            <button className="btn rounded-pill px-4 fw-semibold"
                                    style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none' }}
                                    onClick={() => {handleAcceptQuote(confirmAcceptId!); setConfirmAcceptId(null);}}>
                                Yes, Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyRepairs;
