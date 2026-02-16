import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/common/Layout';

interface Quote {
    repairQuoteId: number;
    sellerBusinessName: string;
    estimatedCost: number;
    estimatedDays: number;
    description: string;
    status: string;
}

interface RepairRequest {
    repairRequestId: number;
    productName: string;
    description: string;
    damageImageUrl: string;
    status: string;
    quotes: Quote[];
}

const MyRepairs = () => {
    const [requests, setRequests] = useState<RepairRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/Repair/my-requests');
                setRequests(res.data);
            } catch (err) {
                console.error("Error fetching repairs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const handleAccept = async (quoteId: number) => {
        if (!window.confirm("Are you sure you want to accept this quote?")) return;

        try {
            await api.post(`/Repair/accept-quote/${quoteId}`);
            alert("Quote accepted!");
            window.location.reload(); // Refresh to show updated statuses
        } catch (err) {
            alert("Failed to accept quote.");
        }
    };

    if (loading) return <Layout><div className="text-center py-5">Loading requests...</div></Layout>;

    return (
        <Layout>
            <div className="container py-5">
                <h2 className="fw-bold mb-4">My Repair Requests</h2>
                {requests.length === 0 ? (
                    <p className="text-muted">You haven't submitted any repair requests yet.</p>
                ) : (
                    requests.map(req => (
                        <div key={req.repairRequestId} className="card shadow-sm mb-4">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-3">
                                        {req.damageImageUrl && (
                                            <img src={`http://localhost:5192${req.damageImageUrl}`} alt="Damage" className="img-fluid rounded mb-2" />
                                        )}
                                        <span className={`badge ${req.status === 'Pending' ? 'bg-warning' : 'bg-info'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="col-md-9">
                                        <h5 className="fw-bold">{req.productName}</h5>
                                        <p className="text-muted">{req.description}</p>
                                        <hr />
                                        <h6>Quotes Received ({req.quotes.length})</h6>
                                        {req.quotes.map(quote => (
                                            <div key={quote.repairQuoteId} className="border rounded p-3 mb-2 bg-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <strong>{quote.sellerBusinessName}</strong>
                                                    <span className="text-success fw-bold">NPR {quote.estimatedCost}</span>
                                                </div>
                                                <p className="small mb-1 text-muted">{quote.description}</p>
                                                <p className="small mb-2 text-dark">Estimated: {quote.estimatedDays} days</p>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleAccept(quote.repairQuoteId)}
                                                    disabled={req.status === 'Accepted'}
                                                >
                                                    {req.status === 'Accepted' ? 'Accepted' : 'Accept Quote'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
};

export default MyRepairs;