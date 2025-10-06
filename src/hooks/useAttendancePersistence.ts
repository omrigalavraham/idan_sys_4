import { useEffect } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';

/**
 * Custom hook to ensure attendance session persistence across page refreshes
 */
export const useAttendancePersistence = () => {
  const { currentSession, initializeFromStorage } = useAttendanceStore();

  useEffect(() => {
    // Function to restore session from localStorage
    const restoreSession = () => {
      const savedSession = localStorage.getItem('current_attendance_session');

      if (savedSession && !currentSession) {
        try {
          const parsedSession = JSON.parse(savedSession);

          // Validate the session data
          if (parsedSession.clockIn && parsedSession.id) {
            const clockInTime = new Date(parsedSession.clockIn);
            const now = new Date();
            const hoursDiff =
              (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

            // Only restore if session is less than 24 hours old
            if (hoursDiff < 24 && hoursDiff >= 0) {
              console.log('Restoring attendance session from localStorage');
              initializeFromStorage();
              return true;
            } else {
              console.log('Removing expired attendance session');
              localStorage.removeItem('current_attendance_session');
            }
          }
        } catch (error) {
          console.error(
            'Error parsing attendance session from localStorage:',
            error
          );
          localStorage.removeItem('current_attendance_session');
        }
      }
      return false;
    };

    // Try to restore immediately
    restoreSession();

    // Also listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_attendance_session') {
        if (e.newValue && !currentSession) {
          // Session was created in another tab
          restoreSession();
        } else if (!e.newValue && currentSession) {
          // Session was removed in another tab
          initializeFromStorage();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentSession, initializeFromStorage]);

  return { currentSession };
};
