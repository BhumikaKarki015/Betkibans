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

// Creates a global cart context to share cart data and actions across components
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    // Stores the current list of items in the user's cart
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const refreshCart = async () => {
        // Clear the cart if no user is logged in
        if (!user) {
            setCartItems([]);
            return;
        }
        try {
            // Fetch the latest cart data from the backend
            const res = await api.get('/Cart');
            setCartItems(res.data.cartItems || []);
        } catch (err) {
            console.error("Cart fetch failed", err);
        }
    };

    // Reload cart data whenever the authenticated user changes
    useEffect(() => { refreshCart(); }, [user]);

    const addToCart = async (productId: number, quantity: number) => {
        // Add a product to the cart, then refresh the cart state
        await api.post('/Cart/add', { productId, quantity });
        refreshCart();
    };

    const removeFromCart = async (cartItemId: number) => {
        // Remove a cart item by its id, then refresh the cart state
        await api.delete(`/Cart/item/${cartItemId}`);
        refreshCart();
    };

    // Update item quantity in the cart, then refresh the cart state
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