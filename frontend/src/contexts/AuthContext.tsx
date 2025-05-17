import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';
import storageService from '../services/storageService';

interface User {
  name: string;
  email: string;
  picture: string;
  googleId: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from storage if available
    return storageService.getItem<User>('user');
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/auth/status`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            storageService.setItem('user', data.user);
          } else {
            setUser(null);
            storageService.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        storageService.removeItem('user');
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${config.apiUrl}/api/logout`, {
        credentials: 'include'
      });
      setUser(null);
      storageService.removeItem('user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: (newUser) => {
        setUser(newUser);
        if (newUser) {
          storageService.setItem('user', newUser);
        } else {
          storageService.removeItem('user');
        }
      },
      isAuthenticated: !!user,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 