import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';

// Public & Customer Pages
import Home from './pages/Home';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Register from './pages/Register';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import OrderDetail from './pages/OrderDetail';
import OrderSuccess from './pages/OrderSuccess';
import RequestRepair from './pages/RequestRepair';
import MyRepairs from './pages/MyRepairs';
import CareGuide from './pages/CareGuide';
import OrderHistory from './pages/OrderHistory';
import UserProfile from './pages/UserProfile';
import AddressManagement from './pages/AddressManagement';
import Wishlist from './pages/Wishlist';
import ForgotPassword from './pages/ForgotPassword';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Support from './pages/Support';
import SellerPolicies from './pages/SellerPolicies';
import ResetPassword from './pages/ResetPassword';

// Seller Pages
import SellerDashboard from './pages/SellerDashboard';
import CompleteProfile from './pages/CompleteProfile';
import UploadKYC from './pages/UploadKYC';
import CreateProduct from './pages/CreateProduct';
import SellerProducts from './pages/SellerProducts';
import SellerProfile from './pages/SellerProfile';
import EditProduct from './pages/EditProduct';
import SellerRepairDashboard from './pages/SellerRepairDashboard';
import SellerOrders from './pages/SellerOrders';
import SellerAnalytics from './pages/SellerAnalytics';
import SellerSettings from './pages/SellerSettings';

// Admin Pages
import AdminPanel from './pages/AdminPanel';

function App() {
        return (
            <GoogleOAuthProvider clientId="750516497549-9pimeon3vehh2i4ronbj74s7aq335ao5.apps.googleusercontent.com">
                    <ToastProvider>
                            <AuthProvider>
                                    <CartProvider>
                                            <WishlistProvider>
                                                    <Routes>
                                                            {/* Admin routes - NO Layout wrapper */}
                                                            <Route path="/admin/panel" element={<AdminPanel />} />
                                                            <Route path="/admin/users" element={<AdminPanel />} />
                                                            <Route path="/admin/sellers" element={<AdminPanel />} />
                                                            <Route path="/admin/verify-sellers" element={<AdminPanel />} />
                                                            <Route path="/admin/products" element={<AdminPanel />} />
                                                            <Route path="/admin/orders" element={<AdminPanel />} />
                                                            <Route path="/admin/analytics" element={<AdminPanel />} />
                                                            <Route path="/admin/settings" element={<AdminPanel />} />
                                                            <Route path="/admin/messages" element={<AdminPanel />} />

                                                            {/* All other routes - WITH Layout wrapper */}
                                                            <Route path="/*" element={
                                                                    <Layout>
                                                                            <Routes>
                                                                                    <Route path="/" element={<Home />} />
                                                                                    <Route path="/products" element={<ProductListPage />} />
                                                                                    <Route path="/cart" element={<Cart />} />
                                                                                    <Route path="/checkout" element={<Checkout />} />
                                                                                    <Route path="/payment/success" element={<PaymentSuccess />} />
                                                                                    <Route path="/order-success" element={<OrderSuccess />} />
                                                                                    <Route path="/product/:id" element={<ProductDetailPage />} />
                                                                                    <Route path="/login" element={<Login />} />
                                                                                    <Route path="/register" element={<Register />} />
                                                                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                                                                    <Route path="/reset-password" element={<ResetPassword />} />
                                                                                    <Route path="/change-password" element={<ChangePassword />} />
                                                                                    <Route path="/request-repair" element={<RequestRepair />} />
                                                                                    <Route path="/my-repairs" element={<MyRepairs />} />
                                                                                    <Route path="/care-guide" element={<CareGuide />} />
                                                                                    <Route path="/orders" element={<OrderHistory />} />
                                                                                    <Route path="/orders/:orderId" element={<OrderDetail />} />
                                                                                    <Route path="/addresses" element={<AddressManagement />} />
                                                                                    <Route path="/profile" element={<UserProfile />} />
                                                                                    <Route path="/wishlist" element={<Wishlist />} />
                                                                                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                                                                                    <Route path="/seller/profile" element={<SellerProfile />} />
                                                                                    <Route path="/seller/complete-profile" element={<CompleteProfile />} />
                                                                                    <Route path="/seller/upload-kyc" element={<UploadKYC />} />
                                                                                    <Route path="/seller/create-product" element={<CreateProduct />} />
                                                                                    <Route path="/seller/products" element={<SellerProducts />} />
                                                                                    <Route path="/seller/edit-product/:id" element={<EditProduct />} />
                                                                                    <Route path="/seller/repairs" element={<SellerRepairDashboard />} />
                                                                                    <Route path="/seller/orders" element={<SellerOrders />} />
                                                                                    <Route path="/seller/analytics" element={<SellerAnalytics />} />
                                                                                    <Route path="/about" element={<AboutUs />} />
                                                                                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                                                                    <Route path="/contact" element={<ContactUs />} />
                                                                                    <Route path="/support" element={<Support />} />
                                                                                    <Route path="/seller-policies" element={<SellerPolicies />} />
                                                                                    <Route path="/seller/settings" element={<SellerSettings />} />
                                                                                    <Route path="*" element={<div className="p-5 text-center"><h1>404 - Page Not Found</h1></div>} />
                                                                            </Routes>
                                                                    </Layout>
                                                            } />
                                                    </Routes>
                                            </WishlistProvider>
                                    </CartProvider>
                            </AuthProvider>
                    </ToastProvider>
            </GoogleOAuthProvider>
        );
}

export default App;