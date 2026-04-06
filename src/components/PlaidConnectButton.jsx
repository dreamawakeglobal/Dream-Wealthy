import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../contexts/AuthContext';
import { useFinancialContext } from '../FinancialContext';
import { supabase } from '../supabaseClient';
import { Link2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import './PlaidConnectButton.css';

const PlaidConnectButton = ({ onConnectionSuccess, isUpdateMode = false, linkedAccessToken = null, brokenAccountId = null }) => {
    const { user } = useAuth();
    const { fetchAllData } = useFinancialContext();
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
                body: JSON.stringify({ userId: user.id, accessToken: linkedAccessToken })
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                console.error("Link Token Failure Payload:", data);
                if (data && data.error) {
                    if (typeof data.error === 'object') {
                        throw new Error(JSON.stringify(data.error));
                    }
                    throw new Error(data.error);
                } else {
                    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
                }
            }

            if (data?.link_token) {
                setToken(data.link_token);
            } else {
                throw new Error("Did not receive link_token from server: " + JSON.stringify(data));
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

            // [UPDATE MODE BYPASS] If we are merely repairing a broken connection, do NOT exchange a new token!
            // Simply repair the flags natively and close the loop.
            if (isUpdateMode && brokenAccountId) {
                const { error: relinkError } = await supabase
                    .from('accounts')
                    .update({ needs_relink: false })
                    .eq('id', brokenAccountId);

                if (relinkError) throw new Error("Database Error: Could not clear relink lock.");

                setSuccessMessage(`Successfully restored connection for ${institutionName}!`);
                await fetchAllData();
                if (onConnectionSuccess) onConnectionSuccess();
                setIsExchanging(false);
                return;
            }

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
            if (!response.ok) throw new Error(data.error || data.message || `Raw Server Error: ${JSON.stringify(data)}`);

            setSuccessMessage(`Successfully connected to ${institutionName}!`);
            await fetchAllData(); // <--- Dynamically repaint the UI with the fresh data!
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

    // Capital One OAuth Interception: If the browser URL contains an active OAuth state, 
    // we explicitly route the physical callback directly into the Plaid Link configuration dynamically.
    if (window.location.href.includes('?oauth_state_id=')) {
        config.receivedRedirectUri = window.location.href;
    }

    const { open, ready } = usePlaidLink(config);

    // If an OAuth Redirect occurred successfully from Capital One, the system autonomously 
    // re-opens the Plaid modal to officially conclude the token extraction sequence!
    useEffect(() => {
        if (ready && window.location.href.includes('?oauth_state_id=')) {
            open();
        }
    }, [ready, open]);

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
