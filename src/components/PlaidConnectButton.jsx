import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Link2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import './PlaidConnectButton.css';

const PlaidConnectButton = ({ onConnectionSuccess }) => {
    const { user } = useAuth();
    const [token, setToken] = useState(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [isExchanging, setIsExchanging] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // 1. Generate Link Token on Component Mount if needed, or when button is clicked
    const generateToken = useCallback(async () => {
        if (!user) return;
        setIsGeneratingToken(true);
        setError(null);
        try {
            // Fetch the active session token to pass to the Edge Function
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error("Could not retrieve authentication session.");

            // Call our secure Supabase Edge Function with explicit Auth Header
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-link-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to generate link token.");
            if (data?.link_token) {
                setToken(data.link_token);
            } else {
                throw new Error("Did not receive link_token from server.");
            }
        } catch (err) {
            console.error('Error generating link token:', err);
            setError(`Link Error: ${err.message || err.toString()}`);
        } finally {
            setIsGeneratingToken(false);
        }
    }, [user]);

    // Generate token eagerly so the modal is ready instantly when clicked
    useEffect(() => {
        if (user && !token) {
            generateToken();
        }
    }, [user, token, generateToken]);

    // 2. Handle the successful bank login from the Plaid UI
    const onSuccess = useCallback(async (public_token, metadata) => {
        setIsExchanging(true);
        setError(null);
        try {
            const institutionName = metadata?.institution?.name || 'Bank Account';

            // Fetch active session token for exchange
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error("Could not retrieve authentication session.");

            // Send public token to our Edge Function for permanent secure exchange
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exchange-public-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ publicToken: public_token, institutionName })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to exchange public token.");

            setSuccessMessage(`Successfully connected to ${institutionName}!`);
            if (onConnectionSuccess) onConnectionSuccess();

        } catch (err) {
            console.error('Error exchanging public token:', err);
            setError(`Exchange Error: ${err.message || err.toString()}`);
        } finally {
            setIsExchanging(false);
        }
    }, [onConnectionSuccess]);

    const config = {
        token,
        onSuccess,
    };

    const { open, ready } = usePlaidLink(config);

    if (successMessage) {
        return (
            <div className="plaid-success-state">
                <CheckCircle2 size={20} className="success-icon" />
                <span>{successMessage}</span>
            </div>
        );
    }

    return (
        <div className="plaid-connect-wrapper">
            <button
                className="plaid-connect-button"
                onClick={() => open()}
                disabled={!ready || isGeneratingToken || isExchanging}
            >
                {isGeneratingToken || isExchanging ? (
                    <>
                        <Loader2 className="spinner" size={18} />
                        {isExchanging ? 'Securing Connection...' : 'Loading Gateway...'}
                    </>
                ) : (
                    <>
                        <Link2 size={18} />
                        Connect Bank Account
                    </>
                )}
            </button>
            {error && (
                <div className="plaid-error-message">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default PlaidConnectButton;
