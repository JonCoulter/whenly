import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { format, parse, addMinutes } from "date-fns";
import { darken } from "@mui/material/styles";

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
  event: any;
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
  theme: any;
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

// Helper to get hour from 'HH:mm'
function getHourLabel(time: string) {
  const date = parse(time, "HH:mm", new Date());
  return format(date, "h a");
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
    days = days.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  } else if (event?.eventType === "daysOfWeek") {
    const dayOrder = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    // Map days to their indices in the week
    const indices = days
      .map((day) => dayOrder.indexOf(day))
      .sort((a, b) => a - b);
    // Find the largest gap between consecutive indices (including wrap-around)
    let maxGap = -1;
    let startIdx = 0;
    for (let i = 0; i < indices.length; i++) {
      const curr = indices[i];
      const next = indices[(i + 1) % indices.length];
      // Calculate gap, wrapping around
      const gap = ((next - curr + 7) % 7) - 1;
      if (gap > maxGap) {
        maxGap = gap;
        startIdx = (i + 1) % indices.length;
      }
    }
    // Rotate the days array to start at the best streak
    const orderedIndices = [];
    for (let i = 0; i < indices.length; i++) {
      orderedIndices.push(indices[(startIdx + i) % indices.length]);
    }
    days = orderedIndices.map((idx) => dayOrder[idx]);
  }

  // Build time labels
  const timeLabels = useMemo(() => {
    let minTime: string | null = null;
    let maxTime: string | null = null;
    processedTimeSlots.forEach((slot) => {
      if (!minTime || slot.time < minTime) minTime = slot.time;
      if (!maxTime || slot.time > maxTime) maxTime = slot.time;
    });

    if (!minTime || !maxTime) return [];

    const times: string[] = [];
    let current = parse(minTime, "HH:mm", new Date());
    const lastSlotStartTime = parse(maxTime, "HH:mm", new Date());
    while (current < lastSlotStartTime) {
      times.push(format(current, "HH:mm"));
      current = addMinutes(current, 15);
    }
    times.push(format(lastSlotStartTime, "HH:mm"));

    return times;
  }, [processedTimeSlots]);

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
  const grid = useMemo(() => {
    return timeLabels.map((time) =>
      days.map((day) => {
        const slotId = `${day}-${time}`;
        return {
          slotId,
          availableUsers: slotAvailabilityMap.get(slotId) || [],
          time,
        };
      })
    );
  }, [timeLabels, days, slotAvailabilityMap]);

  // Build hour label info: [{ label: '9 AM', rowIdx: 0 }, ...]
  const hourLabels = useMemo(() => {
    const labels: { label: string; rowIdx: number }[] = [];
    let lastHour = "";
    timeLabels.forEach((time, idx) => {
      const hour = format(parse(time, "HH:mm", new Date()), "H");
      if (hour !== lastHour) {
        labels.push({ label: getHourLabel(time), rowIdx: idx });
        lastHour = hour;
      }
    });
    // Ensure the last hour label is present at the bottom, corresponding to the event's end time
    if (timeLabels.length > 0) {
      const lastSlotStart = parse(timeLabels[timeLabels.length - 1], "HH:mm", new Date());
      const endTime = addMinutes(lastSlotStart, 15);
      const endHour = format(endTime, "H");
      const lastLabelHour = labels.length > 0 ? format(parse(timeLabels[timeLabels.length - 1], "HH:mm", new Date()), "H") : null;
      if (endHour !== lastLabelHour) {
        labels.push({ label: getHourLabel(format(endTime, "HH:mm")), rowIdx: timeLabels.length });
      }
    }
    return labels;
  }, [timeLabels]);

  // Grid ref
  const gridRef = useRef<HTMLDivElement>(null);

  // Check if the screen is small
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // Click and drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect" | null>(null);
  const [draggedSlots, setDraggedSlots] = useState<Set<string>>(new Set());
  const [lastDragCell, setLastDragCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [lastTouchCell, setLastTouchCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // Get all cells between two points (inclusive, straight line)
  const getCellsBetween = useCallback(
    (
      start: { row: number; col: number },
      end: { row: number; col: number }
    ): { row: number; col: number }[] => {
      const cells: { row: number; col: number }[] = [];
      const rowStep = start.row === end.row ? 0 : start.row < end.row ? 1 : -1;
      const colStep = start.col === end.col ? 0 : start.col < end.col ? 1 : -1;
      let row = start.row,
        col = start.col;
      cells.push({ row, col });
      while (row !== end.row || col !== end.col) {
        if (row !== end.row) row += rowStep;
        if (col !== end.col) col += colStep;
        cells.push({ row, col });
      }
      return cells;
    },
    []
  );

  // Mouse up handler
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragMode) {
        if (setSelectedSlots) {
          setSelectedSlots((prev) => {
            const newSet = new Set(prev);
            draggedSlots.forEach((slotId) => {
              if (dragMode === "select") newSet.add(slotId);
              else newSet.delete(slotId);
            });
            return Array.from(newSet);
          });
        }
        setIsDragging(false);
        setDragMode(null);
        setDraggedSlots(new Set());
        setLastDragCell(null);
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, dragMode, draggedSlots, setSelectedSlots]);

  // Touch end handler
  useEffect(() => {
    const handleTouchEnd = (e: TouchEvent) => {
      if (isTouchDragging && dragMode) {
        if (setSelectedSlots) {
          setSelectedSlots((prev) => {
            const newSet = new Set(prev);
            draggedSlots.forEach((slotId) => {
              if (dragMode === "select") newSet.add(slotId);
              else newSet.delete(slotId);
            });
            return Array.from(newSet);
          });
        }
        setIsTouchDragging(false);
        setDragMode(null);
        setDraggedSlots(new Set());
        setLastTouchCell(null);
      }
    };
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isTouchDragging, dragMode, draggedSlots, setSelectedSlots]);

  // Memoized Set
  const selectedSlotsSet = useMemo(
    () => new Set(selectedSlots),
    [selectedSlots]
  );

  // Cell mouse handlers
  const handleCellMouseDown = useCallback(
    (row: number, col: number, slotId: string, isSelected: boolean) => {
      if (!setSelectedSlots) {
        if (typeof onRequireEdit === "function") onRequireEdit();
        return;
      }
      setIsDragging(true);
      setDragMode(isSelected ? "deselect" : "select");
      setDraggedSlots(new Set([slotId]));
      setLastDragCell({ row, col });
    },
    [setSelectedSlots, onRequireEdit]
  );

  const handleCellEnter = useCallback(
    (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }, isSelected: boolean) => {
      if (editingMyAvailability) {
        // Drag/selection logic
        if (!setSelectedSlots) {
          if (typeof onRequireEdit === "function") onRequireEdit();
          return;
        }
        if (isDragging && lastDragCell) {
          const path = getCellsBetween(lastDragCell, { row, col });
          setDraggedSlots((prev) => {
            const next = new Set(prev);
            path.forEach(({ row, col }) => {
              if (grid[row] && grid[row][col]) next.add(grid[row][col].slotId);
            });
            return next;
          });
          setLastDragCell({ row, col });
        }
      } else {
        // Hover info logic
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
      }
    },
    [editingMyAvailability, setSelectedSlots, onRequireEdit, isDragging, lastDragCell, getCellsBetween, grid, event?.eventType, days]
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
      onSlotHoverChange(localHoveredCell);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localHoveredCell]);

  // --- Touch handlers ---
  // Remove per-cell onTouchMove handler, only use onTouchStart
  const handleCellTouchStart = useCallback(
    (
      row: number,
      col: number,
      slotId: string,
      isSelected: boolean,
      e: React.TouchEvent
    ) => {
      if (!setSelectedSlots) {
        if (typeof onRequireEdit === "function") onRequireEdit();
        return;
      }
      setIsTouchDragging(true);
      setDragMode(isSelected ? "deselect" : "select");
      setDraggedSlots(new Set([slotId]));
      setLastTouchCell({ row, col });
    },
    [setSelectedSlots, onRequireEdit]
  );

  // --- Touch move logic at grid level ---
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    // Handler to prevent scroll if dragging and update drag selection
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging || !lastTouchCell) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gridEl.getBoundingClientRect();
      // Calculate cell width/height
      const cellW = rect.width / days.length;
      const cellH = cellHeight; // px, already defined
      // Get coordinates relative to grid
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      // Calculate col/row
      let col = Math.floor(x / cellW);
      let row = Math.floor(y / cellH);
      // Clamp to grid bounds
      col = Math.max(0, Math.min(days.length - 1, col));
      row = Math.max(0, Math.min(timeLabels.length - 1, row));
      // Only update if cell is different
      if (row !== lastTouchCell.row || col !== lastTouchCell.col) {
        const path = getCellsBetween(lastTouchCell, { row, col });
        setDraggedSlots((prev) => {
          const next = new Set(prev);
          path.forEach(({ row, col }) => {
            if (grid[row] && grid[row][col]) next.add(grid[row][col].slotId);
          });
          return next;
        });
        setLastTouchCell({ row, col });
      }
    };
    gridEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      gridEl.removeEventListener("touchmove", handleTouchMove);
    };
  }, [
    isTouchDragging,
    lastTouchCell,
    days.length,
    timeLabels.length,
    getCellsBetween,
    grid,
    cellHeight,
  ]);

  // Prevent scroll on touch drag by adding non-passive listeners
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const preventScrollIfDragging = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };
    gridEl.addEventListener("touchstart", preventScrollIfDragging, {
      passive: false,
    });
    return () => {
      gridEl.removeEventListener("touchstart", preventScrollIfDragging);
    };
  }, [isTouchDragging]);

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
        {/* Grid*/}
        <Box
          ref={gridRef}
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${days.length}, 1fr)`,
            gridTemplateRows: `repeat(${timeLabels.length}, ${cellHeight}px)`,
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            position: "relative",
            flex: 1,
            minWidth: 0,
          }}
        >
          {grid.map((rowArr, rowIdx) =>
            rowArr.map((cell, colIdx) => {
              const isSelected = selectedSlotsSet.has(cell.slotId);
              const isBeingDragged = draggedSlots.has(cell.slotId);

              // Pass this down to GridCell to control interactivity and cursor
              const isSelectable = !!setSelectedSlots;

              const onCellMouseDown = (e: React.MouseEvent) => {
                e.preventDefault();
                handleCellMouseDown(rowIdx, colIdx, cell.slotId, isSelected);
              };

              const onCellEnter = () => handleCellEnter(rowIdx, colIdx, cell, isSelected);

              // Touch handlers for this cell
              const onCellTouchStart = (e: React.TouchEvent) => {
                handleCellTouchStart(
                  rowIdx,
                  colIdx,
                  cell.slotId,
                  isSelected,
                  e
                );
              };

              // Highlight if highlightUserName is available in this slot
              const isHighlightedUserAvailable =
                highlightUserName &&
                cell.availableUsers.includes(highlightUserName);

              return (
                <GridCell
                  key={cell.slotId}
                  cell={cell}
                  isSelected={isSelected}
                  isBeingDragged={isBeingDragged}
                  dragMode={dragMode}
                  showOthersAvailability={showOthersAvailability}
                  theme={theme}
                  onMouseDown={onCellMouseDown}
                  onTouchStart={onCellTouchStart}
                  colIdx={colIdx}
                  rowIdx={rowIdx}
                  daysLength={days.length}
                  grid={grid}
                  selectedSlotsSet={selectedSlotsSet}
                  isSelectable={isSelectable}
                  days={days}
                  onCellEnter={onCellEnter}
                  onSlotLeave={onSlotLeave || (() => {})}
                  event={event}
                  editingMyAvailability={editingMyAvailability}
                  uniqueUserCount={uniqueUserCount}
                  isHighlightedUserAvailable={!!isHighlightedUserAvailable}
                  highlightUserName={highlightUserName}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(AvailabilityGrid);
