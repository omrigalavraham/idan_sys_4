import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  PhoneMissed,
  XCircle,
  CheckCircle,
  FileText,
  Edit3,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

interface WhatsAppTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  phoneNumber: string;
}

const defaultTemplates = [
  {
    id: 'no-answer',
    icon: PhoneMissed,
    title: 'אין מענה',
    color: 'orange',
    message: (name: string) => `שלום ${name},
ניסינו ליצור איתך קשר אך לא הצלחנו להשיגך.
נשמח לשוחח ולספק את כל המידע הרלוונטי.
מוזמן לחזור אלינו בשעות הנוחות לך או להשיב להודעה זו.`,
  },
  {
    id: 'no-answer-2',
    icon: PhoneMissed,
    title: 'אין מענה 2',
    color: 'red',
    message: (name: string) => `שלום ${name},
זו פנייה נוספת לאחר שניסינו ליצור איתך קשר בעבר.
נשמח לדעת אם עדיין רלוונטי עבורך שנמשיך בתהליך.
אם כן – נוכל לקבוע זמן שנוח לך לשיחה קצרה.`,
  },
  {
    id: 'not-interested',
    icon: XCircle,
    title: 'לא מעוניין',
    color: 'gray',
    message: (name: string) => `שלום ${name},
תודה שעדכנת אותנו. מכבדים את ההחלטה שלך ולא נטריד מעבר לכך.
נשמח לעמוד לרשותך בעתיד, בכל זמן שתמצא לנכון.
מאחלים לך הצלחה רבה בהמשך.`,
  },
  {
    id: 'new',
    icon: CheckCircle,
    title: 'חדש',
    color: 'green',
    message: (name: string) => `שלום ${name},
תודה שפנית אלינו! שמחנו לקבל את פנייתך ונשמח לעמוד לשירותך.
נציג מצוות המכירות שלנו יחזור אליך בהקדם עם כל המידע הרלוונטי.
בינתיים, אם יש לך שאלות – אנחנו כאן בשבילך.`,
  },
  {
    id: 'price-sent',
    icon: FileText,
    title: 'נשלחה הצעת מחיר',
    color: 'purple',
    message: (name: string) => `שלום ${name},
שלחנו אליך הצעת מחיר מסודרת בהתאם לשיחתנו.
נשמח לדעת אם קיבלת את ההצעה ואם יש שאלות או הבהרות שנוכל לעזור בהן.
אנחנו זמינים עבורך בכל שלב.`,
  },
  {
    id: 'custom',
    icon: Edit3,
    title: 'טקסט חופשי',
    color: 'blue',
    message: () => '',
  },
];

const WhatsAppTemplates: React.FC<WhatsAppTemplatesProps> = ({
  isOpen,
  onClose,
  leadName,
  phoneNumber,
}) => {
  const { user, clientConfig } = useAuthStore();
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  let clientTemplates: any[] = [];

  if (user?.role !== 'admin' && clientConfig?.message_templates) {
    clientTemplates =
      clientConfig.message_templates.filter(
        (t: any) => t.template_type === 'whatsapp'
      ) || [];
  }

  const templates = [
    ...defaultTemplates,
    ...clientTemplates.map(t => ({
      id: `client-${t.id}`,
      icon: MessageCircle,
      title: t.template_name,
      color: 'blue',
      message: (name: string) =>
        t.content.replace(/{name}/g, name).replace(/{phone}/g, phoneNumber),
    })),
  ];

  const handleSendMessage = async (templateId: string) => {
    let message;
    if (templateId === 'custom') {
      message = customMessage;
    } else {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      message = template.message(leadName);
    }

    let formattedPhone = phoneNumber.replace(/\D/g, '');

    if (formattedPhone.startsWith('972')) {
      formattedPhone = formattedPhone;
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9) {
      formattedPhone = '972' + formattedPhone;
    } else if (formattedPhone.length === 10 && formattedPhone.startsWith('5')) {
      formattedPhone = '972' + formattedPhone;
    } else {
      formattedPhone = '972' + formattedPhone;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

    try {
      window.open(whatsappUrl, 'whatsapp-web');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      window.open(whatsappUrl, '_blank');
    }

    onClose();
  };

  const getColorClasses = (color: string) => {
    const colors: {
      [key: string]: {
        bg: string;
        text: string;
        border: string;
        hover: string;
      };
    } = {
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-600',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-600',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        תבניות WhatsApp
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        בחר תבנית או כתוב הודעה מותאמת
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map(template => {
                    if (template.id === 'custom') {
                      return (
                        <div
                          key={template.id}
                          className="md:col-span-2 lg:col-span-3"
                        >
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {template.title}
                              </span>
                            </div>
                            <textarea
                              value={customMessage}
                              onChange={e => setCustomMessage(e.target.value)}
                              className="w-full h-32 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              placeholder={`שלום ${leadName},\n\nהקלד את ההודעה שלך כאן...`}
                            />
                            {customMessage && (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSendMessage('custom')}
                                className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg transition-all"
                              >
                                <Send className="w-5 h-5" />
                                שלח הודעה מותאמת
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const Icon = template.icon;
                    const colors = getColorClasses(template.color);
                    const isSelected = selectedTemplate === template.id;

                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setSelectedTemplate(isSelected ? null : template.id)
                        }
                        className={`text-right p-4 rounded-xl border-2 transition-all ${
                          colors.bg
                        } ${colors.border} ${colors.hover} ${
                          isSelected
                            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}
                          >
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {template.title}
                          </span>
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 mb-3 whitespace-pre-line leading-relaxed border-t border-gray-200 dark:border-gray-600 pt-3">
                                {template.message(leadName)}
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSendMessage(template.id);
                                }}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                              >
                                <Send className="w-4 h-4" />
                                שלח עכשיו
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!isSelected && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            לחץ לתצוגה מקדימה
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>שולח ל: {leadName}</span>
                  <span dir="ltr">{phoneNumber}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppTemplates;
