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
  useMediaQuery,
  Snackbar,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { format, parse, addMinutes, isSameDay, parseISO, isWithinInterval, addDays } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { getEventById, submitAvailability, getEventResponses } from '../api/eventService';
import { Person } from '@mui/icons-material';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';

// Types
interface TimeSlot {
  id: string;
  date?: string;  // Optional for specificDays events
  dayOfWeek?: string;  // For daysOfWeek events
  time: string;
  dateObj?: Date;  // Optional since daysOfWeek events don't need specific dates
  availableUsers?: string[];
}

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  calendar: string;
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
  const [responses, setResponses] = useState<{
    totalResponses: number;
    uniqueUsers: number;
    responses: any[];
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showOthersAvailability, setShowOthersAvailability] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // Fetch event data and responses
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      
      setIsLoading(true);
      try {
        const [eventResponse, responsesData] = await Promise.all([
          getEventById(eventId),
          getEventResponses(eventId)
        ]);
        
        if (eventResponse.success && eventResponse.data) {
          setEvent(eventResponse.data.data || eventResponse.data);
        } else {
          setError(eventResponse.error || 'Failed to load event');
        }
        
        setResponses(responsesData);
      } catch (err) {
        setError('Failed to load event data');
        console.error('Error loading event:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleSlotSelection = (slot: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      }
      return [...prev, slot];
    });
  };

  const handleSubmit = async () => {
    if (!name || selectedSlots.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please enter your name and select at least one time slot',
        severity: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format the selected slots to match the expected format
      const formattedSlots = selectedSlots.map(slotId => {
        // For days of week events, just use the slot ID as is
        if (event.eventType === 'daysOfWeek') {
          return slotId.split('-undefined')[0]; // Remove any -undefined suffix
        }
        
        // For specific days events, format as before
        const parts = slotId.split('-');
        const date = parts.slice(0, 3).join('-');  // Join YYYY-MM-DD
        const time = parts[3];  // Get HH:mm
        return `${date}-${time}`;
      });

      await submitAvailability(eventId!, {
        userName: name,
        selectedSlots: formattedSlots
      });

      setSnackbar({
        open: true,
        message: 'Your availability has been saved!',
        severity: 'success'
      });

      // Refresh responses
      const responsesData = await getEventResponses(eventId!);
      setResponses(responsesData);

      // Reset form
      setName('');
      setSelectedSlots([]);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to submit availability',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots for the calendar
  const generateTimeSlots = (): TimeSlot[] => {
    if (!event) return [];
    
    const slots: TimeSlot[] = [];
    
    // Handle different event types
    if (event.eventType === 'specificDays' && event.specificDays) {
      // For specific days events, use the provided dates
      event.specificDays.forEach((date: string) => {
        // Handle both "HH:mm" and "hh:mm a" time formats
        let startTime = event.timeRange?.start || '09:00';
        let endTime = event.timeRange?.end || '17:00';
        
        // Convert time formats
        [startTime, endTime] = [startTime, endTime].map(time => {
          if (time.includes('AM') || time.includes('PM')) {
            const [t, period] = time.split(' ');
            const [hours, minutes] = t.split(':').map(Number);
            let hour24 = hours;
            
            if (period === 'PM' && hours < 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;
            
            return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          return time;
        });
        
        const start = parse(startTime, 'HH:mm', new Date());
        const end = parse(endTime, 'HH:mm', new Date());
        
        let current = start;
        while (current < end) {
          const formattedTime = format(current, 'HH:mm');
          // Create slot ID in the format "YYYY-MM-DD-HH:mm"
          const slotId = `${date}-${formattedTime}`;
          
          // Create date object in local timezone
          const [year, month, day] = date.split('-').map(Number);
          const [hours, minutes] = formattedTime.split(':').map(Number);
          const dateObj = new Date(year, month - 1, day, hours, minutes);
          
          slots.push({
            id: slotId,
            date,
            time: formattedTime,
            dateObj
          });
          current = addMinutes(current, 30); // 30-minute slots
        }
      });
    } else if (event.eventType === 'daysOfWeek' && event.daysOfWeek) {
      // For days of week events, create slots for each day without specific dates
      event.daysOfWeek.forEach((dayOfWeek: string) => {
        let startTime = event.timeRange?.start || '09:00';
        let endTime = event.timeRange?.end || '17:00';
        
        // Convert time formats
        [startTime, endTime] = [startTime, endTime].map(time => {
          if (time.includes('AM') || time.includes('PM')) {
            const [t, period] = time.split(' ');
            const [hours, minutes] = t.split(':').map(Number);
            let hour24 = hours;
            
            if (period === 'PM' && hours < 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;
            
            return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          return time;
        });
        
        const start = parse(startTime, 'HH:mm', new Date());
        const end = parse(endTime, 'HH:mm', new Date());
        
        let current = start;
        while (current < end) {
          const formattedTime = format(current, 'HH:mm');
          // Create slot ID in the format "DAY-HH:mm"
          const slotId = `${dayOfWeek}-${formattedTime}`;
          slots.push({
            id: slotId,
            dayOfWeek,
            time: formattedTime
          });
          current = addMinutes(current, 30); // 30-minute slots
        }
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // Group time slots by date or day of week
  const groupedByDate = timeSlots.reduce((acc: GroupedSlots, slot) => {
    const key = slot.date || slot.dayOfWeek || '';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {} as GroupedSlots);

  // Add this function to process responses into slot availability
  const processResponses = (slots: TimeSlot[]): TimeSlot[] => {
    if (!responses?.responses) return slots;

    // Create a map of slot IDs to available users
    const slotAvailability = new Map<string, string[]>();
    
    responses.responses.forEach(response => {
      // Get the slot ID from the response
      const slotId = response.slotId;
      const users = slotAvailability.get(slotId) || [];
      users.push(response.userName);
      slotAvailability.set(slotId, users);
    });

    // Update slots with availability information
    return slots.map(slot => ({
      ...slot,
      availableUsers: slotAvailability.get(slot.id) || []
    }));
  };

  // Process slots with availability data
  const processedTimeSlots = showOthersAvailability ? processResponses(timeSlots) : timeSlots;

  // Add function to fetch calendar events
  const fetchCalendarEvents = async () => {
    if (!event) return;
    
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    
    setIsImporting(true);
    try {
      // Get date range based on event type
      let startDate, endDate;
      
      if (event.eventType === 'specificDays' && event.specificDays?.length > 0) {
        startDate = event.specificDays[0];
        endDate = event.specificDays[event.specificDays.length - 1];
      } else {
        // For days of week events, use next 2 weeks
        const today = new Date();
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(addDays(today, 14), 'yyyy-MM-dd');
      }
      
      const response = await fetch(
        `${config.apiUrl}/api/calendar/events?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Process calendar events and update selected slots
      const calendarEvents = data.data.events as CalendarEvent[];
      console.log('Calendar Events:', calendarEvents);
      const newSelectedSlots = new Set(selectedSlots);
      
      // For each time slot in our event
      timeSlots.forEach(slot => {
        // Create a date object for the slot's start time
        let slotStart: Date;
        if (slot.dateObj) {
          slotStart = slot.dateObj;
        } else if (slot.date) {
          // For specific days events, create date in local timezone
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          slotStart = new Date(year, month - 1, day, hours, minutes);
        } else {
          // For days of week events, use today's date
          const today = new Date();
          const [hours, minutes] = slot.time.split(':').map(Number);
          slotStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        }
        
        const slotEnd = addMinutes(slotStart, 30); // 30-minute slots
        
        console.log(`\nChecking slot: ${slot.id}`);
        console.log('Slot start:', slotStart.toISOString());
        console.log('Slot end:', slotEnd.toISOString());
        
        // Check if this slot overlaps with any calendar event
        const hasOverlap = calendarEvents.some(event => {
          // Parse the ISO dates with timezone information
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          console.log(`\nComparing with event: ${event.summary}`);
          console.log('Event start:', eventStart.toISOString());
          console.log('Event end:', eventEnd.toISOString());
          
          // Convert all dates to UTC for comparison
          const slotStartUTC = new Date(Date.UTC(
            slotStart.getFullYear(),
            slotStart.getMonth(),
            slotStart.getDate(),
            slotStart.getHours(),
            slotStart.getMinutes()
          ));
          
          const slotEndUTC = new Date(Date.UTC(
            slotEnd.getFullYear(),
            slotEnd.getMonth(),
            slotEnd.getDate(),
            slotEnd.getHours(),
            slotEnd.getMinutes()
          ));
          
          const eventStartUTC = new Date(Date.UTC(
            eventStart.getFullYear(),
            eventStart.getMonth(),
            eventStart.getDate(),
            eventStart.getHours(),
            eventStart.getMinutes()
          ));
          
          const eventEndUTC = new Date(Date.UTC(
            eventEnd.getFullYear(),
            eventEnd.getMonth(),
            eventEnd.getDate(),
            eventEnd.getHours(),
            eventEnd.getMinutes()
          ));
          
          console.log('Slot start (UTC):', slotStartUTC.toISOString());
          console.log('Slot end (UTC):', slotEndUTC.toISOString());
          console.log('Event start (UTC):', eventStartUTC.toISOString());
          console.log('Event end (UTC):', eventEndUTC.toISOString());
          
          const overlaps = (
            (slotStartUTC >= eventStartUTC && slotStartUTC < eventEndUTC) || // Slot starts during event
            (slotEndUTC > eventStartUTC && slotEndUTC <= eventEndUTC) || // Slot ends during event
            (slotStartUTC <= eventStartUTC && slotEndUTC >= eventEndUTC) // Slot completely contains event
          );
          
          console.log('Overlaps:', overlaps);
          return overlaps;
        });
        
        // If no overlap, mark the slot as available
        if (!hasOverlap) {
          newSelectedSlots.add(slot.id);
        }
        else {
          newSelectedSlots.delete(slot.id);
        }
      });
      
      setSelectedSlots(Array.from(newSelectedSlots));
      
      setSnackbar({
        open: true,
        message: 'Calendar events imported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error importing calendar events:', error);
      setSnackbar({
        open: true,
        message: 'Failed to import calendar events',
        severity: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

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

            {event?.creatorName &&
              <Box sx={{ mb: 1 }}>
                <Chip 
                  icon={<Person />} 
                  label={`${event?.creatorName}`} 
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
                label={`${responses?.uniqueUsers || 0} Responses`} 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Import Calendar
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<CalendarMonthIcon />}
              onClick={fetchCalendarEvents}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Google Calendar'}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {/* Calendar View */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                When are you free?
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOthersAvailability}
                    onChange={(e) => setShowOthersAvailability(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show others' availability"
              />
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
                    {Object.keys(groupedByDate).map(key => (
                      <Box key={key} sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="subtitle2">
                          {event.eventType === 'daysOfWeek' ? key : format(new Date(key + 'T00:00:00'), 'EEE')}
                        </Typography>
                        {event.eventType === 'specificDays' && (
                          <Typography variant="body2">
                            {format(new Date(key + 'T00:00:00'), 'MMM d')}
                          </Typography>
                        )}
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
                        {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}
                      </Typography>
                      <Grid container spacing={1}>
                        {slots.map((slot) => {
                          const availableCount = slot.availableUsers?.length || 0;
                          const intensity = Math.min(availableCount / 5, 1); // Normalize to 0-1, max at 5 people
                          
                          return (
                            <Grid key={slot.id} size={{ xs: 4, sm: 3 }}>
                              <Tooltip 
                                title={
                                  slot.availableUsers?.length ? 
                                  `Available: ${slot.availableUsers.join(', ')}` : 
                                  'No one available'
                                }
                              >
                                <Box 
                                  onClick={() => handleSlotSelection(slot.id)}
                                  sx={{
                                    p: 1,
                                    textAlign: 'center',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: selectedSlots.includes(slot.id) 
                                      ? theme.palette.primary.main 
                                      : showOthersAvailability && availableCount > 0
                                        ? `rgba(25, 118, 210, ${0.2 + (intensity * 0.6)})` // Blue with varying opacity
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
                              </Tooltip>
                            </Grid>
                          );
                        })}
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
                    {processedTimeSlots.map(slot => {
                      const dateIndex = Object.keys(groupedByDate).indexOf(slot.date || '');
                      const timeIndex = Array.from(
                        new Set(processedTimeSlots.map(s => s.time))
                      ).indexOf(slot.time);
                      
                      const availableCount = slot.availableUsers?.length || 0;
                      const intensity = Math.min(availableCount / 5, 1); // Normalize to 0-1, max at 5 people
                      
                      return (
                        <Tooltip 
                          key={slot.id}
                          title={
                            slot.availableUsers?.length ? 
                            `Available: ${slot.availableUsers.join(', ')}` : 
                            'No one available'
                          }
                        >
                          <Box 
                            onClick={() => handleSlotSelection(slot.id)}
                            sx={{
                              gridColumn: dateIndex + 1,
                              gridRow: timeIndex + 1,
                              height: '40px',
                              borderRadius: 1,
                              cursor: 'pointer',
                              backgroundColor: selectedSlots.includes(slot.id) 
                                ? theme.palette.primary.main 
                                : showOthersAvailability && availableCount > 0
                                  ? `rgba(25, 118, 210, ${0.1 + (intensity * 0.9)})` // Blue with varying opacity
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
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SignInModal 
        open={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        title={'Whenly'}
      />
    </Container>
  );
};

export default EventPage;
