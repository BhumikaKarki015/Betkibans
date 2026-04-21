import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    phoneNumber?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Creates a global authentication context to share user and token data
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Stores the currently logged-in user information
    const [user, setUser] = useState<User | null>(null);
    // Stores the authentication token for protected API access
    const [token, setToken] = useState<string | null>(null);
    // Tracks whether authentication data is still being loaded from session storage
    const [isLoading, setIsLoading] = useState(true); // ← INSIDE component
    const navigate = useNavigate();

    useEffect(() => {
        // Restore authentication state after page refresh using session storage
        const savedToken = sessionStorage.getItem('token');
        const savedUser = sessionStorage.getItem('user');

        if (savedToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch {
                // Clear invalid session data if parsing fails
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        // Save authentication data in state and session storage after login
        setToken(newToken);
        setUser(userData);
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
        navigate('/');
    };

    // Clear authentication state and remove session data on logout
    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // Converts token presence into a boolean authentication check
    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
