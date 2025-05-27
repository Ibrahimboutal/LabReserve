import NotificationsIcon from '@mui/icons-material/Notifications';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '../types';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Preference state
  const [preferences, setPreferences] = useState<{
    system_announcements: boolean;
    maintenance_alerts: boolean;
    reservation_updates: boolean;
    email: boolean;
  }>({ system_announcements: true, maintenance_alerts: true, reservation_updates: true, email: true });
  
  

  // Ref to always have latest preferences in subscription callback
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Filter notifications based on preferences
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Always store raw notifications
      setAllNotifications(data || []);

      // Apply filtering before setting filtered list
      if (!preferences.system_announcements && data) {
        const filtered = data.filter(
          (n) =>
            n.type !== 'System' &&
            n.type !== 'Success' &&
            n.type !== 'Error' &&
            n.type !== 'Info' &&
            n.type !== 'Warning'
        );
        setFilteredNotifications(filtered);
      } else {
        setFilteredNotifications(data || []);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification preferences for current user
  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error.message);
      return;
    }

    const prefs = {
      system_announcements: data?.system_announcements ?? true,
      maintenance_alerts: data?.maintenance_alerts ?? true,
      reservation_updates: data?.reservation_updates ?? true,
      email: data?.email ?? true,

    };

    setPreferences(prefs);
    preferencesRef.current = prefs;
  };

  // Subscribe to real-time changes in notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user) return () => {}; // Return no-op if no user

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;

          // Only add to allNotifications
          setAllNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev];
          });

          // Add to filteredNotifications only if allowed by preference
          setFilteredNotifications((prev) => {
            if (
              !preferencesRef.current.system_announcements &&
              ['System', 'Success', 'Error', 'Info', 'Warning'].includes(newNotif.type)
            ) {
              return prev;
            }

            const exists = prev.some((n) => n.id === newNotif.id);
            if (exists) return prev;

            return [newNotif, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setAllNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      setFilteredNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setFilteredNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setFilteredNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteAllNotification = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setAllNotifications([]);
      setFilteredNotifications([]);
    }
    catch (error: any) {
      setError(error.message);
    } 
  };

  // Count unread notifications
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  // Lifecycle: Load notifications & preferences + subscribe
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
      const unsubscribe = subscribeToNotifications();
      return () => {
        unsubscribe();
      };
    }
  }, [user, subscribeToNotifications]);

  // Clear existing system announcements when preference is disabled
  useEffect(() => {
    if (!preferences.system_announcements ) {
      setFilteredNotifications((prev) =>
        prev.filter((n) => !['System', 'Success', 'Error', 'Info', 'Warning', 'Equipment deleted'].includes(n.type))
      );
    }
    else {
      setFilteredNotifications(allNotifications);
    }
    if(!preferences.reservation_updates) {
      setFilteredNotifications((prev) =>
        prev.filter((n)  => !['Reservation', 'lab_reservation', 'cancelled'].includes(n.type))
      );
    }
    else {
      setFilteredNotifications(allNotifications);
    }
    if(!preferences.maintenance_alerts) {
      setFilteredNotifications((prev) =>
        prev.filter((n) => !['warning'].includes(n.type))
      );
    }
    else {
      setFilteredNotifications(allNotifications);
    }
    if(!preferences.email) {
      setFilteredNotifications((prev) =>
        prev.filter((n) => n.type !== 'Email')
      );
    }
    else {
      setFilteredNotifications(allNotifications);
    }
  }, [preferences.system_announcements, allNotifications]);

  return (
    <>
      {/* Notification Icon */}
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 'calc(100vh - 166px)',
            overflowY: 'auto',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
            
          )}
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button size="small" onClick={handleDeleteAllNotification}>
            Clear all
          </Button>
        </Box>
        <Divider />

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                }}
                onClick={() => handleMarkAsRead(notification.id)}
                button
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Button size="small" onClick={() => handleDeleteNotification(notification.id)}>
                    Delete
                  </Button>
                </Box>
                
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {format(new Date(notification.created_at), 'PPp')}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
}