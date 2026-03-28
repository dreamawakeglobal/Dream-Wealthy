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
        'kamvaughn1@gmail.com'.toLowerCase(),
        'artisaangel@gmail.com'.toLowerCase(),
        'keltonreed16@gmail.com'.trim().toLowerCase()
    ]; // We can add more here if needed later

    const userEmail = user?.email?.trim().toLowerCase() || '';

    // If absolutely no user is logged in
    if (!user) {
        return <Navigate to="/signup" replace />;
    }

    // If user is logged in, but not on the whitelist API
    if (user && !ALLOWED_EMAILS.includes(userEmail)) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', marginTop: '100px' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Beta Access Restricted</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Sorry, <strong>{userEmail}</strong> is not currently on the approved Beta Access list.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Please contact an administrator to whitelist this email.</p>
            </div>
        );
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
