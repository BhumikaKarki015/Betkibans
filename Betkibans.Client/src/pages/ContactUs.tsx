import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const ContactUs = () => {
    const { showToast } = useToast();
    const green = '#2D6A4F';
    const beige = '#F5F2EC';

    const [form, setForm] = useState({
        name: '', email: '', phone: '', subject: '', message: '', type: 'General Inquiry',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            showToast('Please fill in all required fields.', 'warning');
            return;
        }
        setSubmitting(true);
        // Simulate submission delay
        await new Promise(res => setTimeout(res, 1200));
        setSubmitting(false);
        setSubmitted(true);
    };

    const contactInfo = [
        { icon: 'bi-envelope-fill', label: 'Email Us', value: 'support@betkibans.com', sub: 'We reply within 24 hours', href: 'mailto:support@betkibans.com' },
        { icon: 'bi-telephone-fill', label: 'Call Us', value: '+977-1-4567890', sub: 'Mon–Sat, 9am–6pm NPT', href: 'tel:+97714567890' },
        { icon: 'bi-geo-alt-fill', label: 'Visit Us', value: 'Thamel, Kathmandu', sub: 'Nepal, 44600', href: null },
    ];

    const inquiryTypes = [
        'General Inquiry', 'Order Support', 'Product Question', 'Seller Support', 'Repair Request', 'Partnership', 'Feedback', 'Other',
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '64px 0' }}>
                <div className="container text-center text-white">
                    <h1 className="fw-bold mb-3">Contact Us</h1>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 520, margin: '0 auto' }}>
                        Have a question, feedback, or need help? We'd love to hear from you.
                        Our team is here to help.
                    </p>
                </div>
            </div>

            <div className="container py-5">

                {/* Contact Info Cards */}
                <div className="row g-3 mb-5">
                    {contactInfo.map(c => (
                        <div key={c.label} className="col-md-4">
                            <div className="p-4 rounded-3 text-center h-100"
                                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                     style={{ width: 56, height: 56, backgroundColor: '#E8F5E9' }}>
                                    <i className={`bi ${c.icon}`} style={{ color: green, fontSize: 24 }}></i>
                                </div>
                                <p className="fw-bold mb-1">{c.label}</p>
                                {c.href ? (
                                    <a href={c.href} className="fw-semibold text-decoration-none d-block mb-1"
                                       style={{ color: green }}>{c.value}</a>
                                ) : (
                                    <p className="fw-semibold mb-1" style={{ color: green }}>{c.value}</p>
                                )}
                                <small className="text-muted">{c.sub}</small>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row g-4">

                    {/* Contact Form */}
                    <div className="col-lg-7">
                        <div className="rounded-3 p-4 p-md-5"
                             style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>

                            {submitted ? (
                                <div className="text-center py-4">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                                         style={{ width: 80, height: 80, backgroundColor: '#E8F5E9' }}>
                                        <i className="bi bi-check-lg" style={{ color: green, fontSize: 40 }}></i>
                                    </div>
                                    <h4 className="fw-bold mb-2">Message Sent!</h4>
                                    <p className="text-muted mb-4" style={{ lineHeight: 1.8 }}>
                                        Thank you for reaching out, <strong>{form.name}</strong>!
                                        We've received your message and will get back to you at <strong>{form.email}</strong> within 24 hours.
                                    </p>
                                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                                        <button className="btn fw-semibold text-white px-4"
                                                style={{ backgroundColor: green, border: 'none', borderRadius: 8 }}
                                                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '', type: 'General Inquiry' }); }}>
                                            Send Another Message
                                        </button>
                                        <Link to="/" className="btn fw-medium px-4"
                                              style={{ border: `1px solid ${green}`, color: green, borderRadius: 8, backgroundColor: 'transparent' }}>
                                            Back to Home
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h5 className="fw-bold mb-1">Send Us a Message</h5>
                                    <p className="text-muted small mb-4">Fields marked with * are required.</p>

                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium small">Full Name *</label>
                                                <input type="text" name="name" className="form-control"
                                                       placeholder="Your full name"
                                                       value={form.name} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium small">Email Address *</label>
                                                <input type="email" name="email" className="form-control"
                                                       placeholder="your@email.com"
                                                       value={form.email} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium small">Phone Number</label>
                                                <div className="input-group">
                                                    <span className="input-group-text text-muted small">+977</span>
                                                    <input type="tel" name="phone" className="form-control"
                                                           placeholder="98XXXXXXXX"
                                                           value={form.phone} onChange={handleChange} />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium small">Inquiry Type</label>
                                                <select name="type" className="form-select"
                                                        value={form.type} onChange={handleChange}>
                                                    {inquiryTypes.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium small">Subject</label>
                                                <input type="text" name="subject" className="form-control"
                                                       placeholder="Brief subject of your message"
                                                       value={form.subject} onChange={handleChange} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium small">Message *</label>
                                                <textarea name="message" className="form-control" rows={5}
                                                          placeholder="Tell us how we can help you..."
                                                          value={form.message} onChange={handleChange} required />
                                            </div>
                                            <div className="col-12">
                                                <button type="submit"
                                                        className="btn fw-semibold text-white px-5 py-2"
                                                        disabled={submitting}
                                                        style={{ backgroundColor: green, border: 'none', borderRadius: 8 }}>
                                                    {submitting
                                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                                                        : <><i className="bi bi-send-fill me-2"></i>Send Message</>}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Side Info */}
                    <div className="col-lg-5">

                        {/* FAQ */}
                        <div className="rounded-3 p-4 mb-3"
                             style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-question-circle-fill me-2" style={{ color: green }}></i>
                                Common Questions
                            </h6>
                            {[
                                { q: 'How do I track my order?', a: 'Go to My Orders and click Track Order on any shipped order.' },
                                { q: 'Can I return a product?', a: 'Yes, contact us within 7 days of delivery with your order number.' },
                                { q: 'How do I become a seller?', a: 'Register as a seller, complete your profile, and upload KYC documents.' },
                                { q: 'What payment methods do you accept?', a: 'We accept Khalti and Cash on Delivery (COD).' },
                            ].map((faq, i) => (
                                <div key={i} className="mb-3 pb-3"
                                     style={{ borderBottom: i < 3 ? '1px dashed #E5E1D8' : 'none' }}>
                                    <p className="fw-semibold mb-1" style={{ fontSize: 13 }}>{faq.q}</p>
                                    <p className="text-muted mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>{faq.a}</p>
                                </div>
                            ))}
                        </div>

                        {/* Business Hours */}
                        <div className="rounded-3 p-4"
                             style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                            <h6 className="fw-bold mb-3" style={{ color: green }}>
                                <i className="bi bi-clock-fill me-2"></i>
                                Business Hours
                            </h6>
                            {[
                                { day: 'Sunday – Friday', hours: '9:00 AM – 6:00 PM' },
                                { day: 'Saturday', hours: '10:00 AM – 4:00 PM' },
                                { day: 'Public Holidays', hours: 'Closed' },
                            ].map(b => (
                                <div key={b.day} className="d-flex justify-content-between py-2"
                                     style={{ borderBottom: '1px dashed #A5D6A7' }}>
                                    <small className="fw-medium">{b.day}</small>
                                    <small className="fw-semibold" style={{ color: green }}>{b.hours}</small>
                                </div>
                            ))}
                            <small className="text-muted d-block mt-2" style={{ fontSize: 11 }}>
                                All times are Nepal Standard Time (NPT, UTC+5:45)
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
