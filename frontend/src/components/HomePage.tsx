import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import EventForm from './EventForm';
import EventFormModal from './EventFormModal';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleEventSubmit = (data: any) => {
    // Handle event creation
    console.log('Event data:', data);
    // TODO: API call or state update
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        backgroundColor: 'background',
        display: 'flex',
        justifyContent: 'center',
        py: 3,
      }}
    >
      {/* Split Hero Layout */}
      <Grid container spacing={4} justifyContent="center">
        {/* Left: Hero & Preview */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ paddingTop: '10vh' }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', textAlign: { xs: 'center', md: 'left' } }}
          >
            When are you free?
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            paragraph 
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            Sync with Google Calendar to effortlessly find the perfect time for everyone to meet.
          </Typography>

          {/* Sample Grid Preview */}
          <Paper elevation={3} sx={{ p: 2, mt: 2, mx: { xs: 'auto', md: 0 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gridAutoRows: '32px',
                gap: 1
              }}
            >
              {Array.from({ length: 30 }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    backgroundColor: idx % 7 === 0 ? 'primary.main' : '#E5E7EB',
                    borderRadius: 0.5
                  }}
                />
              ))}
            </Box>
          </Paper>
          
          {/* Mobile: Show button to open modal */}
          {isMobile && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => setIsModalOpen(true)}
              >
                Create Event
              </Button>
            </Box>
          )}
        </Grid>

        {/* Right: Create Event Form (Desktop only) */}
        {!isMobile && (
          <Grid size={{ xs: 12, md: 6 }}>
            <EventForm 
              onSubmit={handleEventSubmit} 
              paperProps={{ sx: { p: 3, mx: { xs: 'auto', md: 0 } } }}
            />
          </Grid>
        )}
      </Grid>
      
      {/* Modal for mobile view */}
      <EventFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleEventSubmit} 
      />
    </Container>
  );
};

export default HomePage;
