import React from "react";
import { Box, Container, Paper, SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LinkIcon from "@mui/icons-material/Link";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventTitleHeader from "./EventTitleHeader";
import EventActionButtons from "./EventActionButtons";
import EventResponsesPanel from "./EventResponsesPanel";
import EventAvailabilitySection from "./EventAvailabilitySection";
import EventSnackbar from "./EventSnackbar";
import EventSignInModal from "./EventSignInModal";

const EventPageMobile: React.FC<any> = (props) => {
  const {
    event,
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
    setSnackbar,
    showOthersAvailability,
    responses,
    hoveredSlotInfo,
    allUniqueUsers,
    hoveredUserName,
    setHoveredUserName,
    theme,
    availabilityGridProps,
    handleSlotHover,
    handleSlotLeave,
    handleRequireEdit,
    snackbar,
    isSignInModalOpen,
    setName,
    ...rest
  } = props;

  // FAB actions
  const actions = [
    {
      icon: editingMyAvailability ? <VisibilityIcon /> : <EditIcon />,
      name: editingMyAvailability ? "View Responses" : "Edit Availability",
      onClick: () => {
        if (editingMyAvailability) {
          setEditingMyAvailability(false);
          setSelectedSlots([]);
          setShowOthersAvailability(true);
        } else {
          setEditingMyAvailability(true);
          setSelectedSlots(mySubmittedSlots);
          setShowOthersAvailability(false);
        }
      },
    },
    {
      icon: <LinkIcon />, name: "Copy Link", onClick: () => {
        navigator.clipboard.writeText(window.location.href);
        setSnackbar({
          open: true,
          message: "Event link copied to clipboard!",
          severity: "success",
        });
      }
    },
    {
      icon: <CalendarMonthIcon />, name: "Import Google Calendar", onClick: user ? fetchCalendarEvents : handleGoogleLogin
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Paper elevation={2} sx={{ p: 3, position: 'relative', minHeight: 400 }}>
        <EventTitleHeader event={event} />
        <EventActionButtons
          user={user}
          isImporting={isImporting}
          fetchCalendarEvents={fetchCalendarEvents}
          handleGoogleLogin={handleGoogleLogin}
          editingMyAvailability={editingMyAvailability}
          isSubmitting={isSubmitting}
          setEditingMyAvailability={setEditingMyAvailability}
          setSelectedSlots={setSelectedSlots}
          setShowOthersAvailability={setShowOthersAvailability}
          mySubmittedSlots={mySubmittedSlots}
          name={name}
          selectedSlots={selectedSlots}
          handleSubmit={handleSubmit}
          flashEditButton={flashEditButton}
          setSnackbar={setSnackbar}
        />
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {(showOthersAvailability || responses) && (
            <EventResponsesPanel
              showOthersAvailability={showOthersAvailability}
              setShowOthersAvailability={setShowOthersAvailability}
              hoveredSlotInfo={hoveredSlotInfo}
              allUniqueUsers={allUniqueUsers}
              hoveredUserName={hoveredUserName}
              setHoveredUserName={setHoveredUserName}
            />
          )}
          <EventAvailabilitySection
            editingMyAvailability={editingMyAvailability}
            user={user}
            name={name}
            setName={setName}
            theme={theme}
            availabilityGridProps={availabilityGridProps}
            handleSlotHover={handleSlotHover}
            handleSlotLeave={handleSlotLeave}
            handleRequireEdit={handleRequireEdit}
            hoveredUserName={hoveredUserName}
          />
        </Box>
        <EventSnackbar snackbar={snackbar} setSnackbar={setSnackbar} />
        <EventSignInModal
          open={isSignInModalOpen}
          onClose={() => rest.setIsSignInModalOpen(false)}
          title={"Whenly"}
        />
        {/* FAB SpeedDial */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
          icon={<SpeedDialIcon />}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      </Paper>
    </Container>
  );
};

export default EventPageMobile;
