import { useState, useCallback } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';
import { NotificationState } from '@/types';



export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'Info',
  });

  const showNotification = useCallback((message: string, severity: NotificationState['severity'] = 'Info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  }, []);

  const NotificationComponent = useCallback(() => (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={hideNotification} severity={notification.severity.toLowerCase() as AlertColor}>
        {notification.message}
      </Alert>
    </Snackbar>
  ), [notification, hideNotification]);

  return {
    showNotification,
    hideNotification,
    NotificationComponent,
  };
}