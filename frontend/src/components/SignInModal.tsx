import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

const SignInModal: React.FC<SignInModalProps> = ({ open, onClose, title }) => {
  const theme = useTheme();
  const { setUser } = useAuth();

  useEffect(() => {
    // Check if we're returning from Google OAuth
    const checkAuthCallback = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/auth/status`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            onClose();
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    if (open) {
      checkAuthCallback();
    }
  }, [open, setUser, onClose]);

  const handleGoogleSignIn = () => {
    // Redirect to the backend login endpoint
    window.location.href = `${config.apiUrl}/api/login`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div" align="center">
          Sign in to {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          py: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            size="large"
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            Continue with Google
          </Button>
          
          {/* Placeholder for future sign-in options */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            opacity: 0.5,
            pointerEvents: 'none'
          }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            <Typography variant="body2" color="text.secondary">
              More options coming soon
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal; 