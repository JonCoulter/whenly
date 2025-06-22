import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
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
    setSnackbar,
    showOthersAvailability,
    responses,
    hoveredSlotInfo,
    allUniqueUsers,
    hoveredUserName,
    setHoveredUserName,
    theme,
    availabilityGridProps,
    onGridSlotHover,
    onGridSlotHoverLeave,
    onRequireEdit,
    snackbar,
    isSignInModalOpen,
    setName,
    ...rest
  } = props;

  // State to control SpeedDial open and flash effect
  // const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [flashEditButton, setFlashEditButton] = useState(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to open SpeedDial and flash the edit button
  const openSpeedDialAndFlashEdit = () => {
    // setSpeedDialOpen(true);
    setFlashEditButton(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashEditButton(false), 600);
  };

  // FAB actions
  // const actions = [
  //   {
  //     icon: (
  //       editingMyAvailability ? <VisibilityIcon /> : <EditIcon style={
  //           flashEditButton
  //             ? {
  //                 color: "primary.main",
  //               }
  //             : {
  //                 color: "black",
  //             }
  //         }/>
  //     ),
  //     name: editingMyAvailability ? "View Responses" : "Edit Availability",
  //     onClick: () => {
  //       if (editingMyAvailability) {
  //         setEditingMyAvailability(false);
  //         setSelectedSlots([]);
  //         setShowOthersAvailability(true);
  //       } else {
  //         setEditingMyAvailability(true);
  //         setSelectedSlots(mySubmittedSlots);
  //         setShowOthersAvailability(false);
  //       }
  //       setSpeedDialOpen(false);
  //     },
  //   },
  //   {
  //     icon: <LinkIcon />,
  //     name: "Copy Link",
  //     onClick: () => {
  //       navigator.clipboard.writeText(window.location.href);
  //       setSnackbar({
  //         open: true,
  //         message: "Event link copied to clipboard!",
  //         severity: "success",
  //       });
  //     },
  //   },
  //   {
  //     icon: <CalendarMonthIcon />,
  //     name: "Import Google Calendar",
  //     onClick: user ? fetchCalendarEvents : handleGoogleLogin,
  //   },
  // ];

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Paper elevation={2} sx={{ p: 3, position: "relative", minHeight: 400 }}>
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
          isMobile={true}
        />
        <Box style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {showOthersAvailability && (
            <EventResponsesPanel
              showOthersAvailability={showOthersAvailability}
              setShowOthersAvailability={setShowOthersAvailability}
              hoveredSlotInfo={hoveredSlotInfo}
              allUniqueUsers={allUniqueUsers}
              hoveredUserName={hoveredUserName}
              setHoveredUserName={setHoveredUserName}
              isMobile={true}
            />
          )}
          <EventAvailabilitySection
            editingMyAvailability={editingMyAvailability}
            user={user}
            name={name}
            setName={setName}
            theme={theme}
            availabilityGridProps={availabilityGridProps}
            onGridSlotHover={onGridSlotHover}
            onGridSlotHoverLeave={onGridSlotHoverLeave}
            onRequireEdit={openSpeedDialAndFlashEdit}
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
        {/* <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial> */}
      </Paper>
    </Container>
  );
};

export default EventPageMobile;
