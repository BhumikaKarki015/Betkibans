import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../contexts/AuthContext';

const UploadKYC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [files, setFiles] = useState({
        businessLicense: null as File | null,
        idDocument: null as File | null,
        taxDocument: null as File | null
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError(`${fieldName} must be less than 5MB`);
                return;
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError(`${fieldName} must be PDF, JPG, or PNG`);
                return;
            }

            setFiles({
                ...files,
                [fieldName]: file
            });
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!files.businessLicense || !files.idDocument) {
            setError('Business License and ID Document are required');
            setLoading(false);
            return;
        }

        try {
            await sellerService.uploadKYC(
                files.businessLicense,
                files.idDocument,
                files.taxDocument
            );
            setSuccess(true);
            // Wait 2 seconds then navigate to dashboard
            setTimeout(() => {
                navigate('/seller/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload documents');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'Seller') {
        navigate('/login');
        return null;
    }

    if (success) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-md-6 text-center">
                            <div className="card border-0 shadow">
                                <div className="card-body p-5">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                                         style={{ width: '100px', height: '100px' }}>
                                        <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <h3 className="fw-bold mb-3">Documents Uploaded Successfully!</h3>
                                    <p className="text-muted mb-4">
                                        Your KYC documents have been submitted for admin review.
                                        You'll be notified once your account is verified.
                                    </p>
                                    <p className="text-muted small">Redirecting to dashboard...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-7">
                        <div className="card border-0 shadow">
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                         style={{ width: '80px', height: '80px' }}>
                                        <i className="bi bi-file-earmark-text text-success" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h2 className="fw-bold">Upload KYC Documents</h2>
                                    <p className="text-muted">Required for seller verification</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Business License */}
                                    <div className="mb-4">
                                        <label className="form-label fw-medium">
                                            Business License <span className="text-danger">*</span>
                                        </label>
                                        <div className="border rounded p-3 bg-light">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'businessLicense')}
                                                required
                                            />
                                            <div className="form-text mt-2">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Business registration certificate or license (PDF, JPG, PNG - Max 5MB)
                                            </div>
                                            {files.businessLicense && (
                                                <div className="alert alert-success mt-2 mb-0 py-2">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    {files.businessLicense.name} ({(files.businessLicense.size / 1024).toFixed(2)} KB)
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ID Document */}
                                    <div className="mb-4">
                                        <label className="form-label fw-medium">
                                            ID Document <span className="text-danger">*</span>
                                        </label>
                                        <div className="border rounded p-3 bg-light">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'idDocument')}
                                                required
                                            />
                                            <div className="form-text mt-2">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Citizenship certificate or passport (PDF, JPG, PNG - Max 5MB)
                                            </div>
                                            {files.idDocument && (
                                                <div className="alert alert-success mt-2 mb-0 py-2">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    {files.idDocument.name} ({(files.idDocument.size / 1024).toFixed(2)} KB)
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tax Document (Optional) */}
                                    <div className="mb-4">
                                        <label className="form-label fw-medium">
                                            Tax Document <span className="text-muted">(Optional)</span>
                                        </label>
                                        <div className="border rounded p-3 bg-light">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'taxDocument')}
                                            />
                                            <div className="form-text mt-2">
                                                <i className="bi bi-info-circle me-1"></i>
                                                PAN card or tax registration (PDF, JPG, PNG - Max 5MB)
                                            </div>
                                            {files.taxDocument && (
                                                <div className="alert alert-success mt-2 mb-0 py-2">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    {files.taxDocument.name} ({(files.taxDocument.size / 1024).toFixed(2)} KB)
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="bg-light rounded p-3 mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <small className="text-muted fw-medium">Setup Progress</small>
                                            <small className="text-muted">Step 2 of 3</small>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar bg-success" style={{ width: '66%' }}></div>
                                        </div>
                                        <small className="text-muted d-block mt-2">
                                            Next: Admin Verification
                                        </small>
                                    </div>

                                    {/* Important Notice */}
                                    <div className="alert alert-warning mb-4">
                                        <h6 className="alert-heading fw-bold">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            Important
                                        </h6>
                                        <ul className="mb-0 small">
                                            <li>All documents must be clear and readable</li>
                                            <li>Documents should be valid and not expired</li>
                                            <li>Business name on license should match your profile</li>
                                            <li>ID document should belong to the business owner</li>
                                        </ul>
                                    </div>

                                    {/* Buttons */}
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-success btn-lg"
                                            disabled={loading || !files.businessLicense || !files.idDocument}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    Submit for Verification
                                                    <i className="bi bi-upload ms-2"></i>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/seller/dashboard')}
                                        >
                                            Cancel & Return to Dashboard
                                        </button>
                                    </div>
                                </form>

                                {/* What happens next */}
                                <div className="mt-4 p-3 bg-light rounded">
                                    <h6 className="fw-bold mb-2">
                                        <i className="bi bi-clock-history text-success me-2"></i>
                                        What happens next?
                                    </h6>
                                    <ol className="small text-muted mb-0 ps-3">
                                        <li>Admin will review your documents (usually within 24-48 hours)</li>
                                        <li>You'll be notified via email about verification status</li>
                                        <li>Once verified, you can start listing products</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UploadKYC;
