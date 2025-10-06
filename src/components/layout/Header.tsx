import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, User, Settings, LogOut, Bell } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import AttendanceButton from '../attendance/AttendanceButton';
import useReminders from '../../hooks/useReminders';

interface NotificationsListProps {
  onClose: () => void;
  onNavigate: (path: string) => void;
  showNotificationFunction?:
    | ((reminderId: string, snoozeMinutes?: number) => void)
    | null;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  onClose,
  onNavigate,
  showNotificationFunction,
}) => {
  const { reminders, toggleComplete } = useReminders();

  // Get pending reminders sorted by due date
  const pendingReminders = reminders
    .filter(r => !r.isCompleted)
    .sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime())
    .slice(0, 5); // Show only first 5

  const formatTimeLeft = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();

    if (diff < 0) {
      return 'באיחור';
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `בעוד ${days} יום`;
    if (hours > 0) return `בעוד ${hours} שעות`;
    if (minutes > 0) return `בעוד ${minutes} דקות`;
    return 'עכשיו';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {pendingReminders.map(reminder => (
        <div
          key={reminder.id}
          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => {
            onNavigate('/reminders');
            onClose(); // Close the dropdown when navigating
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(
                reminder.priority
              )}`}
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {reminder.title}
              </h4>
              {reminder.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {reminder.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeLeft(reminder.dueDateTime)}
                </span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (showNotificationFunction) {
                        showNotificationFunction(reminder.id, 0);
                      }
                      onClose();
                    }}
                    className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                  >
                    עכשיו
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (showNotificationFunction) {
                        showNotificationFunction(reminder.id, 5);
                      }
                      onClose();
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    5 דק׳
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (showNotificationFunction) {
                        showNotificationFunction(reminder.id, 15);
                      }
                      onClose();
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    15 דק׳
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (showNotificationFunction) {
                        showNotificationFunction(reminder.id, 60);
                      }
                      onClose();
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    שעה
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleComplete(reminder.id);
                      onClose();
                    }}
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    הושלם
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface HeaderProps {
  onMenuClick: () => void;
  showNotificationFunction?:
    | ((reminderId: string, snoozeMinutes?: number) => void)
    | null;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showNotificationFunction,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { clients } = useClientStore();
  const { getPendingCount } = useReminders();
  const isDark = theme === 'dark';
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const pendingReminders = getPendingCount();

  const getUserClient = () => {
    if (!user?.client_id) return null;
    return clients.find(c => c.id === user.client_id!.toString());
  };

  const userClient = getUserClient();
  useEffect(() => {
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`userAvatar_${user.id}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const handleAvatarUpdate = (event: StorageEvent) => {
      if (user?.id && event.key === `userAvatar_${user.id}`) {
        setAvatarUrl(event.newValue);
      }
    };

    window.addEventListener('storage', handleAvatarUpdate);
    return () => window.removeEventListener('storage', handleAvatarUpdate);
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm mobile-header safe-top">
      <div className="container mx-auto px-4 py-3 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMenuClick}
              className="menu-button text-blue-600 dark:text-blue-400 md:hidden haptic-medium p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <Menu className="h-8 w-8" />
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-blue-600 dark:to-purple-600 text-white shadow-md flex items-center justify-center haptic-light"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.button>

            <AttendanceButton />

            {/* Notifications Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md flex items-center justify-center haptic-light relative"
              >
                <Bell className="h-5 w-5" />
                {/* Notification Badge */}
                {pendingReminders > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                    {pendingReminders > 99 ? '99+' : pendingReminders}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden max-h-96"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            תזכורות בהמתנה
                          </h3>
                          <button
                            onClick={() => navigate('/reminders')}
                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                          >
                            צפה בכולן
                          </button>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-72 overflow-y-auto">
                        {pendingReminders === 0 ? (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">אין תזכורות בהמתנה</p>
                          </div>
                        ) : (
                          <NotificationsList
                            onClose={() => setShowNotifications(false)}
                            onNavigate={path => {
                              navigate(path);
                              setShowNotifications(false);
                            }}
                            showNotificationFunction={showNotificationFunction}
                          />
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(!showProfile)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md transition-all duration-200 haptic-medium"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfile(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                    >
                      {/* Header Section */}
                      <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={user?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user?.email}
                            </p>
                            {userClient && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                                {userClient.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <motion.button
                          whileHover={{
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigate('/profile');
                            setShowProfile(false);
                          }}
                          className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 text-right flex items-center gap-3 transition-colors duration-150"
                        >
                          <User className="w-4 h-4 text-blue-500" />
                          פרופיל
                        </motion.button>

                        <motion.button
                          whileHover={{
                            backgroundColor: 'rgba(107, 114, 128, 0.05)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigate('/settings');
                            setShowProfile(false);
                          }}
                          className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 text-right flex items-center gap-3 transition-colors duration-150"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          הגדרות
                        </motion.button>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-2" />

                        <motion.button
                          whileHover={{
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 text-right flex items-center gap-3 transition-colors duration-150"
                        >
                          <LogOut className="w-4 h-4" />
                          התנתק
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
