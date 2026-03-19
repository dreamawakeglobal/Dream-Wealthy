import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy loaded pages to optimize build chunks
const Waitlist = React.lazy(() => import('./pages/Waitlist'));
const Home = React.lazy(() => import('./pages/Home'));
const Income = React.lazy(() => import('./pages/Income'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Projections = React.lazy(() => import('./pages/Projections'));
const Investments = React.lazy(() => import('./pages/Investments'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
import AudioPlayer from './components/AudioPlayer';
import FloatingNotes from './components/FloatingNotes';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FinancialProvider } from './FinancialContext';
import { SoundProvider } from './SoundContext';
import ThemeToggle from './components/ThemeToggle';
import { TutorialOverlay } from './components/TutorialOverlay';
import PointerGlow from './components/PointerGlow';

const Onboarding = React.lazy(() => import('./pages/Onboarding'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinancialProvider>
          <SoundProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AudioPlayer />
              <FloatingNotes />
              <ThemeToggle />
              <PointerGlow />
              <TutorialOverlay />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Waitlist />} />
                  <Route path="onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
                  <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                  <Route path="projections" element={<ProtectedRoute><Projections /></ProtectedRoute>} />
                  <Route path="investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                  <Route path="signup" element={<SignUp />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SoundProvider>
        </FinancialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
