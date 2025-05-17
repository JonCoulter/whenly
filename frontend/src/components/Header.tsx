import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container, 
  IconButton, 
  useTheme as useMuiTheme, 
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import SignInModal from './SignInModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Whenly'
}) => {
  const muiTheme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const { user, logout } = useAuth();
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    setSnackbar({
      open: true,
      message: 'Successfully logged out!',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{ 
                    p: 0,
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <Avatar
                    alt={user.name}
                    src={user.picture}
                    sx={{ 
                      width: 42, 
                      height: 42,
                      border: `2px solid ${muiTheme.palette.primary.main}`
                    }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  sx = {{ mt: 1 }}
                >
                  <Typography sx={{ p: 1, mb: 1, textAlign: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                  <MenuItem onClick={handleLogout} sx={{ p: 2, pl: 1.5, textAlign: 'center', justifyContent: 'center' }}>
                    <ListItemIcon sx={{ pl: 1, mr: 1 }}>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign out</ListItemText>
                  </MenuItem>
                  <MenuItem sx={{ p: 1, pl: 2, textAlign: 'center', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isDarkMode}
                          onChange={toggleTheme}
                          icon={<Brightness7Icon />}
                          checkedIcon={<Brightness3Icon />}
                          sx={{ mr: 2 }}
                        />
                      }
                      label={isDarkMode ? "Dark Mode" : "Light Mode"}
                    />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                variant="text" 
                onClick={() => setIsSignInModalOpen(true)}
                sx={{
                  color: "text.primary",
                  '&:hover': {
                    color: muiTheme.palette.primary.main,
                  }
                }}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>

      <SignInModal 
        open={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        title={title}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Header; 