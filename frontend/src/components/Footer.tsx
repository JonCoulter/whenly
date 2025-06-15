import React from 'react';
import { Box, Container, Typography, Link, Grid, useTheme, Stack } from '@mui/material';

interface FooterProps {
  title?: string;
}

const Footer: React.FC<FooterProps> = ({ title = 'Whenly' }) => {
  const theme = useTheme();
  
  const linkStyle = {
    textDecoration: 'none',
    color: 'text.secondary',
    transition: 'color 0.2s',
    '&:hover': {
      color: theme.palette.primary.main,
    }
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        width: '100%',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="space-between">
          <Grid size={{ xs:12, sm:6 }}>
            <Typography variant="body2" color="text.secondary">
              {title} - Made with ❤️ by <Link href="https://joncoulter.github.io" target="_blank" rel="noopener" color="inherit" sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: theme.palette.primary.main } }}>Jonathan Coulter</Link>
            </Typography>
          </Grid>
          <Grid size={{ xs:12, sm:6 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Stack direction="row" spacing={2} sx={{ fontSize: '0.8rem' }}>
                <Link href="#" sx={linkStyle} target="_blank" rel="noopener">
                  Privacy Policy
                </Link>
                <Link href="https://forms.gle/NSxnXYc2Ge69WpJ5A" sx={linkStyle} target="_blank" rel="noopener">
                  Feedback Form
                </Link>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer; 