import React from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import GridCell from "../GridCell";
import type { GridCellProps } from "../GridCell";

interface GridBodyProps {
  grid: GridCellProps["grid"];
  days: string[];
  timeLabels: string[];
  cellHeight: number;
  selectedSlotsSet: Set<string>;
  draggedSlots: Set<string>;
  dragMode: "select" | "deselect" | null;
  showOthersAvailability: boolean;
  theme: any;
  handleCellMouseDown: (row: number, col: number, slotId: string, isSelected: boolean) => void;
  handleCellEnter: (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }, isSelected: boolean) => void;
  handleCellTouchStart: (row: number, col: number, slotId: string, isSelected: boolean, e: React.TouchEvent) => void;
  handleCellTouchEnd: (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }, isSelected: boolean, e: React.TouchEvent) => void;
  editingMyAvailability: boolean;
  uniqueUserCount: number;
  highlightUserName?: string | null;
  onSlotLeave?: () => void;
  event: any;
  handleCellClick: (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }) => void;
}

/**
 * GridBody renders the main grid of cells for the availability grid.
 * @param {Object} props
 * @param {Array} props.grid - 2D array of grid cell data
 * @param {Array} props.days - Array of day labels (columns)
 * @param {Array} props.timeLabels - Array of time labels (rows)
 * @param {number} props.cellHeight - Height of each cell in px
 * @param {Set<string>} props.selectedSlotsSet - Set of selected slot IDs
 * @param {Set<string>} props.draggedSlots - Set of currently dragged slot IDs
 * @param {string | null} props.dragMode - Current drag mode
 * @param {boolean} props.showOthersAvailability - Whether to show others' availability
 * @param {any} props.theme - MUI theme object
 * @param {Function} props.handleCellMouseDown - Mouse down handler
 * @param {Function} props.handleCellEnter - Mouse enter handler
 * @param {Function} props.handleCellTouchStart - Touch start handler
 * @param {Function} props.handleCellTouchEnd - Touch end handler
 * @param {boolean} props.editingMyAvailability - Whether the user is editing their own availability
 * @param {number} props.uniqueUserCount - Number of unique users who have responded
 * @param {string | null} props.highlightUserName - User name to highlight
 * @param {Function} props.onSlotLeave - Mouse leave handler
 * @param {any} props.event - Event object
 * @param {Function} props.handleCellClick - Click handler
 * @returns {JSX.Element}
 */
const GridBody: React.FC<GridBodyProps> = ({
  grid,
  days,
  timeLabels,
  cellHeight,
  selectedSlotsSet,
  draggedSlots,
  dragMode,
  showOthersAvailability,
  theme,
  handleCellMouseDown,
  handleCellEnter,
  handleCellTouchStart,
  handleCellTouchEnd,
  editingMyAvailability,
  uniqueUserCount,
  highlightUserName,
  onSlotLeave,
  event,
  handleCellClick,
}) => (
  <Box
    id="availability-grid-body"
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
        const isSelectable = true; // Assume always selectable if handlers are passed
        const onCellMouseDown = (e: React.MouseEvent) => {
          e.preventDefault();
          handleCellMouseDown(rowIdx, colIdx, cell.slotId, isSelected);
        };
        const onCellEnter = () => handleCellEnter(rowIdx, colIdx, cell, isSelected);
        const onCellTouchStart = (e: React.TouchEvent) => {
          handleCellTouchStart(rowIdx, colIdx, cell.slotId, isSelected, e);
        };
        const onCellTouchEnd = (e: React.TouchEvent) => {
          handleCellTouchEnd(rowIdx, colIdx, cell, isSelected, e);
        };
        const isHighlightedUserAvailable =
          highlightUserName && cell.availableUsers.includes(highlightUserName);
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
            onTouchEnd={onCellTouchEnd}
            onClick={() => handleCellClick(rowIdx, colIdx, cell)}
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
);

GridBody.propTypes = {
  grid: PropTypes.array.isRequired,
  days: PropTypes.array.isRequired,
  timeLabels: PropTypes.array.isRequired,
  cellHeight: PropTypes.number.isRequired,
  selectedSlotsSet: PropTypes.instanceOf(Set).isRequired,
  draggedSlots: PropTypes.instanceOf(Set).isRequired,
  dragMode: PropTypes.string,
  showOthersAvailability: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired,
  handleCellMouseDown: PropTypes.func.isRequired,
  handleCellEnter: PropTypes.func.isRequired,
  handleCellTouchStart: PropTypes.func.isRequired,
  handleCellTouchEnd: PropTypes.func.isRequired,
  editingMyAvailability: PropTypes.bool.isRequired,
  uniqueUserCount: PropTypes.number.isRequired,
  highlightUserName: PropTypes.string,
  onSlotLeave: PropTypes.func,
  event: PropTypes.object.isRequired,
  handleCellClick: PropTypes.func.isRequired,
};

export default GridBody; 