import api from './api';
import type { Product } from '../types/Product';

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
    getAllProducts: async (filters?: ProductFilters): Promise<Product[]> => {
        const response = await api.get('/Product', {
            params: filters,
            paramsSerializer: (params) => {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(key, v.toString()));
                    } else {
                        searchParams.append(key, value.toString());
                    }
                });
                return searchParams.toString();
            }
        });
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