import { useEffect } from 'react';
import { useSyncStore } from '../store/syncStore';
import useAuthStore from '../store/authStore';

// Custom hook for automatic synchronization
export const useSync = () => {
  const { addSyncEvent, processSyncEvents, validateDataIntegrity } = useSyncStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Start periodic data integrity checks
    const integrityInterval = setInterval(async () => {
      try {
        const isValid = await validateDataIntegrity();
        if (!isValid) {
          console.warn('Data integrity issues detected, attempting repair...');
          await useSyncStore.getState().repairDataInconsistencies();
        }
      } catch (error) {
        console.error('Error during data integrity check:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(integrityInterval);
  }, [user]);

  // Auto-sync functions
  const syncLead = (action: 'create' | 'update' | 'delete', leadId: string, data?: Record<string, unknown>) => {
    if (!user) return;
    addSyncEvent({
      type: 'lead',
      action,
      entityId: leadId,
      data: data || {},
      userId: user.id
    });
  };

  const syncCustomer = (action: 'create' | 'update' | 'delete', customerId: string, data?: Record<string, unknown>) => {
    if (!user) return;
    addSyncEvent({
      type: 'customer',
      action,
      entityId: customerId,
      data: data || {},
      userId: user.id
    });
  };

  const syncReminder = (action: 'create' | 'update' | 'delete', reminderId: string, data?: Record<string, unknown>) => {
    if (!user) return;
    addSyncEvent({
      type: 'reminder',
      action,
      entityId: reminderId,
      data: data || {},
      userId: user.id
    });
  };

  const syncTask = (action: 'create' | 'update' | 'delete', taskId: string, data?: Record<string, unknown>) => {
    if (!user) return;
    addSyncEvent({
      type: 'task',
      action,
      entityId: taskId,
      data: data || {},
      userId: user.id
    });
  };

  return {
    syncLead,
    syncCustomer,
    syncReminder,
    syncTask,
    processSyncEvents
  };
};

// Hook for monitoring sync status
export const useSyncStatus = () => {
  const { isOnline, syncInProgress, lastSync, getSystemHealth } = useSyncStore();
  
  return {
    isOnline,
    syncInProgress,
    lastSync,
    systemHealth: getSystemHealth()
  };
};