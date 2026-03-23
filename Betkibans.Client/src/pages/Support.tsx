import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Support = () => {
    const location = useLocation();
    const green = '#2D6A4F';
    const beige = '#F5F2EC';
    const cardStyle = { backgroundColor: '#FDFAF5', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };

    useEffect(() => {
        if (location.hash) {
            const el = document.getElementById(location.hash.replace('#', ''));
            if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [location]);

    const faqs = [
        {
            category: 'Orders',
            icon: '🛒',
            items: [
                { q: 'How do I place an order?', a: 'Browse products, add them to your cart, and proceed to checkout. You can pay via Khalti or Cash on Delivery.' },
                { q: 'Can I cancel my order?', a: 'Orders can be cancelled only while in Pending status. Go to My Orders, find the order, and click Cancel.' },
                { q: 'How do I track my order?', a: 'Go to My Orders and click Track Order on any Shipped or Delivered order to see the status timeline and tracking number.' },
                { q: 'What payment methods are accepted?', a: 'We accept Khalti digital wallet and Cash on Delivery (COD) across Nepal.' },
            ]
        },
        {
            category: 'Products',
            icon: '📦',
            items: [
                { q: 'Are all products handcrafted?', a: 'Yes — every product on Betkibans is handcrafted by verified Nepali artisans using natural bamboo, cane, or rattan materials.' },
                { q: 'How do I know if a seller is verified?', a: 'Look for the green "Verified Seller" badge on seller profiles and product pages. All verified sellers have completed our KYC process.' },
                { q: 'Can I request a custom product?', a: 'Yes — you can contact sellers directly through the platform or use the Repair Request feature to discuss custom orders.' },
            ]
        },
        {
            category: 'Account',
            icon: '👤',
            items: [
                { q: 'How do I reset my password?', a: 'Click "Forgot Password?" on the login page, enter your email, and follow the link sent to your inbox.' },
                { q: 'How do I become a seller?', a: 'Register as a seller, complete your business profile, and upload your KYC documents. Our team reviews applications within 2–5 business days.' },
                { q: 'How do I update my delivery address?', a: 'Go to your account settings and click Manage Addresses to add, edit, or set a default delivery address.' },
            ]
        },
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '64px 0' }}>
                <div className="container text-center text-white">
                    <h1 className="fw-bold mb-3">Help & Support</h1>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 520, margin: '0 auto' }}>
                        Find answers to common questions or get in touch with our support team.
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="container py-4">
                <div className="row g-3">
                    {[
                        { icon: 'bi-question-circle', label: 'FAQ', anchor: '#faq' },
                        { icon: 'bi-truck', label: 'Shipping', anchor: '#shipping' },
                        { icon: 'bi-arrow-return-left', label: 'Returns', anchor: '#returns' },
                        { icon: 'bi-envelope', label: 'Contact Us', link: '/contact' },
                    ].map(item => (
                        <div key={item.label} className="col-6 col-md-3">
                            {item.link ? (
                                <Link to={item.link} className="text-decoration-none">
                                    <div className="p-3 rounded-3 text-center h-100"
                                         style={{ ...cardStyle, border: `1px solid #E5E1D8` }}>
                                        <i className={`bi ${item.icon} d-block mb-2`} style={{ fontSize: 28, color: green }}></i>
                                        <p className="fw-semibold mb-0 small">{item.label}</p>
                                    </div>
                                </Link>
                            ) : (
                                <a href={item.anchor} className="text-decoration-none"
                                   onClick={e => { e.preventDefault(); document.getElementById(item.anchor!.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <div className="p-3 rounded-3 text-center h-100"
                                         style={{ ...cardStyle, border: `1px solid #E5E1D8` }}>
                                        <i className={`bi ${item.icon} d-block mb-2`} style={{ fontSize: 28, color: green }}></i>
                                        <p className="fw-semibold mb-0 small">{item.label}</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="container pb-5">

                {/* FAQ */}
                <div id="faq" className="mb-5 pt-3">
                    <div className="mb-4">
                        <p className="fw-medium mb-1 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Help Center</p>
                        <h3 className="fw-bold">Frequently Asked Questions</h3>
                    </div>
                    {faqs.map(cat => (
                        <div key={cat.category} className="mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.category}</span>
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {cat.items.map((item, i) => (
                                    <div key={i} className="rounded-3 p-4" style={cardStyle}>
                                        <p className="fw-semibold mb-2" style={{ fontSize: 14 }}>
                                            <i className="bi bi-question-circle-fill me-2" style={{ color: green, fontSize: 13 }}></i>
                                            {item.q}
                                        </p>
                                        <p className="text-muted mb-0 small" style={{ lineHeight: 1.7 }}>{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Shipping */}
                <div id="shipping" className="mb-5 pt-3">
                    <div className="mb-4">
                        <p className="fw-medium mb-1 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Delivery</p>
                        <h3 className="fw-bold">Shipping Information</h3>
                    </div>
                    <div className="row g-3">
                        {[
                            { icon: '🕒', title: 'Processing Time', desc: 'Orders are processed within 1–2 business days. Handcrafted items may take 3–7 days for crafting before shipment.' },
                            { icon: '🚚', title: 'Delivery Time', desc: 'Standard delivery across Nepal takes 3–7 business days depending on your location. Kathmandu Valley orders typically arrive within 2–3 days.' },
                            { icon: '💰', title: 'Shipping Cost', desc: 'Shipping is calculated at checkout. Standard shipping is NPR 150. Free shipping may apply on qualifying orders during promotions.' },
                            { icon: '📍', title: 'Delivery Coverage', desc: 'We deliver across all 7 provinces of Nepal. Remote areas may require additional time. Check availability at checkout.' },
                        ].map(s => (
                            <div key={s.title} className="col-md-6">
                                <div className="p-4 rounded-3 h-100" style={cardStyle}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                                    <h6 className="fw-bold mb-2">{s.title}</h6>
                                    <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3 p-4 mt-3" style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                        <h6 className="fw-bold mb-2" style={{ color: green }}>
                            <i className="bi bi-info-circle-fill me-2"></i>Track Your Order
                        </h6>
                        <p className="text-muted small mb-2">Once your order is shipped, you'll receive a tracking number from the seller. You can view it in My Orders → Track Order.</p>
                        <Link to="/orders" className="btn btn-sm fw-medium text-white"
                              style={{ backgroundColor: green, border: 'none', borderRadius: 8 }}>
                            View My Orders
                        </Link>
                    </div>
                </div>

                {/* Returns */}
                <div id="returns" className="mb-5 pt-3">
                    <div className="mb-4">
                        <p className="fw-medium mb-1 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Returns & Refunds</p>
                        <h3 className="fw-bold">Return Policy</h3>
                    </div>

                    <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
                        <h6 className="fw-bold mb-2">7-Day Return Window</h6>
                        <p className="text-muted small mb-0">
                            You may request a return within <strong>7 days of delivery</strong> for defective or significantly misrepresented products.
                            Items must be unused and in original condition.
                        </p>
                    </div>

                    <div className="d-flex flex-column gap-3 mb-4">
                        {[
                            { step: '1', title: 'Contact Support', desc: 'Email us at support@betkibans.com or use the Contact Us form with your order number and reason for return.' },
                            { step: '2', title: 'Approval', desc: 'Our team reviews your request within 48 hours. We may ask for photos of the issue.' },
                            { step: '3', title: 'Return Shipment', desc: 'If approved, we provide return instructions. For seller fault cases, return shipping is covered by the seller.' },
                            { step: '4', title: 'Refund', desc: 'Once the return is received and verified, your refund is processed within 5–7 business days to your original payment method.' },
                        ].map(s => (
                            <div key={s.step} className="d-flex align-items-start gap-3 rounded-3 p-4" style={cardStyle}>
                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                     style={{ width: 36, height: 36, backgroundColor: green, fontSize: 14 }}>
                                    {s.step}
                                </div>
                                <div>
                                    <p className="fw-bold mb-1" style={{ fontSize: 14 }}>{s.title}</p>
                                    <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3 p-4" style={{ ...cardStyle, border: '1px solid #FFCDD2' }}>
                        <h6 className="fw-bold mb-2" style={{ color: '#C62828' }}>Non-Returnable Items</h6>
                        <ul className="text-muted small mb-0 ps-3" style={{ lineHeight: 2 }}>
                            <li>Items returned after 7 days of delivery</li>
                            <li>Used or damaged items not caused by the seller</li>
                            <li>Custom or made-to-order products</li>
                            <li>Items without original packaging where required</li>
                        </ul>
                    </div>
                </div>

                {/* Still need help */}
                <div className="rounded-3 p-5 text-center" style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                    <h5 className="fw-bold mb-2">Still Need Help?</h5>
                    <p className="text-muted mb-4 small">Our support team is available Sunday–Friday, 9am–6pm NPT.</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Link to="/contact" className="btn fw-semibold text-white px-4"
                              style={{ backgroundColor: green, border: 'none', borderRadius: 8 }}>
                            <i className="bi bi-envelope me-2"></i>Contact Us
                        </Link>
                        <a href="mailto:support@betkibans.com" className="btn fw-medium px-4"
                           style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, backgroundColor: 'transparent' }}>
                            support@betkibans.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
