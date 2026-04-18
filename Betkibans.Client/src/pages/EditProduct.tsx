import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Category { categoryId: number; categoryName: string; }
interface Material { materialId: number; materialName: string; }

const EditProduct = () => {
    const { showToast } = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [existingImages, setExistingImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [productStats] = useState({ views: 0, sold: 0, favorites: 0 });
    const [createdAt, setCreatedAt] = useState('');

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
        isActive: true,
        materialIds: [] as number[],
    });

    useEffect(() => {
        if (!user || user.role !== 'Seller') { navigate('/login'); return; }
        fetchAll();
    }, [id, user, navigate]);

    const fetchAll = async () => {
        try {
            const [catRes, matRes] = await Promise.all([
                api.get('/Category'),
                api.get('/Material'),
            ]);
            setCategories(catRes.data);
            setMaterials(matRes.data);

            if (!id) return;
            const product = await productService.getProductById(parseInt(id));

            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                discountPrice: product.discountPrice?.toString() || '',
                stockQuantity: product.stockQuantity?.toString() || '',
                categoryId: product.categoryId?.toString() || '',
                length: product.length?.toString() || '',
                width: product.width?.toString() || '',
                height: product.height?.toString() || '',
                weight: product.weight?.toString() || '',
                color: (product as any).color || '',
                finishType: (product as any).finishType || '',
                craftingTimeDays: (product as any).craftingTimeDays || '',
                careInstructions: (product as any).careInstructions || '',
                careWarnings: (product as any).careWarnings || '',
                isActive: (product as any).isActive !== false,
                materialIds: product.productMaterials?.map((m: any) => m.materialId) || [],
            });

            if (product.productImages) {
                setExistingImages(product.productImages.map((img: any) => ({
                    url: `${import.meta.env.VITE_API_URL}${img.imageUrl}`,
                    isPrimary: img.isPrimary,
                })));
            }

            setCreatedAt((product as any).createdAt || '');
        } catch (err) {
            setError('Failed to load product details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleMaterialChange = (materialId: number) => {
        const current = [...formData.materialIds];
        const idx = current.indexOf(materialId);
        if (idx > -1) current.splice(idx, 1);
        else current.push(materialId);
        setFormData({ ...formData, materialIds: current });
    };

    const handleNewImages = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const valid = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            setNewImages(prev => [...prev, ...valid]);
        }
    };

    const discountPercent = formData.price && formData.discountPrice
        ? Math.round((1 - parseFloat(formData.discountPrice) / parseFloat(formData.price)) * 100)
        : null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
            setError('Discount price must be lower than the original price');
            setSaving(false);
            return;
        }

        try {
            if (!id) return;
            await api.put(`/Product/${id}`, {
                productId: parseInt(id),
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
                stockQuantity: parseInt(formData.stockQuantity),
                categoryId: parseInt(formData.categoryId),
                length: formData.length ? parseFloat(formData.length) : null,
                width: formData.width ? parseFloat(formData.width) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                color: formData.color || null,
                finishType: formData.finishType || null,
                craftingTimeDays: formData.craftingTimeDays || null,
                careInstructions: formData.careInstructions || null,
                careWarnings: formData.careWarnings || null,
                isActive: formData.isActive,
                materialIds: formData.materialIds,
            });
            navigate('/seller/products');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {

        setDeleting(true);
        try {
            await productService.deleteProduct(parseInt(id!));
            navigate('/seller/products');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete product');
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border" style={{ color: '#2D6A4F' }} role="status" />
        </div>
    );

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
                            <button className="btn btn-link p-0 text-decoration-none" style={{ fontSize: 13, color: '#666' }}
                                    onClick={() => navigate('/seller/products')}>My Products</button>
                            <span className="text-muted mx-2">›</span>
                            <span style={{ color: '#2D6A4F' }}>Edit Product</span>
                        </nav>
                        <h4 className="fw-bold mb-0">Edit Product</h4>
                        <small className="text-muted">Update your product listing</small>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm fw-medium"
                                onClick={() => navigate(`/product/${id}`)}
                                style={{ borderColor: '#2D6A4F', color: '#2D6A4F', borderRadius: 8, fontSize: 13 }}>
                            <i className="bi bi-eye me-1"></i>View Page
                        </button>
                        <button className="btn btn-sm fw-medium"
                                onClick={() => navigate('/seller/products')}
                                style={{ borderColor: '#CCC', color: '#555', borderRadius: 8, fontSize: 13 }}>
                            <i className="bi bi-arrow-left me-1"></i>Back
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{ fontSize: 14 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>{error}
                    </div>
                )}

                {/* ── 0. Product Status Card ── */}
                <div className="p-4 mb-3" style={cardStyle}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={sectionNumStyle}><i className="bi bi-bar-chart-fill" style={{ fontSize: 11 }}></i></div>
                        <h6 className="fw-bold mb-0">Current Product Status</h6>
                    </div>
                    <div className="row g-3 mb-3">
                        {[
                            { label: 'Views', value: productStats.views || '—', icon: 'bi-eye' },
                            { label: 'Favorites', value: productStats.favorites || '—', icon: 'bi-heart' },
                            { label: 'Sold', value: productStats.sold || '—', icon: 'bi-bag-check' },
                        ].map(s => (
                            <div key={s.label} className="col-4 text-center">
                                <div className="rounded-2 py-2" style={{ backgroundColor: '#F0EBE1' }}>
                                    <i className={`bi ${s.icon} d-block mb-1`} style={{ color: '#2D6A4F', fontSize: 18 }}></i>
                                    <div className="fw-bold" style={{ fontSize: 18 }}>{s.value}</div>
                                    <small className="text-muted">{s.label}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: 13, color: '#555' }}>Product Status:</span>
                            <div className="form-check form-switch mb-0">
                                <input className="form-check-input" type="checkbox" name="isActive"
                                       checked={formData.isActive}
                                       onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                <label className="form-check-label fw-medium" style={{ fontSize: 13, color: formData.isActive ? '#2D6A4F' : '#999' }}>
                                    {formData.isActive ? 'Active (visible to buyers)' : 'Inactive (hidden)'}
                                </label>
                            </div>
                        </div>
                        {createdAt && (
                            <small className="text-muted">
                                Listed: {new Date(createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </small>
                        )}
                    </div>
                </div>

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
                                   onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Description *</label>
                            <textarea className="form-control" name="description" value={formData.description}
                                      onChange={handleChange} rows={4} required style={inputStyle} />
                            <small className="text-muted">{formData.description.length} / 2000</small>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Category *</label>
                                <select className="form-select" name="categoryId" value={formData.categoryId}
                                        onChange={handleChange} required style={inputStyle}>
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                </select>
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
                                           onChange={handleChange} required min="0" style={inputStyle} />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                    Discount Price
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
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Stock Quantity *</label>
                                <input type="number" className="form-control" name="stockQuantity"
                                       value={formData.stockQuantity} onChange={handleChange} required min="0"
                                       style={inputStyle} />
                                {parseInt(formData.stockQuantity) <= 3 && parseInt(formData.stockQuantity) > 0 && (
                                    <small style={{ color: '#E65100' }}>⚠ Low stock — consider restocking</small>
                                )}
                                {formData.stockQuantity === '0' && (
                                    <small className="text-danger">Out of stock — product will be hidden</small>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Crafting Time (Days)</label>
                                <input type="text" className="form-control" name="craftingTimeDays"
                                       value={formData.craftingTimeDays} onChange={handleChange}
                                       style={inputStyle} placeholder="e.g. 3-4" />
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Product Images ── */}
                    <div className="p-4 mb-3" style={cardStyle}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={sectionNumStyle}>3</div>
                            <h6 className="fw-bold mb-0">Product Images</h6>
                        </div>

                        {/* Existing images */}
                        {existingImages.length > 0 && (
                            <div className="mb-3">
                                <small className="text-muted fw-medium d-block mb-2">Current Images</small>
                                <div className="d-flex flex-wrap gap-2">
                                    {existingImages.map((img, i) => (
                                        <div key={i} className="position-relative" style={{ width: 80, height: 80 }}>
                                            <img src={img.url} alt={`product-${i}`}
                                                 className="rounded-2 w-100 h-100" style={{ objectFit: 'cover' }} />
                                            {img.isPrimary && (
                                                <span className="position-absolute bottom-0 start-0 w-100 text-center"
                                                      style={{ backgroundColor: 'rgba(45,106,79,0.8)', color: 'white', fontSize: 9, borderRadius: '0 0 6px 6px', padding: '1px 0' }}>
                                                    Cover
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add new images */}
                        <label className="d-flex flex-column align-items-center justify-content-center rounded-3 p-3 mb-2"
                               style={{ border: '2px dashed #C5BFB4', cursor: 'pointer', backgroundColor: '#F8F5F0' }}>
                            <i className="bi bi-plus-circle" style={{ fontSize: 22, color: '#2D6A4F' }}></i>
                            <span className="fw-medium mt-1" style={{ fontSize: 13 }}>Add More Images</span>
                            <small className="text-muted">PNG, JPG, WEBP</small>
                            <input type="file" className="d-none" multiple accept="image/png,image/jpeg,image/jpg,image/webp"
                                   onChange={handleNewImages} />
                        </label>

                        {newImages.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {newImages.map((file, i) => (
                                    <div key={i} className="position-relative" style={{ width: 80, height: 80 }}>
                                        <img src={URL.createObjectURL(file)} alt="new"
                                             className="rounded-2 w-100 h-100" style={{ objectFit: 'cover' }} />
                                        <button type="button"
                                                className="position-absolute d-flex align-items-center justify-content-center"
                                                onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
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

                        <p className="fw-medium mb-2" style={{ fontSize: 13, color: '#555' }}>Dimensions</p>
                        <div className="row g-2 mb-3">
                            {['length', 'width', 'height', 'weight'].map(field => (
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
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>General Care Instructions</label>
                            <textarea className="form-control" name="careInstructions" value={formData.careInstructions}
                                      onChange={handleChange} rows={3} style={inputStyle}
                                      placeholder="e.g. Wipe with soft dry cloth. Keep away from direct sunlight..." />
                        </div>
                        <div>
                            <label className="form-label fw-medium" style={{ fontSize: 13 }}>
                                Warnings & Cautions <small className="text-muted fw-normal">(optional)</small>
                            </label>
                            <textarea className="form-control" name="careWarnings" value={formData.careWarnings}
                                      onChange={handleChange} rows={2} style={inputStyle}
                                      placeholder="e.g. Do not drag across floor. Avoid harsh chemicals..." />
                        </div>
                    </div>

                    {/* Submit buttons */}
                    <div className="d-flex justify-content-end gap-2 mb-4">
                        <button type="button" className="btn fw-medium px-4"
                                onClick={() => navigate('/seller/products')}
                                style={{ borderColor: '#CCC', color: '#555', borderRadius: 8 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn fw-semibold px-5 text-white"
                                disabled={saving}
                                style={{ backgroundColor: '#2D6A4F', borderRadius: 8 }}>
                            {saving
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                : <><i className="bi bi-check-circle me-2"></i>Save Changes</>}
                        </button>
                    </div>
                </form>

                {/* ── Danger Zone ── */}
                <div className="p-4 mb-4 rounded-3" style={{ border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5' }}>
                    <h6 className="fw-bold mb-1" style={{ color: '#C62828' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>Danger Zone
                    </h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                        Permanently delete this product and all its images. This action cannot be undone.
                    </p>
                    <button className="btn btn-sm fw-semibold"
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{ backgroundColor: '#C62828', color: 'white', borderRadius: 8, border: 'none' }}>
                        {deleting
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</>
                            : <><i className="bi bi-trash3 me-2"></i>Delete Product</>}
                    </button>
                </div>
            </div>
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: 14, padding: '32px 28px',
                        maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <h5 className="fw-bold mb-2">Delete this product?</h5>
                        <p className="text-muted small mb-4">This is permanent and cannot be undone.</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <button className="btn btn-outline-secondary rounded-pill px-4"
                                    onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn rounded-pill px-4 fw-semibold"
                                    style={{ backgroundColor: '#E53E3E', color: 'white', border: 'none' }}
                                    onClick={() => { handleDeleteProduct(); setShowDeleteConfirm(false); }}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EditProduct;
