import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    const ALLOWED_EMAIL = 'w.shamerer@gmail.com';

    // If no user is logged in, OR the user is logged in but is NOT the allowed email
    if (!user || user.email !== ALLOWED_EMAIL) {
        // Redirect to signup page
        return <Navigate to="/signup" replace />;
    }

    return children;
};
