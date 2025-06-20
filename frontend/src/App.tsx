import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import EventPage from './components/EventPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <CssBaseline />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh', // This ensures the box takes at least the full viewport height
            }}
          >
            <Header />
            <Box
              component="main"
              sx={{
                flexGrow: 1, // This makes the main content take up all available space
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/e/:eventId" element={<EventPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
