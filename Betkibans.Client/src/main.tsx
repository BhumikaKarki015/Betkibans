import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './index.css';
import './styles/mobile.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* 1. BrowserRouter must be outermost so AuthProvider can use navigate() */}
        <BrowserRouter>
            {/* 2. AuthProvider provides user status to the rest of the app */}
            <AuthProvider>
                {/* 3. CartProvider can now see if a user is logged in */}
                <CartProvider>
                    <App />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);