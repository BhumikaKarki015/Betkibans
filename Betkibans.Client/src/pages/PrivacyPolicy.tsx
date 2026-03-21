import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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

    const sections = [
        {
            id: 'information',
            title: '1. Information We Collect',
            content: [
                { subtitle: 'Account Information', text: 'When you register, we collect your full name, email address, phone number, and password (encrypted). For sellers, we additionally collect business name, address, KYC documents (citizenship ID, business registration), and bank details.' },
                { subtitle: 'Order Information', text: 'When you place an order, we collect your delivery address, order details, and payment method. Payment processing is handled by Khalti — we do not store your card or wallet credentials.' },
                { subtitle: 'Usage Data', text: 'We collect information about how you interact with our platform including pages visited, products viewed, and search queries. This helps us improve your experience.' },
            ]
        },
        {
            id: 'usage',
            title: '2. How We Use Your Information',
            content: [
                { subtitle: 'To Process Orders', text: 'Your personal and address information is used to fulfill and deliver your orders, send order confirmations, and handle returns or repairs.' },
                { subtitle: 'To Improve Our Service', text: 'Usage data helps us understand how customers use Betkibans so we can improve features, fix bugs, and personalize your experience.' },
                { subtitle: 'To Communicate With You', text: 'We send order updates, password reset emails, and (if opted in) newsletters about new products and promotions. You can unsubscribe at any time.' },
                { subtitle: 'For Seller Verification', text: 'KYC documents submitted by sellers are reviewed by our admin team to verify identity and ensure platform authenticity.' },
            ]
        },
        {
            id: 'sharing',
            title: '3. Information Sharing',
            content: [
                { subtitle: 'With Sellers', text: 'When you place an order, the seller receives your name, delivery address, and phone number to fulfill and ship your order. They do not receive your payment details or account password.' },
                { subtitle: 'With Payment Processors', text: 'Payment information is shared with Khalti for processing. We do not store payment credentials on our servers.' },
                { subtitle: 'We Never Sell Your Data', text: 'Betkibans does not sell, rent, or trade your personal information to third parties for marketing purposes.' },
            ]
        },
        {
            id: 'security',
            title: '4. Data Security',
            content: [
                { subtitle: 'Encryption', text: 'All passwords are hashed using industry-standard encryption. Data transmission is secured using HTTPS.' },
                { subtitle: 'Access Control', text: 'Only authorized Betkibans staff can access user data, and only when necessary for customer support or platform operations.' },
                { subtitle: 'Breach Notification', text: 'In the unlikely event of a data breach, we will notify affected users within 72 hours and take immediate corrective action.' },
            ]
        },
        {
            id: 'rights',
            title: '5. Your Rights',
            content: [
                { subtitle: 'Access & Correction', text: 'You can view and update your personal information at any time through your account settings.' },
                { subtitle: 'Data Deletion', text: 'You may request deletion of your account and personal data by contacting support@betkibans.com. Note that we may retain order history for legal and tax purposes.' },
                { subtitle: 'Opt-out', text: 'You can opt out of marketing emails at any time using the unsubscribe link in any email, or through your notification settings.' },
            ]
        },
        {
            id: 'cookies',
            title: '6. Cookies',
            content: [
                { subtitle: 'What We Use', text: 'We use essential cookies for authentication (keeping you logged in) and functional cookies to remember your cart and preferences.' },
                { subtitle: 'No Tracking Cookies', text: 'We do not use third-party advertising or tracking cookies. Your browsing data is not shared with advertisers.' },
            ]
        },
    ];

    const termsSections = [
        {
            title: 'Buyer Terms',
            items: [
                'You must be 18 years or older to create an account and make purchases.',
                'You are responsible for providing accurate delivery information.',
                'Orders can be cancelled only while in Pending status.',
                'Product reviews must be honest and based on genuine purchases.',
                'Fraudulent chargebacks or false dispute claims may result in account suspension.',
            ]
        },
        {
            title: 'Seller Terms',
            items: [
                'Sellers must complete KYC verification before listing products.',
                'All products must be genuinely handcrafted bamboo or cane items.',
                'Sellers must accurately describe products including dimensions, materials, and condition.',
                'Sellers must fulfill orders within the stated crafting time.',
                'Betkibans charges a 10% commission on each completed sale.',
                'Fraudulent listings or misrepresentation will result in immediate account termination.',
            ]
        },
        {
            title: 'General Terms',
            items: [
                'Betkibans reserves the right to remove any listing or suspend any account that violates our policies.',
                'We are not liable for disputes between buyers and sellers beyond our stated dispute resolution process.',
                'These terms may be updated periodically. Continued use of the platform constitutes acceptance.',
                'This platform is governed by the laws of Nepal.',
            ]
        },
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '64px 0' }}>
                <div className="container text-center text-white">
                    <h1 className="fw-bold mb-3">Privacy Policy & Terms</h1>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto' }}>
                        Last updated: March 2026 — We are committed to protecting your privacy and being transparent about how we use your data.
                    </p>
                </div>
            </div>

            <div className="container py-5">
                <div className="row g-4">

                    {/* Sticky Table of Contents */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <div className="sticky-top rounded-3 p-3" style={{ top: 80, backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <p className="fw-bold mb-3 small text-uppercase" style={{ letterSpacing: 1, color: green }}>Contents</p>
                            <div className="d-flex flex-column gap-1">
                                {sections.map(s => (
                                    <a key={s.id} href={`#${s.id}`}
                                       className="text-decoration-none small py-1 px-2 rounded-2"
                                       style={{ color: '#555', fontSize: 13 }}
                                       onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                                        {s.title}
                                    </a>
                                ))}
                                <hr className="my-2" />
                                <a href="#terms"
                                   className="text-decoration-none small py-1 px-2 rounded-2 fw-semibold"
                                   style={{ color: green, fontSize: 13 }}
                                   onClick={e => { e.preventDefault(); document.getElementById('terms')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    Terms of Service
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-lg-9">

                        {/* Privacy Policy intro */}
                        <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                            <h5 className="fw-bold mb-2" style={{ color: green }}>
                                <i className="bi bi-shield-check-fill me-2"></i>Our Privacy Commitment
                            </h5>
                            <p className="mb-0 small" style={{ lineHeight: 1.8 }}>
                                Betkibans collects only the information necessary to provide our service.
                                We never sell your data, and we give you full control over your information.
                                This policy explains exactly what we collect, why, and how you can manage it.
                            </p>
                        </div>

                        {/* Privacy sections */}
                        {sections.map(section => (
                            <div key={section.id} id={section.id} className="mb-5">
                                <h4 className="fw-bold mb-4 pb-2" style={{ borderBottom: `2px solid ${green}`, color: '#1a1a1a' }}>
                                    {section.title}
                                </h4>
                                <div className="d-flex flex-column gap-4">
                                    {section.content.map(item => (
                                        <div key={item.subtitle}>
                                            <h6 className="fw-bold mb-2" style={{ color: green }}>{item.subtitle}</h6>
                                            <p className="text-muted mb-0" style={{ lineHeight: 1.8, fontSize: 15 }}>{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Terms of Service */}
                        <div id="terms" className="mt-5">
                            <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
                                <h4 className="fw-bold mb-2">Terms of Service</h4>
                                <p className="text-muted mb-0 small" style={{ lineHeight: 1.8 }}>
                                    By using Betkibans, you agree to the following terms. Please read them carefully.
                                </p>
                            </div>

                            {termsSections.map(ts => (
                                <div key={ts.title} className="mb-4">
                                    <h5 className="fw-bold mb-3" style={{ color: green }}>{ts.title}</h5>
                                    <ul className="d-flex flex-column gap-2 ps-0" style={{ listStyle: 'none' }}>
                                        {ts.items.map((item, i) => (
                                            <li key={i} className="d-flex align-items-start gap-2">
                                                <i className="bi bi-check-circle-fill mt-1 flex-shrink-0" style={{ color: green, fontSize: 14 }}></i>
                                                <span className="text-muted" style={{ lineHeight: 1.7, fontSize: 15 }}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Contact for privacy */}
                        <div className="rounded-3 p-4 mt-5" style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <h5 className="fw-bold mb-2">Questions or Concerns?</h5>
                            <p className="text-muted mb-3" style={{ lineHeight: 1.8 }}>
                                If you have any questions about this Privacy Policy or Terms of Service,
                                or wish to exercise your data rights, please contact us:
                            </p>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center gap-2 small">
                                    <i className="bi bi-envelope-fill" style={{ color: green }}></i>
                                    <span className="text-muted">support@betkibans.com</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 small">
                                    <i className="bi bi-geo-alt-fill" style={{ color: green }}></i>
                                    <span className="text-muted">Thamel, Kathmandu, Nepal</span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <Link to="/about#contact" className="btn btn-sm fw-medium"
                                      style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, backgroundColor: 'transparent' }}>
                                    <i className="bi bi-envelope me-1"></i>Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
