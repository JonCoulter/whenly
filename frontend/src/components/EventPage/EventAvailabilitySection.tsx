import React from "react";
import { Box } from "@mui/material";
import AvailabilityGrid from "../AvailabilityGrid";

const EventAvailabilitySection: React.FC<any> = (props) => {
  const {
    editingMyAvailability,
    user,
    name,
    setName,
    theme,
    availabilityGridProps,
    handleSlotHover,
    handleSlotLeave,
    handleRequireEdit,
    hoveredUserName,
  } = props;
  return (
    <Box>
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
      <AvailabilityGrid
        {...availabilityGridProps}
        editingMyAvailability={editingMyAvailability}
        onSlotHover={handleSlotHover}
        onSlotLeave={handleSlotLeave}
        onRequireEdit={handleRequireEdit}
        highlightUserName={hoveredUserName}
      />
    </Box>
  );
};

export default EventAvailabilitySection;
