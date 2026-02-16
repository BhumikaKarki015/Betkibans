import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext'; 
import { AuthProvider } from './contexts/AuthContext';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout'; 
import OrderSuccess from './pages/OrderSuccess';
import RequestRepair from './pages/RequestRepair';
import MyRepairs from './pages/MyRepairs';

// Seller Pages
import SellerDashboard from './pages/SellerDashboard';
import CompleteProfile from './pages/CompleteProfile';
import UploadKYC from './pages/UploadKYC';
import CreateProduct from './pages/CreateProduct';
import SellerProducts from './pages/SellerProducts';
import EditProduct from './pages/EditProduct';
import SellerRepairDashboard from './pages/SellerRepairDashboard';

// Admin Pages
import AdminPanel from './pages/AdminPanel';

function App() {
        return (
            <AuthProvider>
                    <CartProvider> {/* ✅ Wrap with CartProvider so cart updates everywhere */}
                            <Routes>
                                    {/* Public & Customer Routes */}
                                    <Route path="/" element={<ProductListPage />} />
                                    <Route path="/products" element={<ProductListPage />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/checkout" element={<Checkout />} /> {/* ✅ New */}
                                    <Route path="/order-success" element={<OrderSuccess />} /> {/* ✅ New */}
                                    <Route path="/product/:id" element={<ProductDetailPage />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/request-repair" element={<RequestRepair />} />
                                    <Route path="/my-repairs" element={<MyRepairs />} />

                                    {/* Seller Routes */}
                                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                                    <Route path="/seller/complete-profile" element={<CompleteProfile />} />
                                    <Route path="/seller/upload-kyc" element={<UploadKYC />} />
                                    <Route path="/seller/create-product" element={<CreateProduct />} />
                                    <Route path="/seller/products" element={<SellerProducts />} />
                                    <Route path="/seller/edit-product/:id" element={<EditProduct />} />
                                    <Route path="/seller/repairs" element={<SellerRepairDashboard />} />

                                    {/* Admin Routes */}
                                    <Route path="/admin/panel" element={<AdminPanel />} />

                                    {/* Fallback for 404 - Optional but good for quality */}
                                    <Route path="*" element={<div className="p-5 text-center"><h1>404 - Page Not Found</h1></div>} />
                            </Routes>
                    </CartProvider>
            </AuthProvider>
        );
}

export default App;