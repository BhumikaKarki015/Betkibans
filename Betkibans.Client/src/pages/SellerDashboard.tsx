import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../contexts/AuthContext';

interface SellerProfile {
    sellerId: number;
    businessName: string | null;
    businessDescription: string | null;
    city: string | null;
    district: string | null;
    isVerified: boolean;
    kycDocumentPath: string | null;
    createdAt: string;
    verifiedAt: string | null;
    rejectionReason: string | null;
}

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'Seller') {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [user, navigate]);

    const fetchProfile = async () => {
        try {
            const data = await sellerService.getProfile();
            setProfile(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
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

    if (error) {
        return (
            <Layout>
                <div className="container mt-5">
                    <div className="alert alert-danger">{error}</div>
                </div>
            </Layout>
        );
    }

    // Check if profile needs completion
    const needsProfileCompletion = !profile?.businessName;
    const needsKycUpload = profile?.businessName && !profile?.kycDocumentPath;
    const pendingVerification = profile?.kycDocumentPath && !profile?.isVerified && !profile?.rejectionReason;
    const isRejected = profile?.rejectionReason;
    const isVerified = profile?.isVerified;

    return (
        <Layout>
            <div className="container py-4">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title mb-3">Seller Menu</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-success fw-bold">
                                            <i className="bi bi-speedometer2 me-2"></i>Dashboard
                                        </a>
                                    </li>
                                    <li className="mb-2">
                                        <button
                                            className="btn btn-link text-decoration-none text-dark p-0"
                                            onClick={() => navigate('/seller/products')}
                                            disabled={!isVerified}
                                        >
                                            <i className="bi bi-box-seam me-2"></i>My Products
                                        </button>
                                    </li>
                                    <li className="mb-2">
                                        <button
                                            className="btn btn-link text-decoration-none text-dark p-0"
                                            onClick={() => navigate('/seller/create-product')}
                                            disabled={!isVerified}
                                        >
                                            <i className="bi bi-plus-circle me-2"></i>Add Product
                                        </button>
                                    </li>
                                    <li className="mb-2">
                                        <a href="#" className="text-decoration-none text-muted">
                                            <i className="bi bi-graph-up me-2"></i>Analytics
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                        <h2 className="mb-4">Seller Dashboard</h2>

                        {/* Verification Status Card */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="card-title mb-1">Verification Status</h5>
                                        {isVerified && (
                                            <div>
                                                <span className="badge bg-success fs-6">
                                                    <i className="bi bi-check-circle me-1"></i>Verified
                                                </span>
                                                <p className="text-muted small mb-0 mt-2">
                                                    Verified on {new Date(profile.verifiedAt!).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {pendingVerification && (
                                            <div>
                                                <span className="badge bg-warning text-dark fs-6">
                                                    <i className="bi bi-clock me-1"></i>Pending Verification
                                                </span>
                                                <p className="text-muted small mb-0 mt-2">
                                                    Your documents are under admin review
                                                </p>
                                            </div>
                                        )}
                                        {isRejected && (
                                            <div>
                                                <span className="badge bg-danger fs-6">
                                                    <i className="bi bi-x-circle me-1"></i>Verification Rejected
                                                </span>
                                                <div className="alert alert-danger mt-2 mb-0">
                                                    <strong>Reason:</strong> {profile.rejectionReason}
                                                </div>
                                            </div>
                                        )}
                                        {needsProfileCompletion && (
                                            <div>
                                                <span className="badge bg-secondary fs-6">
                                                    <i className="bi bi-exclamation-circle me-1"></i>Incomplete Profile
                                                </span>
                                            </div>
                                        )}
                                        {needsKycUpload && (
                                            <div>
                                                <span className="badge bg-info text-dark fs-6">
                                                    <i className="bi bi-upload me-1"></i>Documents Needed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step-by-step Guide */}
                        {!isVerified && (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Complete Your Seller Setup</h5>

                                    {/* Step 1: Complete Profile */}
                                    <div className="d-flex align-items-start mb-3">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${needsProfileCompletion ? 'bg-warning' : 'bg-success'}`}
                                             style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                                            {needsProfileCompletion ? (
                                                <span className="text-white fw-bold">1</span>
                                            ) : (
                                                <i className="bi bi-check text-white"></i>
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Complete Business Profile</h6>
                                            <p className="text-muted small mb-2">
                                                Add your business name, description, and location
                                            </p>
                                            {needsProfileCompletion ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => navigate('/seller/complete-profile')}
                                                >
                                                    Complete Profile
                                                </button>
                                            ) : (
                                                <span className="text-success small">✓ Completed</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Upload KYC */}
                                    <div className="d-flex align-items-start mb-3">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${needsKycUpload ? 'bg-warning' : (!needsProfileCompletion ? 'bg-success' : 'bg-secondary')}`}
                                             style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                                            {needsKycUpload ? (
                                                <span className="text-white fw-bold">2</span>
                                            ) : (!needsProfileCompletion ? (
                                                <i className="bi bi-check text-white"></i>
                                            ) : (
                                                <span className="text-white fw-bold">2</span>
                                            ))}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Upload KYC Documents</h6>
                                            <p className="text-muted small mb-2">
                                                Submit business license, ID document, and tax certificate
                                            </p>
                                            {needsKycUpload ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => navigate('/seller/upload-kyc')}
                                                >
                                                    Upload Documents
                                                </button>
                                            ) : isRejected ? (
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => navigate('/seller/upload-kyc')}
                                                >
                                                    Re-upload Documents
                                                </button>
                                            ) : !needsProfileCompletion ? (
                                                <span className="text-success small">✓ Completed</span>
                                            ) : (
                                                <span className="text-muted small">Complete profile first</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 3: Wait for Verification */}
                                    <div className="d-flex align-items-start">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${pendingVerification ? 'bg-warning' : (isVerified ? 'bg-success' : 'bg-secondary')}`}
                                             style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                                            {isVerified ? (
                                                <i className="bi bi-check text-white"></i>
                                            ) : (
                                                <span className="text-white fw-bold">3</span>
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Admin Verification</h6>
                                            <p className="text-muted small mb-0">
                                                {pendingVerification ? 'Your documents are being reviewed...' :
                                                    isVerified ? 'Account verified! You can now list products.' :
                                                        'Upload documents to start verification'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions (for verified sellers) */}
                        {isVerified && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Quick Actions</h5>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <button
                                                className="btn btn-success w-100 py-3"
                                                onClick={() => navigate('/seller/create-product')}
                                            >
                                                <i className="bi bi-plus-circle fs-4 d-block mb-2"></i>
                                                Add New Product
                                            </button>
                                        </div>
                                        <div className="col-md-6">
                                            <button
                                                className="btn btn-outline-success w-100 py-3"
                                                onClick={() => navigate('/seller/products')}
                                            >
                                                <i className="bi bi-box-seam fs-4 d-block mb-2"></i>
                                                Manage Products
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Business Info (if completed) */}
                        {profile?.businessName && (
                            <div className="card border-0 shadow-sm mt-4">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Business Information</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="text-muted small">Business Name</label>
                                            <p className="mb-0 fw-medium">{profile.businessName}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="text-muted small">Location</label>
                                            <p className="mb-0 fw-medium">{profile.city}, {profile.district}</p>
                                        </div>
                                        <div className="col-12">
                                            <label className="text-muted small">Description</label>
                                            <p className="mb-0">{profile.businessDescription}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SellerDashboard;
