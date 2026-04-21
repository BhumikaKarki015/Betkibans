import { Link } from 'react-router-dom';
import type { Product } from '../../types/Product';

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {

    // Returns the correct image URL for the product.
    // If the stored path is already absolute, use it directly.
    // Otherwise, prepend the backend API base URL.
    const getImageUrl = () => {
        if (product.productImages && product.productImages.length > 0) {
            const imageUrl = product.productImages[0].imageUrl;
            if (imageUrl.startsWith('http')) {
                return imageUrl;
            }
            return `${import.meta.env.VITE_API_URL}${imageUrl}`;
        }
        return null;
    };

    return (
        <div className="col">
            <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                {/* Product Image */}
                <Link to={`/product/${product.productId}`} className="text-decoration-none">
                    <div className="position-relative" style={{ paddingTop: '75%', overflow: 'hidden' }}>
                        <img
                            src={getImageUrl() ?? '/no-image.png'}
                            alt={product.name}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.onerror = null;
                                t.src = '/no-image.png';
                            }}
                        />

                        {/* Show stock badge when the product is unavailable */}
                        {product.stockQuantity === 0 && (
                            <div className="position-absolute top-0 end-0 m-2">
                                <span className="badge bg-danger">Out of Stock</span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Product information section */}
                <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                        <span className="badge bg-light text-dark border me-1">
                            {product.categoryName}
                        </span>
                    </div>

                    <h5 className="card-title mb-1">
                        <Link to={`/product/${product.productId}`} className="text-decoration-none text-dark fw-bold">
                            {product.name}
                        </Link>
                    </h5>

                    {/* Truncate long descriptions to keep card layout consistent */}
                    <p className="card-text text-muted small mb-3 flex-grow-1">
                        {product.description.length > 60
                            ? `${product.description.substring(0, 60)}...`
                            : product.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="fs-5 fw-bold text-success">
                            NPR {product.price.toLocaleString()}
                        </span>
                        <Link to={`/product/${product.productId}`} className="btn btn-outline-success btn-sm">
                            View Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;