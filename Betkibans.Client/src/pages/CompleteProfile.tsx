import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../contexts/AuthContext';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        city: '',
        district: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await sellerService.completeProfile(formData);
            // Success! Navigate to KYC upload
            navigate('/seller/upload-kyc');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'Seller') {
        navigate('/login');
        return null;
    }

    return (
        <Layout>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card border-0 shadow">
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                         style={{ width: '80px', height: '80px' }}>
                                        <i className="bi bi-shop text-success" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h2 className="fw-bold">Complete Your Business Profile</h2>
                                    <p className="text-muted">Tell us about your bamboo & cane business</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Business Name */}
                                    <div className="mb-3">
                                        <label htmlFor="businessName" className="form-label fw-medium">
                                            Business Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            id="businessName"
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            placeholder="e.g., Himalayan Bamboo Crafts"
                                            required
                                        />
                                        <div className="form-text">The name of your furniture business</div>
                                    </div>

                                    {/* Business Description */}
                                    <div className="mb-3">
                                        <label htmlFor="businessDescription" className="form-label fw-medium">
                                            Business Description <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="businessDescription"
                                            name="businessDescription"
                                            value={formData.businessDescription}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Tell customers about your business, craftsmanship, and what makes your products special..."
                                            required
                                        />
                                        <div className="form-text">Describe your business and products (min 50 characters)</div>
                                    </div>

                                    {/* Business Address */}
                                    <div className="mb-3">
                                        <label htmlFor="businessAddress" className="form-label fw-medium">
                                            Business Address <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="businessAddress"
                                            name="businessAddress"
                                            value={formData.businessAddress}
                                            onChange={handleChange}
                                            placeholder="Street address, ward number"
                                            required
                                        />
                                    </div>

                                    {/* City */}
                                    <div className="mb-3">
                                        <label htmlFor="city" className="form-label fw-medium">
                                            City <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="e.g., Kathmandu, Lalitpur, Bhaktapur"
                                            required
                                        />
                                    </div>

                                    {/* District */}
                                    <div className="mb-4">
                                        <label htmlFor="district" className="form-label fw-medium">
                                            District <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            id="district"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select District</option>
                                            <option value="Bagmati">Bagmati</option>
                                            <option value="Gandaki">Gandaki</option>
                                            <option value="Lumbini">Lumbini</option>
                                            <option value="Koshi">Koshi</option>
                                            <option value="Madhesh">Madhesh</option>
                                            <option value="Karnali">Karnali</option>
                                            <option value="Sudurpashchim">Sudurpashchim</option>
                                        </select>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="bg-light rounded p-3 mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <small className="text-muted fw-medium">Setup Progress</small>
                                            <small className="text-muted">Step 1 of 3</small>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar bg-success" style={{ width: '33%' }}></div>
                                        </div>
                                        <small className="text-muted d-block mt-2">
                                            Next: Upload KYC Documents
                                        </small>
                                    </div>

                                    {/* Buttons */}
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-success btn-lg"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    Continue to KYC Upload
                                                    <i className="bi bi-arrow-right ms-2"></i>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/seller/dashboard')}
                                        >
                                            Save as Draft & Return Later
                                        </button>
                                    </div>
                                </form>

                                {/* Help Text */}
                                <div className="mt-4 p-3 bg-light rounded">
                                    <h6 className="fw-bold mb-2">
                                        <i className="bi bi-info-circle text-success me-2"></i>
                                        Why do we need this?
                                    </h6>
                                    <ul className="small text-muted mb-0">
                                        <li>Customers want to know about your business</li>
                                        <li>Location helps with local delivery options</li>
                                        <li>Required for seller verification process</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CompleteProfile;
