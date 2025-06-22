import React from "react";
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from "@mui/material";
import { format, parse } from "date-fns";

const EventResponsesPanel: React.FC<any> = (props) => {
  const {
    showOthersAvailability,
    setShowOthersAvailability,
    hoveredSlotInfo,
    allUniqueUsers,
    hoveredUserName,
    setHoveredUserName,
    isMobile,
  } = props;
  return (
    <Box
      sx={{
        mb: { xs: 1, md: 0 },
        mt: { xs: 0, md: 5.8 },
        width: { xs: "100%", md: "auto" },
        pr: { xs: 0, md: 2 },
        borderRadius: 3,
        boxShadow: { xs: 1, md: 2 },
        p: { xs: 2, md: 3 },
        minHeight: { xs: 0, md: 320 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 6,
            height: 28,
            borderRadius: 2,
            background: (theme) => theme.palette.primary.main,
            boxShadow: 1,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "1.1rem", md: "1.3rem" },
            letterSpacing: 0.5,
            color: "text.primary",
            textShadow: "0 1px 2px rgba(25, 118, 210, 0.08)",
          }}
        >
          Responses
        </Typography>
      </Box>
      {!isMobile && (
        <FormControlLabel
          control={
            <Switch
              checked={showOthersAvailability}
              onChange={(e) => setShowOthersAvailability(e.target.checked)}
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
            mb: 1,
            "& .MuiFormControlLabel-label": { fontSize: "0.875rem" },
          }}
        />
      )}
      <Divider sx={{ my: 1.5 }} />
      <Box>
        {hoveredSlotInfo ? (
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: "text.secondary",
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            {hoveredSlotInfo.dayLabel} at{" "}
            {format(parse(hoveredSlotInfo.time, "HH:mm", new Date()), "h:mm a")}
          </Typography>
        ) : (
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: "text.secondary",
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            {isMobile ? "Tap to view availability" : "Hover to view availability"}
          </Typography>
        )}
        {allUniqueUsers.size > 0 ? (
          <List
            dense
            disablePadding
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "1fr",
              },
              gap: 0,
              width: "100%",
              overflowX: "hidden",
            }}
          >
            {Array.from(allUniqueUsers).map((uniqueUser) => {
              let isAvailable = false;
              if (hoveredSlotInfo) {
                isAvailable =
                  hoveredSlotInfo.availableUsers.includes(uniqueUser);
              }
              return (
                <ListItem
                  key={uniqueUser as string}
                  sx={{
                    py: 0.5,
                    pl: 0.2,
                    pr: 0,
                    borderRadius: 2,
                    transition: "background 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      background: (theme) => theme.palette.action.hover,
                      boxShadow: 2,
                    },
                    mb: 0.5,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 28, md: 36 }, pl: 0.2 }}>
                    <Avatar
                      sx={{
                        width: { xs: 22, md: 28 },
                        height: { xs: 22, md: 28 },
                        bgcolor: hoveredSlotInfo
                          ? isAvailable
                            ? "primary.main"
                            : "secondary.main"
                          : "grey.400",
                        opacity: hoveredSlotInfo && !isAvailable ? 0.7 : 1,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: { xs: "0.9rem", md: "1.1rem" },
                        border: (theme) =>
                          `2px solid ${theme.palette.background.paper}`,
                        boxShadow: 1,
                        transition: "box-shadow 0.2s, border 0.2s",
                      }}
                    >
                      {(uniqueUser as string).charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={uniqueUser as string}
                    onMouseEnter={() =>
                      setHoveredUserName(uniqueUser as string)
                    }
                    onMouseLeave={() => setHoveredUserName(null)}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontSize: { xs: "0.7rem", md: "1rem" },
                      sx: hoveredSlotInfo
                        ? isAvailable
                          ? {
                              fontWeight: 500,
                            }
                          : {
                              color: "text.disabled",
                              textDecoration: "line-through",
                            }
                        : {
                            fontWeight: 500,
                          },
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.75rem", md: "0.8rem" } }}
          >
            No one has responded to this event yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default EventResponsesPanel;
