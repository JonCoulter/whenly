import React from "react";
import { Stack, Button, IconButton, Box } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";

const EventActionButtons: React.FC<any> = (props) => {
  // Destructure all props needed for the buttons
  const {
    user,
    isImporting,
    fetchCalendarEvents,
    handleGoogleLogin,
    editingMyAvailability,
    isSubmitting,
    setEditingMyAvailability,
    setSelectedSlots,
    setShowOthersAvailability,
    mySubmittedSlots,
    name,
    selectedSlots,
    handleSubmit,
    flashEditButton,
    isMobile,
  } = props;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        width: { xs: "100%", md: "auto" },
        minWidth: { md: 350 },
        alignItems: "center",
        justifyContent: { xs: "center", md: "flex-start" },
        mt: { xs: 2, md: 0 },
        mb: { xs: 2, md: 0 },
        height: { xs: "100%", md: "auto" },
      }}
    >
      <Button
        variant="outlined"
        color="primary"
        size={isMobile ? "medium" : "large"}
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          if (props.setSnackbar) {
            props.setSnackbar({
              open: true,
              message: "Event link copied to clipboard!",
              severity: "success",
            });
          }
        }}
        sx={{
          textTransform: "none",
          borderColor: "divider",
          color: "text.secondary",
          width: "auto",
          height: isMobile ? "36px" : "41px",
          px: isMobile ? "12px" : "18px",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "transparent",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LinkIcon sx={{ mr: isMobile ? 0 : 1 }} />
          {isMobile ? "" : <Box sx={{ ml: "2px" }}>Copy link</Box>}
        </Box>
      </Button>
      <Button
        variant="outlined"
        color="primary"
        size={isMobile ? "medium" : "large"}
        onClick={user ? fetchCalendarEvents : handleGoogleLogin}
        disabled={isImporting}
        sx={{
          textTransform: "none",
          borderColor: "divider",
          color: "text.secondary",
          width: "auto",
          height: isMobile ? "36px" : "41px",
          px: isMobile ? "12px" : "18px",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "transparent",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CalendarMonthIcon sx={{ mr: isMobile ? 0 : 1 }} />
        <Box sx={{ml: isMobile ? 0 : "2px"}}>
        {isMobile
          ? ""
          : isImporting
              ? "Importing..."
              : "Import Google Calendar"}
          </Box>
        </Box>
      </Button>
      {editingMyAvailability ? (
        <Box
          sx={{ display: "flex", gap: 1, width: { xs: "100%", md: "auto" } }}
        >
          <IconButton
            disabled={isSubmitting}
            onClick={() => {
              setEditingMyAvailability(false);
              setSelectedSlots([]);
              setShowOthersAvailability(true);
            }}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "secondary.main" },
              width: { xs: 40, md: 40 },
              height: { xs: 40, md: 40 },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={
              isSubmitting || (!user && !name) || selectedSlots.length === 0
            }
            onClick={handleSubmit}
            sx={{
              minWidth: isMobile
                ? "60px"
                : mySubmittedSlots.length > 0
                ? "112px"
                : "160px",
              textTransform: "none",
              height: isMobile ? "36px" : "41px",
              width: { xs: "100%", md: "auto" },
            }}
          >
            {isSubmitting
              ? mySubmittedSlots.length > 0
                ? "Updating..."
                : "Submitting..."
              : mySubmittedSlots.length > 0
              ? "Update"
              : "Submit"}
          </Button>
        </Box>
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
            minWidth: isMobile ? "90px" : "160px",
            textTransform: "none",
            transition: "box-shadow 0.2s, background 0.2s",
            boxShadow: flashEditButton ? "0 0 0 4px #1976d2aa" : undefined,
            backgroundColor: flashEditButton ? "primary.light" : undefined,
            opacity: flashEditButton ? 0.8 : 1,
            height: isMobile ? "36px" : "41px",
            width: { xs: "100%", md: "auto" },
            fontSize: { xs: "0.8rem", sm: "1rem" },
          }}
        >
          {mySubmittedSlots.length > 0
            ? "Edit availability"
            : "Enter availability"}
        </Button>
      )}
    </Stack>
  );
};

export default EventActionButtons;
