import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage drag and touch selection logic for the availability grid.
 * Handles both mouse and touch events, and exposes state and handlers for use in the grid component.
 */
export function useGridSelection({
  setSelectedSlots,
  onRequireEdit,
  grid,
  timeLabels,
  days,
  cellHeight,
}: {
  setSelectedSlots?: React.Dispatch<React.SetStateAction<string[]>>;
  onRequireEdit?: () => void;
  grid: { slotId: string }[][];
  timeLabels: string[];
  days: string[];
  cellHeight: number;
}) {
  // Mouse drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const [draggedSlots, setDraggedSlots] = useState<Set<string>>(new Set());
  const [lastDragCell, setLastDragCell] = useState<{ row: number; col: number } | null>(null);

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [lastTouchCell, setLastTouchCell] = useState<{ row: number; col: number } | null>(null);
  const touchStartCellRef = useRef<{ row: number; col: number; slotId: string; isSelected: boolean } | null>(null);
  const [hasTouchMoved, setHasTouchMoved] = useState(false);
  const hasTouchMovedRef = useRef(false);
  const justHandledTapRef = useRef(false);
  const draggedSlotsRef = useRef<Set<string>>(new Set());

  // Helper to set both state and ref
  const setHasTouchMovedBoth = (val: boolean) => {
    setHasTouchMoved(val);
    hasTouchMovedRef.current = val;
  };
  const setDraggedSlotsBoth = (val: Set<string>) => {
    setDraggedSlots(val);
    draggedSlotsRef.current = new Set(val);
  };

  // Get all cells between two points (inclusive, straight line)
  const getCellsBetween = useCallback((start: { row: number; col: number }, end: { row: number; col: number }) => {
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
  }, []);

  // Mouse up handler
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragMode) {
        if (setSelectedSlots) {
          setSelectedSlots((prev) => {
            const newSet = new Set(prev);
            draggedSlots.forEach((slotId) => {
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

  // Touch end handler (for drag selection only)
  useEffect(() => {
    const handleTouchEnd = (e: TouchEvent) => {
      if (justHandledTapRef.current) {
        justHandledTapRef.current = false;
        return;
      }
      if (isTouchDragging && dragMode && hasTouchMovedRef.current) {
        if (setSelectedSlots) {
          setSelectedSlots((prev) => {
            const newSet = new Set(prev);
            draggedSlotsRef.current.forEach((slotId) => {
              if (dragMode === 'select') newSet.add(slotId);
              else newSet.delete(slotId);
            });
            return Array.from(newSet);
          });
        }
        setIsTouchDragging(false);
        setDragMode(null);
        setDraggedSlotsBoth(new Set());
        setLastTouchCell(null);
        touchStartCellRef.current = null;
        setHasTouchMovedBoth(false);
      }
    };
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isTouchDragging, dragMode, setSelectedSlots]);

  // Touch move logic at grid level
  useEffect(() => {
    const gridEl = document.getElementById('availability-grid-body');
    if (!gridEl) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging || !lastTouchCell) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gridEl.getBoundingClientRect();
      const cellW = rect.width / days.length;
      const cellH = cellHeight;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      let col = Math.floor(x / cellW);
      let row = Math.floor(y / cellH);
      col = Math.max(0, Math.min(days.length - 1, col));
      row = Math.max(0, Math.min(timeLabels.length - 1, row));
      if (
        touchStartCellRef.current &&
        (row !== touchStartCellRef.current.row || col !== touchStartCellRef.current.col)
      ) {
        setHasTouchMovedBoth(true);
      }
      if (row !== lastTouchCell.row || col !== lastTouchCell.col) {
        const path = getCellsBetween(lastTouchCell, { row, col });
        setDraggedSlotsBoth((prev => {
          const next = new Set(prev);
          path.forEach(({ row, col }) => {
            if (grid[row] && grid[row][col]) next.add(grid[row][col].slotId);
          });
          return next;
        })(draggedSlotsRef.current));
        setLastTouchCell({ row, col });
      }
    };
    gridEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      gridEl.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isTouchDragging, lastTouchCell, days.length, timeLabels.length, getCellsBetween, grid, cellHeight]);

  // Prevent scroll on touch drag by adding non-passive listeners
  useEffect(() => {
    const gridEl = document.getElementById('availability-grid-body');
    if (!gridEl) return;
    const preventScrollIfDragging = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };
    gridEl.addEventListener('touchstart', preventScrollIfDragging, { passive: false });
    return () => {
      gridEl.removeEventListener('touchstart', preventScrollIfDragging);
    };
  }, [isTouchDragging]);

  // Mouse event handlers
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

  const handleCellEnter = useCallback((row: number, col: number, cell: { slotId: string }, isSelected: boolean) => {
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
  }, [isDragging, lastDragCell, getCellsBetween, grid]);

  // Touch event handlers for cells
  const handleCellTouchStart = useCallback((row: number, col: number, slotId: string, isSelected: boolean, e: React.TouchEvent) => {
    if (!setSelectedSlots) {
      if (typeof onRequireEdit === 'function') onRequireEdit();
      return;
    }
    setIsTouchDragging(true);
    setDragMode(isSelected ? 'deselect' : 'select');
    setDraggedSlotsBoth(new Set([slotId]));
    setLastTouchCell({ row, col });
    touchStartCellRef.current = { row, col, slotId, isSelected };
    setHasTouchMovedBoth(false);
  }, [setSelectedSlots, onRequireEdit]);

  const handleCellTouchEnd = useCallback((row: number, col: number, cell: { slotId: string }, isSelected: boolean, e: React.TouchEvent) => {
    if (!setSelectedSlots) return;
    if (
      touchStartCellRef.current &&
      !hasTouchMovedRef.current &&
      touchStartCellRef.current.row === row &&
      touchStartCellRef.current.col === col
    ) {
      e.stopPropagation();
      e.preventDefault();
      justHandledTapRef.current = true;
      setSelectedSlots((prev) => {
        const newSet = new Set(prev);
        if (isSelected) newSet.delete(cell.slotId);
        else newSet.add(cell.slotId);
        return Array.from(newSet);
      });
      setIsTouchDragging(false);
      setDragMode(null);
      setDraggedSlotsBoth(new Set());
      setLastTouchCell(null);
      touchStartCellRef.current = null;
      setHasTouchMovedBoth(false);
      justHandledTapRef.current = false;
    }
  }, [setSelectedSlots]);

  return {
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
  };
} 