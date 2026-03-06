import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    
    const hideLayoutPaths = ['/login', '/register'];
    
    const shouldHideLayout = hideLayoutPaths.includes(location.pathname);

    if (shouldHideLayout) {
        return <main>{children}</main>;
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <main className="flex-grow-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;