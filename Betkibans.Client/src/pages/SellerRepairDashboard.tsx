import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/common/Layout';

interface RepairRequest {
    repairRequestId: number;
    productName: string;
    description: string;
    damageImageUrl: string;
    status: string;
    createdAt: string;
}

const SellerRepairDashboard = () => {
    const [requests, setRequests] = useState<RepairRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [quoteData, setQuoteData] = useState({ cost: 0, days: 0, desc: '' });
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAvailable = async () => {
            try {
                const res = await api.get('/Repair/available-requests');
                setRequests(res.data);
            } catch (err) {
                console.error("Failed to load requests", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailable();
    }, []);

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/Repair/submit-quote', {
                repairRequestId: selectedReqId,
                estimatedCost: quoteData.cost,
                estimatedDays: quoteData.days,
                description: quoteData.desc
            });
            alert("Quote submitted!");
            setSelectedReqId(null);
            window.location.reload();
        } catch (err) {
            alert("Error submitting quote");
        }
    };

    if (loading) return <Layout><div className="text-center py-5">Loading available jobs...</div></Layout>;

    return (
        <Layout>
            <div className="container py-5">
                <h2 className="fw-bold mb-4 text-success">Seller Repair Dashboard</h2>
                <div className="row">
                    {requests.map(req => (
                        <div key={req.repairRequestId} className="col-md-6 mb-4">
                            <div className={`card h-100 shadow-sm ${req.status === 'Accepted' ? 'border-success' : ''}`}>
                                {req.status === 'Accepted' && (
                                    <div className="bg-success text-white text-center py-1 fw-bold small">
                                        🎉 CUSTOMER ACCEPTED YOUR QUOTE
                                    </div>
                                )}
                                <div className="card-body">
                                    <h5 className="card-title fw-bold">{req.productName}</h5>
                                    <p className="card-text text-muted">{req.description}</p>

                                    {/* Visual Status Badge */}
                                    <div className="mb-3">
                    <span className={`badge ${req.status === 'Accepted' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {req.status === 'Accepted' ? 'Job Confirmed' : 'Waiting for Customer'}
                    </span>
                                    </div>

                                    {req.damageImageUrl && (
                                        <img src={`http://localhost:5192${req.damageImageUrl}`} className="img-thumbnail mb-3" style={{ maxHeight: '150px' }} alt="Damage" />
                                    )}

                                    {/* Only show "Provide Quote" if it's still pending */}
                                    {req.status === 'Pending' ? (
                                        <button className="btn btn-primary w-100" onClick={() => setSelectedReqId(req.repairRequestId)}>
                                            Provide Quote
                                        </button>
                                    ) : (
                                        <button className="btn btn-outline-success w-100" disabled>
                                            Quote Already Sent
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quote Modal Overlay */}
                {selectedReqId && (
                    <>
                        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                        <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content shadow-lg border-0">
                                    <form onSubmit={handleQuoteSubmit}>
                                        <div className="modal-header bg-success text-white">
                                            <h5 className="modal-title fw-bold">Submit Professional Quote</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedReqId(null)}></button>
                                        </div>
                                        <div className="modal-body p-4">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Estimated Cost (NPR)</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">NPR</span>
                                                    <input type="number" className="form-control" placeholder="1500" required onChange={e => setQuoteData({...quoteData, cost: Number(e.target.value)})} />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Days to Complete</label>
                                                <input type="number" className="form-control" placeholder="3" required onChange={e => setQuoteData({...quoteData, days: Number(e.target.value)})} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Repair Plan / Details</label>
                                                <textarea className="form-control" rows={3} placeholder="Describe how you will fix the item..." required onChange={e => setQuoteData({...quoteData, desc: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="modal-footer bg-light">
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedReqId(null)}>Cancel</button>
                                            <button type="submit" className="btn btn-success px-4">Send Quote</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default SellerRepairDashboard;