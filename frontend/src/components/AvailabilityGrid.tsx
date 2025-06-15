import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { format, parse, addMinutes } from 'date-fns';

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
  event: any;
  groupedByDate: GroupedSlots;
  selectedSlots: string[];
  setSelectedSlots?: React.Dispatch<React.SetStateAction<string[]>>;
  showOthersAvailability: boolean;
  processedTimeSlots: TimeSlot[];
  theme: any;
  onSlotHover: (slotId: string, availableUsers: string[], time: string, dayLabel: string) => void;
  onSlotLeave: () => void;
  onRequireEdit?: () => void;
  editingMyAvailability: boolean;
  uniqueUserCount: number;
}

// Helper to get hour from 'HH:mm'
function getHourLabel(time: string) {
  const date = parse(time, 'HH:mm', new Date());
  return format(date, 'h a');
}

// Height of one cell (px)
const cellHeight = 18;

// Memoized Grid Cell Component
interface GridCellProps {
  cell: { slotId: string; availableUsers: string[]; time: string; };
  isSelected: boolean;
  isBeingDragged: boolean;
  dragMode: 'select' | 'deselect' | null;
  showOthersAvailability: boolean;
  theme: any;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  colIdx: number;
  rowIdx: number;
  daysLength: number;
  grid: { slotId: string; availableUsers: string[]; time: string; }[][];
  selectedSlotsSet: Set<string>;
  isSelectable: boolean;
  days: string[];
  onSlotHover: (slotId: string, availableUsers: string[], time: string, dayLabel: string) => void;
  onSlotLeave: () => void;
  event: any;
  editingMyAvailability: boolean;
  uniqueUserCount: number;
}

const GridCell: React.FC<GridCellProps> = React.memo(({
  cell,
  isSelected,
  isBeingDragged,
  dragMode,
  showOthersAvailability,
  theme,
  onMouseDown,
  onMouseEnter,
  colIdx,
  rowIdx,
  daysLength,
  grid,
  selectedSlotsSet,
  isSelectable,
  days,
  onSlotHover,
  onSlotLeave,
  event,
  editingMyAvailability,
  uniqueUserCount,
}) => {
  const availableCount = cell.availableUsers.length;
  const denominator = uniqueUserCount > 0 ? uniqueUserCount : 1;
  const intensity = Math.min(availableCount / denominator, 1);
  
  let bgColor = theme.palette.background.paper;
  if (isBeingDragged && dragMode === 'select') {
    bgColor = theme.palette.primary.light;
  } else if (isBeingDragged && dragMode === 'deselect') {
    bgColor = theme.palette.action.selected;
  } else if (isSelected && !showOthersAvailability) {
    bgColor = theme.palette.primary.main;
  } else if (showOthersAvailability && availableCount > 0) {
    bgColor = `rgba(25, 118, 210, ${0.1 + intensity * 0.75})`;
  }

  // Border logic for outline/merge
  let border: React.CSSProperties = {};
  if (editingMyAvailability && isSelected) {
    const isAboveSelected = rowIdx > 0 && selectedSlotsSet.has(grid[rowIdx - 1][colIdx].slotId);
    const isBelowSelected = rowIdx < grid.length - 1 && selectedSlotsSet.has(grid[rowIdx + 1][colIdx].slotId);
    const isLastRow = rowIdx === grid.length - 1;
    const isLastCol = colIdx === daysLength - 1;
    const is30MinIncrement = rowIdx > 0 && rowIdx % 2 === 0;
    border = {
      borderLeft: '2px solid ' + theme.palette.primary.main,
      borderRight: isLastCol ? '2px solid ' + theme.palette.primary.main : '2px solid ' + theme.palette.primary.main,
      borderBottom: isBelowSelected ? 'none' : (isLastRow ? '2px solid ' + theme.palette.primary.main : '2px solid ' + theme.palette.primary.main),
      borderTop:
        is30MinIncrement
          ? (isAboveSelected ? '1px solid ' + theme.palette.divider : '2px solid ' + theme.palette.primary.main)
          : (isAboveSelected ? 'none' : '2px solid ' + theme.palette.primary.main),
    };
  } else {
    // Add gray divider borders for non-selected cells or when not editing
    border = {
      borderLeft: '1px solid ' + theme.palette.divider,
      borderRight: '1px solid ' + theme.palette.divider,
      borderTop: rowIdx > 0 && rowIdx % 2 === 0 ? '1px solid ' + theme.palette.divider : 'none',
    };
  }

  return (
    <Box
      onMouseDown={onMouseDown}
      onMouseEnter={() => {
        onMouseEnter();
        const dayLabel = event?.eventType === 'daysOfWeek' ? days[colIdx] : format(new Date(days[colIdx] + 'T00:00:00'), 'MMM d, EEE');
        onSlotHover(cell.slotId, cell.availableUsers, cell.time, dayLabel);
      }}
      onMouseLeave={() => {
        onSlotLeave();
      }}
      sx={{
        ...border,
        height: cellHeight + 'px',
        width: '100%',
        backgroundColor: bgColor,
        color: isSelected && !showOthersAvailability ? '#fff' : theme.palette.text.primary,
        cursor: isSelectable ? 'pointer' : 'default',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        userSelect: 'none',
        '&:hover': {
          backgroundColor: isSelected && !showOthersAvailability
            ? theme.palette.primary.dark
            : theme.palette.mode === 'light'
              ? '#D1D5DB'
              : '#4B5563'
        },
      }}
    />
  );
});

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  event,
  groupedByDate,
  selectedSlots,
  setSelectedSlots,
  showOthersAvailability,
  processedTimeSlots,
  theme,
  onSlotHover,
  onSlotLeave,
  onRequireEdit,
  editingMyAvailability,
  uniqueUserCount,
}) => {
  // Days (columns)
  let days = Object.keys(groupedByDate);
  if (event?.eventType === 'specificDays') {
    days = days.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  } else if (event?.eventType === 'daysOfWeek') {
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  }

  // Build time labels (rows) from processedTimeSlots
  const timeLabels = useMemo(() => {
    let minTime: string | null = null;
    let maxTime: string | null = null;
    processedTimeSlots.forEach(slot => {
      if (!minTime || slot.time < minTime) minTime = slot.time;
      if (!maxTime || slot.time > maxTime) maxTime = slot.time;
    });

    if (!minTime || !maxTime) return [];

    const times: string[] = [];
    let current = parse(minTime, 'HH:mm', new Date());
    // Ensure we go up to but not including the end time of the last slot interval
    const lastSlotStartTime = parse(maxTime, 'HH:mm', new Date()); 
    while (current < lastSlotStartTime) {
      times.push(format(current, 'HH:mm'));
      current = addMinutes(current, 15);
    }
    // Add the last slot start time itself
    times.push(format(lastSlotStartTime, 'HH:mm'));

    return times;
  }, [processedTimeSlots]);

  // Build a map for quick lookup of available users
  const slotAvailabilityMap = useMemo(() => {
    const map = new Map<string, string[]>();
    processedTimeSlots.forEach(slot => {
      if (slot.availableUsers) {
        map.set(slot.id, slot.availableUsers);
      }
    });
    return map;
  }, [processedTimeSlots]);

  // Build 2D grid: grid[timeIdx][dayIdx] = { slotId, availableUsers, time }
  const grid = useMemo(() => {
    return timeLabels.map(time =>
      days.map(day => {
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
    let lastHour = '';
    timeLabels.forEach((time, idx) => {
      const hour = format(parse(time, 'HH:mm', new Date()), 'H');
      if (hour !== lastHour) {
        labels.push({ label: getHourLabel(time), rowIdx: idx });
        lastHour = hour;
      }
    });
    return labels;
  }, [timeLabels]);

  // --- Click and drag selection state ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const [draggedSlots, setDraggedSlots] = useState<Set<string>>(new Set());
  const [lastDragCell, setLastDragCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Helper: get all cells between two points (inclusive, straight line)
  const getCellsBetween = useCallback(
    (
      start: { row: number; col: number },
      end: { row: number; col: number }
    ): { row: number; col: number }[] => {
      const cells: { row: number; col: number }[] = [];
      const rowStep = start.row === end.row ? 0 : start.row < end.row ? 1 : -1;
      const colStep = start.col === end.col ? 0 : start.col < end.col ? 1 : -1;
      let row = start.row, col = start.col;
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

  // Mouse up handler (global)
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragMode) {
        if (setSelectedSlots) {
          setSelectedSlots(prev => {
            const newSet = new Set(prev);
            draggedSlots.forEach(slotId => {
              if (dragMode === 'select') newSet.add(slotId);
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
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragMode, draggedSlots, setSelectedSlots]);

  // Memoized Set for efficient selectedSlots lookup
  const selectedSlotsSet = useMemo(() => new Set(selectedSlots), [selectedSlots]);

  // Cell mouse handlers
  const handleCellMouseDown = useCallback((row: number, col: number, slotId: string, isSelected: boolean) => {
    if (!setSelectedSlots) {
      if (typeof onRequireEdit === 'function') onRequireEdit();
      return;
    }
    setIsDragging(true);
    setDragMode(isSelected ? 'deselect' : 'select');
    setDraggedSlots(new Set([slotId]));
    setLastDragCell({ row, col });
  }, [setSelectedSlots, onRequireEdit]);

  const handleCellMouseEnter = useCallback((row: number, col: number, slotId: string) => {
    if (!setSelectedSlots) return;
    if (isDragging && lastDragCell) {
      const path = getCellsBetween(lastDragCell, { row, col });
      setDraggedSlots(prev => {
        const next = new Set(prev);
        path.forEach(({ row, col }) => {
          if (grid[row] && grid[row][col]) next.add(grid[row][col].slotId);
        });
        return next;
      });
      setLastDragCell({ row, col });
    }
  }, [setSelectedSlots, isDragging, lastDragCell, getCellsBetween, grid]);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', pb: 2 }}>
      {/* Header row: day headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, 1fr)`,
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          ml: '60px'
          // no margin bottom
        }}
      >
        {days.map(day => (
          <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography variant="body2" fontWeight="medium">
              {event.eventType === 'daysOfWeek' ? day : format(new Date(day + 'T00:00:00'), 'EEE')}
            </Typography>
            {event.eventType === 'specificDays' && (
              <Typography variant="caption" color="text.secondary">
                {format(new Date(day + 'T00:00:00'), 'MMM d')}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      {/* Main flex row: left = time labels, right = grid */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Time labels (hour, aligned to top of hour block) */}
        <Box sx={{ width: '60px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {hourLabels.map(({ label, rowIdx }, i) => (
            <Box
              key={label + rowIdx}
              sx={{
                position: 'absolute',
                top: rowIdx * cellHeight - 4, // Align top of hour to above cell top
                height: cellHeight,
                display: 'flex',
                alignItems: 'flex-start', // Align to top
                justifyContent: 'flex-end',
                pr: 1, // Adjusted padding right
                fontSize: 13, // Slightly smaller font size
                color: theme.palette.text.secondary,
                pointerEvents: 'none',
                width: '100%'
              }}
            >
              {label}
            </Box>
          ))}
          {/* Spacer to ensure full height */}
          <Box sx={{ height: timeLabels.length * cellHeight }} />
        </Box>
        {/* The grid itself (no time label column) */}
        <Box
          ref={gridRef}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, 1fr)`,
            gridTemplateRows: `repeat(${timeLabels.length}, ${cellHeight}px)`,
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            position: 'relative',
            flex: 1,
            minWidth: 0
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
              
              const onCellMouseEnter = () => {
                if (!isSelectable) return; // Guard logic inside handler
                handleCellMouseEnter(rowIdx, colIdx, cell.slotId);
              };

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
                  onMouseEnter={onCellMouseEnter}
                  colIdx={colIdx}
                  rowIdx={rowIdx}
                  daysLength={days.length}
                  grid={grid}
                  selectedSlotsSet={selectedSlotsSet}
                  isSelectable={isSelectable}
                  days={days}
                  onSlotHover={onSlotHover}
                  onSlotLeave={onSlotLeave}
                  event={event}
                  editingMyAvailability={editingMyAvailability}
                  uniqueUserCount={uniqueUserCount}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AvailabilityGrid;