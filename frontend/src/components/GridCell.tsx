import React from "react";
import { Box } from "@mui/material";
import { darken } from "@mui/material/styles";

/**
 * Props for GridCell component.
 */
export interface GridCellProps {
  cell: { slotId: string; availableUsers: string[]; time: string };
  isSelected: boolean;
  isBeingDragged: boolean;
  dragMode: "select" | "deselect" | null;
  showOthersAvailability: boolean;
  theme: any;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onClick?: () => void;
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

/**
 * GridCell renders a single cell in the availability grid.
 */
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
    onClick,
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
        onMouseEnter={() => {
          onCellEnter();
        }}
        onMouseLeave={onSlotLeave || (() => {})}
        onTouchStart={onTouchStart}
        onTouchEnd={(e) => {
          onTouchEnd(e);
          onCellEnter();
          if (onClick) onClick();
        }}
        onClick={() => {
          onCellEnter();
          if (onClick) onClick();
        }}
        sx={{
          ...border,
          height: 18 + "px",
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

export default GridCell; 