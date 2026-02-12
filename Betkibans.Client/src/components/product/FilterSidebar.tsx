import { useState, useEffect } from 'react';
import type { ProductFilters } from '../../services/productService';
import api from '../../services/api';

interface Category {
    categoryId: number;
    categoryName: string;
}

interface Material {
    materialId: number;
    materialName: string;
}

interface FilterSidebarProps {
    onFilterChange: (filters: Partial<ProductFilters>) => void;
}

const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);

    // Local state (Waiting for user to click "Apply")
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, matRes] = await Promise.all([
                    api.get('/Category'),
                    api.get('/Material')
                ]);
                setCategories(catRes.data);
                setMaterials(matRes.data);
            } catch (err) {
                console.error("Failed to load filters", err);
            }
        };
        fetchData();
    }, []);

    const handleCategoryToggle = (id: number) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
        // Note: We removed onFilterChange() here. Now we wait for the button.
    };

    const handleMaterialToggle = (id: number) => {
        setSelectedMaterials(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    // ✅ ONE BUTTON TO RULE THEM ALL
    const handleApplyFilters = () => {
        onFilterChange({
            categoryIds: selectedCategories,
            materialIds: selectedMaterials,
            minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
            maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined
        });
    };

    const handleReset = () => {
        setSelectedCategories([]);
        setSelectedMaterials([]);
        setPriceRange({ min: '', max: '' });
        onFilterChange({
            categoryIds: [],
            materialIds: [],
            minPrice: undefined,
            maxPrice: undefined
        });
        window.location.reload(); // Hard reset to be safe
    };

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white fw-bold">
                Filters
            </div>
            <div className="card-body">
                {/* Categories */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-2">Category</h6>
                    <div className="d-flex flex-column gap-2">
                        {categories.map(cat => (
                            <div key={cat.categoryId} className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`cat-${cat.categoryId}`}
                                    checked={selectedCategories.includes(cat.categoryId)}
                                    onChange={() => handleCategoryToggle(cat.categoryId)}
                                />
                                <label className="form-check-label" htmlFor={`cat-${cat.categoryId}`}>
                                    {cat.categoryName}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Materials */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-2">Material</h6>
                    <div className="d-flex flex-column gap-2">
                        {materials.map(mat => (
                            <div key={mat.materialId} className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`mat-${mat.materialId}`}
                                    checked={selectedMaterials.includes(mat.materialId)}
                                    onChange={() => handleMaterialToggle(mat.materialId)}
                                />
                                <label className="form-check-label" htmlFor={`mat-${mat.materialId}`}>
                                    {mat.materialName}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="mb-3">
                    <h6 className="fw-bold mb-2">Price Range (NPR)</h6>
                    <div className="row g-2">
                        <div className="col-6">
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                            />
                        </div>
                        <div className="col-6">
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                <button
                    className="btn btn-success w-100 mb-2"
                    onClick={handleApplyFilters}
                >
                    Apply Filters
                </button>

                {/* Reset Button */}
                <button
                    className="btn btn-outline-secondary w-100 btn-sm"
                    onClick={handleReset}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;