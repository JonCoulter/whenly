import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Chip,
  Button,
  Skeleton,
  Alert,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { format, parse, addMinutes, isSameDay } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getEventById } from '../api/eventService';
import { Person } from '@mui/icons-material';

// Types
interface TimeSlot {
  id: string;
  date: string;
  time: string;
  dateObj: Date;
}

interface GroupedSlots {
  [key: string]: TimeSlot[];
}

// Main component
const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      
      setIsLoading(true);
      const response = await getEventById(eventId);
      
      if (response.success && response.data) {
        // The actual event data is nested inside response.data.data
        if (response.data.data) {
          setEvent(response.data.data);
        } else {
          setEvent(response.data);
        }
      } else {
        setError(response.error || 'Failed to load event');
      }
      
      setIsLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  const handleSlotSelection = (slot: string) => {
    setSelectedSlots(prev => {
      // If already selected, remove it
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } 
      // Otherwise add it
      return [...prev, slot];
    });
  };

  const handleSubmit = async () => {
    if (!name || selectedSlots.length === 0) {
      setError('Please enter your name and select at least one time slot');
      return;
    }

    setIsSubmitting(true);
    // TODO: Implement API call to save availability
    console.log('Submitting availability for', name, selectedSlots);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Show success message
      alert('Your availability has been saved!');
    }, 1000);
  };

  // Generate time slots for the calendar
  const generateTimeSlots = (): TimeSlot[] => {
    if (!event) return [];
    
    const slots: TimeSlot[] = [];
    const dates: string[] = [];
    
    // For demo, generate some dates
    if (event.eventType === 'specificDays' && event.specificDays) {
      dates.push(...event.specificDays);
    } else {
      // Default to next 5 days if no specific days
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }
    }
    
    // Generate time slots
    dates.forEach((date: string) => {
      // Handle both "HH:mm" and "hh:mm a" time formats
      let startTime = event.timeRange?.start || '09:00';
      let endTime = event.timeRange?.end || '17:00';
      
      // Convert "hh:mm a" format (like "09:00 AM") to "HH:mm" format (like "09:00")
      if (startTime.includes('AM') || startTime.includes('PM')) {
        const [time, period] = startTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period === 'PM' && hours < 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        startTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      if (endTime.includes('AM') || endTime.includes('PM')) {
        const [time, period] = endTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period === 'PM' && hours < 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        endTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      
      let current = start;
      while (current < end) {
        const formattedTime = format(current, 'HH:mm');
        slots.push({
          id: `${date}-${formattedTime}`,
          date,
          time: formattedTime,
          dateObj: parse(`${date} ${formattedTime}`, 'yyyy-MM-dd HH:mm', new Date())
        });
        current = addMinutes(current, 30); // 30-minute slots
      }
    });
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // Group time slots by date for the calendar view
  const groupedByDate = timeSlots.reduce((acc: GroupedSlots, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as GroupedSlots);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          {/* Event Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {event?.name || 'Event Details'}
            </Typography>

            {event?.createdBy &&
              <Box sx={{ mb: 1 }}>
                <Chip 
                  icon={<Person />} 
                  label={`${event?.createdBy}`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            }
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`${event?.timeRange?.start || '9:00 AM'} - ${event?.timeRange?.end || '5:00 PM'}`} 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                icon={<GroupIcon />} 
                label={`${event?.attendees?.length || 0} Responses`} 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Import Calendar
            </Typography>
            <Button variant="contained" color="primary">
              Import
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {/* Calendar View */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom >
                When are you free?
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              {/* Name Input */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  color: `${theme.palette.text.primary}`,
                  borderRadius: '4px',
                  backgroundColor: `${theme.palette.background.paper}`,
                  border: `2px solid ${theme.palette.divider}`,
                  width: '100%',
                  maxWidth: '300px'
                }}
              />

              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                disabled={isSubmitting || !name || selectedSlots.length === 0}
                onClick={handleSubmit}
                sx={{ minWidth: '200px' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Availability'}
              </Button>
            </Box>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
              rowGap: 1,
              columnGap: 2
            }}>
              {/* Time headers (only shown on desktop) */}
              {!isMobile && (
                <>
                  <Box sx={{ gridColumn: '1 / 2', mt: 7 }}>
                    {/* Empty space above time labels */}
                  </Box>
                  <Box sx={{ 
                    gridColumn: '2 / 3', 
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Object.keys(groupedByDate).length}, 1fr)`,
                    gap: 1,
                    mb: 1
                  }}>
                    {Object.keys(groupedByDate).map(date => (
                      <Box key={date} sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="subtitle2">
                          {format(new Date(date), 'EEE')}
                        </Typography>
                        <Typography variant="body2">
                          {format(new Date(date), 'MMM d')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
              
              {/* Time labels */}
              {!isMobile && (
                <Box sx={{ 
                  gridColumn: '1 / 2', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1 
                }}>
                  {Array.from(new Set(timeSlots.map(slot => slot.time))).map((time, index) => (
                    <Box key={index} sx={{ 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pr: 2,
                      fontSize: '14px'
                    }}>
                      {time}
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Calendar Grid */}
              <Box sx={{ 
                gridColumn: isMobile ? '1 / 2' : '2 / 3',
                overflowX: 'auto',
                paddingTop: '18px'
              }}>
                {isMobile ? (
                  // Mobile view: List by date
                  Object.entries(groupedByDate).map(([date, slots]: [string, TimeSlot[]]) => (
                    <Box key={date} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        {format(new Date(date), 'EEEE, MMMM d')}
                      </Typography>
                      <Grid container spacing={1}>
                        {slots.map((slot) => (
                          <Grid key={slot.id} size={{ xs: 4, sm: 3 }}>
                            <Box 
                              onClick={() => handleSlotSelection(slot.id)}
                              sx={{
                                p: 1,
                                textAlign: 'center',
                                borderRadius: 1,
                                cursor: 'pointer',
                                backgroundColor: selectedSlots.includes(slot.id) 
                                  ? theme.palette.primary.main 
                                  : theme.palette.mode === 'light' ? '#E5E7EB' : '#374151',
                                color: selectedSlots.includes(slot.id) 
                                  ? '#fff' 
                                  : 'text.primary',
                                '&:hover': {
                                  backgroundColor: selectedSlots.includes(slot.id)
                                    ? theme.palette.primary.dark
                                    : theme.palette.mode === 'light' ? '#D1D5DB' : '#4B5563'
                                },
                                position: 'relative'
                              }}
                            >
                              {slot.time}
                              {selectedSlots.includes(slot.id) && (
                                <CheckCircleIcon 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: -8, 
                                    right: -8, 
                                    fontSize: 16,
                                    backgroundColor: '#fff',
                                    borderRadius: '50%'
                                  }} 
                                />
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))
                ) : (
                  // Desktop view: Grid calendar
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Object.keys(groupedByDate).length}, 1fr)`,
                    gap: 1
                  }}>
                    {timeSlots.map(slot => {
                      const dateIndex = Object.keys(groupedByDate).indexOf(slot.date);
                      const timeIndex = Array.from(
                        new Set(timeSlots.map(s => s.time))
                      ).indexOf(slot.time);
                      
                      return (
                        <Box 
                          key={slot.id}
                          onClick={() => handleSlotSelection(slot.id)}
                          sx={{
                            gridColumn: dateIndex + 1,
                            gridRow: timeIndex + 1,
                            height: '40px',
                            borderRadius: 1,
                            cursor: 'pointer',
                            backgroundColor: selectedSlots.includes(slot.id) 
                              ? theme.palette.primary.main 
                              : theme.palette.mode === 'light' ? '#E5E7EB' : '#374151',
                            '&:hover': {
                              backgroundColor: selectedSlots.includes(slot.id)
                                ? theme.palette.primary.dark
                                : theme.palette.mode === 'light' ? '#D1D5DB' : '#4B5563'
                            },
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isMobile && slot.time}
                          {selectedSlots.includes(slot.id) && (
                            <CheckCircleIcon 
                              sx={{ 
                                position: 'absolute', 
                                top: -5, 
                                right: -5, 
                                fontSize: 16,
                                backgroundColor: '#fff',
                                borderRadius: '50%'
                              }} 
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventPage;
