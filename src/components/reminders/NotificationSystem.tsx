import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { playNotificationSound } from '../../utils/notificationSound';

interface NotificationData {
  id: string;
  title: string;
  description?: string;
  type: 'reminder' | 'overdue' | 'upcoming';
  timestamp: Date;
  reminderId?: string;
  dueDateTime?: Date;
  assignedTo?: string;
  priority?: string;
}

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onComplete?: (reminderId: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onComplete,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 6000; // 6 seconds - longer display time
    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          onDismiss(notification.id);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification.id, onDismiss]);

  const formatTime = (timestamp: Date) => {
    return format(timestamp, 'HH:mm', { locale: he });
  };

  const formatDate = (timestamp: Date) => {
    return format(timestamp, 'dd/MM/yyyy', { locale: he });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        duration: 0.4,
      }}
      className="relative max-w-sm w-full bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-100"
      style={{
        direction: 'rtl',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          תזכורת שירות חוזרת
        </h3>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-white/80 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Client/Contact Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-lg">👤</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">
              {notification.title}
            </h4>
            {notification.description && (
              <p className="text-gray-600 text-xs">
                {notification.description}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>
              {notification.dueDateTime
                ? `נקבע ל${formatTime(
                    notification.dueDateTime
                  )} תאריך ${formatDate(notification.dueDateTime)}`
                : `הודעה מ${formatTime(notification.timestamp)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>🕐</span>
            <span>זמן שרירה: {formatTime(notification.timestamp)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>📅</span>
            <span>תאריך: {formatDate(notification.timestamp)}</span>
          </div>
          {notification.assignedTo && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>📞</span>
              <span>נציג: {notification.assignedTo}</span>
            </div>
          )}
          {notification.priority && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>⭐</span>
              <span>
                עדיפות:{' '}
                {notification.priority === 'high'
                  ? 'גבוהה'
                  : notification.priority === 'medium'
                  ? 'בינונית'
                  : 'נמוכה'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              if (notification.reminderId && onComplete) {
                onComplete(notification.reminderId);
              }
              onDismiss(notification.id);
            }}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            הושלם
          </button>
          <button
            onClick={() => onDismiss(notification.id)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            סגור
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <motion.div
          className="h-full bg-green-500"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

interface NotificationSystemProps {
  reminders: Array<{
    id: string;
    title: string;
    description?: string;
    dueDateTime: Date;
    isCompleted: boolean;
    type: string;
    priority?: 'low' | 'medium' | 'high';
    advanceNotice?: number;
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
  }>;
  onCompleteReminder?: (reminderId: string) => void;
  onShowNotification?: (
    showFunction: (reminderId: string, snoozeMinutes?: number) => void
  ) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  reminders,
  onCompleteReminder,
  onShowNotification,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const remindersRef = useRef(reminders);

  // Update reminders ref when reminders prop changes
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  // Debug: Log notifications state changes
  useEffect(() => {
    console.log(
      'Notifications state updated:',
      notifications.length,
      notifications
    );
  }, [notifications]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Function to show browser notification
  const showBrowserNotification = (reminder: any) => {
    console.log('Attempting to show browser notification for:', reminder.title);

    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('Creating browser notification...');

      const notification = new Notification(`תזכורת: ${reminder.title}`, {
        body: reminder.description || 'הגיעה השעה עבור התזכורת',
        icon: '/favicon.ico', // You can replace with your app icon
        tag: reminder.id, // Prevents duplicate notifications
        requireInteraction: true, // Notification stays until user interacts
      });

      notification.onclick = () => {
        console.log('Browser notification clicked');
        window.focus(); // Bring the window to focus
        notification.close();
      };

      // Auto close after 10 seconds if user doesn't interact
      setTimeout(() => {
        notification.close();
      }, 10000);
    } else if (Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('Permission response:', permission);
        if (permission === 'granted') {
          showBrowserNotification(reminder); // Retry
        }
      });
    } else {
      console.warn('Notification permission denied');
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    };

    requestNotificationPermission();
  }, []);

  // Stable function to check for due reminders
  const checkForDueReminders = useCallback(() => {
    console.log(
      'Checking for due reminders...',
      new Date().toLocaleTimeString()
    );
    console.log('Total reminders:', remindersRef.current.length);
    const now = new Date();

    // Debug: Show all reminders and their due times
    remindersRef.current.forEach(reminder => {
      const dueTime = new Date(reminder.dueDateTime);
      const timeDiff = now.getTime() - dueTime.getTime();
      console.log(
        `Reminder "${
          reminder.title
        }": due at ${dueTime.toLocaleString()}, diff: ${Math.round(
          timeDiff / 1000
        )}s, completed: ${reminder.isCompleted}`
      );
    });

    // Get reminders that are due now (within the last 2 minutes to ensure we don't miss them)
    const dueReminders = remindersRef.current.filter(reminder => {
      if (reminder.isCompleted) return false;

      const dueTime = new Date(reminder.dueDateTime);
      const timeDiff = now.getTime() - dueTime.getTime();

      // Show notification if due time has passed and it's within the last 2 minutes
      // This gives us a wider window to catch reminders
      return timeDiff >= 0 && timeDiff < 120000; // 2 minutes = 120 seconds
    });

    console.log('Found due reminders:', dueReminders.length);

    // Create notifications for due reminders
    dueReminders.forEach(reminder => {
      console.log('Processing due reminder:', reminder.title);
      setNotifications(prev => {
        // Check if we already have a notification for this reminder
        const existingNotification = prev.find(
          n => n.reminderId === reminder.id && n.type === 'reminder'
        );

        if (!existingNotification) {
          console.log('Creating new notification for:', reminder.title);
          // Show browser notification
          showBrowserNotification(reminder);

          // Play notification sound
          try {
            playNotificationSound();
            console.log('Notification sound played');
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }

          const notification: NotificationData = {
            id: `auto-${reminder.id}-${Date.now()}`,
            title: reminder.title,
            description: reminder.description || 'הגיעה השעה עבור התזכורת',
            type: 'reminder',
            timestamp: now,
            reminderId: reminder.id,
            dueDateTime: reminder.dueDateTime,
            assignedTo: reminder.assignedTo?.name,
            priority: reminder.priority,
          };

          console.log('Adding notification to state:', notification);
          const newState = [...prev, notification];
          console.log('New notifications state will be:', newState);
          return newState;
        }
        return prev;
      });
    });
  }, []);

  // Check for due reminders automatically
  useEffect(() => {
    // Check immediately
    console.log('Starting initial reminder check...');
    checkForDueReminders();

    // Check every 30 seconds for due reminders
    console.log('Setting up automatic reminder checking every 30 seconds');
    const interval = setInterval(checkForDueReminders, 30000);

    return () => {
      console.log('Cleaning up reminder checker');
      clearInterval(interval);
    };
  }, [checkForDueReminders]);

  // Only show notifications when manually triggered, not automatically
  const showReminderNotification = (
    reminderId: string,
    snoozeMinutes?: number
  ) => {
    const reminder = remindersRef.current.find(r => r.id === reminderId);
    if (!reminder || reminder.isCompleted) {
      return;
    }

    const now = new Date();
    const notification: NotificationData = {
      id: `manual-${reminder.id}-${Date.now()}`,
      title: reminder.title,
      description:
        snoozeMinutes && snoozeMinutes > 0
          ? `תזכורת נדחתה - יופיע שוב בעוד ${snoozeMinutes} דקות`
          : reminder.description || 'תזכורת ידנית',
      type: 'reminder',
      timestamp: now,
      reminderId: reminder.id,
      dueDateTime: reminder.dueDateTime,
      assignedTo: reminder.assignedTo?.name,
      priority: reminder.priority,
    };

    setNotifications(prev => [...prev, notification]);

    // If snoozed and more than 0 minutes, set timer to show again
    if (snoozeMinutes && snoozeMinutes > 0) {
      setTimeout(() => {
        showReminderNotification(reminderId);
      }, snoozeMinutes * 60 * 1000);
    }
  };

  // Expose the function to parent component
  useEffect(() => {
    if (onShowNotification) {
      onShowNotification(showReminderNotification);
    }
  }, [onShowNotification]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const completeReminder = (reminderId: string) => {
    if (onCompleteReminder) {
      onCompleteReminder(reminderId);
    }
    // Remove all notifications for this reminder
    setNotifications(prev => prev.filter(n => n.reminderId !== reminderId));
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationToast
                notification={notification}
                onDismiss={dismissNotification}
                onComplete={completeReminder}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationSystem;
