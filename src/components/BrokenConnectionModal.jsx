import React from 'react';
import { useStore } from '../store';
import PlaidConnectButton from './PlaidConnectButton';
import { ShieldAlert } from 'lucide-react';
import './BrokenConnectionModal.css';

const BrokenConnectionModal = () => {
    // Only extract the accounts array to prevent unnecessary re-renders
    const accounts = useStore(state => state.accounts) || [];
    const brokenAccount = accounts.find(a => a.needs_relink);

    if (!brokenAccount) return null;

    return (
        <div className="broken-connection-overlay">
            <div className="broken-connection-modal glass">
                <div className="broken-icon-ring glass">
                    <ShieldAlert size={32} className="broken-icon" />
                </div>
                <h2>Connection Paused</h2>
                <p>
                    Your bank credentials for <strong>{brokenAccount.name || 'your synced account'}</strong> require a quick security verification to resume the auto-trackers.
                </p>
                <div className="broken-action-container">
                    <PlaidConnectButton 
                        isUpdateMode={true} 
                        linkedAccessToken={brokenAccount.plaid_access_token} 
                        brokenAccountId={brokenAccount.id} 
                    />
                </div>
            </div>
        </div>
    );
};

export default BrokenConnectionModal;
