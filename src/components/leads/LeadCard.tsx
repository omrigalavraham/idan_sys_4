import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  PhoneCall,
} from 'lucide-react';
import { Lead } from '../../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Custom WhatsApp icon component
const WhatsAppIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

import WhatsAppTemplates from './WhatsAppTemplates';
import EmailTemplates from './EmailTemplates';
import LeadAnalysis from '../ai/LeadAnalysis';
import LeadHistory from './LeadHistory';

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  checkbox?: React.ReactNode;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  checkbox,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const savedState = localStorage.getItem(`lead-${lead.id}-expanded`);
    return savedState ? JSON.parse(savedState) : false;
  });
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);

  // Function to create reminder when callback is set
  const createCallbackReminder = () => {
    if (lead.callbackDate) {
      const callbackDateTime = new Date(lead.callbackDate);
      if (lead.callbackTime) {
        const [hours, minutes] = lead.callbackTime.split(':');
        callbackDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      const reminder = {
        id: `callback-${lead.id}-${Date.now()}`,
        title: `טלפון חוזר ל${lead.name}`,
        description: `טלפון: ${lead.phone}${
          lead.notes ? ` | הערות: ${lead.notes}` : ''
        }`,
        type: 'callback' as const,
        dueDateTime: callbackDateTime,
        isCompleted: false,
        priority: 'medium' as const,
        relatedTo: {
          type: 'lead' as const,
          id: lead.id,
          name: lead.name,
        },
        createdAt: new Date(),
      };

      // Save to reminders
      const existingReminders = JSON.parse(
        localStorage.getItem('reminders') || '[]'
      );
      const updatedReminders = [...existingReminders, reminder];
      localStorage.setItem('reminders', JSON.stringify(updatedReminders));
    }
  };

  // Create reminder when component mounts if callback exists
  React.useEffect(() => {
    createCallbackReminder();
  }, [lead.callbackDate, lead.callbackTime]);

  const handleWhatsAppClick = () => {
    setShowWhatsAppTemplates(true);
  };

  const handleEmailClick = () => {
    if (lead.email) {
      setShowEmailTemplates(true);
    }
  };

  const handlePhoneClick = () => {
    const formattedPhone = lead.phone.replace(/\D/g, '');
    const phoneUrl = `tel:${formattedPhone}`;
    const link = document.createElement('a');
    link.href = phoneUrl;
    link.setAttribute('class', 'phone-link');
    link.click();
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden cursor-pointer md:text-left text-right"
      style={{ marginBottom: '16px' }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Desktop & Mobile Header */}
      <div className="p-6 md:text-left text-right">
        <div className="flex items-start justify-between mb-4 md:flex-row flex-row-reverse">
          <div className="flex items-center gap-3 md:flex-row flex-row-reverse md:order-1 order-2">
            {checkbox}
            <div className="md:text-left text-right">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 md:text-left text-right">
                {lead.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 md:flex-row flex-row-reverse md:justify-start justify-end">
                <Phone className="w-4 h-4" />
                <span dir="ltr" className="md:text-left text-right">
                  {lead.phone}
                </span>
                {lead.email && (
                  <>
                    <span>•</span>
                    <Mail className="w-4 h-4" />
                    <span className="truncate max-w-[150px] md:text-left text-right">
                      {lead.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2 md:order-2 order-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={e => {
                e.stopPropagation();
                handleWhatsAppClick();
              }}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="שלח WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={e => {
                e.stopPropagation();
                handlePhoneClick();
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="התקשר"
            >
              <PhoneCall className="w-5 h-5" />
            </motion.button>

            {lead.email && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={e => {
                  e.stopPropagation();
                  handleEmailClick();
                }}
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                title="שלח מייל"
              >
                <Mail className="w-5 h-5" />
              </motion.button>
            )}

            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="ערוך"
              >
                <Edit2 className="w-5 h-5" />
              </motion.button>
            )}

            {canDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="מחק"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
        {/* Status & Date Row */}
        <div className="flex items-center gap-3 md:flex-row flex-row-reverse md:justify-start justify-end md:text-left text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            {lead.status}
          </span>

          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 md:flex-row flex-row-reverse">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: he })}
            </span>
          </div>

          {(lead.notes || lead.callbackDate || lead.history?.length) && (
            <span className="text-xs text-gray-400 md:ml-auto mr-auto md:text-left text-right">
              {isExpanded ? '▲ הסתר פרטים' : '▼ הצג פרטים'}
            </span>
          )}
        </div>{' '}
        {/* Callback Info */}
        {lead.callbackDate && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 md:flex-row flex-row-reverse md:text-left text-right">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              טלפון חוזר:{' '}
              {format(new Date(lead.callbackDate), 'dd/MM/yyyy', {
                locale: he,
              })}
              {lead.callbackTime && ` בשעה ${lead.callbackTime}`}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={e => {
              e.stopPropagation();
              handleWhatsAppClick();
            }}
            className="flex flex-col items-center gap-1 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors"
          >
            <WhatsAppIcon className="w-6 h-6" />
            <span className="text-xs font-medium">WhatsApp</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={e => {
              e.stopPropagation();
              handlePhoneClick();
            }}
            className="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors"
          >
            <PhoneCall className="w-6 h-6" />
            <span className="text-xs font-medium">התקשר</span>
          </motion.button>

          {lead.email ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={e => {
                e.stopPropagation();
                handleEmailClick();
              }}
              className="flex flex-col items-center gap-1 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors"
            >
              <Mail className="w-6 h-6" />
              <span className="text-xs font-medium">מייל</span>
            </motion.button>
          ) : canEdit ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors"
            >
              <Edit2 className="w-6 h-6" />
              <span className="text-xs font-medium">ערוך</span>
            </motion.button>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-800"
          >
            <div className="p-6 md:text-left text-right">
              {lead.notes && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 md:text-left text-right">
                    הערות:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed md:text-left text-right">
                    {lead.notes}
                  </p>
                </div>
              )}

              <LeadAnalysis lead={lead} />
              <LeadHistory history={lead.history || []} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WhatsAppTemplates
        isOpen={showWhatsAppTemplates}
        onClose={() => setShowWhatsAppTemplates(false)}
        leadName={lead.name}
        phoneNumber={lead.phone}
      />

      <EmailTemplates
        isOpen={showEmailTemplates}
        onClose={() => setShowEmailTemplates(false)}
        leadName={lead.name}
        email={lead.email || ''}
      />
    </motion.div>
  );
};

export default LeadCard;
