import { API_BASE_URL } from '../config/api.js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { createSimpleISOString, parseSimpleISOString, formatDateTimeForDisplay } from '../utils/dateUtils';

export interface UnifiedEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'reminder' | 'meeting' | 'task' | 'no-reminder';
  startTime: string;
  endTime: string;
  advanceNotice: number; // minutes before event
  isActive?: boolean; // for reminders
  notified?: boolean; // for reminders
  customerId?: string;
  customerName?: string; // for reminders without customer_id
  leadId?: string;
  taskId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedEventFormData {
  title: string;
  description?: string;
  eventType: 'reminder' | 'meeting' | 'task' | 'no-reminder';
  startTime: string;
  endTime: string;
  advanceNotice?: number;
  isActive?: boolean;
  notified?: boolean;
  customerId?: string;
  customerName?: string;
  leadId?: string;
  taskId?: string;
}

interface UnifiedEventStore {
  events: UnifiedEvent[];
  isLoading: boolean;
  error: string | null;
  
  // API functions
  fetchEvents: () => Promise<void>;
  fetchEventsByType: (eventType: string) => Promise<void>;
  fetchEventsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  addEvent: (eventData: UnifiedEventFormData) => Promise<void>;
  updateEvent: (id: string, updates: Partial<UnifiedEventFormData>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  markAsNotified: (id: string) => Promise<void>;
  
  // Helper functions
  getEventsByType: (eventType: string) => UnifiedEvent[];
  getEventsByLead: (leadId: string) => UnifiedEvent[];
  getEventsByCustomer: (customerId: string) => UnifiedEvent[];
  getTodayEvents: () => UnifiedEvent[];
  getUpcomingEvents: () => UnifiedEvent[];
  getRemindersForNotification: () => UnifiedEvent[];
  clearEvents: () => void;
}

export const useUnifiedEventStore = create<UnifiedEventStore>()(
  persist(
    (set, get) => ({
      events: [],
      isLoading: false,
      error: null,

      fetchEvents: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          const response = await fetch(`${API_BASE_URL}/unified-events`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            if (response.status === 404) {
              throw new Error('נתיב API לא נמצא - בדוק שהשרת פועל');
            } else if (response.status === 401) {
              throw new Error('פג תוקף ההתחברות - נא להתחבר מחדש');
            } else if (response.status === 500) {
              throw new Error('שגיאת שרת - נא לנסות שוב מאוחר יותר');
            } else {
              throw new Error(`שגיאה בטעינת האירועים (${response.status})`);
            }
          }

          const data = await response.json();
          
          // Transform server data to match our UnifiedEvent interface
          const events = data.events?.map((event: any) => {
            // Keep server times as-is (they should be in local time format)
            const startTime = event.startTime || new Date().toISOString();
            const endTime = event.endTime || new Date().toISOString();
            
            return {
              id: event.id?.toString() || '',
              title: event.title || '',
              description: event.description || '',
              eventType: event.eventType || 'reminder',
              startTime: startTime,
              endTime: endTime,
              advanceNotice: event.advanceNotice !== null && event.advanceNotice !== undefined ? Number(event.advanceNotice) : (event.eventType === 'reminder' ? 1440 : 0),
              isActive: event.isActive !== undefined ? event.isActive : true,
              notified: event.notified !== undefined ? event.notified : false,
              customerId: event.customerId?.toString() || '',
              customerName: event.customerName || '',
              leadId: event.leadId?.toString() || '',
              taskId: event.taskId?.toString() || '',
              createdBy: event.createdBy?.toString() || '',
              createdAt: event.createdAt ? (typeof event.createdAt === 'string' ? event.createdAt : new Date(event.createdAt).toISOString()) : new Date().toISOString(),
              updatedAt: event.updatedAt ? (typeof event.updatedAt === 'string' ? event.updatedAt : new Date(event.updatedAt).toISOString()) : new Date().toISOString()
            };
          }) || [];

          set({ events, isLoading: false });
        } catch (error) {
          console.error('Error fetching events:', error);
          const errorMessage = error instanceof Error ? error.message : 'שגיאה בטעינת האירועים';
          
          set({ 
            error: errorMessage,
            isLoading: false 
          });

          // Only show toast for user-relevant errors
          if (!errorMessage.includes('404') && !errorMessage.includes('נתיב API לא נמצא')) {
            toast.error('שגיאה בטעינת האירועים');
          }

          // Retry logic for network errors
          if (errorMessage.includes('404') || errorMessage.includes('נתיב API לא נמצא')) {
            console.log('Retrying fetch events in 5 seconds...');
            setTimeout(() => {
              const currentState = get();
              if (currentState.error) {
                fetchEvents();
              }
            }, 5000);
          }
        }
      },

      fetchEventsByType: async (eventType: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          const response = await fetch(`${API_BASE_URL}/unified-events?type=${eventType}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error('שגיאה בטעינת האירועים');
          }

          const data = await response.json();
          
          // Transform server data to match our UnifiedEvent interface
          const events = data.events?.map((event: any) => {
            // Parse simple times from server
            const startTime = event.startTime ? parseSimpleISOString(event.startTime).toISOString() : new Date().toISOString();
            const endTime = event.endTime ? parseSimpleISOString(event.endTime).toISOString() : new Date().toISOString();
            
            return {
              id: event.id.toString(),
              title: event.title,
              description: event.description,
              eventType: event.eventType,
              startTime: startTime,
              endTime: endTime,
              advanceNotice: event.advanceNotice !== null && event.advanceNotice !== undefined ? Number(event.advanceNotice) : 0,
              isActive: event.isActive !== undefined ? event.isActive : true,
              notified: event.notified || false,
              customerId: event.customerId?.toString(),
              customerName: event.customerName,
              leadId: event.leadId?.toString(),
              taskId: event.taskId?.toString(),
              createdBy: event.createdBy?.toString(),
              createdAt: event.createdAt,
              updatedAt: event.updatedAt
            };
          }) || [];

          set({ events, isLoading: false });
        } catch (error) {
          console.error('Error fetching events by type:', error);
          set({ 
            error: error instanceof Error ? error.message : 'שגיאה בטעינת האירועים',
            isLoading: false 
          });
          toast.error('שגיאה בטעינת האירועים');
        }
      },

      fetchEventsByDateRange: async (startDate: string, endDate: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          const response = await fetch(`${API_BASE_URL}/unified-events?start_date=${startDate}&end_date=${endDate}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error('שגיאה בטעינת האירועים');
          }

          const data = await response.json();
          
          // Transform server data to match our UnifiedEvent interface
          const events = data.events?.map((event: any) => {
            // Parse simple times from server
            const startTime = event.startTime ? parseSimpleISOString(event.startTime).toISOString() : new Date().toISOString();
            const endTime = event.endTime ? parseSimpleISOString(event.endTime).toISOString() : new Date().toISOString();
            
            return {
              id: event.id.toString(),
              title: event.title,
              description: event.description,
              eventType: event.eventType,
              startTime: startTime,
              endTime: endTime,
              advanceNotice: event.advanceNotice !== null && event.advanceNotice !== undefined ? Number(event.advanceNotice) : 0,
              isActive: event.isActive !== undefined ? event.isActive : true,
              notified: event.notified || false,
              customerId: event.customerId?.toString(),
              customerName: event.customerName,
              leadId: event.leadId?.toString(),
              taskId: event.taskId?.toString(),
              createdBy: event.createdBy?.toString(),
              createdAt: event.createdAt,
              updatedAt: event.updatedAt
            };
          }) || [];

          set({ events, isLoading: false });
        } catch (error) {
          console.error('Error fetching events by date range:', error);
          set({ 
            error: error instanceof Error ? error.message : 'שגיאה בטעינת האירועים',
            isLoading: false 
          });
          toast.error('שגיאה בטעינת האירועים');
        }
      },

      addEvent: async (eventData: UnifiedEventFormData) => {
        try {
          set({ isLoading: true });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          // Use the startTime and endTime directly as they should be in local format
          const simpleStartTime = eventData.startTime;
          const simpleEndTime = eventData.endTime;

          // Transform data to match server expectations
          const serverData = {
            title: eventData.title,
            description: eventData.description,
            eventType: eventData.eventType,
            startTime: simpleStartTime,
            endTime: simpleEndTime,
            advanceNotice: eventData.advanceNotice || 0,
            isActive: eventData.isActive !== undefined ? eventData.isActive : true,
            notified: eventData.notified || false,
            customerId: eventData.customerId ? parseInt(eventData.customerId) : null,
            customerName: eventData.customerName,
            leadId: eventData.leadId ? parseInt(eventData.leadId) : null,
            taskId: eventData.taskId ? parseInt(eventData.taskId) : null
          };

          const response = await fetch(`${API_BASE_URL}/unified-events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(serverData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'שגיאה ביצירת האירוע');
          }

          // Refresh events list
          await get().fetchEvents();
          
          toast.success('האירוע נוצר בהצלחה');
        } catch (error) {
          console.error('Error creating event:', error);
          set({ isLoading: false });
          toast.error(error instanceof Error ? error.message : 'שגיאה ביצירת האירוע');
          throw error;
        }
      },

      updateEvent: async (id: string, updates: Partial<UnifiedEventFormData>) => {
        try {
          set({ isLoading: true });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          // Transform data to match server expectations
          const serverData: any = {};
          if (updates.title !== undefined) serverData.title = updates.title;
          if (updates.description !== undefined) serverData.description = updates.description;
          if (updates.eventType !== undefined) serverData.eventType = updates.eventType;
          
          // Handle simple time updates - use directly as they should be in local format
          if (updates.startTime !== undefined) {
            serverData.startTime = updates.startTime;
          }
          
          if (updates.endTime !== undefined) {
            serverData.endTime = updates.endTime;
          }
          
          if (updates.advanceNotice !== undefined) serverData.advanceNotice = updates.advanceNotice;
          if (updates.isActive !== undefined) serverData.isActive = updates.isActive;
          if (updates.notified !== undefined) serverData.notified = updates.notified;
          
          // Always send customer and lead fields to ensure proper clearing
          serverData.customerId = updates.customerId && updates.customerId.trim() !== '' ? parseInt(updates.customerId) : null;
          serverData.customerName = updates.customerName && updates.customerName.trim() !== '' ? updates.customerName : null;
          serverData.leadId = updates.leadId && updates.leadId.trim() !== '' ? parseInt(updates.leadId) : null;
          
          if (updates.taskId !== undefined) serverData.taskId = updates.taskId ? parseInt(updates.taskId) : null;

          const response = await fetch(`${API_BASE_URL}/unified-events/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(serverData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'שגיאה בעדכון האירוע');
          }

          // Refresh events list
          await get().fetchEvents();
          
          toast.success('האירוע עודכן בהצלחה');
        } catch (error) {
          console.error('Error updating event:', error);
          set({ isLoading: false });
          toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון האירוע');
          throw error;
        }
      },

      deleteEvent: async (id: string) => {
        try {
          set({ isLoading: true });
          
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          const response = await fetch(`${API_BASE_URL}/unified-events/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'שגיאה במחיקת האירוע');
          }

          // Remove from local state
          set(state => ({
            events: state.events.filter(event => event.id !== id),
            isLoading: false
          }));
          
          toast.success('האירוע נמחק בהצלחה');
        } catch (error) {
          console.error('Error deleting event:', error);
          set({ isLoading: false });
          toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת האירוע');
          throw error;
        }
      },

      markAsNotified: async (id: string) => {
        try {
          const sessionToken = localStorage.getItem('session_token');
          const accessToken = localStorage.getItem('access_token');
          
          if (!sessionToken || !accessToken) {
            throw new Error('לא נמצא טוקן התחברות');
          }

          const response = await fetch(`${API_BASE_URL}/unified-events/${id}/notified`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error('שגיאה בעדכון התזכורת');
          }

          // Update local state
          set(state => ({
            events: state.events.map(event =>
              event.id === id ? { ...event, notified: true } : event
            )
          }));
        } catch (error) {
          toast.error('שגיאה בעדכון התזכורת');
        }
      },

      // Helper functions
      getEventsByType: (eventType: string) => {
        return get().events.filter(event => event.eventType === eventType);
      },

      getEventsByLead: (leadId: string) => {
        return get().events.filter(event => event.leadId === leadId);
      },

      getEventsByCustomer: (customerId: string) => {
        return get().events.filter(event => event.customerId === customerId);
      },

      getTodayEvents: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().events.filter(event => 
          event.startTime.startsWith(today)
        );
      },

      getUpcomingEvents: () => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return get().events.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= now && eventDate <= nextWeek;
        });
      },

      getRemindersForNotification: () => {
        return get().events.filter(event => 
          event.eventType === 'reminder' && 
          event.isActive && 
          !event.notified && 
          event.advanceNotice > 0
        );
      },

      clearEvents: () => {
        set({ events: [], error: null });
      }
    }),
    {
      name: 'unified-event-storage',
      version: 1,
      partialize: (state) => ({
        // Only persist events, not loading states
        events: state.events
      })
    }
  )
);
