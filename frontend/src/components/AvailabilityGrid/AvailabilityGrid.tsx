import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { format } from "date-fns";
import { darken } from "@mui/material/styles";
import {
  getHourLabel,
  sortSpecificDays,
  sortDaysOfWeek,
  buildTimeLabels,
  buildHourLabels,
  buildGrid,
} from "./gridUtils";
import { useGridSelection } from "./useGridSelection";
import GridBody from "./GridBody";

interface TimeSlot {
  id: string;
  date?: string;
  dayOfWeek?: string;
  time: string;
  availableUsers?: string[];
}

interface GroupedSlots {
  [key: string]: TimeSlot[];
}

interface AvailabilityGridProps {
  /** The event object containing all event data */
  event: {
    eventType: "specificDays" | "daysOfWeek" | string;
    // Add more fields as needed
  };
  /** Time slots grouped by date or day of week */
  groupedByDate: GroupedSlots;
  /** Array of currently selected slot IDs */
  selectedSlots: string[];
  /** Function to set selected time slots (only when editing) */
  setSelectedSlots?: React.Dispatch<React.SetStateAction<string[]>>;
  /** Whether to show others' availability (view mode) */
  showOthersAvailability: boolean;
  /** All processed time slots for the grid */
  processedTimeSlots: TimeSlot[];
  /** The MUI theme object */
  theme: {
    palette: {
      background: { paper: string };
      divider: string;
      primary: { main: string; light: string };
      action: { selected: string };
      text: { primary: string; secondary: string };
    };
  };
  /** Handler for when a slot is hovered (view mode) */
  onSlotHoverChange?: (info: {
    slotId: string;
    availableUsers: string[];
    time: string;
    dayLabel: string;
  } | null) => void;
  /** Handler to require edit mode (when not allowed to edit directly) */
  onRequireEdit?: () => void;
  /** Whether the user is editing their own availability */
  editingMyAvailability: boolean;
  /** Number of unique users who have responded */
  uniqueUserCount: number;
  /** The user name to highlight in the grid (for hover in response panel) */
  highlightUserName?: string | null;
  /** Handler for when the mouse leaves a slot (view mode) */
  onSlotLeave?: () => void;
}

// Height of one cell (px)
const cellHeight = 18;

// Memoized Grid Cell Component
interface GridCellProps {
  cell: { slotId: string; availableUsers: string[]; time: string };
  isSelected: boolean;
  isBeingDragged: boolean;
  dragMode: "select" | "deselect" | null;
  showOthersAvailability: boolean;
  theme: any;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  colIdx: number;
  rowIdx: number;
  daysLength: number;
  grid: { slotId: string; availableUsers: string[]; time: string }[][];
  selectedSlotsSet: Set<string>;
  isSelectable: boolean;
  days: string[];
  onCellEnter: () => void;
  onSlotLeave: () => void;
  event: any;
  editingMyAvailability: boolean;
  uniqueUserCount: number;
  isHighlightedUserAvailable: boolean;
  highlightUserName?: string | null;
}

const GridCell: React.FC<GridCellProps> = React.memo(
  ({
    cell,
    isSelected,
    isBeingDragged,
    dragMode,
    showOthersAvailability,
    theme,
    onMouseDown,
    onTouchStart,
    onTouchEnd,
    colIdx,
    rowIdx,
    daysLength,
    grid,
    selectedSlotsSet,
    isSelectable,
    days,
    onCellEnter,
    onSlotLeave,
    event,
    editingMyAvailability,
    uniqueUserCount,
    isHighlightedUserAvailable,
    highlightUserName,
  }) => {
    const availableCount = cell.availableUsers.length;
    const denominator = uniqueUserCount > 0 ? uniqueUserCount : 1;
    const intensity = Math.min(availableCount / denominator, 1);

    let bgColor = theme.palette.background.paper;
    if (highlightUserName) {
      if (isHighlightedUserAvailable) {
        let opacity = 0.1 + Math.min(1 / denominator, 1) * 0.75;
        bgColor = `rgba(25, 118, 210, ${opacity})`;
      }
    } else {
      if (isBeingDragged && dragMode === "select") {
        bgColor = theme.palette.primary.light;
      } else if (isBeingDragged && dragMode === "deselect") {
        bgColor = theme.palette.action.selected;
      } else if (isSelected && !showOthersAvailability) {
        bgColor = theme.palette.primary.main;
      } else if (showOthersAvailability && availableCount > 0) {
        bgColor = `rgba(25, 118, 210, ${0.1 + intensity * 0.75})`;
      }
    }

    // Border logic for outline/merge
    let border: React.CSSProperties = {};
    if (highlightUserName) {
      border = {
        borderLeft: "1px solid " + theme.palette.divider,
        borderRight: "1px solid " + theme.palette.divider,
        borderBottom: "none",
        borderTop:
          rowIdx > 0 && rowIdx % 2 === 0
            ? "1px solid " + theme.palette.divider
            : "none",
      };
    } else if (editingMyAvailability && isSelected) {
      const isAboveSelected =
        rowIdx > 0 && selectedSlotsSet.has(grid[rowIdx - 1][colIdx].slotId);
      const isBelowSelected =
        rowIdx < grid.length - 1 &&
        selectedSlotsSet.has(grid[rowIdx + 1][colIdx].slotId);
      const isLastRow = rowIdx === grid.length - 1;
      const is30MinIncrement = rowIdx > 0 && rowIdx % 2 === 0;
      const verticalBorder = showOthersAvailability
        ? "2px solid " + theme.palette.primary.main
        : "1px solid " + theme.palette.divider;
      border = {
        borderLeft: verticalBorder,
        borderRight: verticalBorder,
        borderBottom: isBelowSelected
          ? "none"
          : isLastRow
          ? "2px solid " + theme.palette.primary.main
          : "2px solid " + theme.palette.primary.main,
        borderTop: is30MinIncrement
          ? isAboveSelected
            ? "1px solid " + theme.palette.divider
            : "2px solid " + theme.palette.primary.main
          : isAboveSelected
          ? "none"
          : "2px solid " + theme.palette.primary.main,
      };
    } else {
      border = {
        borderLeft: "1px solid " + theme.palette.divider,
        borderRight: "1px solid " + theme.palette.divider,
        borderTop:
          rowIdx > 0 && rowIdx % 2 === 0
            ? "1px solid " + theme.palette.divider
            : "none",
      };
    }

    // Add highlight for hovered user
    let highlightStyle = {};
    if (highlightUserName) {
      if (!isHighlightedUserAvailable) {
        highlightStyle = {
          filter: "grayscale(60%)",
        };
      }
    }

    return (
      <Box
        onMouseDown={onMouseDown}
        onMouseEnter={onCellEnter}
        onMouseLeave={onSlotLeave || (() => {})}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          ...border,
          height: cellHeight + "px",
          width: "100%",
          backgroundColor: bgColor,
          color:
            isSelected && !showOthersAvailability
              ? "#fff"
              : theme.palette.text.primary,
          cursor: isSelectable ? "pointer" : "default",
          transition:
            "background 0.2s, box-shadow 0.2s, opacity 0.2s, filter 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          userSelect: "none",
          "&:hover": {
            backgroundColor: darken(bgColor, 0.1),
          },
          ...highlightStyle,
        }}
      />
    );
  }
);

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  event,
  groupedByDate,
  selectedSlots,
  setSelectedSlots,
  showOthersAvailability,
  processedTimeSlots,
  theme,
  onSlotHoverChange,
  onRequireEdit,
  editingMyAvailability,
  uniqueUserCount,
  highlightUserName,
  onSlotLeave,
}) => {
  // Days (columns)
  let days = Object.keys(groupedByDate);
  if (event?.eventType === "specificDays") {
    days = sortSpecificDays(days);
  } else if (event?.eventType === "daysOfWeek") {
    days = sortDaysOfWeek(days);
  }

  // Build time labels
  const timeLabels = useMemo(() => buildTimeLabels(processedTimeSlots), [processedTimeSlots]);

  // Map of available users for each slot
  const slotAvailabilityMap = useMemo(() => {
    const map = new Map<string, string[]>();
    processedTimeSlots.forEach((slot) => {
      if (slot.availableUsers) {
        map.set(slot.id, slot.availableUsers);
      }
    });
    return map;
  }, [processedTimeSlots]);

  // Build 2D grid: grid[timeIdx][dayIdx] = { slotId, availableUsers, time }
  const grid = useMemo(() => buildGrid(timeLabels, days, slotAvailabilityMap), [timeLabels, days, slotAvailabilityMap]);

  // Build hour label info: [{ label: '9 AM', rowIdx: 0 }, ...]
  const hourLabels = useMemo(() => buildHourLabels(timeLabels), [timeLabels]);

  // Grid ref
  const gridRef = useRef<HTMLDivElement>(null);

  // Check if the screen is small
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // Use custom hook for all drag/touch selection logic
  const {
    isDragging,
    dragMode,
    draggedSlots,
    lastDragCell,
    isTouchDragging,
    lastTouchCell,
    handleCellMouseDown,
    handleCellEnter,
    handleCellTouchStart,
    handleCellTouchEnd,
  } = useGridSelection({
    setSelectedSlots,
    onRequireEdit,
    grid,
    timeLabels,
    days,
    cellHeight,
  });

  // Memoized Set
  const selectedSlotsSet = useMemo(
    () => new Set(selectedSlots),
    [selectedSlots]
  );

  // Local hover state to avoid parent re-renders
  const [localHoveredCell, setLocalHoveredCell] = useState<{
    slotId: string;
    availableUsers: string[];
    time: string;
    dayLabel: string;
  } | null>(null);
  const lastParentHoverRef = useRef<string | null>(null);

  // Debounced call to parent onSlotHoverChange
  useEffect(() => {
    if (!onSlotHoverChange) return;
    // Only call parent if hovered cell actually changed
    if (localHoveredCell?.slotId !== lastParentHoverRef.current) {
      lastParentHoverRef.current = localHoveredCell?.slotId || null;
      console.log('localHoveredCell (AvailabilityGrid)', localHoveredCell);
      onSlotHoverChange(localHoveredCell);
    }
  }, [localHoveredCell]);

  // On tap/click, also set hovered cell info for mobile
  const handleCellClick = useCallback(
    (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }) => {
      const dayLabel =
        event?.eventType === "daysOfWeek"
          ? days[col]
          : format(new Date(days[col] + "T00:00:00"), "MMM d, EEE");
      setLocalHoveredCell({
        slotId: cell.slotId,
        availableUsers: cell.availableUsers,
        time: cell.time,
        dayLabel,
      });
    },
    [event?.eventType, days]
  );

  return (
    <Box sx={{ width: "100%", overflowX: "auto", pb: 2 }}>
      {/* Header row: day headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${days.length}, 1fr)`,
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          ml: { xs: "41px", md: "48px" },
          // no margin bottom
        }}
      >
        {days.map((day) => (
          <Box key={day} sx={{ textAlign: "center", py: 0.5 }}>
            <Typography variant="body2" fontWeight="medium">
              {event.eventType === "daysOfWeek"
                ? isSmallScreen
                  ? day.substring(0, 3)
                  : day
                : format(new Date(day + "T00:00:00"), "EEE")}
            </Typography>
            {event.eventType === "specificDays" && (
              <Typography variant="caption" color="text.secondary">
                {format(new Date(day + "T00:00:00"), "MMM d")}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      {/* Main flex row: left = time labels, right = grid */}
      <Box
        sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}
      >
        {/* Time labels (hour, aligned to top of hour block) */}
        <Box
          sx={{ width: { xs: "41px", md: "48px" }, flexShrink: 0, position: "relative", zIndex: 1 }}
        >
          {hourLabels.map(({ label, rowIdx }, i) => (
            <Box
              key={label + rowIdx}
              sx={{
                position: "absolute",
                top: rowIdx * cellHeight - 7, // Align top of hour to above cell top
                height: cellHeight,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                pr: 1,
                fontSize: { xs: 11, md: 13 },
                color: theme.palette.text.secondary,
                pointerEvents: "none",
                width: "100%",
              }}
            >
              {label}
            </Box>
          ))}
          <Box sx={{ height: timeLabels.length * cellHeight }} />
        </Box>
        {/* Main grid body is now a separate component for modularity and clarity */}
        <GridBody
          grid={grid}
          days={days}
          timeLabels={timeLabels}
          cellHeight={cellHeight}
          selectedSlotsSet={selectedSlotsSet}
          draggedSlots={draggedSlots}
          dragMode={dragMode}
          showOthersAvailability={showOthersAvailability}
          theme={theme}
          handleCellMouseDown={handleCellMouseDown}
          handleCellEnter={handleCellEnter}
          handleCellTouchStart={handleCellTouchStart}
          handleCellTouchEnd={handleCellTouchEnd}
          editingMyAvailability={editingMyAvailability}
          uniqueUserCount={uniqueUserCount}
          highlightUserName={highlightUserName}
          onSlotLeave={onSlotLeave}
          event={event}
          handleCellClick={handleCellClick}
        />
      </Box>
    </Box>
  );
};

// PropTypes for runtime validation
AvailabilityGrid.propTypes = {
  event: PropTypes.shape({
    eventType: PropTypes.string.isRequired,
  }).isRequired,
  groupedByDate: PropTypes.object.isRequired,
  selectedSlots: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelectedSlots: PropTypes.func,
  showOthersAvailability: PropTypes.bool.isRequired,
  processedTimeSlots: PropTypes.array.isRequired,
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      background: PropTypes.shape({ paper: PropTypes.string.isRequired }).isRequired,
      divider: PropTypes.string.isRequired,
      primary: PropTypes.shape({ main: PropTypes.string.isRequired, light: PropTypes.string.isRequired }).isRequired,
      action: PropTypes.shape({ selected: PropTypes.string.isRequired }).isRequired,
      text: PropTypes.shape({ primary: PropTypes.string.isRequired, secondary: PropTypes.string.isRequired }).isRequired,
    }).isRequired,
  }).isRequired,
  uniqueUserCount: PropTypes.number.isRequired,
};

export default React.memo(AvailabilityGrid);
