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
    sellerBusinessName?: string;
    discountPrice?: number;

    // Images
    productImages: ProductImage[];
    productMaterials?: { materialId: number; materialName: string }[];
    
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    
    color?: string;
    finishType?: string;
    craftingTimeDays?: string;
    careInstructions?: string;
    careWarnings?: string;

    // Optional fields
    materials?: string[];
    averageRating: number;
    totalReviews: number;
}