import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <>
            {/* 1. HERO SECTION (Nepali Bamboo Furniture) */}
            <div className="home-page-wrapper">
                {/* 1. HERO SECTION with hero.jpeg */}
                <div
                    className="position-relative d-flex align-items-center justify-content-center text-white"
                    style={{
                        height: '550px',
                        background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/hero.jpeg') center/cover no-repeat`
                    }}
                >
                    <div className="text-center px-3">
                        <h1 className="display-3 fw-bold mb-3 shadow-text">Nepali Bamboo Furniture</h1>
                        <p className="lead fs-4 mb-4 shadow-text">Supporting Local Artisans • Sustainable Living • Handcrafted Quality</p>
                        <button
                            className="btn btn-success btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg border-2"
                            onClick={() => navigate('/products')}
                        >
                            Shop Now
                        </button>
                    </div>
                </div>

            <div className="container">
                {/* 2. WHY CHOOSE BETKIBANS (The 3 Icons from Wireframe) */}
                <div className="row text-center mb-5 g-4">
                    <div className="col-md-4">
                        <div className="p-4 border rounded-4 bg-white shadow-sm">
                            <div className="fs-1 mb-2">👤</div>
                            <h5 className="fw-bold">Verified Artisans</h5>
                            <p className="small text-muted mb-0">Direct support for local Nepali craftsmen.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="p-4 border rounded-4 bg-white shadow-sm">
                            <div className="fs-1 mb-2">🛠️</div>
                            <h5 className="fw-bold">Repair Services</h5>
                            <p className="small text-muted mb-0">Giving your furniture a second life.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="p-4 border rounded-4 bg-white shadow-sm">
                            <div className="fs-1 mb-2">🌱</div>
                            <h5 className="fw-bold">Eco-Friendly</h5>
                            <p className="small text-muted mb-0">100% natural and sustainable materials.</p>
                        </div>
                    </div>
                </div>

                {/* 3. MEET OUR ARTISANS (Spotlight from Wireframe) */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Meet Our Verified Artisans</h3>
                    <button className="btn btn-link text-success p-0 fw-bold text-decoration-none">View All →</button>
                </div>
                <div className="row g-4 mb-5">
                    {['Ram Furniture', 'Lumbini Furniture', 'Pokhara Crafts'].map((artisan, idx) => (
                        <div key={idx} className="col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="bg-secondary-subtle py-5 text-center">Artisan Profile Photo</div>
                                <div className="card-body text-center">
                                    <h5 className="fw-bold mb-1">{artisan}</h5>
                                    <div className="text-warning small mb-3">★★★★★ (4.8)</div>
                                    <button className="btn btn-outline-success btn-sm w-100 rounded-pill">View Products</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </>
    );
};

export default Home;