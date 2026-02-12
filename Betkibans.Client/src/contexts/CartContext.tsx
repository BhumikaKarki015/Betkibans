import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
    cartItemId: number;
    productId: number;
    quantity: number;
    product: {
        name: string;
        price: number;
        productImages: { imageUrl: string }[];
    };
}

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (productId: number, quantity: number) => Promise<void>;
    removeFromCart: (cartItemId: number) => Promise<void>;
    updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
    refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const refreshCart = async () => {
        if (!user) {
            setCartItems([]);
            return;
        }
        try {
            const res = await api.get('/Cart');
            setCartItems(res.data.cartItems || []);
        } catch (err) {
            console.error("Cart fetch failed", err);
        }
    };

    useEffect(() => { refreshCart(); }, [user]);

    const addToCart = async (productId: number, quantity: number) => {
        await api.post('/Cart/add', { productId, quantity });
        refreshCart();
    };

    const removeFromCart = async (cartItemId: number) => {
        await api.delete(`/Cart/item/${cartItemId}`);
        refreshCart();
    };

    const updateQuantity = async (cartItemId: number, quantity: number) => {
        await api.put('/Cart/update-quantity', { cartItemId, quantity });
        refreshCart();
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};