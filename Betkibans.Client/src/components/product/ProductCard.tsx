import { Link } from 'react-router-dom';
import type { Product } from '../../types/Product';

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {

    // ✅ SAFE IMAGE HELPER
    // This checks if images exist before trying to read them.
    // If no image, it shows a placeholder.
    const getImageUrl = () => {
        if (product.productImages && product.productImages.length > 0) {
            return `http://localhost:5192${product.productImages[0].imageUrl}`;
        }
        return 'https://via.placeholder.com/300?text=No+Image';
    };

    return (
        <div className="col">
            <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                {/* Product Image */}
                <Link to={`/product/${product.productId}`} className="text-decoration-none">
                    <div className="position-relative" style={{ paddingTop: '75%', overflow: 'hidden' }}>
                        <img
                            src={getImageUrl()}
                            alt={product.name}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                                // Fallback if the image link is broken
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error';
                            }}
                        />
                        {product.stockQuantity === 0 && (
                            <div className="position-absolute top-0 end-0 m-2">
                                <span className="badge bg-danger">Out of Stock</span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Card Body */}
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