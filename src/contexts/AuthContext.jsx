import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTutorialActive, setTutorialActive] = useState(false);

    useEffect(() => {
        // Check for active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (log in, log out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signInWithOtp: (email) => supabase.auth.signInWithOtp({ email }),
        signInWithOAuth: (provider) => supabase.auth.signInWithOAuth({ provider }),
        signOut: () => supabase.auth.signOut(),
        user,
        hasCompletedOnboarding: user?.user_metadata?.has_completed_onboarding,
        isTutorialActive,
        setTutorialActive,
        completeOnboarding: async (startTutorial) => {
             // 1. Update Supabase
             await supabase.auth.updateUser({
                  data: { has_completed_onboarding: true }
             });
             // 2. Local state update
             setUser(prevUser => ({
                 ...prevUser, 
                 user_metadata: { ...prevUser?.user_metadata, has_completed_onboarding: true }
             }));
             // 3. Trigger tutorial if requested
             if (startTutorial) {
                 setTutorialActive(true);
             }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
