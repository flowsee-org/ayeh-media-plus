import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/lib/api";
import AuthModal from '@/components/auth/AuthModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const authCallbackRef = useRef(null);

  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'ayeh-app',
    public_settings: { auth_required: false },
  });

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      const token = api.auth.getToken();
      if (token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('App state check error:', error);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.warn('User auth check failed:', error?.message);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout(null); // clear token without redirect
    if (shouldRedirect) {
      router.push('/login');
    }
  };

  const openAuthModal = (callback = null) => {
    authCallbackRef.current = callback;
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    authCallbackRef.current = null;
  };

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    if (typeof authCallbackRef.current === 'function') {
      try {
        authCallbackRef.current(loggedInUser);
      } catch (err) {
        console.error('Auth callback error:', err);
      }
      authCallbackRef.current = null;
    }
  };

  const navigateToLogin = () => {
    openAuthModal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
