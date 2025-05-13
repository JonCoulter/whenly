import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

interface EventFormProps {
  onSubmit?: (data: any) => void;
  paperProps?: React.ComponentProps<typeof Paper>;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, paperProps }) => {
  const [mode, setMode] = useState<'dateTime' | 'dateOnly'>('dateTime');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      // Collect form data and pass to onSubmit
      onSubmit({
        mode,
        // other form values would be collected here
      });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }} {...paperProps}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
        Create an Event
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* Event Name */}
        <TextField label="Event Name" variant="outlined" fullWidth />

        {/* Mode Toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => val && setMode(val)}
          color="primary"
          sx={{ justifyContent: 'center' }}
        >
          <ToggleButton value="dateTime">Dates & Times</ToggleButton>
          <ToggleButton value="dateOnly">Dates Only</ToggleButton>
        </ToggleButtonGroup>

        {/* Time Range Selectors */}
        {mode === 'dateTime' && (
          <Grid container spacing={2} justifyContent="center">
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>From</InputLabel>
                <Select defaultValue="09:00 AM" label="From">
                  <MenuItem value="09:00 AM">09:00 AM</MenuItem>
                  <MenuItem value="10:00 AM">10:00 AM</MenuItem>
                  {/* ...additional times... */}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>To</InputLabel>
                <Select defaultValue="05:00 PM" label="To">
                  <MenuItem value="05:00 PM">05:00 PM</MenuItem>
                  <MenuItem value="06:00 PM">06:00 PM</MenuItem>
                  {/* ...additional times... */}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Calendar Placeholder */}
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'text.disabled',
            borderRadius: 1,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
            mx: { xs: 'auto', md: 0 },
            width: { xs: '90%', md: 'auto' }
          }}
        >
          Calendar Preview
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ alignSelf: 'center', width: { xs: '90%', md: 'auto' } }}
        >
          Create Event
        </Button>
      </Box>
    </Paper>
  );
};

export default EventForm; 