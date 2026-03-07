import { useState, useEffect } from 'react';
import ProductCard from '../components/product/ProductCard';
import FilterSidebar from '../components/product/FilterSidebar';
import { productService } from '../services/productService';
import type { ProductFilters } from '../services/productService';
import type { Product } from '../types/Product';

const ProductListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState<ProductFilters>({
        categoryIds: [],
        materialIds: [],
        sort: 'newest'
    });

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productService.getAllProducts(filters);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <>
            <div className="bg-light py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 mb-4">
                            {/* This red error will vanish once you create File #2 below */}
                            <FilterSidebar onFilterChange={handleFilterChange} />
                        </div>

                        <div className="col-lg-9">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="fw-bold mb-0">Bamboo & Cane Collection</h2>
                                <select
                                    className="form-select w-auto"
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange({ sort: e.target.value })}
                                >
                                    <option value="newest">Sort: Featured</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-search display-1 text-muted"></i>
                                    <p className="lead mt-3">No products found matching your filters.</p>
                                    <button
                                        className="btn btn-outline-success"
                                        onClick={() => window.location.reload()}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                    {products.map(product => (
                                        <ProductCard key={product.productId} product={product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductListPage;