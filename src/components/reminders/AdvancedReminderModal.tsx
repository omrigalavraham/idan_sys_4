import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Phone,
  MessageCircle,
  CheckCircle2,
  FileText,
  Plus,
  Bell,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { usersService, User as UserType } from '../../services/usersService';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'callback' | 'meeting' | 'task' | 'followup' | 'appointment';
  dueDateTime: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  advanceNotice?: number; // Minutes before to send notification (0 = no advance notice)
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

interface AdvancedReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reminder: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'>) => void;
  reminder?: Reminder | null; // For editing
}

const AdvancedReminderModal: React.FC<AdvancedReminderModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  reminder,
}) => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserType[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Reminder['type']>('task');
  const [priority, setPriority] = useState<Reminder['priority']>('medium');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [relatedName, setRelatedName] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [advanceNotice, setAdvanceNotice] = useState(5); // Default 5 minutes

  const isManager = user?.role === 'admin' || user?.role === 'manager';

  // Load users for assignment (if manager)
  useEffect(() => {
    if (isManager) {
      // Load real users from API
      const loadUsers = async () => {
        try {
          const allUsers = await usersService.getAllActiveUsers();
          console.log('Loaded users successfully:', allUsers.length);
          setUsers(allUsers);
        } catch (error) {
          console.error('Failed to load users from API:', error);
          console.log('Using default users instead');
          // Use minimal default data instead of mock users
          const defaultUsers: UserType[] = [
            {
              id: user?.id || 'current-user',
              name: user?.name || 'משתמש נוכחי',
              email: user?.email || '',
              role: user?.role || 'agent',
            },
          ];
          setUsers(defaultUsers);
        }
      };

      loadUsers();
    }
  }, [isManager, user]);

  // Initialize form with reminder data (for editing)
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description || '');
      setType(reminder.type);
      setPriority(reminder.priority);
      setDate(reminder.dueDateTime.toISOString().split('T')[0]);
      setTime(reminder.dueDateTime.toTimeString().slice(0, 5));
      setAssignedToId(reminder.assignedTo?.id || '');
      setRelatedName(reminder.relatedTo?.name || '');
      setNotes(reminder.notes || '');
      setTags(reminder.tags || []);
      setAdvanceNotice(reminder.advanceNotice || 15);
    }
  }, [reminder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    const dueDateTime = new Date(`${date}T${time}`);
    const assignedUser = users.find(u => u.id === assignedToId);

    const newReminder: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'> = {
      title,
      description: description || undefined,
      type,
      dueDateTime,
      priority,
      assignedTo: assignedUser
        ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
          }
        : undefined,
      relatedTo: relatedName
        ? {
            type: 'lead',
            id: `temp-${Date.now()}`,
            name: relatedName,
          }
        : undefined,
      createdBy: {
        id: user?.id || '',
        name: user?.name || '',
      },
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
      advanceNotice,
    };

    onAdd(newReminder);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('task');
    setPriority('medium');
    setDate('');
    setTime('');
    setAssignedToId('');
    setRelatedName('');
    setNotes('');
    setTags([]);
    setNewTag('');
    setAdvanceNotice(15);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'callback':
        return <Phone className="w-5 h-5" />;
      case 'meeting':
        return <User className="w-5 h-5" />;
      case 'task':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'followup':
        return <MessageCircle className="w-5 h-5" />;
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {reminder ? 'עריכת תזכורת' : 'תזכורת חדשה'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title and Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  כותרת *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="כותרת התזכורת..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  סוג
                </label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as Reminder['type'])}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="task">משימה</option>
                    <option value="callback">טלפון חוזר</option>
                    <option value="meeting">פגישה</option>
                    <option value="appointment">תור</option>
                    <option value="followup">מעקב</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {getTypeIcon(type)}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                תיאור
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="פרטים נוספים על התזכורת..."
              />
            </div>

            {/* Priority and Assignment Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  עדיפות
                </label>
                <select
                  value={priority}
                  onChange={e =>
                    setPriority(e.target.value as Reminder['priority'])
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                </select>
              </div>

              {isManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    משויך לנציג
                  </label>
                  <select
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      {users.length === 0
                        ? 'לא נמצאו נציגים...'
                        : 'בחר נציג...'}
                    </option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  {users.length <= 1 && (
                    <p className="text-sm text-gray-500 mt-1">
                      * הנציגים נטענים מבסיס הנתונים. אם הרשימה ריקה, יש לבדוק
                      את החיבור לשרת.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  תאריך *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  שעה *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Related To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                קשור ל
              </label>
              <input
                type="text"
                value={relatedName}
                onChange={e => setRelatedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="שם ליד/לקוח/אירוע..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                תגיות
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="הוסף תגית..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Advance Notice */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Bell className="w-4 h-4 inline mr-2" />
                הודעה מוקדמת (דקות)
              </label>
              <select
                value={advanceNotice}
                onChange={e => setAdvanceNotice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 דקות לפני</option>
                <option value={15}>15 דקות לפני</option>
                <option value={30}>30 דקות לפני</option>
                <option value={60}>שעה לפני</option>
                <option value={120}>שעתיים לפני</option>
                <option value={1440}>יום לפני</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                הערות
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="הערות נוספות..."
              />
            </div>

            {/* Preview */}
            {title && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  תצוגה מקדימה:
                </h4>
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${getPriorityColor(priority)}`}
                  >
                    {getTypeIcon(type)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {title}
                    </h5>
                    {description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {date} {time}
                      </span>
                      {assignedToId && (
                        <span>
                          נציג: {users.find(u => u.id === assignedToId)?.name}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded ${getPriorityColor(
                          priority
                        )}`}
                      >
                        {priority === 'high'
                          ? 'גבוה'
                          : priority === 'medium'
                          ? 'בינוני'
                          : 'נמוך'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {reminder ? 'עדכן תזכורת' : 'צור תזכורת'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                ביטול
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedReminderModal;
