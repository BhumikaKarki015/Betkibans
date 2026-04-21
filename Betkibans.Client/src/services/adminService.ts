import api from './api';

export const adminService = {
    //  URL pointing to the new AdminController
    getPendingSellers: async () => {
        const response = await api.get('/Admin/pending-sellers');
        return response.data;
    },

    verifySeller: async (sellerId: number, isApproved: boolean, rejectionReason?: string) => {
        // pointing to '/Seller/verify' instead of '/Admin/verify-seller'
        const response = await api.put(`/Seller/verify/${sellerId}`, {
            isApproved,
            rejectionReason
        });
        return response.data;
    },
};