import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; 
import type { Product } from '../types/Product';

const ProductDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart(); 

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false); 

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (id) {
                    const data = await productService.getProductById(parseInt(id));
                    setProduct(data);

                    if (data.productImages && data.productImages.length > 0) {
                        setSelectedImage(`http://localhost:5192${data.productImages[0].imageUrl}`);
                    }
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // ✅ UPDATED: Now performs actual API call via CartContext
    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (product && product.productId) {
            setIsAdding(true);
            try {
                await addToCart(product.productId, 1); // Adds 1 item by default
                alert(`${product.name} added to cart!`);
            } catch (error) {
                console.error("Add to cart error:", error);
                alert("Could not add item to cart. Please try again.");
            } finally {
                setIsAdding(false);
            }
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!product) {
        return (
            <Layout>
                <div className="container py-5 text-center">
                    <h3 className="text-danger">Product not found.</h3>
                    <Link to="/products" className="btn btn-outline-secondary mt-3">Back to Products</Link>
                </div>
            </Layout>
        );
    }

    const getMainImage = () => {
        if (selectedImage) return selectedImage;
        return 'https://via.placeholder.com/600?text=No+Image';
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="mb-4">
                    <Link to="/products" className="text-decoration-none text-muted">
                        <i className="bi bi-arrow-left me-2"></i>Back to Collection
                    </Link>
                </div>

                <div className="row g-5">
                    {/* LEFT COLUMN: Images */}
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm mb-3">
                            <div className="position-relative" style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}>
                                <img
                                    src={getMainImage()}
                                    alt={product.name}
                                    className="img-fluid rounded w-100 h-100"
                                    style={{ objectFit: 'contain', maxHeight: '500px' }}
                                />
                            </div>
                        </div>
                        {/* Thumbnails */}
                        <div className="d-flex gap-2 overflow-auto pb-2">
                            {product.productImages?.map((img) => (
                                <img
                                    key={img.productImageId}
                                    src={`http://localhost:5192${img.imageUrl}`}
                                    className={`img-thumbnail ${selectedImage.includes(img.imageUrl) ? 'border-success' : ''}`}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => setSelectedImage(`http://localhost:5192${img.imageUrl}`)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Product Info */}
                    <div className="col-md-6">
                        <div className="mb-2">
                            <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">
                                {product.categoryName || 'Furniture'}
                            </span>
                        </div>

                        <h1 className="fw-bold display-6 mb-3">{product.name}</h1>

                        <div className="mb-4">
                            <h2 className="text-success fw-bold">NPR {product.price.toLocaleString()}</h2>
                        </div>

                        <p className="lead text-muted mb-5" style={{ fontSize: '1.1rem' }}>
                            {product.description}
                        </p>

                        <div className="card bg-light border-0 mb-4">
                            <div className="card-body">
                                <h6 className="fw-bold text-uppercase text-muted mb-3 small">Specifications</h6>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <small className="text-muted d-block">Dimensions</small>
                                        <span className="fw-medium">
                                            {product.length || 0}L x {product.width || 0}W x {product.height || 0}H cm
                                        </span>
                                    </div>
                                    <div className="col-6">
                                        <small className="text-muted d-block">Weight</small>
                                        <span className="fw-medium">{product.weight || 'N/A'} kg</span>
                                    </div>
                                    <div className="col-6">
                                        <small className="text-muted d-block">Stock</small>
                                        <span className={product.stockQuantity > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                                            {product.stockQuantity > 0 ? `${product.stockQuantity} items left` : 'Out of Stock'}
                                        </span>
                                    </div>
                                    <div className="col-6">
                                        <small className="text-muted d-block">Material</small>
                                        <span className="fw-medium">Bamboo, Cane</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-grid gap-3">
                            <button
                                className="btn btn-success btn-lg py-3 shadow-sm fw-bold"
                                onClick={handleAddToCart}
                                disabled={product.stockQuantity === 0 || isAdding}
                            >
                                <i className="bi bi-cart-plus me-2"></i>
                                {product.stockQuantity === 0 ? 'Out of Stock' : (isAdding ? 'Adding...' : 'Add to Cart')}
                            </button>

                            <div className="d-flex justify-content-center gap-3 mt-2">
                                <small className="text-muted">
                                    <i className="bi bi-shield-check me-1"></i> Quality Verified
                                </small>
                                <small className="text-muted">
                                    <i className="bi bi-truck me-1"></i> Standard Delivery
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProductDetailPage;