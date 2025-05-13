import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Link, IconButton, useTheme, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface HeaderProps {
  title?: string;
  toggleTheme?: () => void;
  mode?: 'light' | 'dark';
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Whenly',
  toggleTheme,
  mode = 'light'
}) => {
  const theme = useTheme();
  
  return (
    <AppBar position="static" sx={{ width: '100%' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              textDecoration: 'none', 
              color: 'text.primary',
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="text" 
              sx={{
                color: "text.primary",
                '&:hover': {
                  color: theme.palette.primary.main,
                }}}>
              Sign In
            </Button>
            
            {toggleTheme && (
              <IconButton 
                onClick={toggleTheme} 
                sx={{ 
                  ml: 1,
                  color: 'text.primary',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness3Icon />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 