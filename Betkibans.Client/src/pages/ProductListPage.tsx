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
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 9;

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
                        c.categoryName.toLowerCase().includes(categoryName.toLowerCase()) ||
                        categoryName.toLowerCase().includes(c.categoryName.toLowerCase())
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
                const search = searchParams.get('search');
                const categoryName = searchParams.get('category');
                const sellerId = searchParams.get('sellerId');

                let resolvedFilters: ProductFilters = {
                    categoryIds: [],
                    materialIds: [],
                    sort: filters.sort, // preserve current sort
                };

                if (search) {
                    resolvedFilters.search = search;
                } else if (categoryName) {
                    try {
                        const res = await api.get('/Category');
                        const match = res.data.find(
                            (c: { categoryId: number; categoryName: string }) =>
                                c.categoryName.toLowerCase().includes(categoryName.toLowerCase()) ||
                                categoryName.toLowerCase().includes(c.categoryName.toLowerCase())
                        );
                        resolvedFilters.categoryIds = match ? [match.categoryId] : [];
                    } catch {
                        resolvedFilters.categoryIds = [];
                    }
                } else if (sellerId) {
                    resolvedFilters.sellerId = Number(sellerId);
                }

                setFilters(resolvedFilters);
                const data = await productService.getAllProducts(resolvedFilters);
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    // Only runs when user manually changes filters via sidebar/sort
// NOT on initial load (searchParams effect handles that)
    const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
        const updated = { ...filters, ...newFilters };
        setFilters(updated);
        setCurrentPage(1);
        setShowFilterOffcanvas(false);

        productService.getAllProducts(updated)
            .then(data => setProducts(data))
            .catch(err => console.error(err));
    };

    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = products.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE
    );

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
                        <FilterSidebar onFilterChange={handleFilterChange} currentFilters={filters} hideHeader />
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
                            <FilterSidebar onFilterChange={handleFilterChange} currentFilters={filters} />
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
                                <>
                                    <div className="row row-cols-2 row-cols-md-2 row-cols-xl-3 g-2 g-md-3">
                                        {paginatedProducts.map(product => (
                                            <ProductCard key={product.productId} product={product} />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-center align-items-center gap-2 mt-4 flex-wrap">
                                            <button
                                                className="btn btn-sm fw-medium"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}>
                                                <i className="bi bi-chevron-left me-1"></i>Prev
                                            </button>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button key={page}
                                                        className="btn btn-sm fw-semibold"
                                                        onClick={() => setCurrentPage(page)}
                                                        style={{
                                                            borderRadius: 8, fontSize: 13, minWidth: 36,
                                                            backgroundColor: currentPage === page ? '#2D6A4F' : 'transparent',
                                                            color: currentPage === page ? 'white' : '#2D6A4F',
                                                            borderColor: '#2D6A4F',
                                                        }}>
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                className="btn btn-sm fw-medium"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}>
                                                Next<i className="bi bi-chevron-right ms-1"></i>
                                            </button>

                                            <small className="text-muted ms-2">
                                                Page {currentPage} of {totalPages} · {products.length} products
                                            </small>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductListPage;
