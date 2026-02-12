export interface CartItem {
    cartItemId: number;
    productId: number;
    productName: string;
    productImageUrl?: string;
    price: number;
    quantity: number;
    subtotal: number;
}