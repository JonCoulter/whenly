import { format, parse, addMinutes } from 'date-fns';

/**
 * Get hour label from 'HH:mm' string.
 */
export function getHourLabel(time: string): string {
  const date = parse(time, 'HH:mm', new Date());
  return format(date, 'h a');
}

/**
 * Sort days for 'specificDays' event type.
 */
export function sortSpecificDays(days: string[]): string[] {
  return days.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

/**
 * Sort days for 'daysOfWeek' event type.
 */
export function sortDaysOfWeek(days: string[]): string[] {
  const dayOrder = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  const indices = days.map(day => dayOrder.indexOf(day)).sort((a, b) => a - b);
  let maxGap = -1;
  let startIdx = 0;
  for (let i = 0; i < indices.length; i++) {
    const curr = indices[i];
    const next = indices[(i + 1) % indices.length];
    const gap = ((next - curr + 7) % 7) - 1;
    if (gap > maxGap) {
      maxGap = gap;
      startIdx = (i + 1) % indices.length;
    }
  }
  const orderedIndices = [];
  for (let i = 0; i < indices.length; i++) {
    orderedIndices.push(indices[(startIdx + i) % indices.length]);
  }
  return orderedIndices.map(idx => dayOrder[idx]);
}

/**
 * Build time labels for the grid.
 */
export function buildTimeLabels(processedTimeSlots: { time: string }[]): string[] {
  let minTime: string | null = null;
  let maxTime: string | null = null;
  processedTimeSlots.forEach((slot) => {
    if (!minTime || slot.time < minTime) minTime = slot.time;
    if (!maxTime || slot.time > maxTime) maxTime = slot.time;
  });
  if (!minTime || !maxTime) return [];
  const times: string[] = [];
  let current = parse(minTime, 'HH:mm', new Date());
  const lastSlotStartTime = parse(maxTime, 'HH:mm', new Date());
  while (current < lastSlotStartTime) {
    times.push(format(current, 'HH:mm'));
    current = addMinutes(current, 15);
  }
  times.push(format(lastSlotStartTime, 'HH:mm'));
  return times;
}

/**
 * Build hour labels for the grid.
 */
export function buildHourLabels(timeLabels: string[]): { label: string; rowIdx: number }[] {
  const labels: { label: string; rowIdx: number }[] = [];
  let lastHour = '';
  timeLabels.forEach((time, idx) => {
    const hour = format(parse(time, 'HH:mm', new Date()), 'H');
    if (hour !== lastHour) {
      labels.push({ label: getHourLabel(time), rowIdx: idx });
      lastHour = hour;
    }
  });
  if (timeLabels.length > 0) {
    const lastSlotStart = parse(timeLabels[timeLabels.length - 1], 'HH:mm', new Date());
    const endTime = addMinutes(lastSlotStart, 15);
    const endHour = format(endTime, 'H');
    const lastLabelHour = labels.length > 0 ? format(parse(timeLabels[timeLabels.length - 1], 'HH:mm', new Date()), 'H') : null;
    if (endHour !== lastLabelHour) {
      labels.push({ label: getHourLabel(format(endTime, 'HH:mm')), rowIdx: timeLabels.length });
    }
  }
  return labels;
}

/**
 * Build the 2D grid for the availability table.
 */
export function buildGrid(timeLabels: string[], days: string[], slotAvailabilityMap: Map<string, string[]>): { slotId: string; availableUsers: string[]; time: string }[][] {
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
} 