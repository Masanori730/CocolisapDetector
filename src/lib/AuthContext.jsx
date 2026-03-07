import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user] = useState({ name: 'PCA Officer', email: 'officer@pca.gov.ph' });
  const isAuthenticated = true;
  const isLoadingAuth = false;
  const isLoadingPublicSettings = false;
  const authError = null;
  const appPublicSettings = {};

  const logout = () => {};
  const navigateToLogin = () => {};
  const checkAppState = () => {};

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
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