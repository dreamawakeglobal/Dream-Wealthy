import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        // If user is not authenticated, redirect to sign up page
        return <Navigate to="/signup" replace />;
    }

    return children;
};
