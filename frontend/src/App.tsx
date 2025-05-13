import React, { useState, useMemo } from 'react';
import { Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import { getThemeOptions } from './theme';

const App: React.FC = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  
  // Create theme based on current mode using our theme configuration
  const theme = useMemo(
    () => createTheme(getThemeOptions(mode)),
    [mode]
  );

  // Toggle theme function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout title="Whenly" toggleTheme={toggleTheme} mode={mode}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

export default App;
