import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CareGuide = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const pdfContentRef = useRef<HTMLDivElement>(null);
    const green = '#2D6A4F';
    const beige = '#F5F2EC';

    const handleDownloadPdf = async () => {
        if (!pdfContentRef.current) return;
        setIsGenerating(true);
        const canvas = await html2canvas(pdfContentRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Betkibans_Bamboo_Care_Manual.pdf');
        setIsGenerating(false);
    };

    const tips = [
        { icon: '☀️', title: 'Avoid Direct Heat & Sunlight', desc: 'Keep bamboo and cane furniture away from radiators, heaters, and intense direct sunlight. Prolonged heat exposure causes the material to dry out, crack, and become brittle over time.' },
        { icon: '🧼', title: 'Gentle Cleaning', desc: 'Use a soft brush or slightly damp cloth with mild soap to clean surfaces. Wipe in the direction of the grain. Never use harsh chemical cleaners, bleach, or abrasive pads as they damage the natural finish.' },
        { icon: '💧', title: 'Moisture Control', desc: 'Bamboo and cane are natural materials sensitive to humidity. Avoid placing furniture in extremely humid or very dry environments. In dry climates, use a humidifier nearby to prevent cracking.' },
        { icon: '🛡️', title: 'Protective Coating', desc: 'Apply a thin coat of linseed oil or beeswax polish every 6–12 months to maintain the natural sheen and protect against moisture absorption. This extends the life of your furniture significantly.' },
        { icon: '🪲', title: 'Pest Prevention', desc: 'Inspect furniture periodically for signs of insect damage. If detected, treat with a natural neem oil solution. Store furniture off the ground and away from walls in storage to ensure good air circulation.' },
        { icon: '🏠', title: 'Indoor vs Outdoor Use', desc: 'Most bamboo furniture is designed for indoor use. If using outdoors, always bring it inside during rain or overnight. Use waterproof furniture covers during monsoon season to prevent warping.' },
        { icon: '🔧', title: 'Loose Joints & Repairs', desc: 'If joints become loose over time, use a bamboo-safe wood glue to reattach them. Do not force or over-tighten as this may crack the material. For major structural damage, use our Repair Request service.' },
        { icon: '✨', title: 'Seasonal Maintenance', desc: 'Give your furniture a thorough inspection and clean at the start of each season. Tighten any loose weaving, touch up minor scratches with matching paint, and reapply protective coating as needed.' },
    ];

    const faqs = [
        { q: 'How long does bamboo furniture last?', a: 'With proper care, quality bamboo furniture can last 10–20 years or more. The key factors are avoiding moisture extremes, keeping it out of direct sunlight, and periodic maintenance.' },
        { q: 'Can I use bamboo furniture outdoors?', a: 'Some pieces are suitable for covered outdoor areas, but most are designed for indoor use. Always check the product description and bring furniture inside during rain or harsh weather.' },
        { q: 'How do I remove stains from cane furniture?', a: 'For light stains, use a damp cloth with mild soap. For tougher stains, a diluted white vinegar solution works well. Always dry the furniture thoroughly after cleaning.' },
        { q: 'My furniture is squeaking — what should I do?', a: 'Squeaking usually means the joints are dry. Apply a small amount of beeswax or furniture wax to the joints. If the squeaking persists, use our Repair Request service.' },
    ];

    return (
        <div style={{ backgroundColor: beige }}>

            {/* Hero */}
            <div style={{ backgroundColor: green, padding: '64px 0' }}>
                <div className="container text-center text-white">
                    <h1 className="fw-bold mb-3">Care Guide</h1>
                    <p className="mb-4" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto 24px' }}>
                        How to maintain and care for your bamboo & cane furniture so it lasts a lifetime.
                    </p>
                    <button className="btn fw-semibold px-5 py-2"
                            style={{ backgroundColor: 'white', color: green, borderRadius: 8, border: 'none' }}
                            onClick={handleDownloadPdf} disabled={isGenerating}>
                        {isGenerating
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                            : <><i className="bi bi-download me-2"></i>Download PDF Manual</>}
                    </button>
                </div>
            </div>

            <div className="container py-5">

                {/* Care Tips Grid */}
                <div className="text-center mb-5">
                    <p className="fw-medium mb-2 text-uppercase" style={{ letterSpacing: 2, fontSize: 12, color: green }}>Maintenance</p>
                    <h2 className="fw-bold">Essential Care Tips</h2>
                </div>

                <div className="row g-3 mb-5">
                    {tips.map(tip => (
                        <div key={tip.title} className="col-md-6 col-lg-3">
                            <div className="p-4 h-100 rounded-3"
                                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>{tip.icon}</div>
                                <h6 className="fw-bold mb-2">{tip.title}</h6>
                                <p className="text-muted mb-0 small" style={{ lineHeight: 1.7 }}>{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Seasonal Schedule */}
                <div className="row g-3 mb-5">
                    <div className="col-lg-8">
                        <div className="rounded-3 p-4"
                             style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <h5 className="fw-bold mb-4">Seasonal Maintenance Schedule</h5>
                            <div className="d-flex flex-column gap-3">
                                {[
                                    { season: 'Spring', icon: '🌸', tasks: 'Full inspection, clean thoroughly, reapply protective oil coating' },
                                    { season: 'Summer', icon: '☀️', tasks: 'Keep out of direct sunlight, check for insect activity, dust regularly' },
                                    { season: 'Monsoon', icon: '🌧️', tasks: 'Move indoors or cover, check for mold, ensure good ventilation' },
                                    { season: 'Winter', icon: '❄️', tasks: 'Keep away from heaters, use humidifier, tighten any loose joints' },
                                ].map(s => (
                                    <div key={s.season} className="d-flex align-items-start gap-3 py-2"
                                         style={{ borderBottom: '1px dashed #E5E1D8' }}>
                                        <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
                                        <div>
                                            <p className="fw-bold mb-1" style={{ color: green }}>{s.season}</p>
                                            <p className="text-muted small mb-0">{s.tasks}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="rounded-3 p-4 h-100"
                             style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                            <h6 className="fw-bold mb-3" style={{ color: green }}>
                                <i className="bi bi-tools me-2"></i>Need Professional Help?
                            </h6>
                            <p className="text-muted small mb-3" style={{ lineHeight: 1.7 }}>
                                If your furniture has structural damage, broken weaving, or needs expert restoration,
                                our verified artisans can help through our Repair Request service.
                            </p>
                            <Link to="/request-repair"
                                  className="btn fw-semibold w-100"
                                  style={{ backgroundColor: '#1B4332', color: 'white', border: 'none', borderRadius: 8 }}>
                                Request a Repair
                            </Link>
                            <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #A5D6A7' }}>
                                <small className="text-muted d-block mb-1">
                                    <i className="bi bi-check-circle-fill me-1" style={{ color: green }}></i>
                                    Verified artisan craftsmen
                                </small>
                                <small className="text-muted d-block mb-1">
                                    <i className="bi bi-check-circle-fill me-1" style={{ color: green }}></i>
                                    Free repair quotes
                                </small>
                                <small className="text-muted d-block">
                                    <i className="bi bi-check-circle-fill me-1" style={{ color: green }}></i>
                                    Available across Nepal
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mb-5">
                    <h5 className="fw-bold mb-4">Frequently Asked Questions</h5>
                    <div className="d-flex flex-column gap-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="rounded-3 p-4"
                                 style={{ backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                                <p className="fw-bold mb-2" style={{ fontSize: 15 }}>
                                    <i className="bi bi-question-circle-fill me-2" style={{ color: green }}></i>
                                    {faq.q}
                                </p>
                                <p className="text-muted mb-0 small" style={{ lineHeight: 1.7 }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PDF Section — hidden from screen but captured for PDF */}
                <div ref={pdfContentRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: 800, backgroundColor: 'white', padding: 40 }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <h1 style={{ color: green, fontWeight: 'bold' }}>BETKIBANS</h1>
                        <p style={{ color: '#666' }}>Bamboo & Cane Furniture Care Manual</p>
                        <hr style={{ borderColor: green, width: '25%', margin: '0 auto' }} />
                    </div>
                    {tips.map(tip => (
                        <div key={tip.title} style={{ marginBottom: 20 }}>
                            <h6 style={{ fontWeight: 'bold', color: green }}>{tip.icon} {tip.title}</h6>
                            <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>{tip.desc}</p>
                        </div>
                    ))}
                    <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #ccc', textAlign: 'center', color: '#999', fontSize: 12 }}>
                        © 2026 Betkibans Artisan Marketplace | Kathmandu, Nepal
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareGuide;
