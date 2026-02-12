import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface PendingSeller {
    sellerId: number;
    email: string;
    fullName: string;
    businessName: string;
    businessDescription: string;
    city: string;
    district: string;
    isVerified: boolean;
    kycDocumentPath: string;
    createdAt: string;
}

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            navigate('/login');
            return;
        }
        fetchPendingSellers();
    }, [user, navigate]);

    const fetchPendingSellers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5192/api/Seller/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingSellers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending sellers');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (sellerId: number, isApproved: boolean) => {
        const rejectionReason = isApproved
            ? null
            : prompt('Please enter rejection reason:');

        if (!isApproved && !rejectionReason) {
            return; // User cancelled
        }

        setActionLoading(sellerId);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5192/api/Seller/verify/${sellerId}`, // ✅ FIXED URL
                {
                    isApproved,
                    rejectionReason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh the list
            await fetchPendingSellers();
            alert(isApproved ? 'Seller verified successfully!' : 'Seller rejected');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to process verification');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container mt-5">
                    <div className="text-center">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-4">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title mb-3">Admin Menu</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-success fw-bold">
                                            <i className="bi bi-people me-2"></i>Seller Verification
                                        </a>
                                    </li>
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-muted">
                                            <i className="bi bi-box-seam me-2"></i>Product Moderation
                                        </a>
                                    </li>
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-muted">
                                            <i className="bi bi-star me-2"></i>Review Moderation
                                        </a>
                                    </li>
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-muted">
                                            <i className="bi bi-graph-up me-2"></i>Analytics
                                        </a>
                                    </li>
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-muted">
                                            <i className="bi bi-gear me-2"></i>Settings
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 className="fw-bold mb-1">Pending Seller Verifications</h2>
                                <p className="text-muted mb-0">Review and approve seller applications</p>
                            </div>
                            <span className="badge bg-warning text-dark fs-6">
                                {pendingSellers.length} Pending
                            </span>
                        </div>

                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {pendingSellers.length === 0 ? (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body text-center py-5">
                                    <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                    <h4 className="mt-3 mb-2">All Caught Up!</h4>
                                    <p className="text-muted">No pending seller verifications at the moment.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {pendingSellers.map((seller) => (
                                    <div key={seller.sellerId} className="col-12">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body p-4">
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <div className="d-flex align-items-start mb-3">
                                                            <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                                                                 style={{ width: '60px', height: '60px', minWidth: '60px' }}>
                                                                <i className="bi bi-shop text-success fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="mb-1 fw-bold">{seller.businessName}</h5>
                                                                <p className="text-muted small mb-1">
                                                                    <i className="bi bi-person me-1"></i>
                                                                    {seller.fullName}
                                                                </p>
                                                                <p className="text-muted small mb-0">
                                                                    <i className="bi bi-envelope me-1"></i>
                                                                    {seller.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <h6 className="text-muted small mb-2">BUSINESS DESCRIPTION</h6>
                                                            <p className="mb-0">{seller.businessDescription}</p>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-6 mb-2">
                                                                <h6 className="text-muted small mb-1">LOCATION</h6>
                                                                <p className="mb-0">
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {seller.city}, {seller.district}
                                                                </p>
                                                            </div>
                                                            <div className="col-md-6 mb-2">
                                                                <h6 className="text-muted small mb-1">APPLIED</h6>
                                                                <p className="mb-0">
                                                                    <i className="bi bi-calendar me-1"></i>
                                                                    {new Date(seller.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {seller.kycDocumentPath && (
                                                            <div className="mt-3">
                                                                <h6 className="text-muted small mb-2">KYC DOCUMENTS</h6>
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    <span className="badge bg-success">
                                                                        <i className="bi bi-file-earmark-check me-1"></i>
                                                                        Documents Uploaded
                                                                    </span>
                                                                    <p className="text-muted small mt-2 mb-0">
                                                                        Stored in: {seller.kycDocumentPath}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="d-grid gap-2">
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() => handleVerify(seller.sellerId, true)}
                                                                disabled={actionLoading === seller.sellerId}
                                                            >
                                                                {actionLoading === seller.sellerId ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                                        Processing...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="bi bi-check-circle me-2"></i>
                                                                        Approve Seller
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => handleVerify(seller.sellerId, false)}
                                                                disabled={actionLoading === seller.sellerId}
                                                            >
                                                                <i className="bi bi-x-circle me-2"></i>
                                                                Reject
                                                            </button>

                                                            {/* ✅ THIS IS THE CORRECT BUTTON PLACEMENT */}
                                                            {seller.kycDocumentPath && (
                                                                <a
                                                                    href={`http://localhost:5192${seller.kycDocumentPath}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-outline-secondary w-100"
                                                                >
                                                                    <i className="bi bi-folder2-open me-2"></i>
                                                                    View Documents
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div className="alert alert-warning mt-3 mb-0 small">
                                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                                            <strong>Review carefully!</strong> Once approved, seller can list products.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminPanel;