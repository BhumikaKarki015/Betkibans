export interface ProductImage {
    productImageId: number;
    imageUrl: string;
    isPrimary: boolean;
}

export interface Product {
    productId: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryName: string;
    categoryId: number;

    // Images
    productImages: ProductImage[];

    // ✅ NEW: Added these missing dimension fields
    length?: number;
    width?: number;
    height?: number;
    weight?: number;

    // Optional fields
    materials?: string[];
    averageRating: number;
    totalReviews: number;
}