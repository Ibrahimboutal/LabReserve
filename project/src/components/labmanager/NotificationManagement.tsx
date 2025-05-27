import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Select,
  MenuItem,
  TablePagination,
  Grid,
  InputLabel,
  FormControl,
} from '@mui/material';
import { supabase } from '@/lib/supabase';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useNotification } from '@/hooks/useNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Notification } from '@/types';
import { LocalNotification } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationManagement() {
  const [newNotification, setNewNotification] = useState<Partial<LocalNotification> | null>(null);
  const [notifications, setNotifications] = useState<
  (LocalNotification & { users: { email: string; role: string } })[]
>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification, NotificationComponent } = useNotification();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isEditing, setIsEditing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [DialogOpen, setDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [targetUser, setTargetUser] = useState<string>('all'); // 'all' for all users, or a specific user ID
  const [users, setUsers] = useState<{
    role: string; id: string; email: string 
}[]>([]);
  const EXPIRE_HOURS = 24;

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications(); 
    subscribeToNotifications();
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, email, role');
      if (error) throw error;
      setUsers(data || []);
      return data.map((user) => user.id); // Extract user IDs
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
      return [];    }
  };

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          users: user_id(email, role)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      setError(error.message);
      showNotification(error.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          console.log('Notification change detected:', payload);

          // Validate payload
          if (!payload.new || !(payload.new as Notification).id) {
            console.warn('Invalid payload received:', payload);
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            
            // Avoid duplicates
            setNotifications((prev) => {
              const exists = prev.some(n => n.id === newNotif.id);
              if (exists) {
                console.warn('Duplicate notification skipped:', newNotif.id);
                return prev;
              }
          
              // Fetch user info if not already available
              const currentUser = prev.find(n => n.id === newNotif.id)?.users;
              if (currentUser) {
                return [{ ...newNotif, users: currentUser }, ...prev];
              }
          
              // Otherwise fetch user data
              supabase
                .from('users')
                .select('email, role')
                .eq('id', newNotif.user_id)
                .single()
                .then(({ data, error }) => {
                  if (error) throw error;
          
                  setNotifications((innerPrev) => {
                    const alreadyExists = innerPrev.some(n => n.id === newNotif.id);
                    if (alreadyExists) return innerPrev;
          
                    return [
                      {
                        ...newNotif,
                        users: { email: data?.email || '', role: data?.role || '' },
                      },
                      ...innerPrev,
                    ];
                  });
                })
                .then(() => Promise.resolve())
                .then(undefined, (err: Error) => {
                  console.error('Error fetching user data:', err.message);
                });
          
              // Temporarily add without user data until resolved
              return [
                {
                  ...newNotif,
                  users: { email: '', role: '' },
                },
                ...prev,
              ];
            });
          }  else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id
                  ? ({
                      ...payload.new,
                      users: n.users,
                    } as Notification & { users: { email: string; role: string } })
                  : n
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();
     

    return () => {
      subscription.unsubscribe();
    };
  };

  
  // Create or update a notification
  const handleCreateOrUpdateNotification = async () => {
    if (!newNotification || !user) return;
  
    // Strip out local-only fields before sending to Supabase
    const { isOptimistic, id, ...rest } = newNotification;
    // Determine who is creating the notification
  
    // Declare tempId outside the try block for scope accessibility
    const tempId = `temp-${Date.now()}`;

    try {
      let notificationsToInsert;
  
      if (targetUser === 'all') {
        // Fetch all user IDs
        const allUserIds = await fetchAllUsers();
  
        // Prepare notification data for each user
        notificationsToInsert = allUserIds.map((userId) => ({
          ...rest,
          user_id: userId, // Associate notification with each user
          read: false, // Default value for unread notifications
          created_at: new Date().toISOString(),
          created_by: newNotification.created_by || 'System', // Include the creator
        }));
      } else {
        // Prepare notification data for the specific user
        notificationsToInsert = [
          {
            ...rest,
            user_id: targetUser, // Associate notification with the selected user
            read: false, // Default value for unread notifications
            created_at: new Date().toISOString(),
            created_by: newNotification.created_by || 'System', // Include the creator

          },
        ];
      }
  
      // Optimistic update for the UI
      setNotifications((prev) => [
        {
          ...newNotification,
          id: tempId,
          isOptimistic: true,
          created_at: new Date().toISOString(),
          created_by: newNotification.created_by || 'System', // Include the creator
          users: { email: user?.email || 'System', role: user?.role || 'System' }, // Placeholder for admin/lab manager users or System-generated notifications
        } as any,
        ...prev,
      ]);
  
      let result: { data: LocalNotification[] | null; error: any } | undefined;
  
      if (isEditing && newNotification.id) {
        // Update an existing notification
        result = await supabase
          .from('notifications')
          .update({ ...rest, created_by: newNotification.created_by  })
          .eq('id', newNotification.id);
  
        if (result.error) throw result.error;
  
        setSnackbarMessage('Notification updated successfully!');
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === newNotification.id ? ({ ...n, isOptimistic: false } as any) : n
          )
        );
      } else {
        // Insert notifications
        result = await supabase.from('notifications').insert(notificationsToInsert).select();
  
        if (result.error) throw result.error;
  
        setSnackbarMessage(
          targetUser === 'all'
            ? 'Notification sent to all users successfully!'
            : 'Notification sent to the selected user successfully!'
        );
  
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === tempId && result?.data?.[0]
              ? ({ ...n, ...result.data[0], isOptimistic: false } as any)
              : n
          )
        );
      }
  
      setIsEditing(false);
      setNewNotification(null);
      setSnackbarOpen(true);
      setDialogOpen(false);
    } catch (error: any) {
      setError(error.message);
      showNotification(error.message, 'Error');
      // Rollback optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== tempId));
    }
  };

  // Handle editing a notification
  const handleEditNotification = (notification: Notification & { users: { email: string; role: string } }) => {
    setNewNotification(notification);
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Handle deleting a notification
  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    try {
      const confirmed = await confirm({
        title: 'Delete Notification',
        message: 'Are you sure you want to delete this notification?',
        confirmText: 'Delete',
        severity: 'error',
      });
      if (!confirmed) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationToDelete);
      if (error) throw error;
      setSnackbarMessage('Notification deleted successfully!');
      setSnackbarOpen(true);
      fetchNotifications();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };
  const filteredAndSortedNotifications = notifications
  .filter((n) => {
    const matchesSearch = filterText
      ? n.title.toLowerCase().includes(filterText.toLowerCase()) ||
        n.message.toLowerCase().includes(filterText.toLowerCase())
      : true;

    const matchesType = filterType ? n.type === filterType : true;
    const matchesRole = filterRole ? n.created_by === filterRole : true;

    // Apply expiration filter
    const createdDate = new Date(n.created_at);
    const expiredThreshold = new Date(Date.now() - EXPIRE_HOURS * 60 * 60 * 1000);
    const isExpired = createdDate < expiredThreshold;

    return matchesSearch && matchesType && matchesRole && !isExpired;
  })
  .sort((a, b) => {
    if (sortBy === 'created_at') {
      return sortOrder === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
    } else {
      return sortOrder === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }


   
  });



  // Notification type options
  const notificationTypes = ['Info', 'Warning', 'Error', 'Success', 'System'];
  const notificationCreator = ['admin', 'lab_manager'];
  
  const paginatedNotifications = filteredAndSortedNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );



  function truncateEmail(email: string): React.ReactNode {
    const maxLength = 20; // Maximum length before truncating
    if (email.length <= maxLength) {
      return email;
    }
    const [localPart, domain] = email.split('@');
    const truncatedLocalPart = localPart.slice(0, maxLength - domain.length - 3); // Account for "..." and domain
    return `${truncatedLocalPart}...@${domain}`;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Notification Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const createdBy = user?.role || 'System'; // Use the user's role or default to 'System'
            setNewNotification({
              title: '',
              message: '',
              type: '',
              created_by: createdBy, // Set the creator
            });
            setIsEditing(false);
            setDialogOpen(true);
          }}
        >
          Create Notification
        </Button>
      </Box>
        
        {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by Title or Message"
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>

          {/* Notification Type Filter */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Types</MenuItem>
                {notificationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* The Creator Role Filter */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>The Creator Role</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="The Creator Role"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Creators</MenuItem>
                {notificationCreator.map((createdby) => (
                  <MenuItem key={createdby} value={createdby}>
                    {createdby}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Sort Options */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Sorted by: {sortBy === 'created_at' ? 'Date' : 'Type'} ({sortOrder.toUpperCase()})
          </Typography>

          <Box>
            <Button
              variant={sortBy === 'created_at' ? 'contained' : 'outlined'}
              color={sortBy === 'created_at' ? 'primary' : 'inherit'}
              size="small"
              onClick={() => {
                setSortBy('created_at');
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              }}
              sx={{ mr: 1, fontWeight: sortBy === 'created_at' ? 'bold' : 'normal' }}
            >
              Created At {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>

            <Button
              variant={sortBy === 'type' ? 'contained' : 'outlined'}
              color={sortBy === 'type' ? 'primary' : 'inherit'}
              size="small"
              onClick={() => {
                setSortBy('type');
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              }}
              sx={{ ml: 1, fontWeight: sortBy === 'type' ? 'bold' : 'normal' }}
            >
              Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </Box>
        </Box>
      </Box>


      {/* Error Handling */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dialog for Creating/Updating Notifications */}
      <Dialog
        open={DialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewNotification(null);
          setIsEditing(false);
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',

          },
        }}
      >
        <DialogTitle>{isEditing ? 'Edit Notification' : 'Create Notification'}</DialogTitle>
        <DialogContent sx={{ p: 1, overflow: 'auto', maxHeight: '60vh', mt: 2, mb: 2, borderRadius: 2 }}>  
        
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel id="send-to-label"  sx={{ mb: 2 }}>
              Send To
            </InputLabel>
            <Select
              labelId="send-to-label"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              label="Send To"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200,
                    overflowY: 'auto',
                  },
                },
              }}
            >
              <MenuItem value="all">All Users</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {truncateEmail(user.email)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Created By"
            value={newNotification?.created_by || 'Unknown'}
            disabled
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Title"
            value={newNotification?.title || ''}
            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Message"
            value={newNotification?.message || ''}
            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Select
            value={newNotification?.type || ''}
            onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
            fullWidth
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>
              Select Notification Type
            </MenuItem>
            {notificationTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrUpdateNotification}
            color="primary"
            startIcon={isEditing ? <CheckCircleIcon /> : undefined}
            autoFocus
          >
            {isEditing ? 'Update Notification' : 'Create Notification'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Indicator */}
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Created By</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Read</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No notifications available.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>{notification.created_by || 'Unknown'}</TableCell>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>{notification.message}</TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                    <TableCell>{notification.users.email || 'Unknown'}</TableCell>
                    <TableCell>{notification.users.role || 'Unknown'}</TableCell>
                    <TableCell>{notification.read ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEditNotification(notification)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setNotificationToDelete(notification.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination outside the Table, inside TableContainer */}
          <TablePagination
            component="div"
            count={notifications.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      )}

      {/* Snackbar for Success Messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 2 }} />
            <Typography>Are you sure you want to delete this notification?</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteNotification} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <NotificationComponent />
      <ConfirmDialogComponent />
    </Box>
  );
}