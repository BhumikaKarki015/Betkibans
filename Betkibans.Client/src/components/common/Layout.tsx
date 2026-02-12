import React from 'react';
import Header from './Header';
// We'll build the Footer soon
const Footer = () => <footer className="bg-gray-800 text-white p-4 text-center mt-auto">© 2026 Betkibans</footer>;

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;