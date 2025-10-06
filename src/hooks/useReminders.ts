import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { generateUUID } from '../utils/uuid';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'callback' | 'meeting' | 'task' | 'followup' | 'appointment';
  dueDateTime: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  };
  relatedTo?: {
    type: 'lead' | 'customer' | 'event';
    id: string;
    name: string;
  };
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
  notes?: string;
  tags?: string[];
}

const STORAGE_KEY = 'user_reminders';
let isSyncDisabled = false; // Prevent sync loops

export const useReminders = () => {
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load reminders from localStorage
  const loadReminders = useCallback(() => {
    if (isSyncDisabled) return;

    try {
      const savedReminders = localStorage.getItem(STORAGE_KEY);
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders).map((r: any) => ({
          ...r,
          dueDateTime: new Date(r.dueDateTime),
          createdAt: new Date(r.createdAt),
        }));
        setReminders(parsedReminders);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save reminders to localStorage
  const saveReminders = useCallback((updatedReminders: Reminder[]) => {
    if (isSyncDisabled) return;

    try {
      isSyncDisabled = true; // Prevent sync loops
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
      setReminders(updatedReminders);
      setLastSync(new Date());

      // Re-enable sync after a short delay
      setTimeout(() => {
        isSyncDisabled = false;
      }, 500);
    } catch (error) {
      console.error('Error saving reminders:', error);
      isSyncDisabled = false;
    }
  }, []);

  // Add new reminder
  const addReminder = useCallback(
    (reminderData: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'>) => {
      const newReminder: Reminder = {
        ...reminderData,
        id: generateUUID(), // Using UUID utility instead of timestamp-based ID
        isCompleted: false,
        createdAt: new Date(),
      };

      const updatedReminders = [...reminders, newReminder];
      saveReminders(updatedReminders);
      return newReminder;
    },
    [reminders, saveReminders]
  );

  // Update reminder
  const updateReminder = useCallback(
    (id: string, updates: Partial<Reminder>) => {
      const updatedReminders = reminders.map(reminder =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      );
      saveReminders(updatedReminders);
    },
    [reminders, saveReminders]
  );

  // Delete reminder
  const deleteReminder = useCallback(
    (id: string) => {
      console.log('Deleting reminder with ID:', id);
      const updatedReminders = reminders.filter(reminder => {
        const shouldKeep = reminder.id !== id;
        if (!shouldKeep) {
          console.log('Found and removing reminder:', reminder.title);
        }
        return shouldKeep;
      });

      if (updatedReminders.length === reminders.length) {
        console.warn('No reminder found with ID:', id);
        return;
      }

      console.log(
        'Updating reminders list, new count:',
        updatedReminders.length
      );
      saveReminders(updatedReminders);
    },
    [reminders, saveReminders]
  );

  // Toggle complete status
  const toggleComplete = useCallback(
    (id: string) => {
      console.log('Toggling complete status for reminder ID:', id);
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        console.log('Current completion status:', reminder.isCompleted);
        updateReminder(id, { isCompleted: !reminder.isCompleted });
        console.log('Toggled to:', !reminder.isCompleted);
      } else {
        console.error('Reminder not found for toggle:', id);
      }
    },
    [reminders, updateReminder]
  );

  // Get reminders for current user or all if manager
  const getFilteredReminders = useCallback(() => {
    if (!user) return [];

    const isManager = user.role === 'admin' || user.role === 'manager';

    if (isManager) {
      return reminders; // Managers see all reminders
    }

    // Regular users see only their own reminders or unassigned ones
    return reminders.filter(
      reminder =>
        !reminder.assignedTo ||
        reminder.assignedTo.id === user.id ||
        reminder.createdBy.id === user.id
    );
  }, [reminders, user]);

  // Get pending reminders count
  const getPendingCount = useCallback(() => {
    return getFilteredReminders().filter(r => !r.isCompleted).length;
  }, [getFilteredReminders]);

  // Get overdue reminders
  const getOverdueReminders = useCallback(() => {
    const now = new Date();
    return getFilteredReminders().filter(
      r => !r.isCompleted && r.dueDateTime < now
    );
  }, [getFilteredReminders]);

  // Get upcoming reminders (next 24 hours)
  const getUpcomingReminders = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return getFilteredReminders().filter(
      r => !r.isCompleted && r.dueDateTime >= now && r.dueDateTime <= tomorrow
    );
  }, [getFilteredReminders]);

  // Initialize and set up sync
  useEffect(() => {
    loadReminders();

    // Listen for storage changes (cross-tab sync) - DISABLED to prevent issues
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && !isSyncDisabled) {
        console.log('Storage changed, reloading...');
        loadReminders();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadReminders]);

  return {
    reminders: getFilteredReminders(),
    allReminders: reminders, // For managers who need to see all
    loading,
    lastSync,
    addReminder,
    updateReminder,
    toggleComplete,
    deleteReminder,
    getPendingCount,
    getOverdueReminders,
    getUpcomingReminders,
    refresh: loadReminders,
  };
};

export default useReminders;
