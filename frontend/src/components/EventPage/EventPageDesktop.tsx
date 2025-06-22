import React from "react";
import { Box, Container, Paper } from "@mui/material";
import EventTitleHeader from "./EventTitleHeader";
import EventActionButtons from "./EventActionButtons";
import EventResponsesPanel from "./EventResponsesPanel";
import EventAvailabilitySection from "./EventAvailabilitySection";
import EventSnackbar from "./EventSnackbar";
import EventSignInModal from "./EventSignInModal";

const EventPageDesktop: React.FC<any> = (props) => {
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
  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
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
        </Box>
        <Box style={{ display: "flex", gap: 24 }}>
          <Box style={{ flex: "0 0 320px", minWidth: 0 }}>
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
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
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
        </Box>
        <EventSnackbar snackbar={snackbar} setSnackbar={setSnackbar} />
        <EventSignInModal
          open={isSignInModalOpen}
          onClose={() => rest.setIsSignInModalOpen(false)}
          title={"Whenly"}
        />
      </Paper>
    </Container>
  );
};

export default EventPageDesktop;
