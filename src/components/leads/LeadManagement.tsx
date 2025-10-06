import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  FileCheck,
  AlertCircle,
  UserCheck,
  Filter,
  UserPlus,
  Upload,
  MessageSquare,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { useLeadStore } from '../../store/leadStore';
import useCustomerStore from '../../store/customerStore';
import { useUserStore } from '../../store/userStore';
import { Customer } from '../../types';
import LeadCard from './LeadCard';
import LeadFormDialog from './LeadFormDialog';
import CreateCustomerDialog from '../customers/CreateCustomerDialog';
import BulkMessageDialog from './BulkMessageDialog';
import BulkAssignDialog from './BulkAssignDialog';
import { Lead, LeadStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface LeadManagementProps {
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
}

const LeadManagement: React.FC<LeadManagementProps> = ({
  selectedLead: selectedLeadProp,
  setSelectedLead: setSelectedLeadProp,
}) => {
  const {
    leads,
    totalLeads,
    currentPage,
    pageSize,
    availableStatuses,
    fetchLeads,
    deleteLead,
    bulkDeleteLeads,
    importFromExcel,
    setCurrentPage,
    setPageSize,
    setSelectedAgentId,
    selectedAgentId,
    updateAvailableStatuses,
  } = useLeadStore();
  const { addCustomer, createFromLead } = useCustomerStore();
  const { user, clientConfig } = useAuthStore();
  const { users: agents, fetchAgentsByManager, fetchUsers } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    LeadStatus | 'הכל'
  >('הכל');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAgentFilter, setShowAgentFilter] = useState(false);
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
  const [showAllLeads, setShowAllLeads] = useState(false);

  // Load leads on component mount and when page changes
  useEffect(() => {
    let agentToShow = selectedAgentId;

    if (!selectedAgentId) {
      if (user?.role === 'admin' && !showAllLeads) {
        agentToShow = user.id;
      } else if (user?.role === 'manager') {
        agentToShow = user.id;
      }
    }

    fetchLeads(currentPage, pageSize, agentToShow || undefined);
  }, [
    currentPage,
    pageSize,
    selectedAgentId,
    user?.id,
    user?.role,
    showAllLeads,
    fetchLeads,
  ]);

  // Update available statuses when client config changes
  useEffect(() => {
    updateAvailableStatuses();
  }, [clientConfig, updateAvailableStatuses]);

  // Load agents for managers and all users for admins
  useEffect(() => {
    if (user?.role === 'manager') {
      fetchAgentsByManager();
    } else if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role, fetchAgentsByManager, fetchUsers]);

  const userLeads = leads;

  const stats = [
    {
      icon: <Users size={20} />,
      label: 'סה״כ לידים',
      count: totalLeads,
      color: 'purple',
    },
    {
      icon: <AlertCircle size={20} />,
      label: 'לידים חדשים',
      count: userLeads.filter(l => l.status === 'חדש').length,
      color: 'green',
    },
    {
      icon: <FileCheck size={20} />,
      label: 'נשלחה הצעת מחיר',
      count: userLeads.filter(l => l.status === 'נשלחה הצעת מחיר').length,
      color: 'blue',
    },
    {
      icon: <UserCheck size={20} />,
      label: 'עסקאות שנסגרו',
      count: userLeads.filter(l => l.status === 'עסקה נסגרה').length,
      color: 'red',
    },
  ];

  const filteredLeads = userLeads.filter(lead => {
    const matchesSearch =
      !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);

    const matchesStatus =
      activeStatusFilter === 'הכל' || lead.status === activeStatusFilter;

    const matchesDate =
      (!dateFilter.startDate ||
        new Date(lead.createdAt) >= new Date(dateFilter.startDate)) &&
      (!dateFilter.endDate ||
        new Date(lead.createdAt) <= new Date(dateFilter.endDate));

    const matchesAgent = true;

    return matchesSearch && matchesStatus && matchesDate && matchesAgent;
  });

  const handleAddNewLead = () => {
    setSelectedLeadProp(null);
    setIsLeadDialogOpen(true);
  };

  const handleCreateCustomer = () => {
    if (userLeads.length === 0) {
      toast.error('לא נמצאו לידים במערכת');
      return;
    }
    setIsCustomerDialogOpen(true);
  };

  const handleCustomerCreated = async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const customerDataWithClientId = {
        ...customerData,
        clientId: user?.client_id ? String(user.client_id) : undefined,
      };

      if (customerDataWithClientId.leadId) {
        await createFromLead(
          customerDataWithClientId.leadId,
          customerDataWithClientId
        );
        await deleteLead(customerDataWithClientId.leadId);
      } else {
        await addCustomer(customerDataWithClientId);
      }

      setIsCustomerDialogOpen(false);
      setSelectedLeadProp(null);
      toast.success('הלקוח נוצר בהצלחה');
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLeadProp(lead);
    setIsLeadDialogOpen(true);
  };

  const handleDeleteLead = (lead: Lead) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הליד?')) {
      deleteLead(lead.id);
    }
  };

  const canEditLead = (lead: Lead) => {
    if (!user) return false;

    if (user.role === 'admin') return true;

    if (user.role === 'manager') {
      const agentIds = agents
        .filter((u: any) => u.role === 'agent' && u.managerId === user.id)
        .map((u: any) => u.id);
      return agentIds.includes(lead.assignedTo) || lead.assignedTo === user.id;
    }

    if (user.role === 'agent' && lead.assignedTo === user.id) {
      return true;
    }

    return false;
  };

  const canDeleteLead = (lead: Lead) => {
    if (!user) return false;

    if (user.role === 'admin') return true;

    if (user.role === 'manager') {
      const agentIds = agents
        .filter((u: any) => u.role === 'agent' && u.managerId === user.id)
        .map((u: any) => u.id);
      return agentIds.includes(lead.assignedTo) || lead.assignedTo === user.id;
    }

    if (user.role === 'agent' && lead.assignedTo === user.id) {
      return true;
    }

    return false;
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importFromExcel(file, user!.id);
      event.target.value = '';
    } catch (error) {
      console.error('Error importing Excel:', error);
    }
  };

  const totalPages = Math.ceil(totalLeads / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setShowPageSizeFilter(false);
  };

  const handleSelectLead = (leadId: string, selected: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (selected) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) {
      toast.error('לא נבחרו לידים למחיקה');
      return;
    }

    const confirmMessage = `האם אתה בטוח שברצונך למחוק ${selectedLeads.size} לידים? פעולה זו לא ניתנת לביטול.`;

    if (window.confirm(confirmMessage)) {
      try {
        const leadsToDelete = Array.from(selectedLeads).filter(leadId => {
          const lead = leads.find(l => l.id === leadId);
          return lead && canDeleteLead(lead);
        });

        if (leadsToDelete.length === 0) {
          toast.error('אין לך הרשאה למחוק את הלידים שנבחרו');
          return;
        }

        const result = await bulkDeleteLeads(leadsToDelete);

        setSelectedLeads(new Set());

        if (result.deletedCount > 0) {
          toast.success(`נמחקו ${result.deletedCount} לידים בהצלחה`);
        }

        if (result.failedCount > 0) {
          toast.error(`${result.failedCount} לידים לא נמחקו בגלל שגיאות`);
        }

        if (leadsToDelete.length < selectedLeads.size) {
          toast.error(
            `${
              selectedLeads.size - leadsToDelete.length
            } לידים לא נמחקו בגלל הרשאות`
          );
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        toast.error('שגיאה במחיקת הלידים');
      }
    }
  };

  const statusFilters = ['הכל', ...availableStatuses];

  const getDefaultStatusColor = (statusName: string) => {
    const defaultColors: { [key: string]: string } = {
      חדש: '#10b981',
      בטיפול: '#3b82f6',
      'נשלחה הצעת מחיר': '#8b5cf6',
      'אין מענה': '#f59e0b',
      'אין מענה 2': '#f97316',
      'רוצה לחשוב': '#06b6d4',
      'ממתין לחתימה': '#84cc16',
      'עסקה נסגרה': '#ef4444',
      'לא מעוניין': '#6b7280',
      'הסרה מהמאגר': '#374151',
      'מספר שגוי': '#9ca3af',
      'לקוח קיים': '#10b981',
    };
    return defaultColors[statusName] || '#6b7280';
  };

  const getStatusColor = (statusName: string) => {
    if (user?.role === 'admin') {
      return getDefaultStatusColor(statusName);
    }
    return (
      clientConfig?.lead_statuses?.find((s: any) => s.name === statusName)
        ?.color || getDefaultStatusColor(statusName)
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header and Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-1">
                  {stat.label}
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.count}
                </h3>
              </div>
              <div className={`text-${stat.color}-500`}>{stat.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateCustomer}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm shadow-md transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">הקמת לקוח</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsBulkMessageOpen(true)}
          disabled={selectedLeads.size === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-medium text-sm shadow-md transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">הודעות</span>
          {selectedLeads.size > 0 && (
            <span className="sm:hidden">({selectedLeads.size})</span>
          )}
        </motion.button>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
          id="excel-import"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('excel-import')?.click()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm shadow-md transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">ייבוא</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddNewLead}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">ליד חדש</span>
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeStatusFilter !== 'הכל'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>סטטוס</span>
            </button>
            <AnimatePresence>
              {showStatusFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-10 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                >
                  {statusFilters.map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setActiveStatusFilter(status as LeadStatus | 'הכל');
                        setShowStatusFilter(false);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                        status === activeStatusFilter
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {status}
                      {status !== 'הכל' && (
                        <span className="mr-2 text-xs text-gray-500">
                          ({userLeads.filter(l => l.status === status).length})
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                dateFilter.startDate || dateFilter.endDate
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>תאריך</span>
            </button>

            <AnimatePresence>
              {showDateFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        מתאריך
                      </label>
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={e =>
                          setDateFilter({
                            ...dateFilter,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        עד תאריך
                      </label>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={e =>
                          setDateFilter({
                            ...dateFilter,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDateFilter({ startDate: '', endDate: '' });
                          setShowDateFilter(false);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                      >
                        נקה
                      </button>
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        החל
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Show All Leads - Admin Only */}
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setShowAllLeads(!showAllLeads);
                setSelectedAgentId(null);
              }}
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                showAllLeads
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>כל הלידים</span>
            </button>
          )}

          {/* Agent Filter - Manager & Admin */}
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <div className="relative">
              <button
                onClick={() => setShowAgentFilter(!showAgentFilter)}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  selectedAgentId
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span>{user?.role === 'admin' ? 'משתמש' : 'נציג'}</span>
              </button>

              <AnimatePresence>
                {showAgentFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                  >
                    <button
                      onClick={() => {
                        setSelectedAgentId(null);
                        setShowAgentFilter(false);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                        !selectedAgentId
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {user?.role === 'admin' ? 'כל המשתמשים' : 'כל הנציגים'}
                    </button>
                    {agents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgentId(agent.id);
                          setShowAgentFilter(false);
                        }}
                        className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                          selectedAgentId === agent.id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {agent.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Page Size Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPageSizeFilter(!showPageSizeFilter)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{pageSize} בדף</span>
            </button>

            <AnimatePresence>
              {showPageSizeFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700"
                >
                  {[25, 50, 100, 200].map(size => (
                    <button
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                        pageSize === size
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {size} לידים
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(activeStatusFilter !== 'הכל' ||
        dateFilter.startDate ||
        dateFilter.endDate ||
        selectedAgentId ||
        (user?.role === 'admin' && showAllLeads)) && (
        <div className="flex items-center gap-2 flex-wrap bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            מסננים פעילים:
          </span>
          {activeStatusFilter !== 'הכל' && (
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: getStatusColor(activeStatusFilter) + '30',
                color: getStatusColor(activeStatusFilter),
              }}
            >
              {activeStatusFilter}
            </span>
          )}
          {user?.role === 'admin' && showAllLeads && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              כל הלידים
            </span>
          )}
          {selectedAgentId && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {agents.find(agent => agent.id === selectedAgentId)?.name}
            </span>
          )}
          {dateFilter.startDate && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              מ-{dateFilter.startDate}
            </span>
          )}
          {dateFilter.endDate && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              עד-{dateFilter.endDate}
            </span>
          )}
          <button
            onClick={() => {
              setActiveStatusFilter('הכל');
              setDateFilter({ startDate: '', endDate: '' });
              setSelectedAgentId(null);
              if (user?.role === 'admin') {
                setShowAllLeads(false);
              }
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            נקה הכל
          </button>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {filteredLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.size === filteredLeads.length &&
                    filteredLeads.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedLeads.size === filteredLeads.length &&
                    filteredLeads.length > 0
                      ? 'בטל בחירת הכל'
                      : 'בחר הכל'}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {filteredLeads.length} לידים זמינים
                  </p>
                </div>
              </label>

              <AnimatePresence>
                {selectedLeads.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      נבחרו {selectedLeads.size}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {selectedLeads.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <button
                    onClick={() => setIsBulkMessageOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>הודעות</span>
                  </button>

                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                      onClick={() => setIsBulkAssignOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      <span>שיוך</span>
                    </button>
                  )}

                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>מחק ({selectedLeads.size})</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => handleEditLead(lead)}
            onDelete={() => handleDeleteLead(lead)}
            canEdit={canEditLead(lead)}
            canDelete={canDeleteLead(lead)}
            checkbox={
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={e => handleSelectLead(lead.id, e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </label>
            }
          />
        ))}

        {filteredLeads.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchQuery || dateFilter.startDate || dateFilter.endDate
                ? 'לא נמצאו לידים התואמים את החיפוש'
                : activeStatusFilter !== 'הכל'
                ? `לא נמצאו לידים בסטטוס ${activeStatusFilter}`
                : 'לא נמצאו לידים'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            מציג {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, totalLeads)} מתוך {totalLeads}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>הקודם</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>הבא</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <LeadFormDialog
        isOpen={isLeadDialogOpen}
        onClose={() => {
          setIsLeadDialogOpen(false);
          setSelectedLeadProp(null);
        }}
        lead={selectedLeadProp}
      />

      <CreateCustomerDialog
        isOpen={isCustomerDialogOpen}
        onClose={() => {
          setIsCustomerDialogOpen(false);
          setSelectedLeadProp(null);
        }}
        lead={selectedLeadProp}
        onSubmit={handleCustomerCreated}
      />

      <BulkMessageDialog
        isOpen={isBulkMessageOpen}
        onClose={() => {
          setIsBulkMessageOpen(false);
          setSelectedLeads(new Set());
        }}
        selectedLeads={filteredLeads.filter(lead => selectedLeads.has(lead.id))}
      />

      <BulkAssignDialog
        isOpen={isBulkAssignOpen}
        onClose={() => {
          setIsBulkAssignOpen(false);
          setSelectedLeads(new Set());
        }}
        selectedLeads={filteredLeads.filter(lead => selectedLeads.has(lead.id))}
      />
    </div>
  );
};

export default LeadManagement;
