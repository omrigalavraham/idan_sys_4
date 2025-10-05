import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  CheckCircle2,
  X,
  Plus,
  Search,
  Edit3,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import AdvancedReminderModal from '../components/reminders/AdvancedReminderModal';
import useAuthStore from '../store/authStore';
import useReminders from '../hooks/useReminders';

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

const Reminders: React.FC = () => {
  const { user } = useAuthStore();
  const {
    reminders,
    addReminder,
    updateReminder,
    toggleComplete,
    deleteReminder,
  } = useReminders();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Reminder['type']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const handleDeleteReminder = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (
      reminder &&
      window.confirm(
        `האם אתה בטוח שברצונך למחוק את התזכורת "${reminder.title}"?`
      )
    ) {
      deleteReminder(id);
    }
  };

  const handleSaveReminder = (
    reminderData: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'>
  ) => {
    if (editingReminder) {
      // Update existing reminder
      updateReminder(editingReminder.id, reminderData);
    } else {
      // Add new reminder
      addReminder(reminderData);
    }
    setEditingReminder(null);
    setShowAddModal(false);
  };

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'callback':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <User className="w-4 h-4" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'followup':
        return <MessageCircle className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: Reminder['type']) => {
    switch (type) {
      case 'callback':
        return 'טלפון חוזר';
      case 'meeting':
        return 'פגישה';
      case 'task':
        return 'משימה';
      case 'followup':
        return 'מעקב';
      case 'appointment':
        return 'תור';
      default:
        return 'תזכורת';
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'גבוה';
      case 'medium':
        return 'בינוני';
      case 'low':
        return 'נמוך';
      default:
        return 'רגיל';
    }
  };

  const isOverdue = (dueDateTime: Date) => {
    return new Date() > dueDateTime;
  };

  const filteredReminders = reminders
    .filter(reminder => {
      if (filter === 'pending') return !reminder.isCompleted;
      if (filter === 'completed') return reminder.isCompleted;
      return true;
    })
    .filter(reminder => {
      if (typeFilter === 'all') return true;
      return reminder.type === typeFilter;
    })
    .filter(reminder => {
      if (!searchTerm) return true;
      return (
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Sort by due date, then by priority
      if (a.dueDateTime.getTime() !== b.dueDateTime.getTime()) {
        return a.dueDateTime.getTime() - b.dueDateTime.getTime();
      }
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                תזכורות
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              תזכורת חדשה
            </motion.button>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-1 ${
              isManager ? 'md:grid-cols-5' : 'md:grid-cols-4'
            } gap-4 mb-6`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    סה"כ תזכורות
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reminders.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ממתינות
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {reminders.filter(r => !r.isCompleted).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    הושלמו
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {reminders.filter(r => r.isCompleted).length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    איחור
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      reminders.filter(
                        r => !r.isCompleted && isOverdue(r.dueDateTime)
                      ).length
                    }
                  </p>
                </div>
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Manager status indicator */}
            {isManager && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      סטטוס
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                      מנהל מערכת
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חיפוש תזכורות..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="pending">ממתינות</option>
              <option value="completed">הושלמו</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">כל הסוגים</option>
              <option value="callback">טלפון חוזר</option>
              <option value="meeting">פגישה</option>
              <option value="task">משימה</option>
              <option value="followup">מעקב</option>
              <option value="appointment">תור</option>
            </select>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredReminders.map(reminder => (
              <motion.div
                key={`reminder-${reminder.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  reminder.isCompleted
                    ? 'border-gray-200 dark:border-gray-700 opacity-75'
                    : isOverdue(reminder.dueDateTime)
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                } p-6 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Checkbox */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleComplete(reminder.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        reminder.isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }`}
                    >
                      {reminder.isCompleted && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getPriorityColor(
                            reminder.priority
                          )}`}
                        >
                          {getTypeIcon(reminder.type)}
                          {getTypeLabel(reminder.type)}
                        </div>
                        <span
                          className={`text-sm px-2 py-1 rounded ${getPriorityColor(
                            reminder.priority
                          )}`}
                        >
                          {getPriorityLabel(reminder.priority)}
                        </span>
                        {isOverdue(reminder.dueDateTime) &&
                          !reminder.isCompleted && (
                            <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-800">
                              באיחור
                            </span>
                          )}
                      </div>

                      <h3
                        className={`text-lg font-semibold mb-2 ${
                          reminder.isCompleted
                            ? 'line-through text-gray-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {reminder.title}
                      </h3>

                      {reminder.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(reminder.dueDateTime, 'dd/MM/yyyy', {
                              locale: he,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(reminder.dueDateTime, 'HH:mm')}</span>
                        </div>
                        {reminder.relatedTo && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{reminder.relatedTo.name}</span>
                          </div>
                        )}
                        {reminder.assignedTo && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            <span>{reminder.assignedTo.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {reminder.tags && reminder.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {reminder.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditingReminder(reminder)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="עריכה"
                    >
                      <Edit3 className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="מחיקה"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredReminders.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              אין תזכורות
            </h3>
            <p className="text-gray-400">
              {searchTerm || filter !== 'all' || typeFilter !== 'all'
                ? 'לא נמצאו תזכורות המתאימות לחיפוש'
                : 'עדיין לא נוספו תזכורות למערכת'}
            </p>
          </div>
        )}
      </div>

      <AdvancedReminderModal
        isOpen={showAddModal || editingReminder !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingReminder(null);
        }}
        onAdd={handleSaveReminder}
        reminder={editingReminder}
      />
    </div>
  );
};

export default Reminders;
