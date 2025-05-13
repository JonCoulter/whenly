import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  toggleTheme?: () => void;
  mode?: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Whenly', 
  toggleTheme, 
  mode = 'light' 
}) => {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Header title={title} toggleTheme={toggleTheme} mode={mode} />

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          pt: 2,
          pb: 4,
          flex: '1 0 auto', // This makes the main content take all available space
        }}
      >
        {children}
      </Box>

      {/* Footer */}
      <Footer title={title} />
    </Box>
  );
};

export default Layout; 