import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import FilterSidebar from '../components/product/FilterSidebar';
import { productService } from '../services/productService';
import type { ProductFilters } from '../services/productService';
import type { Product } from '../types/Product';
import api from '../services/api';

const ProductListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [showFilterOffcanvas, setShowFilterOffcanvas] = useState(false);

    const [filters, setFilters] = useState<ProductFilters>(() => ({
        categoryIds: [],
        materialIds: [],
        sort: 'newest',
        search: searchParams.get('search') || undefined,
    }));

    useEffect(() => {
        const search = searchParams.get('search');
        const categoryName = searchParams.get('category');
        const sellerId = searchParams.get('sellerId');

        if (search) {
            setFilters({ categoryIds: [], materialIds: [], sort: 'newest', search });
        } else if (categoryName) {
            api.get('/Category').then(res => {
                const match = res.data.find(
                    (c: { categoryId: number; categoryName: string }) =>
                        c.categoryName.toLowerCase() === categoryName.toLowerCase()
                );
                setFilters({
                    categoryIds: match ? [match.categoryId] : [],
                    materialIds: [],
                    sort: 'newest',
                });
            }).catch(() => {});
        } else if (sellerId) {
            setFilters({ categoryIds: [], materialIds: [], sort: 'newest', sellerId: Number(sellerId) });
        } else {
            setFilters({ categoryIds: [], materialIds: [], sort: 'newest' });
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await productService.getAllProducts(filters);
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filters]);

    const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        // Auto-close offcanvas after applying filters on mobile
        setShowFilterOffcanvas(false);
    };

    return (
        <>
            {/* ── Mobile Filter Offcanvas ── */}
            {showFilterOffcanvas && (
                <div
                    className="offcanvas offcanvas-start show offcanvas-filter"
                    style={{ visibility: 'visible', width: 300 }}
                    tabIndex={-1}
                >
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title fw-bold mb-0">Filters</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowFilterOffcanvas(false)}
                        />
                    </div>
                    <div className="offcanvas-body p-0">
                        <FilterSidebar onFilterChange={handleFilterChange} hideHeader />
                    </div>
                </div>
            )}
            {/* Backdrop */}
            {showFilterOffcanvas && (
                <div
                    className="offcanvas-backdrop fade show"
                    onClick={() => setShowFilterOffcanvas(false)}
                />
            )}

            <div className="bg-light py-4 py-md-5">
                <div className="container">

                    {/* ── Mobile Filter Bar (visible on < lg) ── */}
                    <div className="filter-mobile-bar d-flex align-items-center justify-content-between mb-3 p-2 rounded-2"
                         style={{ backgroundColor: '#fff', border: '1px solid #E8E4DA', display: 'none' }}>
                        <button
                            className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                            onClick={() => setShowFilterOffcanvas(true)}
                            style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8 }}
                        >
                            <i className="bi bi-sliders"></i>
                            Filters
                        </button>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={filters.sort}
                            onChange={(e) => handleFilterChange({ sort: e.target.value })}
                            style={{ maxWidth: 180 }}
                        >
                            <option value="newest">Sort: Featured</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>

                    <div className="row">
                        {/* ── Desktop Sidebar ── */}
                        <div className="filter-sidebar-desktop col-lg-3 mb-4">
                            <FilterSidebar onFilterChange={handleFilterChange} />
                        </div>

                        <div className="col-lg-9">
                            {/* Desktop sort header */}
                            <div className="product-list-header d-none d-lg-flex justify-content-between align-items-center mb-4">
                                <h2 className="fw-bold mb-0">Bamboo &amp; Cane Collection</h2>
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

                            {/* Mobile: just heading */}
                            <h2 className="fw-bold mb-3 d-lg-none" style={{ fontSize: '1.3rem' }}>
                                Bamboo &amp; Cane Collection
                            </h2>

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
                                <div className="row row-cols-2 row-cols-md-2 row-cols-xl-3 g-2 g-md-3">
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
