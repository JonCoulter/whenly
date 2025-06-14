import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { format, parse } from 'date-fns';

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
  setSelectedSlots: React.Dispatch<React.SetStateAction<string[]>>;
  showOthersAvailability: boolean;
  processedTimeSlots: TimeSlot[];
  theme: any;
}

// Helper to get hour from 'HH:mm'
function getHourLabel(time: string) {
  const date = parse(time, 'HH:mm', new Date());
  return format(date, 'h a');
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  event,
  groupedByDate,
  selectedSlots,
  setSelectedSlots,
  showOthersAvailability,
  processedTimeSlots,
  theme
}) => {
  // Days (columns)
  const days = Object.keys(groupedByDate);

  // Build time labels (rows) from processedTimeSlots
  let minTime: string | null = null;
  let maxTime: string | null = null;
  processedTimeSlots.forEach(slot => {
    if (!minTime || slot.time < minTime) minTime = slot.time;
    if (!maxTime || slot.time > maxTime) maxTime = slot.time;
  });
  function generateTimeLabels(start: string, end: string) {
    const times: string[] = [];
    let current = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    while (current <= endTime) {
      times.push(format(current, 'HH:mm'));
      current = new Date(current.getTime() + 15 * 60000);
    }
    return times;
  }
  const timeLabels = minTime && maxTime ? generateTimeLabels(minTime, maxTime) : [];

  // Build a map for quick lookup of available users
  const slotAvailabilityMap = new Map<string, string[]>();
  processedTimeSlots.forEach(slot => {
    if (slot.availableUsers) {
      slotAvailabilityMap.set(slot.id, slot.availableUsers);
    }
  });

  // Build 2D grid: grid[timeIdx][dayIdx] = { slotId, availableUsers }
  const grid: { slotId: string; availableUsers: string[] }[][] = timeLabels.map(time =>
    days.map(day => {
      const slotId = `${day}-${time}`;
      return {
        slotId,
        availableUsers: slotAvailabilityMap.get(slotId) || []
      };
    })
  );

  // Build hour label info: [{ label: '9 AM', rowIdx: 0 }, ...]
  const hourLabels: { label: string; rowIdx: number }[] = [];
  let lastHour = '';
  timeLabels.forEach((time, idx) => {
    const hour = format(parse(time, 'HH:mm', new Date()), 'H');
    if (hour !== lastHour) {
      hourLabels.push({ label: getHourLabel(time), rowIdx: idx });
      lastHour = hour;
    }
  });

  // --- Click and drag selection state ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const [draggedSlots, setDraggedSlots] = useState<Set<string>>(new Set());
  const [lastDragCell, setLastDragCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Helper: get all cells between two points (inclusive, straight line)
  function getCellsBetween(
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): { row: number; col: number }[] {
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
  }

  // Mouse up handler (global)
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragMode) {
        setSelectedSlots(prev => {
          const newSet = new Set(prev);
          draggedSlots.forEach(slotId => {
            if (dragMode === 'select') newSet.add(slotId);
            else newSet.delete(slotId);
          });
          return Array.from(newSet);
        });
        setIsDragging(false);
        setDragMode(null);
        setDraggedSlots(new Set());
        setLastDragCell(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragMode, draggedSlots, setSelectedSlots]);

  // Cell mouse handlers
  const handleCellMouseDown = (row: number, col: number, slotId: string, isSelected: boolean) => {
    setIsDragging(true);
    setDragMode(isSelected ? 'deselect' : 'select');
    setDraggedSlots(new Set([slotId]));
    setLastDragCell({ row, col });
  };
  const handleCellMouseEnter = (row: number, col: number, slotId: string) => {
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
  };

  // Height of one cell (px)
  const cellHeight = 32;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', pb: 2 }}>
      {/* Header row: empty + day headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, 1fr)`,
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 0.5,
          ml: '60px' // leave space for time labels
        }}
      >
        {days.map(day => (
          <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="subtitle2">
              {event.eventType === 'daysOfWeek' ? day : format(new Date(day + 'T00:00:00'), 'EEE')}
            </Typography>
            {event.eventType === 'specificDays' && (
              <Typography variant="body2">
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
                top: rowIdx * cellHeight,
                height: cellHeight,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                pr: 1,
                fontSize: 15,
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
              const availableCount = cell.availableUsers.length;
              const intensity = Math.min(availableCount / 5, 1);
              const isSelected = selectedSlots.includes(cell.slotId);
              const isBeingDragged = draggedSlots.has(cell.slotId);
              let bgColor = theme.palette.background.paper;
              if (isBeingDragged && dragMode === 'select') {
                bgColor = theme.palette.primary.light;
              } else if (isBeingDragged && dragMode === 'deselect') {
                bgColor = theme.palette.action.selected;
              } else if (isSelected) {
                bgColor = theme.palette.primary.main;
              } else if (showOthersAvailability && availableCount > 0) {
                bgColor = `rgba(25, 118, 210, ${0.1 + intensity * 0.7})`;
              }
              return (
                <Tooltip
                  key={cell.slotId}
                  title={
                    availableCount > 0
                      ? `Available: ${cell.availableUsers.join(', ')}`
                      : 'No one available'
                  }
                >
                  <Box
                    onMouseDown={e => { e.preventDefault(); handleCellMouseDown(rowIdx, colIdx, cell.slotId, isSelected); }}
                    onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx, cell.slotId)}
                    sx={{
                      borderTop: rowIdx === 0 ? 'none' : `1px solid ${theme.palette.divider}`,
                      borderRight: colIdx === days.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`,
                      borderLeft: 'none',
                      borderBottom: 'none',
                      height: `${cellHeight}px`,
                      width: '100%',
                      backgroundColor: bgColor,
                      color: isSelected ? '#fff' : theme.palette.text.primary,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: isSelected
                          ? theme.palette.primary.dark
                          : theme.palette.mode === 'light'
                            ? '#D1D5DB'
                            : '#4B5563'
                      }
                    }}
                  />
                </Tooltip>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AvailabilityGrid;