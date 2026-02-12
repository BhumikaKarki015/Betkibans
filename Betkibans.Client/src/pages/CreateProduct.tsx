import { useState, useEffect } from 'react';
// ✅ FIX 1: Use 'import type' for these React types
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Category {
    categoryId: number;
    categoryName: string;
}

interface Material {
    materialId: number;
    materialName: string;
}

const CreateProduct = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    // ✅ NEW: State for selected images
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        categoryId: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        materialIds: [] as number[]
    });

    useEffect(() => {
        if (!user || user.role !== 'Seller') {
            navigate('/login');
            return;
        }
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
            console.error('Failed to load categories/materials', err);
            setError('Failed to load form data. Ensure backend is running.');
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ✅ NEW: Handle image selection
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Convert FileList to Array and convert to array of Files
            const filesArray = Array.from(e.target.files);
            // Basic validation: Check if files are images (optional but recommended)
            const validImages = filesArray.filter(file => file.type.startsWith('image/'));

            if (validImages.length !== filesArray.length) {
                alert("Some files were not images and were ignored.");
            }
            setSelectedImages(prevImages => [...prevImages, ...validImages]);
        }
    };

    // ✅ NEW: Remove a selected image before upload
    const removeImage = (indexToRemove: number) => {
        setSelectedImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
    };


    const handleMaterialChange = (materialId: number) => {
        const currentMaterials = [...formData.materialIds];
        const index = currentMaterials.indexOf(materialId);
        if (index > -1) {
            currentMaterials.splice(index, 1);
        } else {
            currentMaterials.push(materialId);
        }
        setFormData({ ...formData, materialIds: currentMaterials });
    };

    // ✅ UPDATED: Completely rewritten handle Submit for FormData
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (formData.materialIds.length === 0) {
            setError('Please select at least one material');
            setLoading(false);
            return;
        }
        if (selectedImages.length === 0) {
            setError('Please upload at least one product image');
            setLoading(false);
            return;
        }

        try {
            // 1. Create FormData object
            const data = new FormData();

            // 2. Append simple text fields
            data.append('Name', formData.name);
            data.append('Description', formData.description);
            data.append('Price', formData.price.toString());
            data.append('StockQuantity', formData.stockQuantity.toString());
            data.append('CategoryId', formData.categoryId.toString());
            if (formData.length) data.append('Length', formData.length.toString());
            if (formData.width) data.append('Width', formData.width.toString());
            if (formData.height) data.append('Height', formData.height.toString());
            if (formData.weight) data.append('Weight', formData.weight.toString());

            // 3. Append Arrays (Materials need special handling for FormData)
            formData.materialIds.forEach((id, index) => {
                data.append(`MaterialIds[${index}]`, id.toString());
            });

            // 4. Append Images
            selectedImages.forEach((image) => {
                // 'Images' must match the property name in the Backend DTO later
                data.append('Images', image);
            });

            // 5. Send to service
            await productService.createProduct(data);
            navigate('/seller/products');
        } catch (err: any) {
            console.error("Upload Error", err);
            if (err.response?.status === 403) {
                setError('Your seller account is not verified or permission denied.');
            } else {
                setError(err.response?.data?.message || 'Failed to create product. Check console for details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-4">
                <div className="row">
                    <div className="col-md-10 col-lg-8 mx-auto">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 className="fw-bold mb-1">Add New Product</h2>
                                <p className="text-muted mb-0">List a new bamboo or cane furniture item</p>
                            </div>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate('/seller/products')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Back
                            </button>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Basic Information Card */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <h5 className="card-title mb-3">Basic Information</h5>

                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label fw-medium">Product Name *</label>
                                        <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} required />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label fw-medium">Description *</label>
                                        <textarea className="form-control" id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="categoryId" className="form-label fw-medium">Category *</label>
                                            <select className="form-select" id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                                                <option value="">Select category</option>
                                                {categories.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-medium">Materials *</label>
                                            <div className="border rounded p-2 bg-light" style={{maxHeight: '100px', overflowY: 'auto'}}>
                                                {materials.map(mat => (
                                                    <div key={mat.materialId} className="form-check">
                                                        <input className="form-check-input" type="checkbox" id={`material-${mat.materialId}`} checked={formData.materialIds.includes(mat.materialId)} onChange={() => handleMaterialChange(mat.materialId)} />
                                                        <label className="form-check-label" htmlFor={`material-${mat.materialId}`}>{mat.materialName}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ✅ NEW: Image Upload Section */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <h5 className="card-title mb-3">Product Images</h5>
                                    <div className="mb-3">
                                        <label htmlFor="images" className="form-label fw-medium">Upload Images (First image will be cover) *</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            id="images"
                                            multiple
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handleImageChange}
                                        />
                                        <div className="form-text">Supported formats: PNG, JPG, WEBP.</div>
                                    </div>

                                    {/* Image Previews */}
                                    {selectedImages.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                            {selectedImages.map((file, index) => (
                                                <div key={index} className="position-relative" style={{width: '80px', height: '80px'}}>
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="img-thumbnail w-100 h-100" style={{objectFit: 'cover'}} />
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle badge rounded-pill p-1"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing & Dimensions Card (Same as before) */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <h5 className="card-title mb-3">Pricing & Dimensions</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="price" className="form-label fw-medium">Price (NPR) *</label>
                                            <div className="input-group"><span className="input-group-text">NPR</span><input type="number" className="form-control" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01"/></div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="stockQuantity" className="form-label fw-medium">Stock Quantity *</label>
                                            <input type="number" className="form-control" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required min="0"/>
                                        </div>
                                        {/* Dimensions (Optional) */}
                                        <div className="col-md-3 mb-3">
                                            <label htmlFor="length" className="form-label small">Length (cm)</label>
                                            <input type="number" className="form-control form-control-sm" id="length" name="length" value={formData.length} onChange={handleChange} step="0.1"/>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label htmlFor="width" className="form-label small">Width (cm)</label>
                                            <input type="number" className="form-control form-control-sm" id="width" name="width" value={formData.width} onChange={handleChange} step="0.1"/>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label htmlFor="height" className="form-label small">Height (cm)</label>
                                            <input type="number" className="form-control form-control-sm" id="height" name="height" value={formData.height} onChange={handleChange} step="0.1"/>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label htmlFor="weight" className="form-label small">Weight (kg)</label>
                                            <input type="number" className="form-control form-control-sm" id="weight" name="weight" value={formData.weight} onChange={handleChange} step="0.1"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/seller/products')}>Cancel</button>
                                <button type="submit" className="btn btn-success px-4" disabled={loading}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</> : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateProduct;