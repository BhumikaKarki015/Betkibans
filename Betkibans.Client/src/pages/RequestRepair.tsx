import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/common/Layout';

const RequestRepair = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        if (image) formData.append('image', image);

        try {
            await api.post('/Repair/submit-request', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Repair request sent! Sellers will now review it.");
            navigate('/my-repairs');
        } catch (err) {
            alert("Error submitting request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="max-w-md mx-auto card shadow-sm p-4">
                    <h2 className="fw-bold mb-4">Request a Bamboo Repair</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Describe the damage</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Example: The leg of my bamboo chair is cracked..."
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Upload a photo of the damage</label>
                            <input
                                type="file"
                                className="form-control"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                            />
                        </div>
                        <button type="submit" className="btn btn-success w-100 py-2 fw-bold" disabled={loading}>
                            {loading ? 'Submitting...' : 'Send Request to Sellers'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default RequestRepair;