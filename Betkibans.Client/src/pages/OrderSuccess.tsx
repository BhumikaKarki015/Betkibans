import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';

const OrderSuccess = () => (
    <Layout>
        <div className="container py-5 text-center">
            <div className="py-5">
                <i className="bi bi-check-circle-fill display-1 text-success shadow-sm rounded-circle"></i>
                <h1 className="mt-4 fw-bold">Order Placed Successfully!</h1>
                <p className="lead text-muted">Thank you for supporting local bamboo artisans. We are processing your order.</p>

                <div className="mt-4 d-flex justify-content-center gap-3">
                    <Link to="/my-orders" className="btn btn-success btn-lg px-4">
                        <i className="bi bi-bag-check me-2"></i>View My Orders
                    </Link>
                    <Link to="/products" className="btn btn-outline-success btn-lg px-4">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    </Layout>
);

export default OrderSuccess;