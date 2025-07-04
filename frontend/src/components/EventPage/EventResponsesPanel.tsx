import React, { useState } from "react";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Collapse from "@mui/material/Collapse";

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
  const [showAllResponses, setShowAllResponses] = useState(false);

  const uniqueUsersArray = Array.from(allUniqueUsers);

  const initialVisibleCount = isMobile
    ? showAllResponses
      ? 8
      : 7
    : uniqueUsersArray.length;

  const firstListUsers = isMobile
    ? uniqueUsersArray.slice(0, 8)
    : uniqueUsersArray;

  const expandedListUsers =
    isMobile && showAllResponses && uniqueUsersArray.length > 8
      ? uniqueUsersArray.slice(8)
      : [];

  // Define shared styles for both lists
  const listStyles = {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr 1fr",
      md: "1fr",
    },
    rowGap: 0.5,
    width: "100%",
    overflowX: "hidden",
    minHeight: isMobile ? 120 : 'auto', // Optional visual polish
  };

  const expandedListStyles = {
    ...listStyles,
    minHeight: "2px",
    marginTop: "4px",
    marginBottom: expandedListUsers.length % 2 === 0 ? "30px" : "0px",
  };

  const renderUserListItem = (uniqueUser: any) => {
    let isAvailable = false;
    if (hoveredSlotInfo) {
      isAvailable = hoveredSlotInfo.availableUsers.includes(uniqueUser);
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
              border: (theme) => `2px solid ${theme.palette.background.paper}`,
              boxShadow: 1,
              transition: "box-shadow 0.2s, border 0.2s",
            }}
          >
            {(uniqueUser as string).charAt(0)}
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary={uniqueUser as string}
          onMouseEnter={() => setHoveredUserName(uniqueUser as string)}
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
  };

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
            {isMobile
              ? "Tap to view availability"
              : "Hover to view availability"}
          </Typography>
        )}
        {uniqueUsersArray.length > 0 ? (
          <Box sx={{ position: "relative" }}>
            <List
              dense
              disablePadding
              sx={listStyles}
            >
              {firstListUsers.map(renderUserListItem)}
            </List>

            <Box>
              <Collapse in={showAllResponses} unmountOnExit>
                <List
                  dense
                  disablePadding
                  sx={expandedListStyles}
                >
                  {expandedListUsers.map(renderUserListItem)}
                </List>
              </Collapse>
            </Box>

            {isMobile && uniqueUsersArray.length > 8 && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: (theme) => theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <ListItem
                  sx={{
                    py: 0.5,
                    px: 0,
                    borderRadius: 2,
                    transition: "background 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      background: (theme) => theme.palette.action.hover,
                      boxShadow: 3,
                    },
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowAllResponses(!showAllResponses)}
                >
                  {showAllResponses ? (
                    <ExpandLessIcon
                      sx={{
                        mx: 0.3,
                        px: 0.5,
                      }}
                    />
                  ) : (
                    <>
                      <ListItemText
                        sx={{
                          pl: 0.8,
                        }}
                        primary={
                          `View ${Math.max(uniqueUsersArray.length - 7, 0)} more responses`
                        }
                        primaryTypographyProps={{
                          variant: "body2",
                          fontSize: "0.7rem",
                        }}
                      />
                      <ExpandMoreIcon 
                        sx={{
                          ml: 0,
                          mx: 0.3,
                          pl: 0.4,
                          pr: 0.6,
                        }}
                      />
                    </>
                  )}
                </ListItem>
              </Box>
            )}
          </Box>
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
