import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import EventPage from './components/EventPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <CssBaseline />
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/e/:eventId" element={<EventPage />} />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
