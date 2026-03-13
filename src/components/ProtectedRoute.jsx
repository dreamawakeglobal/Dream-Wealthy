import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    const ALLOWED_EMAILS = [
        'w.shamerer@gmail.com',
        'Tariq.west2496@gmail.com'
    ]; // We can add more here if needed later

    // If no user is logged in, OR the user is logged in but is NOT the allowed email
    if (!user || !ALLOWED_EMAILS.includes(user.email)) {
        // Redirect to signup page
        return <Navigate to="/signup" replace />;
    }

    return children;
};
