import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const AboutUs = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const el = document.getElementById(location.hash.replace('#', ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
    }, [location]);

    const green = '#2D6A4F';
    const beige = '#F5F2EC';
    const cardStyle = { backgroundColor: '#FDFAF5', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };

    const team = [
        { name: 'Bhumika Karki', role: 'Founder & Lead Developer', emoji: '👩‍💻', desc: 'Computer Science student passionate about empowering local artisans through technology.' },
        { name: 'Nepali Artisans', role: 'Our Verified Sellers', emoji: '🪑', desc: 'Skilled craftspeople from Kathmandu, Pokhara, Lumbini and across Nepal keeping traditional craftsmanship alive.' },
        { name: 'Betkibans Community', role: 'Our Customers', emoji: '🌿', desc: 'Conscious consumers who believe in sustainable living and supporting local businesses.' },
    ];

    const values = [
        { icon: '🌱', title: 'Sustainability', desc: 'Every product is made from natural bamboo and cane — biodegradable, renewable, and eco-friendly materials that reduce plastic waste.' },
        { icon: '🤝', title: 'Fair Trade', desc: 'We ensure our artisans receive fair compensation for their craft. No middlemen — sellers set their own prices.' },
        { icon: '✅', title: 'Authenticity', desc: 'Every seller goes through a KYC verification process to ensure you\'re buying genuine handcrafted products.' },
        { icon: '🔧', title: 'Longevity', desc: 'Our repair service helps extend product lifespan — because great furniture should last a lifetime, not end up in landfill.' },
    ];

    const stats = [
        { value: '100+', label: 'Verified Artisans' },
        { value: '500+', label: 'Products Listed' },
        { value: '1,000+', label: 'Happy Customers' },
        { value: '7', label: 'Provinces Covered' },
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '80px 0' }}>
                <div className="container text-center text-white">
                    <p className="mb-2 fw-medium" style={{ letterSpacing: 2, fontSize: 13, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                        Our Story
                    </p>
                    <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>About Betkibans</h1>
                    <p className="mb-0 mx-auto" style={{ maxWidth: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                        Connecting Nepal's skilled bamboo and cane artisans with conscious consumers —
                        promoting sustainable living, fair trade, and authentic craftsmanship since 2026.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="container py-5">
                <div className="row g-3 text-center">
                    {stats.map(s => (
                        <div key={s.label} className="col-6 col-md-3">
                            <div className="p-4 rounded-3" style={cardStyle}>
                                <div className="fw-bold mb-1" style={{ fontSize: 36, color: green }}>{s.value}</div>
                                <small className="text-muted fw-medium">{s.label}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Our Story */}
            <div id="story" className="container pb-5">
                <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                        <p className="fw-medium mb-2 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Our Beginning</p>
                        <h2 className="fw-bold mb-3">From Classroom to Craftsmen</h2>
                        <p className="text-muted mb-3" style={{ lineHeight: 1.9 }}>
                            Betkibans was born from a simple observation — Nepal's talented bamboo and cane
                            artisans lacked a modern platform to reach customers beyond their local markets.
                            Their exquisite handcrafted furniture was hidden from the world.
                        </p>
                        <p className="text-muted mb-3" style={{ lineHeight: 1.9 }}>
                            Built as a Final Year Project at London Metropolitan University (in partnership
                            with Islington College, Nepal), Betkibans is more than an e-commerce platform —
                            it's a bridge between traditional craftsmanship and modern convenience.
                        </p>
                        <p className="text-muted" style={{ lineHeight: 1.9 }}>
                            The name "Betkibans" comes from the Nepali words for cane (beti/bans) —
                            the very materials that define our artisans' craft.
                        </p>
                    </div>
                    <div className="col-lg-6">
                        <div className="rounded-3 p-5 text-center" style={{ backgroundColor: '#E8F5E9' }}>
                            <div style={{ fontSize: 80 }}>🪑</div>
                            <h5 className="fw-bold mt-3 mb-2" style={{ color: green }}>Handcrafted with Love</h5>
                            <p className="text-muted small mb-0">
                                Every piece tells a story of skill, patience, and generations of knowledge
                                passed down through Nepal's artisan families.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission */}
            <div id="mission" style={{ backgroundColor: '#fff', padding: '64px 0' }}>
                <div className="container">
                    <div className="text-center mb-5">
                        <p className="fw-medium mb-2 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>What We Stand For</p>
                        <h2 className="fw-bold">Our Mission & Values</h2>
                    </div>
                    <div className="row g-4">
                        {values.map(v => (
                            <div key={v.title} className="col-md-6 col-lg-3">
                                <div className="p-4 h-100 rounded-3 text-center" style={{ ...cardStyle, border: '1px solid #E8F5E9' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>{v.icon}</div>
                                    <h5 className="fw-bold mb-2">{v.title}</h5>
                                    <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-5 p-5 rounded-3" style={{ backgroundColor: '#E8F5E9' }}>
                        <h4 className="fw-bold mb-3" style={{ color: green }}>Our Mission</h4>
                        <p className="mb-0 mx-auto" style={{ maxWidth: 700, lineHeight: 1.9, color: '#444', fontSize: 16 }}>
                            To empower Nepal's bamboo and cane artisans by providing them a trusted digital
                            marketplace — enabling fair trade, preserving cultural craftsmanship, and promoting
                            sustainable living for a greener Nepal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Team */}
            <div id="team" className="container py-5">
                <div className="text-center mb-5">
                    <p className="fw-medium mb-2 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>The People</p>
                    <h2 className="fw-bold">Meet the Team</h2>
                </div>
                <div className="row g-4 justify-content-center">
                    {team.map(t => (
                        <div key={t.name} className="col-md-4">
                            <div className="p-4 h-100 rounded-3 text-center" style={cardStyle}>
                                <div style={{ fontSize: 56, marginBottom: 16 }}>{t.emoji}</div>
                                <h5 className="fw-bold mb-1">{t.name}</h5>
                                <p className="mb-2 fw-medium small" style={{ color: green }}>{t.role}</p>
                                <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div id="contact" style={{ backgroundColor: '#fff', padding: '64px 0' }}>
                <div className="container">
                    <div className="text-center mb-5">
                        <p className="fw-medium mb-2 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Get in Touch</p>
                        <h2 className="fw-bold">Contact Us</h2>
                    </div>
                    <div className="row g-4 justify-content-center">
                        {[
                            { icon: 'bi-envelope-fill', label: 'Email', value: 'support@betkibans.com' },
                            { icon: 'bi-telephone-fill', label: 'Phone', value: '+977-1-4567890' },
                            { icon: 'bi-geo-alt-fill', label: 'Address', value: 'Thamel, Kathmandu, Nepal' },
                        ].map(c => (
                            <div key={c.label} className="col-md-4">
                                <div className="p-4 rounded-3 text-center h-100" style={{ ...cardStyle, border: '1px solid #E8F5E9' }}>
                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                         style={{ width: 52, height: 52, backgroundColor: '#E8F5E9' }}>
                                        <i className={`bi ${c.icon}`} style={{ color: green, fontSize: 22 }}></i>
                                    </div>
                                    <p className="fw-bold mb-1">{c.label}</p>
                                    <p className="text-muted small mb-0">{c.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ backgroundColor: green, padding: '56px 0' }}>
                <div className="container text-center">
                    <h3 className="fw-bold text-white mb-2">Ready to Support Local Artisans?</h3>
                    <p className="mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Shop our curated collection of handcrafted bamboo and cane furniture.
                    </p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Link to="/products" className="btn btn-lg px-5 fw-bold rounded-pill"
                              style={{ backgroundColor: '#fff', color: green, border: 'none' }}>
                            Shop Now
                        </Link>
                        <Link to="/register" className="btn btn-lg px-5 fw-medium rounded-pill"
                              style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}>
                            Join as a Seller
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
