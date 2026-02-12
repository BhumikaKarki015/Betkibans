import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        // We will keep category and dimensions read-only or simple for now
    });

    useEffect(() => {
        if (!user || user.role !== 'Seller') {
            navigate('/login');
            return;
        }
        fetchProduct();
    }, [id, user, navigate]);

    const fetchProduct = async () => {
        try {
            if (!id) return;
            const data = await productService.getProductById(parseInt(id));
            setFormData({
                name: data.name,
                description: data.description,
                price: data.price.toString(),
                stockQuantity: data.stockQuantity.toString(),
            });
        } catch (err) {
            setError('Failed to load product details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!id) return;
            // Send update as JSON (Simple update)
            await api.put(`/Product/${id}`, {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                stockQuantity: parseInt(formData.stockQuantity)
            });
            alert('Product updated successfully!');
            navigate('/seller/products');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="text-center mt-5">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="container py-4">
                <div className="row">
                    <div className="col-md-8 mx-auto">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h4 className="card-title mb-4">Edit Product</h4>
                                {error && <div className="alert alert-danger">{error}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Product Name</label>
                                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-control" name="description" rows={4} value={formData.description} onChange={handleChange} required />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Price (NPR)</label>
                                            <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Stock Quantity</label>
                                            <input type="number" className="form-control" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller/products')}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EditProduct;