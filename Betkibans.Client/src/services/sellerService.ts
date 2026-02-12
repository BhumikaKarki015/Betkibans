import api from './api';

interface CompleteProfileData {
    businessName: string;
    businessDescription: string;
    businessAddress: string;
    city: string;
    district: string;
}

export const sellerService = {
    getProfile: async () => {
        const response = await api.get('/Seller/profile');
        return response.data;
    },

    completeProfile: async (data: CompleteProfileData) => {
        const response = await api.post('/Seller/complete-profile', data);
        return response.data;
    },

    uploadKYC: async (businessLicense: File, idDocument: File, taxDocument: File | null) => {
        const formData = new FormData();
        formData.append('businessLicense', businessLicense);
        formData.append('idDocument', idDocument);
        if (taxDocument) {
            formData.append('taxDocument', taxDocument);
        }

        const response = await api.post('/Seller/upload-kyc', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
