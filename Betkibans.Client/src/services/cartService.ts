import api from './api';
import type { CartItem } from '../types/Cart'; 

export const cartService = {
    // GET /api/Cart
    getCart: async () => {
        const response = await api.get<CartItem[]>('/Cart');
        return response.data;
    },

    // POST /api/Cart/add
    addToCart: async (productId: number, quantity: number) => {
        const response = await api.post('/Cart/add', { productId, quantity });
        return response.data;
    },

    // DELETE /api/Cart/remove/{productId}
    removeFromCart: async (productId: number) => {
        const response = await api.delete(`/Cart/remove/${productId}`);
        return response.data;
    }
};