import api from './api';
import type { Product } from '../types/Product';

// Define what filters look like
export interface ProductFilters {
    search?: string;
    categoryIds?: number[];
    materialIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    sellerId?: number;
}

export const productService = {
    // Accept 'filters' as an argument here!
    getAllProducts: async (filters?: ProductFilters): Promise<Product[]> => {
        const params = new URLSearchParams();

        // Convert the object into URL parameters
        if (filters) {
            if (filters.search) params.append('search', filters.search);
            if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.sellerId) params.append('sellerId', filters.sellerId.toString());

            // Handle Arrays (e.g. categoryIds=1&categoryIds=2)
            filters.categoryIds?.forEach(id => params.append('categoryIds', id.toString()));
            filters.materialIds?.forEach(id => params.append('materialIds', id.toString()));
        }

        // Send the parameters to the backend
        const response = await api.get('/Product', { params });
        return response.data;
    },

    getProductById: async (id: number): Promise<Product> => {
        const response = await api.get(`/Product/${id}`);
        return response.data;
    },

    createProduct: async (data: FormData): Promise<Product> => {
        const response = await api.post('/Product', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateProduct: async (id: number, data: any): Promise<Product> => {
        const response = await api.put(`/Product/${id}`, data);
        return response.data;
    },

    deleteProduct: async (productId: number): Promise<void> => {
        await api.delete(`/Product/${productId}`);
    },

    getSellerProducts: async (): Promise<Product[]> => {
        const response = await api.get('/Product/seller/mine');
        return response.data;
    },
};