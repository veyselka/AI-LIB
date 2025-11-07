// contexts/AuthContext.js
import React, { useState, createContext } from 'react';
import { View, Text } from 'react-native';

const COLORS = {
  background: '#121212',
  white: '#FFFFFF',
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);

  const authContext = React.useMemo(() => ({
    signIn: async (token) => {
      if (token) {
        setUserToken(token);
      }
    },
    signOut: async () => {
      setUserToken(null);
    },
    userToken,
  }), [userToken]);

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};
