import React from "react";
import { Box, Typography } from "@mui/material";
import { format, parseISO } from "date-fns";

const EventTitleHeader: React.FC<{ event: any }> = ({ event }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 1 }}>
        <Box
          sx={{
            width: 6,
            borderRadius: 2,
            background: (theme) => theme.palette.primary.main,
            mt: "6.5px",
            mb: "6.5px",
            mr: 0.5,
            boxShadow: 1,
          }}
        />
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 400,
            fontSize: "2.5rem",
            textAlign: { xs: "left", md: "left" },
            width: "100%",
            pr: 1.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          {event?.name || "Event Details"}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            lineHeight: 1.5,
            mr: 1,
            minHeight: { xs: 0, md: 20 },
            mt: 0.5,
          }}
        >
          {(() => {
            if (!event?.specificDays?.length) {
              return null;
            }
            let startDate = event.specificDays[0];
            let endDate = event.specificDays[event.specificDays.length - 1];
            if (event.specificDays.length > 1) {
              const sorted = [...event.specificDays].sort(
                (a, b) => new Date(a).getTime() - new Date(b).getTime()
              );
              startDate = sorted[0];
              endDate = sorted[sorted.length - 1];
            }
            return (
              <>
                {format(parseISO(startDate), "M/d")} - {format(parseISO(endDate), "M/d")}
              </>
            );
          })()}
        </Typography>
      </Box>
    </Box>
  );
};

export default EventTitleHeader; 