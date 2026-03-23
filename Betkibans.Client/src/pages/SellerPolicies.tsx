import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const SellerPolicies = () => {
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

    const sections = [
        {
            id: 'eligibility',
            icon: '✅',
            title: 'Seller Eligibility',
            items: [
                'You must be a Nepali citizen or registered business entity in Nepal.',
                'You must be at least 18 years of age.',
                'You must sell genuine handcrafted bamboo, cane, or rattan products.',
                'You must complete KYC verification before listing any products.',
                'Each seller account must represent a unique individual or business — duplicate accounts are not permitted.',
            ]
        },
        {
            id: 'kyc',
            icon: '📋',
            title: 'KYC Verification',
            items: [
                'All sellers must submit a valid government-issued ID (citizenship card or passport).',
                'A business registration document or tax certificate is required for registered businesses.',
                'KYC documents are reviewed by our admin team within 2–5 business days.',
                'Providing false or forged documents will result in permanent account termination and potential legal action.',
                'Your KYC documents are stored securely and never shared with third parties.',
            ]
        },
        {
            id: 'listings',
            icon: '📦',
            title: 'Product Listings',
            items: [
                'All products must be handcrafted from bamboo, cane, rattan, or similar natural materials.',
                'Product descriptions must be accurate, including dimensions, materials, weight, and condition.',
                'A minimum of 2 clear product images is required; up to 10 images are allowed.',
                'Product descriptions must be at least 50 characters long.',
                'Minimum product price is NPR 100.',
                'Sellers must not list counterfeit, damaged, or misrepresented products.',
                'Products must not infringe on any third-party intellectual property rights.',
            ]
        },
        {
            id: 'orders',
            icon: '🛒',
            title: 'Order Fulfillment',
            items: [
                'Sellers must confirm and begin processing orders within 48 hours of receipt.',
                'Estimated crafting and delivery times must be clearly communicated to buyers.',
                'Sellers are responsible for safe packaging to prevent damage during shipping.',
                'Order status must be updated promptly — mark as Shipped with a tracking number when dispatched.',
                'Sellers must not cancel confirmed orders without a valid reason.',
                'Repeated unfulfilled orders may result in account suspension.',
            ]
        },
        {
            id: 'commission',
            icon: '💰',
            title: 'Commission & Payments',
            items: [
                'Betkibans charges a 10% commission on every completed sale.',
                'For repair services, a 10% commission applies on the quoted repair amount.',
                'Payments are released to sellers after the order is marked as Delivered and the buyer confirmation period (48 hours) has passed.',
                'Sellers are responsible for any applicable taxes on their earnings.',
                'Commission rates are subject to change with 30 days\' prior notice to sellers.',
            ]
        },
        {
            id: 'returns',
            icon: '↩️',
            title: 'Returns & Disputes',
            items: [
                'Buyers may request a return within 7 days of delivery for defective or misrepresented products.',
                'Sellers must respond to return requests within 48 hours.',
                'If a return is approved due to seller fault (wrong item, defective product), the seller bears the return shipping cost.',
                'Betkibans reserves the right to mediate disputes and make final decisions.',
                'Fraudulent dispute claims by sellers will result in account suspension.',
            ]
        },
        {
            id: 'conduct',
            icon: '🤝',
            title: 'Seller Conduct',
            items: [
                'Sellers must maintain professional and respectful communication with buyers.',
                'Sellers must not attempt to conduct transactions outside of Betkibans to avoid commission.',
                'Sellers must not post false reviews on their own products or competitors\' products.',
                'Spam, misleading promotions, or manipulative pricing practices are strictly prohibited.',
                'Any form of harassment, discrimination, or abusive behavior will result in immediate account termination.',
            ]
        },
        {
            id: 'termination',
            icon: '⚠️',
            title: 'Account Suspension & Termination',
            items: [
                'Betkibans reserves the right to suspend or terminate any seller account that violates these policies.',
                'Sellers will be notified of the reason for suspension and given an opportunity to appeal.',
                'Serious violations (fraud, forgery, harassment) will result in immediate and permanent termination without appeal.',
                'Upon termination, any pending payouts will be held for 30 days pending review.',
            ]
        },
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '64px 0' }}>
                <div className="container text-center text-white">
                    <p className="mb-2 fw-medium" style={{ letterSpacing: 2, fontSize: 12, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                        For Sellers
                    </p>
                    <h1 className="fw-bold mb-3">Seller Policies</h1>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto' }}>
                        Last updated: March 2026 — Please read these policies carefully before listing products on Betkibans.
                    </p>
                </div>
            </div>

            <div className="container py-5">
                <div className="row g-4">

                    {/* Sticky Table of Contents */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <div className="sticky-top rounded-3 p-3" style={{ top: 80, ...cardStyle }}>
                            <p className="fw-bold mb-3 small text-uppercase" style={{ letterSpacing: 1, color: green }}>Contents</p>
                            <div className="d-flex flex-column gap-1">
                                {sections.map(s => (
                                    <a key={s.id} href={`#${s.id}`}
                                       className="text-decoration-none small py-1 px-2 rounded-2"
                                       style={{ color: '#555', fontSize: 13 }}
                                       onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                                        {s.icon} {s.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-lg-9">

                        {/* Intro Banner */}
                        <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                            <h5 className="fw-bold mb-2" style={{ color: green }}>
                                <i className="bi bi-info-circle-fill me-2"></i>
                                Welcome, Seller!
                            </h5>
                            <p className="mb-0 small" style={{ lineHeight: 1.8 }}>
                                These policies exist to ensure a fair, trustworthy, and thriving marketplace for
                                both sellers and buyers. By registering as a seller on Betkibans, you agree to
                                abide by all the policies listed below. Violations may result in account suspension or termination.
                            </p>
                        </div>

                        {/* Policy Sections */}
                        {sections.map(section => (
                            <div key={section.id} id={section.id} className="mb-5">
                                <h4 className="fw-bold mb-4 pb-2 d-flex align-items-center gap-2"
                                    style={{ borderBottom: `2px solid ${green}`, color: '#1a1a1a' }}>
                                    <span>{section.icon}</span>
                                    <span>{section.title}</span>
                                </h4>
                                <ul className="d-flex flex-column gap-3 ps-0" style={{ listStyle: 'none' }}>
                                    {section.items.map((item, i) => (
                                        <li key={i} className="d-flex align-items-start gap-2">
                                            <i className="bi bi-check-circle-fill mt-1 flex-shrink-0"
                                               style={{ color: green, fontSize: 14 }}></i>
                                            <span className="text-muted" style={{ lineHeight: 1.8, fontSize: 15 }}>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* CTA */}
                        <div className="rounded-3 p-4" style={cardStyle}>
                            <div className="row align-items-center g-3">
                                <div className="col-md-8">
                                    <h5 className="fw-bold mb-1">Ready to Start Selling?</h5>
                                    <p className="text-muted mb-0 small" style={{ lineHeight: 1.7 }}>
                                        If you have questions about these policies or need help with your seller account,
                                        our support team is here to help.
                                    </p>
                                </div>
                                <div className="col-md-4 d-flex gap-2 flex-wrap">
                                    <Link to="/contact"
                                          className="btn fw-medium text-white"
                                          style={{ backgroundColor: green, border: 'none', borderRadius: 8, fontSize: 13 }}>
                                        <i className="bi bi-envelope me-1"></i>Contact Support
                                    </Link>
                                    <Link to="/register"
                                          className="btn fw-medium"
                                          style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, fontSize: 13, backgroundColor: 'transparent' }}>
                                        Register as Seller
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerPolicies;
