import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { useTheme } from './hooks/useTheme';
import AppRoutes from './routes/AppRoutes';
import { useSync } from './hooks/useSync';
import NotificationSystem from './components/reminders/NotificationSystem';
import useReminders from './hooks/useReminders';
import './styles/lead-cards.css';

function App() {
  const { theme } = useTheme();
  useSync();
  const { reminders, toggleComplete } = useReminders();
  const [showNotificationFunction, setShowNotificationFunction] = useState<
    ((reminderId: string, snoozeMinutes?: number) => void) | null
  >(null);

  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Error boundary
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('App Error:', error);
      setHasError(true);
      setErrorDetails(`${error.message} at ${error.filename}:${error.lineno}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promise rejection:', event.reason);
      setHasError(true);
      setErrorDetails(`Promise rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  // iOS specific optimizations
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    // Prevent bounce scrolling
    const preventBounce = (e: TouchEvent) => {
      if (e.target === document.body) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventBounce, { passive: false });

    // Fix viewport height
    const fixViewport = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    fixViewport();
    window.addEventListener('resize', fixViewport);
    window.addEventListener('orientationchange', () => {
      setTimeout(fixViewport, 100);
    });

    return () => {
      document.removeEventListener('touchmove', preventBounce);
      window.removeEventListener('resize', fixViewport);
    };
  }, []);

  // Error screen
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white p-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">משהו השתבש</h1>
          <p className="text-base mb-5 opacity-90">{errorDetails}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-base font-semibold transition-colors"
          >
            טען מחדש
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <Toaster position="top-right" />
        <NotificationSystem
          reminders={reminders}
          onCompleteReminder={toggleComplete}
          onShowNotification={setShowNotificationFunction}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout showNotificationFunction={showNotificationFunction}>
                  <AppRoutes />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
