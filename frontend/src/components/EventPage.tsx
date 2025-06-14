import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  Skeleton,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
  Snackbar,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  format,
  parse,
  addMinutes,
  isSameDay,
  parseISO,
  isWithinInterval,
  addDays,
} from "date-fns";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Person, Cancel } from "@mui/icons-material";
import {
  getEventById,
  submitAvailability,
  getEventResponses,
} from "../api/eventService";
import config from "../config";
import { useAuth } from "../contexts/AuthContext";
import SignInModal from "./SignInModal";
import AvailabilityGrid from "./AvailabilityGrid";
import LinkIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import storageService from "../services/storageService";

// Types
interface TimeSlot {
  id: string;
  date?: string; // Optional for specificDays events
  dayOfWeek?: string; // For daysOfWeek events
  time: string;
  dateObj?: Date; // Optional since daysOfWeek events don't need specific dates
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [name, setName] = useState<string>(user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responses, setResponses] = useState<{
    totalResponses: number;
    uniqueUsers: number;
    responses: any[];
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [showOthersAvailability, setShowOthersAvailability] =
    useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const [editingMyAvailability, setEditingMyAvailability] =
    useState<boolean>(false);
  const [mySubmittedSlots, setMySubmittedSlots] = useState<string[]>([]);
  const [hoveredSlotInfo, setHoveredSlotInfo] = useState<{
    slotId: string;
    availableUsers: string[];
    time: string;
    dayLabel: string;
  } | null>(null);
  const [flashEditButton, setFlashEditButton] = useState(false);

  // Ref to hold the current name value for useEffects without being a dependency
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  // Generate all possible time slots for the calendar (full grid)
  const generateAllTimeSlots = useCallback((): TimeSlot[] => {
    if (!event) return [];
    const slots: TimeSlot[] = [];
    let days: string[] = [];

    // Get the days for the event
    if (event.eventType === "specificDays" && event.specificDays) {
      days = event.specificDays;
    } else if (event.eventType === "daysOfWeek" && event.daysOfWeek) {
      days = event.daysOfWeek;
    }

    // Get the time range
    let startTime = event.timeRange?.start || "09:00";
    let endTime = event.timeRange?.end || "17:00";

    // Convert 12-hour format to 24-hour if needed
    [startTime, endTime] = [startTime, endTime].map((time) => {
      if (time.includes("AM") || time.includes("PM")) {
        const [t, period] = time.split(" ");
        const [hours, minutes] = t.split(":").map(Number);
        let hour24 = hours;
        if (period === "PM" && hours < 12) hour24 += 12;
        if (period === "AM" && hours === 12) hour24 = 0;
        return `${hour24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      }
      return time;
    });

    // Generate all 15-minute time slots between start and end time
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());
    const timeSlots: string[] = [];
    let current = start;
    while (current < end) {
      timeSlots.push(format(current, "HH:mm"));
      current = addMinutes(current, 15);
    }

    // Create a slot for every combination of day and time
    days.forEach((day) => {
      timeSlots.forEach((time) => {
        if (event.eventType === "specificDays") {
          const slotId = `${day}-${time}`;
          const [year, month, dayNum] = day.split("-").map(Number);
          const [hours, minutes] = time.split(":").map(Number);
          const dateObj = new Date(year, month - 1, dayNum, hours, minutes);
          slots.push({
            id: slotId,
            date: day,
            time,
            dateObj,
          });
        } else {
          // daysOfWeek
          const slotId = `${day}-${time}`;
          slots.push({
            id: slotId,
            dayOfWeek: day,
            time,
          });
        }
      });
    });

    return slots;
  }, [event]);

  // Use all possible slots for the grid
  const allTimeSlots = useMemo(
    () => generateAllTimeSlots(),
    [generateAllTimeSlots]
  );

  // Merge in availability data from backend
  const processResponses = useCallback(
    (slots: TimeSlot[]): TimeSlot[] => {
      if (!responses?.responses) return slots;
      // Create a map of slot IDs to available users
      const slotAvailability = new Map<string, string[]>();
      responses.responses.forEach((response) => {
        const slotId = response.slotId;
        const users = slotAvailability.get(slotId) || [];
        users.push(response.userName);
        slotAvailability.set(slotId, users);
      });
      // Update slots with availability information
      return slots.map((slot) => ({
        ...slot,
        availableUsers: slotAvailability.get(slot.id) || [],
      }));
    },
    [responses]
  );

  // Group time slots by date or day of week
  const groupedByDate = useMemo(
    () =>
      allTimeSlots.reduce((acc: GroupedSlots, slot) => {
        const key = slot.date || slot.dayOfWeek || "";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(slot);
        return acc;
      }, {} as GroupedSlots),
    [allTimeSlots]
  );

  // Use the merged slots for the grid
  const processedTimeSlots = useMemo(
    () =>
      showOthersAvailability ? processResponses(allTimeSlots) : allTimeSlots,
    [showOthersAvailability, processResponses, allTimeSlots]
  );

  // Memoize the formatted slots generation
  const generateFormattedSlots = useCallback(
    (slots: string[]) => {
      return slots.map((slotId) => {
        if (event?.eventType === "daysOfWeek") {
          return slotId.split("-undefined")[0];
        }

        const parts = slotId.split("-");
        const date = parts.slice(0, 3).join("-");
        const time = parts[3];
        return `${date}-${time}`;
      });
    },
    [event?.eventType]
  );

  // Memoize the availability grid props (excluding hover handlers)
  const availabilityGridProps = useMemo(
    () => ({
      event,
      groupedByDate,
      selectedSlots: editingMyAvailability ? selectedSlots : mySubmittedSlots,
      setSelectedSlots: editingMyAvailability ? setSelectedSlots : undefined,
      showOthersAvailability,
      processedTimeSlots,
      theme,
    }),
    [
      event,
      groupedByDate,
      editingMyAvailability,
      selectedSlots,
      mySubmittedSlots,
      showOthersAvailability,
      processedTimeSlots,
      theme,
    ]
  );

  // On mount, load last submitted guest name and availability (runs only once)
  useEffect(() => {
    if (!user && eventId) {
      const lastGuestName = storageService.getItem<string>(`guestName_${eventId}`);
      console.log('[LocalStorage][GUEST][LOAD]', `guestName_${eventId}`, lastGuestName);
      if (lastGuestName) {
        setName(lastGuestName);
        const key = `availability_${eventId}_${lastGuestName}`;
        const loadedAvailability = storageService.getItem<string[]>(key);
        console.log('[LocalStorage][GUEST][LOAD]', key, loadedAvailability);
        if (loadedAvailability) {
          setMySubmittedSlots(loadedAvailability);
        }
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save guest name and availability to local storage only after successful submission
  const handleSubmit = useCallback(async () => {
    if (!name || selectedSlots.length === 0) {
      setSnackbar({
        open: true,
        message: "Please enter your name and select at least one time slot",
        severity: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedSlots = generateFormattedSlots(selectedSlots);

      await submitAvailability(eventId!, {
        userName: name,
        selectedSlots: formattedSlots,
      });

      setSnackbar({
        open: true,
        message: "Your availability has been saved!",
        severity: "success",
      });

      const responsesData = await getEventResponses(eventId!);
      setResponses(responsesData);

      const submittedUserName = user?.name || name;
      const latestCurrentUserResponse = responsesData.responses.find(
        (response: any) => response.userName === submittedUserName
      );

      setMySubmittedSlots(formattedSlots);
      // Save to guest storage only for non-logged-in users
      if (!user) {
        const key = eventId && name ? `availability_${eventId}_${name}` : '';
        if (key) {
          console.log('[LocalStorage][GUEST][SAVE]', key, formattedSlots);
          storageService.setItem(key, formattedSlots);
          // Save last used name
          storageService.setItem(`guestName_${eventId}`, name);
        }
      }
      setSelectedSlots([]);
      setEditingMyAvailability(false);
      setShowOthersAvailability(true);
    } catch (err) {
      console.error("Error submitting availability:", err);
      setSnackbar({
        open: true,
        message: "Failed to submit availability",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, selectedSlots, eventId, user, generateFormattedSlots]);

  // Memoize the handleSlotSelection function
  const handleSlotSelection = useCallback((slot: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      }
      return [...prev, slot];
    });
  }, []);

  // Update the mySubmittedSlots effect to handle storage only for non-logged-in users
  useEffect(() => {
    if (!responses?.responses) {
      if (mySubmittedSlots.length > 0) {
        setMySubmittedSlots([]);
      }
      return;
    }

    console.log('responses.responses:', responses.responses);
    console.log('user:', user);
    console.log('nameRef.current:', nameRef.current);

    const nameToLookup = user?.name || nameRef.current;

    // Collect all slotIds for this user
    const userResponses = responses.responses.filter(
      (response: any) => response.userName === nameToLookup && response.isAvailable
    );
    const newSubmittedSlots = userResponses.map((r: any) => r.slotId);

    console.log('nameToLookup:', nameToLookup);
    console.log('userResponses:', userResponses);
    console.log('newSubmittedSlots:', newSubmittedSlots);

    if (
      mySubmittedSlots.length !== newSubmittedSlots.length ||
      !mySubmittedSlots.every((slot, i) => slot === newSubmittedSlots[i])
    ) {
      setMySubmittedSlots(newSubmittedSlots);
    }
  }, [responses, user, nameRef, mySubmittedSlots]);

  // Ensure selectedSlots is set to mySubmittedSlots when entering edit mode
  useEffect(() => {
    if (editingMyAvailability) {
      setSelectedSlots(mySubmittedSlots);
      console.log('selectedSlots:', selectedSlots);
    }
  }, [editingMyAvailability, mySubmittedSlots]);

  // 1. Fetch event data and all responses (runs when eventId or user changes)
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      setIsLoading(true);
      try {
        const [eventResponse, responsesData] = await Promise.all([
          getEventById(eventId),
          getEventResponses(eventId),
        ]);

        if (eventResponse.success && eventResponse.data) {
          setEvent(eventResponse.data.data || eventResponse.data);
        } else {
          setError(eventResponse.error || "Failed to load event");
        }

        setResponses(responsesData);
      } catch (err) {
        setError("Failed to load event data");
        console.error("Error loading event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, user]);

  // Derive all unique users for the hover panel
  const allUniqueUsers = useMemo(() => {
    if (!responses?.responses) return new Set<string>();
    const users = new Set<string>();
    responses.responses.forEach((response) => {
      users.add(response.userName);
    });
    return users;
  }, [responses]);

  const handleSlotHover = useCallback(
    (
      slotId: string,
      availableUsers: string[],
      time: string,
      dayLabel: string
    ) => {
      setHoveredSlotInfo({ slotId, availableUsers, time, dayLabel });
    },
    []
  );

  const handleSlotLeave = useCallback(() => {
    setHoveredSlotInfo(null);
  }, []);

  const unavailableUsers = useMemo(() => {
    if (!hoveredSlotInfo) return [];
    return Array.from(allUniqueUsers).filter(
      (user) => !hoveredSlotInfo.availableUsers.includes(user)
    );
  }, [hoveredSlotInfo, allUniqueUsers]);

  // Add login handler
  const handleGoogleLogin = () => {
    setIsSignInModalOpen(true);
  };

  // Add function to fetch calendar events
  const fetchCalendarEvents = async () => {
    if (!event) return;
    
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }

    setEditingMyAvailability(true);
    setSelectedSlots(mySubmittedSlots);
    setShowOthersAvailability(false);
    
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
      const newSelectedSlots = new Set(selectedSlots);
      
      // For each time slot in our event
      processedTimeSlots.forEach(slot => {
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
        
        const slotEnd = addMinutes(slotStart, 15); // 15-minute slots
        
        // Check if this slot overlaps with any calendar event
        const hasOverlap = calendarEvents.some(event => {
          // Parse the ISO dates with timezone information
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
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
          
          const overlaps = (
            (slotStartUTC >= eventStartUTC && slotStartUTC < eventEndUTC) || // Slot starts during event
            (slotEndUTC > eventStartUTC && slotEndUTC <= eventEndUTC) || // Slot ends during event
            (slotStartUTC <= eventStartUTC && slotEndUTC >= eventEndUTC) // Slot completely contains event
          );
          
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

  const handleRequireEdit = useCallback(() => {
    setFlashEditButton(true);
    setTimeout(() => setFlashEditButton(false), 400);
  }, []);

  // Clear selectedSlots when leaving edit mode
  useEffect(() => {
    if (!editingMyAvailability) {
      setSelectedSlots([]);
    }
  }, [editingMyAvailability]);

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
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Title Section */}
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 400,
                  fontSize: "2.5rem",
                  mb: 0.5,
                }}
              >
                {event?.name || "Event Details"}
              </Typography>
              {(event?.eventType === "specificDays" ||
                event?.creatorName === user?.name) && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {event?.eventType === "specificDays" &&
                    (() => {
                      let startDate =
                        event?.specificDays?.[0] ||
                        new Date().toISOString().split("T")[0];
                      let endDate =
                        event?.specificDays?.[event?.specificDays?.length - 1] ||
                        new Date().toISOString().split("T")[0];
                      if (event?.specificDays && event.specificDays.length > 1) {
                        // Sort dates to ensure correct order
                        const sorted = [...event.specificDays].sort(
                          (a, b) => new Date(a).getTime() - new Date(b).getTime()
                        );
                        startDate = sorted[0];
                        endDate = sorted[sorted.length - 1];
                      }
                      return (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ lineHeight: 1.5, mr: 1 }}
                        >
                          {format(parseISO(startDate), "M/d")} -{" "}
                          {format(parseISO(endDate), "M/d")}
                        </Typography>
                      );
                    })()}
                  {event?.creatorName === user?.name && (
                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        textTransform: "none",
                        color: "primary.main",
                        fontWeight: 500,
                        p: 0,
                        minWidth: 0,
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: "primary.dark",
                        },
                      }}
                      onClick={() => {
                        console.log("edit event");
                      }}
                    >
                      Edit event
                    </Button>
                  )}
                </Box>
              )}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<LinkIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setSnackbar({
                      open: true,
                      message: "Event link copied to clipboard!",
                      severity: "success",
                    });
                  }}
                  sx={{
                    textTransform: "none",
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  Copy link
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<CalendarMonthIcon />}
                  onClick={user ? fetchCalendarEvents : handleGoogleLogin}
                  disabled={isImporting}
                  sx={{
                    textTransform: "none",
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {isImporting ? "Importing..." : (user || editingMyAvailability) ? "Import Google Calendar" : "Login with Google"}
                </Button>
                {editingMyAvailability ? (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={
                      isSubmitting ||
                      (!user && !name) ||
                      selectedSlots.length === 0
                    }
                    onClick={handleSubmit}
                    sx={{
                      minWidth: "160px",
                      textTransform: "none",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => {
                      setEditingMyAvailability(true);
                      setSelectedSlots(mySubmittedSlots);
                      setShowOthersAvailability(false);
                    }}
                    sx={{
                      minWidth: "160px",
                      textTransform: "none",
                      transition: "box-shadow 0.2s, background 0.2s",
                      boxShadow: flashEditButton ? "0 0 0 4px #1976d2aa" : undefined,
                      backgroundColor: flashEditButton ? "primary.light" : undefined,
                      opacity: flashEditButton ? 0.8 : 1,
                    }}
                  >
                    {mySubmittedSlots.length > 0 ? "Edit availability" : "Enter availability"}
                  </Button>
                )}
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOthersAvailability}
                    onChange={(e) =>
                      setShowOthersAvailability(e.target.checked)
                    }
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Show others' availability
                  </Typography>
                }
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.875rem",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            {/* Responses Panel */}
            {showOthersAvailability && responses && (
              <Box sx={{ mb: { xs: 4, md: 0 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Responses
                  </Typography>
                </Box>
                {hoveredSlotInfo ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "text.secondary" }}
                    >
                      {hoveredSlotInfo.dayLabel} on{" "}
                      {format(
                        parse(hoveredSlotInfo.time, "HH:mm", new Date()),
                        "h:mm a"
                      )}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {hoveredSlotInfo.availableUsers.length > 0 ? (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ fontWeight: "bold", mb: 0.5 }}
                        >
                          Available:
                        </Typography>
                        <List dense disablePadding>
                          {hoveredSlotInfo.availableUsers.map((user) => (
                            <ListItem key={user} sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: "30px" }}>
                                <CheckCircleIcon
                                  color="success"
                                  fontSize="small"
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={user}
                                primaryTypographyProps={{ variant: "body2" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ) : (
                      <></>
                    )}
                    {unavailableUsers.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{ fontWeight: "bold", mb: 0.5 }}
                        >
                          Unavailable:
                        </Typography>
                        <List dense disablePadding>
                          {unavailableUsers.map((user) => (
                            <ListItem key={user} sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: "30px" }}>
                                <Cancel color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={user}
                                primaryTypographyProps={{ variant: "body2" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    {allUniqueUsers.size > 0 ? (
                      <List dense disablePadding>
                        {Array.from(allUniqueUsers).map((uniqueUser) => {
                          const isCreator = event?.creatorName === uniqueUser;
                          const isCurrentUser = user?.name === uniqueUser;
                          return (
                            <ListItem
                              key={uniqueUser}
                              sx={{
                                py: 0.75,
                                px: 1,
                                borderRadius: "4px",
                                backgroundColor: isCreator
                                  ? "rgba(0, 0, 0, 0.04)"
                                  : "transparent",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {isCurrentUser && user?.picture ? (
                                  <Avatar
                                    src={user.picture}
                                    alt={uniqueUser}
                                    sx={{ width: 24, height: 24 }}
                                  />
                                ) : (
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: "grey.400",
                                    }}
                                  >
                                    <Person sx={{ fontSize: 16 }} />
                                  </Avatar>
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={uniqueUser}
                                primaryTypographyProps={{
                                  variant: "body1",
                                  sx: {
                                    fontWeight: 400,
                                    color: "text.primary",
                                  },
                                }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No one has responded to this event yet.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            {/* Calendar View */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                
              </Box>

              {editingMyAvailability && !user && (
                <Box sx={{ mb: 2 }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      padding: "12px",
                      fontSize: "16px",
                      color: theme.palette.text.primary,
                      borderRadius: "8px",
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      width: "100%",
                      maxWidth: "300px",
                    }}
                  />
                </Box>
              )}

              {/* Availability Grid */}
              <AvailabilityGrid
                {...availabilityGridProps}
                editingMyAvailability={editingMyAvailability}
                onSlotHover={handleSlotHover}
                onSlotLeave={handleSlotLeave}
                onRequireEdit={handleRequireEdit}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SignInModal
        open={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        title={"Whenly"}
      />
    </Container>
  );
};

export default EventPage;
