import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { supabase } from '../supabaseClient';
import { useStore } from '../store';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Lock, Camera, Save, Bell, Shield, Loader2, Link2, Sparkles, Briefcase, Zap, BrainCircuit, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PlaidConnectButton from '../components/PlaidConnectButton';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import './Settings.css';

const Settings = () => {
    const { user, setTutorialActive } = useAuth();
    const { playPop } = useSound();
    const { expenseBorderColor, setExpenseBorderColor } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const accounts = useStore(state => state.accounts) || [];

    // State for Profile Information
    const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
    const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
    const [email] = useState(user?.email || '');
    const [profileUpdating, setProfileUpdating] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // State for AI Advisor Persona
    const [activePersona, setActivePersona] = useState(user?.user_metadata?.advisor_persona || 'wealth_manager');
    const [personaUpdating, setPersonaUpdating] = useState(false);
    const [personaMessage, setPersonaMessage] = useState({ type: '', text: '' });

    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // State for Password Change
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const handleAvatarUpload = async (event) => {
        if(playPop) playPop();
        try {
            setUploadingAvatar(true);
            setProfileMessage({ type: '', text: '' });

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Try to upload to "avatars" bucket
            let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("row-level security") || uploadError.message.includes("Could not find the bucket")) {
                    throw new Error('Storage bucket missing. Please create a public bucket named "avatars" in Supabase.');
                }
                throw uploadError;
            }

            // Get public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            setProfileMessage({ type: 'success', text: 'Profile picture updated successfully!' });

        } catch (error) {
            setProfileMessage({ type: 'error', text: error.message });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if(playPop) playPop();
        setProfileUpdating(true);
        setProfileMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.auth.updateUser({
                data: { first_name: firstName, last_name: lastName }
            });

            if (error) throw error;
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.message });
        } finally {
            setProfileUpdating(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if(playPop) playPop();
        setPasswordUpdating(true);
        setPasswordMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: "Passwords do not match." });
            setPasswordUpdating(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message });
        } finally {
            setPasswordUpdating(false);
        }
    };

    const handleRestartTutorial = () => {
        if(playPop) playPop();
        setTutorialActive(true);
        navigate('/dashboard');
    };

    return (
        <div className="settings-page-container animate-fade-in">
            <div className="settings-header">
                <h1 className="settings-title">Profile Settings</h1>
                <p className="text-secondary">Manage your account details, security, and preferences.</p>
            </div>

            <Card glass className="settings-container">
                {/* Settings Sidebar */}
                <div className="settings-sidebar">
                    <button 
                        className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setActiveTab('profile'); }}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button 
                        className={`settings-tab ${activeTab === 'advisor' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setActiveTab('advisor'); }}
                    >
                        <Sparkles size={18} /> Financial Advisor
                    </button>
                    <button 
                        className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setActiveTab('security'); }}
                    >
                        <Shield size={18} /> Security
                    </button>
                    <button 
                        className={`settings-tab ${activeTab === 'integrations' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setActiveTab('integrations'); }}
                    >
                        <Link2 size={18} /> Integrations
                    </button>
                    <button 
                        className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => { if(playPop) playPop(); setActiveTab('preferences'); }}
                    >
                        <Bell size={18} /> Preferences
                    </button>
                </div>

                <div className="settings-content-area">
                    {/* Profile Information Card */}
                    {activeTab === 'profile' && (
                        <AnimateOnScroll delay={0.1}>
                    <div className="settings-section profile-info-card">
                        <div className="card-header">
                            <User size={20} className="text-primary" />
                            <h2>Personal Information</h2>
                        </div>

                        <div className="profile-avatar-section">
                            <div className="avatar-placeholder" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                                {!avatarUrl && (
                                    <span className="avatar-initials">
                                        {firstName ? firstName[0].toUpperCase() : 'U'}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="avatar-upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                >
                                    {uploadingAvatar ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div className="avatar-details">
                                <h3>Profile Picture</h3>
                                <p className="text-muted">JPG, GIF or PNG. Max size of 800K</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="settings-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <Input value={email} disabled className="disabled-input" />
                                <small className="help-text">Email address cannot be changed currently.</small>
                            </div>

                            {profileMessage.text && (
                                <div className={`message-banner ${profileMessage.type}`}>
                                    {profileMessage.text}
                                </div>
                            )}

                            <Button type="submit" disabled={profileUpdating} className="save-btn">
                                {profileUpdating ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </Button>
                        </form>
                    </div>
                </AnimateOnScroll>
                    )}

                    {/* AI Advisor Selection Card */}
                    {activeTab === 'advisor' && (
                        <AnimateOnScroll delay={0.1}>
                            <div className="settings-section ai-advisor-card">
                                <div className="card-header">
                                    <Sparkles size={20} className="text-primary" />
                                    <h2>Hire Your Financial Advisor</h2>
                                </div>
                                <p className="text-muted" style={{ marginBottom: '24px' }}>Select the specific Persona and psychological archetype you want your AI Financial Advisor embedded with. This completely rewrites the mathematical advisory engine natively to fit your personality.</p>

                                <div className="advisor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                    {[
                                        { id: 'wealth_manager', name: 'Wealth Manager', icon: Briefcase, color: '#F59E0B', desc: 'Professional, Analytical, and Exclusive. Focuses strictly on maximum ROI and compounding wealth.' },
                                        { id: 'accountability_coach', name: 'Accountability Coach', icon: Zap, color: '#EF4444', desc: 'Aggressive, blunt, and intense. Pushes you to drastically cut matrix expenses and eliminate debt instantly.' },
                                        { id: 'visionary_guide', name: 'Visionary Guide', icon: Sparkles, color: '#8B5CF6', desc: 'Warm, wildly encouraging, and futuristic. Paints the picture of your Dream Wealthy timeline.' },
                                        { id: 'cfo', name: 'Agentic C.F.O.', icon: BrainCircuit, color: '#3B82F6', desc: 'Hyper-logical, systems-driven protocol. Speaks purely in actionable numbers and optimization percentages.' }
                                    ].map(persona => (
                                        <div 
                                            key={persona.id}
                                            className={`persona-card glass ${activePersona === persona.id ? 'active-persona' : ''}`}
                                            style={{
                                                padding: '24px',
                                                borderRadius: '16px',
                                                border: activePersona === persona.id ? `2px solid ${persona.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: activePersona === persona.id ? `0 0 24px ${persona.color}40` : 'none',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}
                                            onClick={async () => {
                                                if(playPop) playPop();
                                                setActivePersona(persona.id);
                                                setPersonaUpdating(true);
                                                setPersonaMessage({ type: '', text: '' });
                                                try {
                                                    const { error } = await supabase.auth.updateUser({
                                                        data: { advisor_persona: persona.id } // Store natively via JWT bypass!
                                                    });
                                                    if (error) throw error;
                                                    setPersonaMessage({ type: 'success', text: `Successfully hired the ${persona.name}!` });
                                                } catch (err) {
                                                    setPersonaMessage({ type: 'error', text: err.message });
                                                } finally {
                                                    setPersonaUpdating(false);
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '12px', borderRadius: '12px', background: `${persona.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <persona.icon size={24} color={persona.color} />
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{persona.name}</h3>
                                            </div>
                                            <p className="text-muted" style={{ margin: 0, lineHeight: '1.5', fontSize: '0.95rem' }}>{persona.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {personaMessage.text && (
                                    <div className={`message-banner ${personaMessage.type}`} style={{ marginTop: '24px' }}>
                                        {personaMessage.text}
                                    </div>
                                )}
                            </div>
                        </AnimateOnScroll>
                    )}

                {/* Linked Accounts Card */}
                {activeTab === 'integrations' && (
                    <AnimateOnScroll delay={0.1}>
                        <div className="settings-section">
                            <div className="card-header">
                                <Link2 size={20} className="text-primary" />
                                <h2>Linked Accounts</h2>
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                Connect your bank securely via Plaid to automate your budgeting and track expenses in real-time. We never store your credentials.
                            </p>
                            
                            {accounts.length > 0 && (
                                <div className="connected-accounts-list" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="glass" style={{
                                            padding: '16px', borderRadius: '12px', border: acc.needs_relink ? '1px solid var(--danger)' : '1px solid var(--surface-border)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {acc.institution_name || 'Connected Bank'}
                                                    {acc.needs_relink ? (
                                                        <span className="badge" style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', fontSize: '0.7rem' }}>Action Required</span>
                                                    ) : (
                                                        <span className="text-success" style={{ display: 'flex', alignItems: 'center' }}><CheckCircle2 size={14} /></span>
                                                    )}
                                                </h4>
                                                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                                                    {acc.needs_relink ? 'Bank connection expired. Reconnect to resume sync.' : 'Connection active and syncing.'}
                                                </p>
                                            </div>
                                            {acc.needs_relink && (
                                                <PlaidConnectButton isUpdateMode={true} linkedAccessToken={acc.plaid_access_token} brokenAccountId={acc.id} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ borderTop: accounts.length > 0 ? '1px solid var(--surface-border)' : 'none', paddingTop: accounts.length > 0 ? '24px' : '0' }}>
                                <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Add New Connection</h4>
                                <PlaidConnectButton />
                            </div>
                        </div>
                    </AnimateOnScroll>
                )}

                {/* Security Card */}
                {activeTab === 'security' && (
                    <AnimateOnScroll delay={0.1} yOffset={40}>
                        <div className="settings-section">
                            <div className="card-header">
                                <Shield size={20} className="text-primary" />
                                <h2>Security Configuration</h2>
                            </div>
                            <form onSubmit={handleUpdatePassword} className="settings-form">
                                <div className="form-group">
                                    <label>New Password</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                {passwordMessage.text && (
                                    <div className={`message-banner ${passwordMessage.type}`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <Button type="submit" variant="secondary" disabled={passwordUpdating} className="save-btn">
                                    {passwordUpdating ? 'Updating...' : <><Lock size={16} /> Update Password</>}
                                </Button>
                            </form>
                        </div>
                    </AnimateOnScroll>
                )}

                {/* Preferences Card */}
                {activeTab === 'preferences' && (
                    <AnimateOnScroll delay={0.1}>
                        <div className="settings-section">
                            <div className="card-header">
                                <Bell size={20} className="text-primary" />
                                <h2>Notifications & Alerts</h2>
                            </div>
                            <div className="preferences-list">
                                <div className="preference-item" style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                                    <div className="preference-info">
                                        <h4>Product Tour</h4>
                                        <p className="text-muted">Re-launch the interactive guided tutorial to learn the UI.</p>
                                    </div>
                                    <Button variant="secondary" onClick={handleRestartTutorial} style={{ padding: '8px 16px', height: 'auto', fontSize: '0.9rem' }}>
                                        Restart Tour
                                    </Button>
                                </div>
                                <div className="preference-item">
                                    <div className="preference-info">
                                        <h4>Algorithm Insights</h4>
                                        <p className="text-muted">Receive weekly summaries of your financial growth.</p>
                                    </div>
                                    <div className="toggle-switch active"></div>
                                </div>
                                <div className="preference-item">
                                    <div className="preference-info">
                                        <h4>Goal Milestones</h4>
                                        <p className="text-muted">Get alerted when you hit target savings goals.</p>
                                    </div>
                                    <div className="toggle-switch active"></div>
                                </div>
                                <div className="preference-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px', marginTop: '16px' }}>
                                    <div className="preference-info" style={{ width: '100%' }}>
                                        <h4>Border Glow</h4>
                                        <p className="text-muted">Personalize the neon styling of your dashboard containers.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {/* None Swatch */}
                                        <button 
                                            type="button"
                                            onClick={() => { if(playPop) playPop(); setExpenseBorderColor('none'); }}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                                border: expenseBorderColor === 'none' ? '2px solid var(--text-primary)' : '2px dashed var(--text-muted)',
                                                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title="None"
                                        >
                                            <div style={{ width: '1px', height: '100%', background: 'var(--text-muted)', transform: 'rotate(45deg)' }} />
                                        </button>
                                        
                                        {/* Color Swatches */}
                                        {[
                                            { id: 'blue', color: '#007aff' },
                                            { id: 'white', color: '#ffffff' },
                                            { id: 'black', color: '#000000' },
                                            { id: 'red', color: '#ff3b30' },
                                            { id: 'green', color: '#2ecc71' },
                                            { id: 'purple', color: '#8b5cf6' },
                                            { id: 'pink', color: '#ec4899' },
                                            { id: 'yellow', color: '#eab308' },
                                            { id: 'orange', color: '#f97316' }
                                        ].map(swatch => (
                                            <button
                                                key={swatch.id}
                                                type="button"
                                                onClick={() => { if(playPop) playPop(); setExpenseBorderColor(swatch.id); }}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                                    background: swatch.color,
                                                    border: expenseBorderColor === swatch.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                                                    boxShadow: `0 0 12px ${swatch.id === 'black' || swatch.id === 'white' ? 'rgba(255,255,255,0.2)' : swatch.color}`,
                                                    transition: 'all 0.2s ease',
                                                    transform: expenseBorderColor === swatch.id ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                                title={swatch.id.charAt(0).toUpperCase() + swatch.id.slice(1)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimateOnScroll>
                )}
                </div>
            </Card>
        </div>
    );
};

export default Settings;
