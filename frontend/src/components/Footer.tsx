import React from 'react';
import { Box, Container, Typography, Link, Grid, useTheme } from '@mui/material';

interface FooterProps {
  title?: string;
}

const Footer: React.FC<FooterProps> = ({ title = 'Whenly' }) => {
  const theme = useTheme();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        width: '100%',
        flexShrink: 0, // Prevents the footer from shrinking
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="space-between">
          <Grid xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} {title}. All rights reserved.
            </Typography>
          </Grid>
          <Grid xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Link 
              href="#" 
              color="inherit" 
              sx={{ 
                px: 1, 
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: theme.palette.primary.main,
                }
              }}
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
              color="inherit" 
              sx={{ 
                px: 1, 
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: theme.palette.primary.main,
                }
              }}
            >
              Terms of Service
            </Link>
            <Link 
              href="#" 
              color="inherit" 
              sx={{ 
                px: 1, 
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: theme.palette.primary.main,
                }
              }}
            >
              Contact
            </Link>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer; 