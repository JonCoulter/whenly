/**
 * Service for handling event-related API calls
 */

// Types
export interface EventFormData {
  eventName: string;
  eventType: 'specificDays' | 'daysOfWeek';
  timeRange: {
    start: string;
    end: string;
  };
  specificDays?: string[]; // Format: YYYY-MM-DD
  daysOfWeek?: string[];   // e.g., ["Monday", "Wednesday", "Friday"]
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new event
 */
export async function createEvent(eventData: EventFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('http://localhost:5000/api/events/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to create event'
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Gets event details by ID
 */
export async function getEventById(eventId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Failed to get event with ID: ${eventId}`
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 