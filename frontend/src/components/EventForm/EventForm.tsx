import React, { useState } from "react";
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
  Grid,
  Checkbox,
  FormControlLabel,
  useTheme,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "./DayPickerStyles.css";
import { format } from "date-fns";
import { createEvent } from "../../api/eventService";
import type { EventFormData } from "../../api/eventService";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Define time options for dropdowns
const timeOptions = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
  "12:00 AM",
];

interface EventFormProps {
  onSubmit?: (data: EventFormData) => void;
  paperProps?: React.ComponentProps<typeof Paper>;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, paperProps }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<"specificDays" | "daysOfWeek">(
    "specificDays"
  );
  const [eventName, setEventName] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eventName.trim() === "") {
      setSubmitError("Please enter an event name");
      return;
    }

    // Validation for dates or days selection
    if (eventType === "specificDays" && selectedDates.length === 0) {
      setSubmitError("Please select at least one date");
      return;
    }

    if (eventType === "daysOfWeek" && selectedDaysOfWeek.length === 0) {
      setSubmitError("Please select at least one day of the week");
      return;
    }

    // Convert selected dates to strings for the API
    const formattedDates = selectedDates.map((date) =>
      format(date, "yyyy-MM-dd")
    );

    // Collect all form data
    const formData: EventFormData = {
      eventName,
      eventType,
      createdBy: user?.email || "",
      creatorName: user?.name || "",
      timeRange: {
        start: startTime,
        end: endTime,
      },
      ...(eventType === "specificDays"
        ? { specificDays: formattedDates }
        : { daysOfWeek: selectedDaysOfWeek }),
    };

    // Call the provided onSubmit callback if available
    if (onSubmit) {
      onSubmit(formData);
    }

    // Make API request using the service
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await createEvent(formData);

      if (result.success) {
        setSubmitSuccess(true);
        console.log("Event created successfully:", result.data);

        // Reset form after successful submission
        if (!onSubmit) {
          // Only reset if not handled by parent
          setEventName("");
          setSelectedDates([]);
          setSelectedDaysOfWeek([]);
        }
        // Redirect to new event page
        navigate(`/e/${result.data.data.eventId}`);
      } else {
        setSubmitError(result.error || "Failed to create event");
        console.error("Error creating event:", result.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayOfWeekToggle = (day: string) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Handle day selection in the calendar
  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;

    // Toggle the selected date
    setSelectedDates((prev) => {
      const isSelected = prev.some(
        (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      );

      if (isSelected) {
        return prev.filter(
          (d) =>
            !(
              d.getDate() === date.getDate() &&
              d.getMonth() === date.getMonth() &&
              d.getFullYear() === date.getFullYear()
            )
        );
      } else {
        return [...prev, date];
      }
    });
  };

  // Custom styles for the DayPicker using theme values
  const dayPickerStyles = {
    caption: { color: theme.palette.text.primary },
    caption_label: { fontSize: "1rem", fontWeight: "bold" },
    day: { margin: "0.15em", borderRadius: "8px" },
    month: {
      width: "100%",
    },
  };

  // Close success/error alerts
  const handleCloseAlert = () => {
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          display: "flex",
          flexDirection: "column",
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.primary.light}10%)`,
          borderRadius: 3,
          boxShadow: { xs: 1, md: 3 },
          minWidth: { md: 420 },
          maxWidth: 600,
          mx: "auto",
        }}
        {...paperProps}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
          <Box
            sx={{
              width: 6,
              height: 32,
              borderRadius: 2,
              background: (theme) => theme.palette.primary.main,
              mr: 1,
              boxShadow: 1,
            }}
          />
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{
              textAlign: { xs: "left", md: "left" },
              fontWeight: 700,
              color: "primary.main",
              letterSpacing: 0.5,
              textShadow: "0 1px 2px rgba(25, 118, 210, 0.08)",
              mb: 0,
            }}
          >
            Create an Event
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flexGrow: 1,
            width: "100%",
          }}
        >
          {/* Event Name */}
          <TextField
            label="Event Name"
            variant="outlined"
            fullWidth
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            error={!!submitError && eventName.trim() === ""}
            helperText={
              submitError && eventName.trim() === ""
                ? "Event name is required"
                : ""
            }
          />

          {/* Event Type Toggle */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                mb: 2,
              }}
            >
              <Typography variant="subtitle1">Event Type</Typography>
              <Box
                sx={{
                  width: 120,
                  height: 5,
                  borderRadius: 2,
                  background: (theme) => theme.palette.primary.main,
                  boxShadow: 1,
                }}
              />
            </Box>
            <ToggleButtonGroup
              value={eventType}
              exclusive
              onChange={(_, val) => val && setEventType(val)}
              color="primary"
              sx={{ justifyContent: "center" }}
            >
              <ToggleButton value="specificDays">Specific Days</ToggleButton>
              <ToggleButton value="daysOfWeek">Days of the Week</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Time Range Selectors */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
                Time Range
              </Typography>
              <Box
                sx={{
                  width: 120,
                  height: 5,
                  borderRadius: 2,
                  background: (theme) => theme.palette.primary.main,
                  boxShadow: 1,
                }}
              />
            </Box>
            <Grid container spacing={2} justifyContent="center">
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>From</InputLabel>
                  <Select
                    value={startTime}
                    label="From"
                    onChange={(e) => setStartTime(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "divider",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor: "primary.main",
                        },
                    }}
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={`start-${time}`} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>To</InputLabel>
                  <Select
                    value={endTime}
                    label="To"
                    onChange={(e) => setEndTime(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "divider",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor: "primary.main",
                        },
                    }}
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={`end-${time}`} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Selection area - consistent height container */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              flexGrow: 1,
            }}
          >
            {/* Content container - fixed width for both options */}
            <Box
              sx={{
                width: "100%",
                maxWidth: "500px", // Ensures consistent width between both views
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Specific Days Calendar (when specificDays is selected) */}
              {eventType === "specificDays" && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ textAlign: "center" }}
                    >
                      Select Specific Days
                    </Typography>
                    <Box
                      sx={{
                        width: 180,
                        height: 5,
                        borderRadius: 2,
                        background: (theme) => theme.palette.primary.main,
                        boxShadow: 1,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      border: "1px dashed",
                      borderColor:
                        submitError && selectedDates.length === 0
                          ? "error.main"
                          : "divider",
                      borderRadius: 1,
                      p: 2,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onDayClick={handleDaySelect}
                      styles={dayPickerStyles}
                      showOutsideDays
                      footer={
                        selectedDates.length > 0 ? (
                          <Typography
                            variant="caption"
                            sx={{ mt: 1, color: "text.secondary" }}
                          >
                            {selectedDates.length} day
                            {selectedDates.length !== 1 ? "s" : ""} selected
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 1,
                              color:
                                submitError && selectedDates.length === 0
                                  ? "error.main"
                                  : "text.secondary",
                            }}
                          >
                            Please select the date(s) for your event
                          </Typography>
                        )
                      }
                    />
                  </Box>
                </Box>
              )}

              {/* Days of the Week Selector (when daysOfWeek is selected) */}
              {eventType === "daysOfWeek" && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ textAlign: "center", fontWeight: 500 }}
                    >
                      Select Days of the Week
                    </Typography>
                    <Box
                      sx={{
                        width: 180,
                        height: 5,
                        borderRadius: 2,
                        background: (theme) => theme.palette.primary.main,
                        boxShadow: 1,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      maxWidth: 341,
                      width: "100%",
                      mx: "auto",
                      p: 2,
                      border: "1px solid",
                      borderColor:
                        submitError && selectedDaysOfWeek.length === 0
                          ? "error.main"
                          : "divider",
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      boxShadow: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1.5,
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      {[
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((day) => (
                        <Button
                          key={day}
                          variant={
                            selectedDaysOfWeek.includes(day)
                              ? "contained"
                              : "outlined"
                          }
                          size="small"
                          onClick={() => handleDayOfWeekToggle(day)}
                          sx={{
                            minWidth: 38,
                            px: 1.5,
                            fontWeight: 600,
                            borderRadius: 2,
                            fontSize: "0.95rem",
                            boxShadow: selectedDaysOfWeek.includes(day)
                              ? 2
                              : undefined,
                            backgroundColor: selectedDaysOfWeek.includes(day)
                              ? "primary.main"
                              : undefined,
                            color: selectedDaysOfWeek.includes(day)
                              ? "#fff"
                              : undefined,
                            borderColor: selectedDaysOfWeek.includes(day)
                              ? "primary.main"
                              : "divider",
                            "&:hover": {
                              backgroundColor: selectedDaysOfWeek.includes(day)
                                ? "primary.dark"
                                : "action.hover",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isSubmitting}
            sx={{
              alignSelf: "center",
              width: { xs: "90%", md: "auto" },
              boxShadow: 2,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "1.08rem",
              mt: 1,
              px: 4,
              py: 1.2,
              transition: "box-shadow 0.2s, background 0.2s",
              "&:hover": {
                boxShadow: 4,
                backgroundColor: "primary.dark",
              },
            }}
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </Box>
      </Paper>

      {/* Success Alert */}
      <Snackbar
        open={submitSuccess}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          sx={{ width: "100%" }}
        >
          Event created successfully!
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      <Snackbar
        open={!!submitError}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="error"
          sx={{ width: "100%" }}
        >
          {submitError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EventForm;
