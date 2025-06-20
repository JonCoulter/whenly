/**
 * Service for handling event-related API calls
 */

import config from '../config';

// Types
export interface EventFormData {
  eventName: string;
  eventType: 'specificDays' | 'daysOfWeek';
  createdBy: string;
  creatorName: string;
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
    const response = await fetch(`${config.apiUrl}/api/events/create`, {
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
    const response = await fetch(`${config.apiUrl}/api/events/${eventId}`, {
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

export const submitAvailability = async (eventId: string, data: {
  userName: string;
  userId?: string;
  selectedSlots: string[];
}): Promise<ApiResponse<void>> => {
  try {

    console.log(data);
    
    const response = await fetch(`${config.apiUrl}/api/events/${eventId}/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit availability');
    }

    return result;
  } catch (error) {
    console.error('Error submitting availability:', error);
    throw error;
  }
};

export const updateAvailability = async (eventId: string, data: {
  userName: string;
  userId?: string;
  selectedSlots: string[];
}): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${config.apiUrl}/api/events/${eventId}/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update availability');
    }

    return result;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

export const getEventResponses = async (eventId: string): Promise<{
  totalResponses: number;
  uniqueUsers: number;
  responses: any[];
}> => {
  try {
    const response = await fetch(`${config.apiUrl}/api/events/${eventId}/responses`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get responses');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting responses:', error);
    throw error;
  }
}; 