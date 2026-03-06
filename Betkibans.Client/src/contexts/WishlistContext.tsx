import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface WishlistContextType {
    wishlistIds: number[];
    isWishlisted: (productId: number) => boolean;
    toggleWishlist: (productId: number) => Promise<void>;
    wishlistCount: number;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
    wishlistIds: [],
    isWishlisted: () => false,
    toggleWishlist: async () => {},
    wishlistCount: 0,
    refreshWishlist: async () => {},
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);

    useEffect(() => {
        if (user) refreshWishlist();
        else setWishlistIds([]);
    }, [user]);

    const refreshWishlist = async () => {
        try {
            const res = await api.get('/Wishlist');
            setWishlistIds(res.data.map((w: any) => w.productId));
        } catch {
            setWishlistIds([]);
        }
    };

    const isWishlisted = (productId: number) => wishlistIds.includes(productId);

    const toggleWishlist = async (productId: number) => {
        if (!user) return;
        try {
            if (isWishlisted(productId)) {
                await api.delete(`/Wishlist/${productId}`);
                setWishlistIds(prev => prev.filter(id => id !== productId));
            } else {
                await api.post('/Wishlist', { productId });
                setWishlistIds(prev => [...prev, productId]);
            }
        } catch {
            console.error('Failed to toggle wishlist');
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlistIds,
            isWishlisted,
            toggleWishlist,
            wishlistCount: wishlistIds.length,
            refreshWishlist,
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
