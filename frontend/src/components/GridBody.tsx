import type { GridCellProps } from "./GridCell";

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
  handleCellClick: (row: number, col: number, cell: { slotId: string; availableUsers: string[]; time: string }) => void;
  editingMyAvailability: boolean;
  uniqueUserCount: number;
  highlightUserName?: string | null;
  onSlotLeave?: () => void;
  event: any;
} 