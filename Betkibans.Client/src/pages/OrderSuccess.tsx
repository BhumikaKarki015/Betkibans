import { useNavigate } from 'react-router-dom'; 

const OrderSuccess = () => {
    const navigate = useNavigate(); 

    return (
        <div className="container py-5 text-center">
            <div className="py-5">
                <div className="display-1 text-success mb-4">✅</div>
                <h1 className="fw-bold mb-3">Order Placed Successfully!</h1>
                <p className="text-muted mb-5 fs-5">
                    Thank you for supporting local bamboo artisans. We are processing your order.
                </p>

                <div className="d-flex justify-content-center gap-3">
                    <button
                        className="btn btn-success btn-lg px-4 rounded-pill"
                        onClick={() => navigate('/orders')} 
                    >
                        View My Orders
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-lg px-4 rounded-pill"
                        onClick={() => navigate('/')}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;