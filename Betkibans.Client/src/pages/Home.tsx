import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

interface Product {
    productId: number;
    name: string;
    price: number;
    discountPrice?: number;
    primaryImageUrl?: string;
    categoryName?: string;
    averageRating?: number;
    totalReviews?: number;
}

interface VerifiedSeller {
    sellerId: number;
    businessName: string;
    city: string;
    logoUrl?: string;
    averageRating?: number;
    totalReviews?: number;
}

const CATEGORIES = [
    { name: 'Chairs',   icon: '🪑', query: 'Chairs' },
    { name: 'Tables',   icon: '🪵', query: 'Tables' },
    { name: 'Beds',     icon: '🛏️', query: 'Beds' },
    { name: 'Outdoors', icon: '🌿', query: 'Outdoor' },
    { name: 'Storage',  icon: '🗄️', query: 'Storage' },
    { name: 'Decor',    icon: '🏮', query: 'Decor' },
];

const TESTIMONIALS = [
    { text: 'Amazing quality and authentic craftsmanship. Highly recommend!', author: 'Anita Sharma', location: 'Kathmandu' },
    { text: 'The repair service is a game changer! Extended my sofa\'s life by years.', author: 'Rajesh Thapa', location: 'Lalitpur' },
    { text: 'Supporting local artisans feels great. Quality is outstanding!', author: 'Meera Gurung', location: 'Pokhara' },
];

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [sellers, setSellers] = useState<VerifiedSeller[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingSellers, setLoadingSellers] = useState(true);

    useEffect(() => {
        // Fetch latest active products
        api.get('/Product?sort=newest&pageSize=8')
            .then(res => setProducts(Array.isArray(res.data) ? res.data.slice(0, 8) : []))
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));

        // Fetch verified sellers
        api.get('/Seller/verified')
            .then(res => setSellers(Array.isArray(res.data) ? res.data.slice(0, 3) : []))
            .catch(() => setSellers([]))
            .finally(() => setLoadingSellers(false));
    }, []);

    const formatPrice = (price: number) =>
        `Rs. ${price.toLocaleString('en-NP')}`;

    return (
        <div style={{ backgroundColor: '#F5F5F0' }}>

            {/* ── 1. HERO ── */}
            <div
                className="position-relative d-flex align-items-center"
                style={{
                    minHeight: 520,
                    background: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url('/hero.jpeg') center/cover no-repeat`,
                }}
            >
                <div className="container">
                    <div className="col-lg-6">
                        <p className="text-white-50 mb-2 fw-medium" style={{ letterSpacing: 2, fontSize: 13, textTransform: 'uppercase' }}>
                            Authentic Nepali Bamboo &amp; Cane Furniture
                        </p>
                        <h1 className="display-4 fw-bold text-white mb-3 lh-sm">
                            Nepali Bamboo<br />Furniture
                        </h1>
                        <p className="text-white-50 fs-6 mb-4">
                            Supporting Local Artisans&nbsp;•&nbsp;Promoting Sustainable Living
                        </p>
                        <div className="d-flex gap-3 flex-wrap">
                            <button
                                className="btn btn-lg px-5 fw-bold rounded-pill"
                                onClick={() => navigate('/products')}
                                style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none' }}
                            >
                                Shop Now
                            </button>
                            <button
                                className="btn btn-lg px-4 fw-medium rounded-pill"
                                onClick={() => navigate('/products')}
                                style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. SHOP BY CATEGORY ── */}
            <div className="container py-5">
                <h3 className="fw-bold text-center mb-4">Shop By Category</h3>
                <div className="row g-3 justify-content-center">
                    {CATEGORIES.map(cat => (
                        <div key={cat.name} className="col-4 col-md-2">
                            <Link
                                to={`/products?category=${cat.query}`}
                                className="text-decoration-none"
                            >
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center p-3 rounded-3 text-center h-100"
                                    style={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E8F5E9',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        minHeight: 100,
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(45,106,79,0.15)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                                    }}
                                >
                                    <span style={{ fontSize: 32, lineHeight: 1 }}>{cat.icon}</span>
                                    <p className="mb-0 mt-2 fw-semibold small" style={{ color: '#2D6A4F' }}>{cat.name}</p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 3. FEATURED PRODUCTS ── */}
            <div style={{ backgroundColor: '#fff', padding: '48px 0' }}>
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <p className="mb-0 text-muted small fw-medium text-uppercase" style={{ letterSpacing: 1 }}>Featured</p>
                            <h3 className="fw-bold mb-0">Latest Products</h3>
                        </div>
                        <Link to="/products" className="fw-semibold text-decoration-none" style={{ color: '#2D6A4F' }}>
                            View All →
                        </Link>
                    </div>

                    {loadingProducts ? (
                        <div className="row g-3">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="col-6 col-md-3">
                                    <div className="rounded-3 placeholder-glow" style={{ backgroundColor: '#F0F0F0', height: 260 }}>
                                        <span className="placeholder w-100 h-100 rounded-3"></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <div style={{ fontSize: 48 }}>🪑</div>
                            <p className="mt-2">No products yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {products.map(p => (
                                <div key={p.productId} className="col-6 col-md-3">
                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s, box-shadow 0.15s',
                                            overflow: 'hidden',
                                        }}
                                        onClick={() => navigate(`/products/${p.productId}`)}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(45,106,79,0.15)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                            (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)';
                                        }}
                                    >
                                        {/* Product Image */}
                                        <div style={{ height: 180, overflow: 'hidden', backgroundColor: '#F5F5F0' }}>
                                            {p.primaryImageUrl ? (
                                                <img
                                                    src={`http://localhost:5192${p.primaryImageUrl}`}
                                                    alt={p.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                                    <span style={{ fontSize: 48 }}>🪑</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body p-3">
                                            {p.categoryName && (
                                                <p className="mb-1 text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {p.categoryName}
                                                </p>
                                            )}
                                            <h6 className="fw-semibold mb-1 lh-sm" style={{ fontSize: 14 }}>{p.name}</h6>
                                            {p.averageRating != null && p.averageRating > 0 && (
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <span style={{ color: '#F59E0B', fontSize: 12 }}>★</span>
                                                    <span style={{ fontSize: 12, color: '#666' }}>{p.averageRating.toFixed(1)} ({p.totalReviews})</span>
                                                </div>
                                            )}
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    {p.discountPrice ? (
                                                        <>
                                                            <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 14 }}>{formatPrice(p.discountPrice)}</span>
                                                            <span className="text-muted text-decoration-line-through ms-1" style={{ fontSize: 12 }}>{formatPrice(p.price)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="fw-bold" style={{ color: '#2D6A4F', fontSize: 14 }}>{formatPrice(p.price)}</span>
                                                    )}
                                                </div>
                                                {p.discountPrice && (
                                                    <span className="badge rounded-pill px-2" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 10 }}>
                                                        {Math.round((1 - p.discountPrice / p.price) * 100)}% OFF
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 4. WHY CHOOSE BETKIBANS ── */}
            <div className="container py-5">
                <h3 className="fw-bold text-center mb-4">Why Choose Betkibans?</h3>
                <div className="row g-4">
                    {[
                        {
                            icon: '✅',
                            title: 'Verified Artisans',
                            desc: 'All sellers are verified through KYC process for authentic quality.',
                        },
                        {
                            icon: '🔧',
                            title: 'Repair Services',
                            desc: 'Extend product lifespan with re-weaving and repair services.',
                            link: '/repair',
                        },
                        {
                            icon: '🌱',
                            title: 'Eco-Friendly',
                            desc: 'Sustainable and biodegradable materials that reduce plastic.',
                        },
                    ].map(f => (
                        <div key={f.title} className="col-md-4">
                            <div
                                className="p-4 text-center h-100 rounded-3"
                                style={{ backgroundColor: '#fff', border: '1px solid #E8F5E9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                            >
                                <div style={{ fontSize: 40 }} className="mb-3">{f.icon}</div>
                                <h5 className="fw-bold mb-2">{f.title}</h5>
                                <p className="text-muted small mb-0">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 5. MEET OUR VERIFIED ARTISANS ── */}
            <div style={{ backgroundColor: '#fff', padding: '48px 0' }}>
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold mb-0">Meet Our Verified Artisans</h3>
                        <span className="fw-semibold" style={{ color: '#2D6A4F', cursor: 'default' }}>View All →</span>
                    </div>

                    {loadingSellers ? (
                        <div className="row g-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="col-md-4">
                                    <div className="rounded-3 placeholder-glow" style={{ height: 200, backgroundColor: '#F0F0F0' }}>
                                        <span className="placeholder w-100 h-100 rounded-3"></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sellers.length === 0 ? (
                        // Fallback placeholder artisans if API has none yet
                        <div className="row g-4">
                            {['Nincane Furnistore', 'Ram Bahadur Furniture', 'Lumbini Cane & Bamboo'].map((name, i) => (
                                <div key={i} className="col-md-4">
                                    <div className="card border-0 text-center rounded-3 overflow-hidden h-100"
                                         style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                        <div className="d-flex align-items-center justify-content-center py-4"
                                             style={{ backgroundColor: '#E8F5E9', minHeight: 100 }}>
                                            <i className="bi bi-shop" style={{ fontSize: 48, color: '#2D6A4F' }}></i>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-1">
                                                <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 11 }}>
                                                    ✓ Verified
                                                </span>
                                            </div>
                                            <h6 className="fw-bold mb-1">{name}</h6>
                                            <p className="text-muted small mb-2">{['Kathmandu','Pokhara','Lumbini'][i]}</p>
                                            <button className="btn btn-sm w-100 fw-medium rounded-pill"
                                                    style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none' }}>
                                                View Products
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="row g-4">
                            {sellers.map(s => (
                                <div key={s.sellerId} className="col-md-4">
                                    <div className="card border-0 text-center rounded-3 overflow-hidden h-100"
                                         style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                        <div className="d-flex align-items-center justify-content-center py-4"
                                             style={{ backgroundColor: '#E8F5E9', minHeight: 100 }}>
                                            {s.logoUrl ? (
                                                <img src={`http://localhost:5192${s.logoUrl}`} alt={s.businessName}
                                                     className="rounded-circle"
                                                     style={{ width: 80, height: 80, objectFit: 'cover' }} />
                                            ) : (
                                                <i className="bi bi-shop" style={{ fontSize: 48, color: '#2D6A4F' }}></i>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-1">
                                                <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F', fontSize: 11 }}>
                                                    ✓ Verified
                                                </span>
                                            </div>
                                            <h6 className="fw-bold mb-1">{s.businessName}</h6>
                                            <p className="text-muted small mb-1">{s.city}</p>
                                            {s.averageRating != null && s.averageRating > 0 && (
                                                <p className="text-muted small mb-2">
                                                    <span style={{ color: '#F59E0B' }}>★</span> {s.averageRating.toFixed(1)} ({s.totalReviews} reviews)
                                                </p>
                                            )}
                                            <button
                                                className="btn btn-sm w-100 fw-medium rounded-pill"
                                                onClick={() => navigate(`/products?sellerId=${s.sellerId}`)}
                                                style={{ backgroundColor: '#2D6A4F', color: 'white', border: 'none' }}
                                            >
                                                View Products
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 6. TESTIMONIALS ── */}
            <div className="container py-5">
                <div className="row g-4">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="col-md-4">
                            <div className="p-4 h-100 rounded-3"
                                 style={{ backgroundColor: '#fff', border: '1px solid #E8F5E9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ color: '#2D6A4F', fontSize: 28, lineHeight: 1 }} className="mb-3">"</div>
                                <p className="mb-3 text-muted" style={{ fontSize: 14, fontStyle: 'italic' }}>{t.text}</p>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                         style={{ width: 36, height: 36, backgroundColor: '#2D6A4F', fontSize: 14 }}>
                                        {t.author[0]}
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>— {t.author}</p>
                                        <p className="mb-0 text-muted" style={{ fontSize: 12 }}>{t.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 7. CTA BANNER ── */}
            <div style={{ backgroundColor: '#2D6A4F', padding: '56px 0' }}>
                <div className="container text-center">
                    <h3 className="fw-bold text-white mb-2">Ready to Furnish Your Space Sustainably?</h3>
                    <p className="text-white-50 mb-4">Join thousands of happy customers supporting local Nepali artisans.</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <button
                            className="btn btn-lg px-5 fw-bold rounded-pill"
                            onClick={() => navigate('/products')}
                            style={{ backgroundColor: '#fff', color: '#2D6A4F', border: 'none' }}
                        >
                            Start Shopping Now
                        </button>
                        <Link
                            to="/register"
                            className="btn btn-lg px-5 fw-medium rounded-pill"
                            style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}
                        >
                            Join as a Seller
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Home;
