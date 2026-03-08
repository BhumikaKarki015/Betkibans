import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import type { Product } from '../types/Product';

const SellerProducts = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'Seller') {
            navigate('/login');
            return;
        }
        fetchProducts();
    }, [user, navigate]);

    const fetchProducts = async () => {
        try {
            const data = await productService.getSellerProducts();
            setProducts(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: number) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await productService.deleteProduct(productId);
            setProducts(products.filter(p => p.productId !== productId));
            alert('Product deleted successfully');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete product');
        }
    };

    // ✅ Helper function to safely get the image URL
    const getProductImage = (product: Product) => {
        if (product.productImages && product.productImages.length > 0) {
            // Prepend backend URL to the relative path
            return `http://localhost:5192${product.productImages[0].imageUrl}`;
        }
        return 'https://via.placeholder.com/300?text=No+Image';
    };

    if (loading) {
        return (
            <>
                <div className="container mt-5">
                    <div className="text-center">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">My Products</h2>
                        <p className="text-muted mb-0">Manage your product listings</p>
                    </div>
                    <button
                        className="btn btn-success"
                        onClick={() => navigate('/seller/create-product')}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Product
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {products.length === 0 ? (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <i className="bi bi-box-seam text-muted" style={{ fontSize: '4rem' }}></i>
                            <h4 className="mt-3 mb-2">No Products Yet</h4>
                            <p className="text-muted mb-4">Start selling by adding your first product</p>
                            <button
                                className="btn btn-success"
                                onClick={() => navigate('/seller/create-product')}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Create Your First Product
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="row mb-3">
                            <div className="col">
                                <p className="text-muted mb-0">
                                    Showing {products.length} product{products.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <div className="row g-4">
                            {products.map((product) => (
                                <div key={product.productId} className="col-md-6 col-lg-4">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="position-relative" style={{ paddingTop: '75%', overflow: 'hidden' }}>
                                            {/* ✅ UPDATED: Use the helper function for src */}
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="position-absolute top-0 start-0 w-100 h-100"
                                                style={{ objectFit: 'cover' }}
                                            />
                                            {product.stockQuantity === 0 && (
                                                <div className="position-absolute top-0 end-0 m-2">
                                                    <span className="badge bg-danger">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            <h5 className="card-title mb-2">{product.name}</h5>
                                            <p className="card-text text-muted small mb-2">
                                                {product.description.substring(0, 100)}
                                                {product.description.length > 100 ? '...' : ''}
                                            </p>

                                            <div className="mb-2">
                                                <span className="badge bg-success me-1">{product.categoryName}</span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h5 className="text-success mb-0">NPR {product.price.toLocaleString()}</h5>
                                                    <small className="text-muted">Stock: {product.stockQuantity}</small>
                                                </div>
                                            </div>

                                            <div className="d-grid gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => navigate(`/seller/edit-product/${product.productId}`)}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(product.productId)}
                                                >
                                                    <i className="bi bi-trash me-1"></i>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-4 text-center">
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/seller/dashboard')}>
                        <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
                    </button>
                </div>
            </div>
        </>
    );
};

export default SellerProducts;