import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requireOnboarding = true }) => {
    const { user, hasCompletedOnboarding } = useAuth();

    const ALLOWED_EMAILS = [
        'w.shamerer@gmail.com'.toLowerCase(),
        'tariq.west2496@gmail.com'.toLowerCase(),
        'jay.bonier@gmail.com'.toLowerCase(),
        'adrianna.turner2005@gmail.com'.toLowerCase(),
        'riqlondon@gmail.com'.toLowerCase(),
        'west.terrion@yahoo.com'.trim().toLowerCase(),
        'kamvaughn1@gmail.com'.toLowerCase()
    ]; // We can add more here if needed later

    // If no user is logged in, OR the user is logged in but is NOT the allowed email
    const userEmail = user?.email?.trim().toLowerCase() || '';
    if (!user || !ALLOWED_EMAILS.includes(userEmail)) {
        // Redirect to signup page
        return <Navigate to="/signup" replace />;
    }

    // Force onboarding if they haven't done it, UNLESS the route explicitly doesn't require it (like the /onboarding route itself)
    if (requireOnboarding && hasCompletedOnboarding !== true) {
        return <Navigate to="/onboarding" replace />;
    }

    // If they TRY to go to /onboarding but they already finished it, push them back to dashboard
    if (!requireOnboarding && hasCompletedOnboarding === true) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};
