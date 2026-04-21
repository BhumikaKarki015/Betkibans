import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Category {
    categoryId: number;
    categoryName: string;
}

interface Material {
    materialId: number;
    materialName: string;
}

const CreateProduct = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    // Stores all form input values for product creation
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        stockQuantity: '',
        categoryId: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        color: '',
        finishType: '',
        craftingTimeDays: '',
        careInstructions: '',
        careWarnings: '',
        materialIds: [] as number[],
    });

    useEffect(() => {
        // Restrict access to verified sellers only
        if (!user || user.role !== 'Seller') { navigate('/login'); return; }
        // Load category and material options for the form
        fetchCategoriesAndMaterials();
    }, [user, navigate]);

    const fetchCategoriesAndMaterials = async () => {
        try {
            const [catData, matData] = await Promise.all([
                api.get('/Category'),
                api.get('/Material')
            ]);
            setCategories(catData.data);
            setMaterials(matData.data);
        } catch (err) {
            setError('Failed to load form data. Ensure backend is running.');
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        // Updates form fields dynamically using input name attributes
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            // Accept only valid image files and ignore unsupported file types
            const validImages = filesArray.filter(file => file.type.startsWith('image/'));
            if (validImages.length !== filesArray.length) showToast('Some files were not images and were ignored.', 'warning');
            setSelectedImages(prev => [...prev, ...validImages]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        // Removes a selected image from the preview list before submission
        setSelectedImages(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const handleMaterialChange = (materialId: number) => {
        const current = [...formData.materialIds];
        const idx = current.indexOf(materialId);
        if (idx > -1) current.splice(idx, 1);
        else current.push(materialId);
        setFormData({ ...formData, materialIds: current });
    };

    // Live discount % calculation
    const discountPercent = formData.price && formData.discountPrice
        ? Math.round((1 - parseFloat(formData.discountPrice) / parseFloat(formData.price)) * 100)
        : null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Performs client-side validation before sending data to the backend
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required.';
        if (!formData.description.trim()) newErrors.description = 'Description is required.';
        if (!formData.categoryId) newErrors.categoryId = 'Please select a category.';
        if (formData.materialIds.length === 0) newErrors.materialIds = 'Please select at least one material.';
        if (!formData.price) newErrors.price = 'Price is required.';
        if (!formData.stockQuantity) newErrors.stockQuantity = 'Stock quantity is required.';
        if (selectedImages.length === 0) newErrors.images = 'Please upload at least one product image.';
        if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
            newErrors.discountPrice = 'Discount price must be lower than the original price.';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }
        setErrors({});

        try {
            // Build multipart form data to support text fields and image uploads
            const data = new FormData();
            data.append('Name', formData.name);
            data.append('Description', formData.description);
            data.append('Price', formData.price.toString());
            data.append('StockQuantity', formData.stockQuantity.toString());
            data.append('CategoryId', formData.categoryId.toString());
            if (formData.discountPrice) data.append('DiscountPrice', formData.discountPrice.toString());
            if (formData.length) data.append('Length', formData.length.toString());
            if (formData.width) data.append('Width', formData.width.toString());
            if (formData.height) data.append('Height', formData.height.toString());
            if (formData.weight) data.append('Weight', formData.weight.toString());
            if (formData.color) data.append('Color', formData.color);
            if (formData.finishType) data.append('FinishType', formData.finishType);
            if (formData.craftingTimeDays) data.append('CraftingTimeDays', formData.craftingTimeDays.toString());
            if (formData.careInstructions) data.append('CareInstructions', formData.careInstructions);
            if (formData.careWarnings) data.append('CareWarnings', formData.careWarnings);

            formData.materialIds.forEach((id, index) => {
                data.append(`MaterialIds[${index}]`, id.toString());
            });
            selectedImages.forEach(image => data.append('Images', image));

            await productService.createProduct(data);
            navigate('/seller/products');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('Your seller account is not verified or permission denied.');
            } else {
                setError(err.response?.data?.message || 'Failed to create product.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Shared inline style objects used to keep the form design consistent
    const inputStyle = { backgroundColor: '#FDFAF5', borderColor: '#DDD9D2', fontSize: 14 };
    const cardStyle = { backgroundColor: '#FDFAF5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: 'none', borderRadius: 12 };
    const sectionNumStyle = { width: 28, height: 28, backgroundColor: '#2D6A4F', color: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 };

    return (
        <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }} className="py-4">
            <div className="container" style={{ maxWidth: 760 }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <nav style={{ fontSize: 13 }} className="mb-1">
                            <span className="text-muted">Seller Dashboard</span>
                            <span className="text-muted mx-2">›</span>
                            <span style={{ color: '#2D6A4F' }}>Add Product</span>
                        </nav>
                        <h4 className="fw-bold mb-0">Add New Product</h4>
                        <small className="text-muted">List a new bamboo or cane furniture item</small>
                    </div>
                    <button className="btn btn-sm fw-medium"
                            onClick={() => navigate('/seller/products')}
                            style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 13 }}>
                        <i className="bi bi-arrow-left me-1"></i>Back
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{ fontSize: 14 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* ── 1. Basic Information ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>1</div>
                            <h6 className="fw-bold mb-0">Basic Information</h6>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Product Name *</label>
                            <input type="text" className="form-control" name="name" value={formData.name}
                                   onChange={handleChange} placeholder="e.g. Handcrafted Bamboo Rocking Chair"
                                   style={inputStyle} />
                            {errors.name && <small className="text-danger">{errors.name}</small>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Description *</label>
                            <textarea className="form-control" name="description" value={formData.description}
                                      onChange={handleChange} rows={4} style={inputStyle}
                                      placeholder="Describe materials, craftsmanship, unique features and care instructions..." />
                            <small className="text-muted">{formData.description.length} / 2000</small>
                            {errors.description && <small className="text-danger d-block">{errors.description}</small>}
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Category *</label>
                                <select className="form-select" name="categoryId" value={formData.categoryId}
                                        onChange={handleChange} style={inputStyle}>
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                </select>
                                {errors.categoryId && <small className="text-danger">{errors.categoryId}</small>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Materials *</label>
                                <div className="rounded-2 p-2" style={{ ...inputStyle, border: '1px solid #DDD9D2', maxHeight: 110, overflowY: 'auto' }}>
                                    {materials.map(mat => (
                                        <div key={mat.materialId} className="form-check mb-1">
                                            <input className="form-check-input" type="checkbox"
                                                   id={`mat-${mat.materialId}`}
                                                   checked={formData.materialIds.includes(mat.materialId)}
                                                   onChange={() => handleMaterialChange(mat.materialId)} />
                                            <label className="form-check-label" htmlFor={`mat-${mat.materialId}`}
                                                   style={{ fontSize: 13 }}>{mat.materialName}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.materialIds && <small className="text-danger">{errors.materialIds}</small>}
                            </div>
                        </div>
                    </div>

                    {/* ── 2. Pricing & Inventory ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>2</div>
                            <h6 className="fw-bold mb-0">Pricing & Inventory</h6>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Price (NPR) *</label>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', fontSize: 13 }}>Rs.</span>
                                    <input type="number" className="form-control" name="price" value={formData.price}
                                           onChange={handleChange} min="0" style={inputStyle}
                                           placeholder="15,000" />
                                </div>
                                {errors.price && <small className="text-danger">{errors.price}</small>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                    Discount Price (Rs.)
                                    {discountPercent !== null && discountPercent > 0 && (
                                        <span className="ms-2 badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 11 }}>
                                            {discountPercent}% OFF
                                        </span>
                                    )}
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ backgroundColor: '#F0EBE1', borderColor: '#DDD9D2', fontSize: 13 }}>Rs.</span>
                                    <input type="number" className="form-control" name="discountPrice"
                                           value={formData.discountPrice} onChange={handleChange} min="0"
                                           style={inputStyle} placeholder="Optional" />
                                </div>
                                {errors.discountPrice && <small className="text-danger">{errors.discountPrice}</small>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Stock Quantity *</label>
                                <input type="number" className="form-control" name="stockQuantity"
                                       value={formData.stockQuantity} onChange={handleChange} min="0"
                                       style={inputStyle} placeholder="20" />
                                {errors.stockQuantity && <small className="text-danger">{errors.stockQuantity}</small>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Crafting Time (Days)</label>
                                <input type="text" className="form-control" name="craftingTimeDays"
                                       value={formData.craftingTimeDays} onChange={handleChange}
                                       style={inputStyle} placeholder="e.g. 3-4" />
                                <small className="text-muted">How long does it take to make this product?</small>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Product Images ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>3</div>
                            <h6 className="fw-bold mb-0">Product Images</h6>
                        </div>

                        <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                            Upload Images * <small className="text-muted fw-normal">(First image will be cover)</small>
                        </label>

                        {/* Drop zone */}
                        <label className="d-flex flex-column align-items-center justify-content-center rounded-3 p-4 mb-2"
                               style={{ border: '2px dashed #C5BFB4', cursor: 'pointer', backgroundColor: '#F8F5F0' }}>
                            <i className="bi bi-cloud-upload" style={{ fontSize: 28, color: '#2D6A4F' }}></i>
                            <span className="fw-medium mt-1" style={{ fontSize: 13 }}>Drag & drop or click to upload</span>
                            <small className="text-muted">PNG, JPG, WEBP — Max 5 photos</small>
                            <input type="file" className="d-none" multiple accept="image/png,image/jpeg,image/jpg,image/webp"
                                   onChange={handleImageChange} />
                        </label>
                        {errors.images && <small className="text-danger">{errors.images}</small>}

                        {selectedImages.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {selectedImages.map((file, i) => (
                                    <div key={i} className="position-relative" style={{ width: 80, height: 80 }}>
                                        <img src={URL.createObjectURL(file)} alt="preview"
                                             className="rounded-2 w-100 h-100" style={{ objectFit: 'cover' }} />
                                        {i === 0 && (
                                            <span className="position-absolute bottom-0 start-0 w-100 text-center"
                                                  style={{ backgroundColor: 'rgba(45,106,79,0.8)', color: 'white', fontSize: 9, borderRadius: '0 0 6px 6px', padding: '1px 0' }}>
                                                Cover
                                            </span>
                                        )}
                                        <button type="button"
                                                className="position-absolute d-flex align-items-center justify-content-center"
                                                onClick={() => removeImage(i)}
                                                style={{ top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#C62828', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer' }}>
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── 4. Product Specifications ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>4</div>
                            <h6 className="fw-bold mb-0">Product Specifications</h6>
                        </div>

                        {/* Dimensions */}
                        <p className="fw-medium mb-2" style={{ fontSize: 13, color: '#555' }}>Dimensions</p>
                        <div className="row g-2 mb-3">
                            {['length', 'width', 'height', 'weight'].map((field) => (
                                <div key={field} className="col-6 col-md-3">
                                    <label className="form-label" style={{ fontSize: 12, color: '#777' }}>
                                        {field.charAt(0).toUpperCase() + field.slice(1)} ({field === 'weight' ? 'kg' : 'cm'})
                                    </label>
                                    <input type="number" className="form-control form-control-sm" name={field}
                                           value={(formData as any)[field]} onChange={handleChange}
                                           step="0.1" style={inputStyle} />
                                </div>
                            ))}
                        </div>

                        {/* Color & Finish */}
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Color</label>
                                <input type="text" className="form-control" name="color" value={formData.color}
                                       onChange={handleChange} style={inputStyle}
                                       placeholder="e.g. Natural Bamboo Brown" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Finish Type</label>
                                <div className="d-flex gap-2 flex-wrap mt-1">
                                    {['Natural', 'Varnished', 'Painted', 'Polished', 'Other'].map(f => (
                                        <button key={f} type="button"
                                                onClick={() => setFormData({ ...formData, finishType: f })}
                                                className="btn btn-sm fw-medium"
                                                style={{
                                                    fontSize: 12, borderRadius: 20,
                                                    backgroundColor: formData.finishType === f ? '#2D6A4F' : '#F0EBE1',
                                                    color: formData.finishType === f ? 'white' : '#555',
                                                    border: formData.finishType === f ? 'none' : '1px solid #DDD9D2',
                                                }}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 5. Care Instructions ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>5</div>
                            <h6 className="fw-bold mb-0">Care Instructions</h6>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                General Care Instructions
                                <small className="text-muted fw-normal ms-1">(shown in product page Care Guide tab)</small>
                            </label>
                            <textarea className="form-control" name="careInstructions" value={formData.careInstructions}
                                      onChange={handleChange} rows={3} style={inputStyle}
                                      placeholder="e.g. Wipe with soft dry cloth. Keep away from direct sunlight. Use mild soap solution for cleaning..." />
                        </div>

                        <div>
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                Warnings & Cautions <small className="text-muted fw-normal">(optional)</small>
                            </label>
                            <textarea className="form-control" name="careWarnings" value={formData.careWarnings}
                                      onChange={handleChange} rows={2} style={inputStyle}
                                      placeholder="e.g. Do not drag across floor. Avoid harsh chemicals. Keep away from heat sources..." />
                        </div>
                    </div>

                    {/* ── Confirmation & Submit ── */}
                    <div className="p-4 mb-4" style={{ ...cardStyle, backgroundColor: '#F8F5F0' }}>
                        <div className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" id="confirm" required />
                            <label className="form-check-label" htmlFor="confirm" style={{ fontSize: 13, color: '#555' }}>
                                I confirm that this product information is accurate and the product is handcrafted by me or my team
                            </label>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn fw-medium px-4"
                                onClick={() => navigate('/seller/products')}
                                style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn fw-semibold px-5 text-white"
                                disabled={loading}
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8 }}>
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                                : <><i className="bi bi-check-circle me-2"></i>Create Product</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProduct;
