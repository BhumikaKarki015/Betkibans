import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CareGuide = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const pdfContentRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = async () => {
        if (!pdfContentRef.current) return;
        setIsGenerating(true);

        const element = pdfContentRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Betkibans_Bamboo_Care_Manual.pdf');
        setIsGenerating(false);
    };

    return (
        <>
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold text-success mb-0">Product Maintenance</h2>
                    <button
                        className="btn btn-success shadow-sm"
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : '📄 Download Official Manual'}
                    </button>
                </div>

                {/* This section will be captured for the PDF */}
                <div ref={pdfContentRef} className="bg-white p-5 border rounded-4 shadow-sm mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="text-center mb-5">
                        <h1 className="display-6 fw-bold text-success">BETKIBANS</h1>
                        <p className="text-muted">Preserving the Art of Nepali Bamboo & Cane</p>
                        <hr className="w-25 mx-auto border-success" />
                    </div>

                    <div className="row g-4">
                        <div className="col-12">
                            <h4 className="fw-bold">🌿 Essential Care Tips</h4>
                            <p className="text-dark">To maintain the natural luster and strength of your bamboo furniture, follow these guidelines from our verified artisans.</p>
                        </div>
                        <div className="col-md-6">
                            <h6 className="fw-bold">☀️ Avoid Direct Heat</h6>
                            <p className="small text-muted">Keep items away from radiators or intense sunlight to prevent the bamboo from becoming brittle.</p>
                        </div>
                        <div className="col-md-6">
                            <h6 className="fw-bold">🧼 Gentle Cleaning</h6>
                            <p className="small text-muted">Use a soft brush or a slightly damp cloth with mild soap. Never use harsh chemicals[cite: 1, 19].</p>
                        </div>
                        <div className="col-md-12 mt-4">
                            <div className="p-3 bg-light rounded-3 border-start border-success border-4">
                                <p className="mb-0 small text-dark">
                                    <strong>Official Support:</strong> If your product requires structural attention,
                                    visit the <strong>Repair Request</strong> section to connect with an artisan[cite: 1, 16].
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-top text-center text-muted small">
                        © 2026 Betkibans Artisan Marketplace | Kathmandu, Nepal
                    </div>
                </div>
            </div>
        </>
    );
};

export default CareGuide;