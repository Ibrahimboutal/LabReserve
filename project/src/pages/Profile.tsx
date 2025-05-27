// Profile.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  LinearProgress,
  Switch,
  ListItemIcon,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Science as ScienceIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification';


const departments = [
  'Chemistry',
  'Physics',
  'Biology',
  'Engineering',
  'Computer Science',
  'Other',
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentLabActivity, setRecentLabActivity] = useState<any[]>([]);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { showNotification, NotificationComponent } = useNotification();
  const navigate = useNavigate();
  const [hasFetched, setHasFetched] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    denied: 0,
    cancelled: 0,
    completed: 0,
  });
  const [labStats, setLabStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    denied: 0,
    cancelled: 0,
    completed: 0,
  });
  const [formData, setFormData] = useState({
    email: user?.email || '',
    department: user?.department || '',
    image_url: user?.image_url || null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      reservationUpdates: true,
      maintenanceAlerts: true,
      systemAnnouncements: true,
    },
  });
  const [averageResponseTime, setAverageResponseTime] = useState<string | null>(null);
  const [labAverageResponseTime, setLabAverageResponseTime] = useState<string | null>(null);
  const [mostReservedEquipment, setMostReservedEquipment] = useState<{
    name: string;
    count: number;
  } | null>(null);

  const [mostReservedLabs, setmostReservedLabs] = useState<{
  name: string;
  count: number;
} | null>(null);
const statusToValue = {
  approved: 1,
  pending: 2,
  denied: 3,
  cancelled: 4,
  completed: 5,
};



  useEffect(() => {
    if (user && !hasFetched) {
    fetchUserData();
    fetchMostReservedEquipment();
    fetchLabStatistics();
    setHasFetched(true);
    }
    
  }, [user, hasFetched]);



// Update the fetchUserData function to include these queries
  const fetchUserData = async () => {
  if (!user) return;
  try {
    
    if (!hasFetched) setLoading(true);

    // Fetch base user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (userError) throw userError;

    // Fetch notification preferences
    const { data: prefData, error: prefError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError.message);
    }

    // Set form data using both sources
    setFormData({
      ...userData,
      notifications: {
        email: prefData?.email ?? true,
        reservationUpdates: prefData?.reservation_updates ?? true,
        maintenanceAlerts: prefData?.maintenance_alerts ?? true,
        systemAnnouncements: prefData?.system_announcements ?? true,
      },
    });

    // Fetch recent activity and statistics
    const [activityResponse, statsResponse] = await Promise.all([
      supabase
        .from('reservations')
        .select(`
          *,
          equipment (
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('reservations').select('*').eq('user_id', user.id),
    ]);

    if (activityResponse.error) throw activityResponse.error;
    if (statsResponse.error) throw statsResponse.error;

    setRecentActivity(activityResponse.data);

    // Calculate statistics
    const statistics = statsResponse.data.reduce((acc: any, curr) => {
      acc.total++;
      acc[curr.status]++;
      return acc;
    }, {
      total: 0,
      approved: 0,
      pending: 0,
      denied: 0,
      cancelled: 0,
      completed: 0,
    });
    setStats(statistics);

    // Fetch recent lab activity and statistics
    const [labActivityResponse, labStatsResponse] = await Promise.all([
      supabase
        .from('lab_reservations')
        .select(`
          *,
          lab: lab_id ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('lab_reservations').select('*').eq('user_id', user.id),
    ]);
    if (labActivityResponse.error) throw labActivityResponse.error;
    if (labStatsResponse.error) throw labStatsResponse.error;
    setRecentLabActivity(labActivityResponse.data);

    const labStatistics = labStatsResponse.data.reduce((acc: any, curr) => {
      acc.total++;
      acc[curr.status]++;
      return acc;
    }, {
      total: 0,
      approved: 0,
      pending: 0,
      denied: 0,
      cancelled: 0,
      completed: 0,
    });
    setLabStats(labStatistics);


    // Fetch average response time
    const { data: responseTimes, error: responseError } = await supabase.rpc(
      'calculate_average_response_time',
      { user_id_param: user?.id }
      
    );
    if (responseError) throw responseError;
    setAverageResponseTime(responseTimes || 'N/A');

    // Fetch lab average response time
    const { data: labResponseTimes, error: labResponseError } = await supabase.rpc(
    'calculate_lab_average_response_time',
    { user_id_param: user?.id }
    );

    if (labResponseError) throw labResponseError;

    // ✅ Handle array/object response properly
    const avgTime =
      Array.isArray(labResponseTimes) && labResponseTimes.length > 0
        ? labResponseTimes[0]?.avg_time || 'N/A'
        : 'N/A';

    setLabAverageResponseTime(avgTime);
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    setError('Failed to load user data');
  } finally {
    if (!hasFetched) setLoading(false);
  }
};

// Fetch the most reserved equipment
  const fetchMostReservedEquipment = async () => {
    
  try {
    const { data, error } = await supabase.rpc('get_most_reserved_equipment', {
      user_id_param: user?.id, // Use the correct parameter name
    });

    if (error) throw error;

    if (data && data.length > 0) {
      setMostReservedEquipment({
        name: data[0].name,
        count: data[0].reservation_count,
      });
    } else {
      setMostReservedEquipment(null);
    }
  } catch (error: any) {
    console.error('Error fetching most reserved equipment:', error.message);
    setError(error.message);
  }
};
// Fetch lab statistics
  const fetchLabStatistics = async () => {
  try {
    const { data, error } = await supabase.rpc('get_lab_statistics', {
      user_id_param: user?.id,
    });
    if (error) throw error;
    
    if (data && data.length > 0) {
      setmostReservedLabs({
        name: data[0].name,
        count: data[0].labreservation_count,
      });
    } else {
      setmostReservedLabs(null);
    }
  } catch (error: any) {
    console.error('Error fetching lab statistics:', error.message);
    setError(error.message);
  }
};

  const handleUpdateProfile = async () => {
    try {
      setHasFetched(true);
      setError(null);
      setSuccess(null);
      const { error } = await supabase
        .from('users')
        .update({
          department: formData.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
      if (error) throw error;
      setSuccess('Profile updated successfully');
      showNotification('Profile updated successfully', 'Success');
    } catch (error: any) {
      setError(error.message);
      showNotification(error.message, 'Error');
    } finally {
      setHasFetched(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setHasFetched(true);
      setError(null);
      setSuccess(null);
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });
      if (error) throw error;
      setSuccess('Password updated successfully');
      showNotification('Password updated successfully', 'Success');
      setPasswordDialog(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setError(error.message);
      showNotification(error.message, 'Error');
    } finally {
      setHasFetched(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'denied':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleSaveNotificationPreferences = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        email: formData.notifications.email,
        reservation_updates: formData.notifications.reservationUpdates,
        maintenance_alerts: formData.notifications.maintenanceAlerts,
        system_announcements: formData.notifications.systemAnnouncements,
      });
    if (error) {
      showNotification(`Failed to save preferences: ${error.message}`, 'Error');
      return;
    }
    showNotification('Notification preferences saved', 'Success');
    setNotificationDialog(false);
  };

const uploadProfileImage = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

const updateAvatarUrl = async (userId: string, imageurl: string) => {
  const { error } = await supabase
    .from('users')
    .update({  image_url: imageurl })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update avatar URL:', error.message);
  }
};

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Please log in to view your profile</Alert>
      </Container>
    );
  }

  const pieChartData = [
    { name: 'Approved', value: stats.approved, color: '#4caf50' },
    { name: 'Pending', value: stats.pending, color: '#ff9800' },
    { name: 'Denied', value: stats.denied, color: '#f44336' },
    { name: 'Cancelled', value: stats.cancelled, color: '#9e9e9e' },
    { name: 'Completed', value: stats.completed, color: '#2196f3' },
  ];
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const StatusCard = ({ title, value, color }: { title: string, value: number, color: any }) => (
    <Grid item xs={12} sm={6} md={2}>
      <Card  sx={{ height: '100%' }}>
        <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
        >
        
          <Typography color="textSecondary" gutterBottom>{title}</Typography>
          <Typography variant="h4" color={`${color}.main`}>{value}</Typography>
          <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => {navigate('/reservations');}}
          >
          Review
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
  const statusColorMap: Record<number, string> = {
    1: '#4caf50', // Approved
    2: '#ff9800', // Pending
    3: '#f44336', // Denied
    4: '#9e9e9e', // Canceled
    5: '#2196f3', // Completed
  };
  const statusLabelMap: Record<number, string> = {
    1: 'Approved',
    2: 'Pending',
    3: 'Denied',
    4: 'Canceled',
    5: 'Completed',
  };
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = data.value;
      const statusColor = statusColorMap[status];
      const statusLabel = statusLabelMap[status];

      return (
        <Box
          sx={{
            p: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: statusColor,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {format(parseISO(label), 'PPP')}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: statusColor }}>
            {data.labName ?? 'Unknown Lab'} – {statusLabel}
          </Typography>
        </Box>
      );
    }

    return null;
  };



  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, position: 'relative' }}>
            {/* Profile Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box position="relative" sx={{ display: 'inline-block' }}>
                {/* Avatar */}
                <Avatar
                  src={formData.image_url || undefined}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mr: 3,
                  }}
                >
                  {user.email[0].toUpperCase()}
                </Avatar>

                {/* Edit Icon Overlay */}
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 2,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                  aria-label="Edit profile picture"
                  role="button"
                  tabIndex={0}
                >
                  <EditIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
              </Box>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user.id) return;
                  const url = await uploadProfileImage(user.id, file);
                  if (url) {
                    setFormData((prev) => ({ ...prev, image_url: url }));
                    await updateAvatarUrl(user.id, url);
                    showNotification('Profile picture updated successfully', 'Success');
                  }
                }}
                style={{ display: 'none' }}
                aria-label="Upload profile picture"
                id="upload-profile-picture"
              />

              {/* User Info */}
              <Box>
                <Typography variant="h4" gutterBottom>
                  {user.email.split('@')[0]}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {user.email}
                </Typography>
                <Chip
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>

            {/* Quick Stats Section */}
            <Grid container spacing={2} alignItems="stretch">
              <Grid item xs={12} sm={6} md={2}>
                <Card sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Equipment Reservations
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 3 }}>
                        {stats.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Success Rate
                      </Typography>
                      <Typography variant="h5" color="info.main">
                        {stats.total
                          ? Math.round(((stats.approved + stats.completed) / stats.total) * 100)
                          : 0}
                        %
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          stats.total
                            ? ((stats.approved + stats.completed) / stats.total) * 100
                            : 0
                        }
                        color="info"
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <StatusCard title="Approved" value={stats.approved} color="success" />
              <StatusCard title="Pending" value={stats.pending} color="warning" />
              <StatusCard title="Completed" value={stats.completed} color="info" />
              <StatusCard title="Canceled" value={stats.cancelled} color="error" />
              <StatusCard title="Denied" value={stats.denied} color="secondary" />
            </Grid>

            {/* Lab Stats Section */}
            <Grid container spacing={2} alignItems="stretch" mt={1}>
              <Grid item xs={12} sm={6} md={2}>
                <Card sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Lab Reservations
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 3 }}>
                        {labStats.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Success Rate
                      </Typography>
                      <Typography variant="h5" color="info.main">
                        {labStats.total
                          ? Math.round(((labStats.approved + labStats.completed) / labStats.total) * 100)
                          : 0}
                        %
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          labStats.total
                            ? ((labStats.approved + labStats.completed) / labStats.total) * 100
                            : 0
                        }
                        color="info"
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <StatusCard title="Approved" value={labStats.approved} color="success" />
              <StatusCard title="Pending" value={labStats.pending} color="warning" />
              <StatusCard title="Completed" value={labStats.completed} color="info" />
              <StatusCard title="Canceled" value={labStats.cancelled} color="error" />
              <StatusCard title="Denied" value={labStats.denied} color="secondary" />
            </Grid>

            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab icon={<SettingsIcon />} label="Settings" />
                <Tab icon={<HistoryIcon />} label="Equipment Activity" />
                <Tab icon={<HistoryIcon />} label="Lab Activity" />
                <Tab icon={<ScienceIcon />} label="Statistics" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Email"
                    value={formData.email}
                    disabled
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    select
                    label="Department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </TextField>
                  {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                  {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Security & Notifications
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<SecurityIcon />}
                      onClick={() => setPasswordDialog(true)}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<NotificationsIcon />}
                      onClick={() => setNotificationDialog(true)}
                      fullWidth
                    >
                      Notification Preferences
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Recent Equipment Activity
              </Typography>
              <List>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ListItem key={activity.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">Reserved {activity.equipment.name}</Typography>
                            <Chip label={activity.status} size="small" color={getStatusColor(activity.status)} />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {format(parseISO(activity.created_at), 'PPpp')}
                            </Typography>
                            <Typography variant="body2">
                              {format(parseISO(activity.start_time), 'PPp')} -{' '}
                              {format(parseISO(activity.end_time), 'p')}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No recent activity"
                      secondary="Your reservation history will appear here"
                    />
                  </ListItem>
                )}
              </List>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => navigate('/reservations')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View All Activity
              </Button>
            </TabPanel>

            {/* Lab Activity Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Recent Lab Activity
              </Typography>
              <List>
                {recentLabActivity.length > 0 ? (
                  recentLabActivity.map((labactivity) => (
                    <ListItem key={labactivity.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">Reserved {labactivity.lab.name}</Typography>
                            <Chip label={labactivity.status} size="small" color={getStatusColor(labactivity.status)} />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {format(parseISO(labactivity.created_at), 'PPpp')}
                            </Typography>
                            <Typography variant="body2">
                              {format(parseISO(labactivity.start_time), 'PPp')} -{' '}
                              {format(parseISO(labactivity.end_time), 'p')}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No recent lab activity"
                      secondary="Your lab reservation history will appear here"
                    />
                  </ListItem>
                )}
              </List>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => navigate('/reservations')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View All Lab Activity
              </Button>
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                {/* Reservation Distribution */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Equipment Reservation Distribution
                    </Typography>
                    <Box sx={{ height: 300, mb: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                            labelLine={false}
                            animationDuration={500}
                            animationEasing="ease-in-out"
                            isAnimationActive={true}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>

                {/* Status Breakdown */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Equipment Reservation Status Breakdown
                    </Typography>
                    <List>
                      {pieChartData.map((entry, index) => (
                        <ListItem key={`status-${index}`}>
                          <ListItemIcon>
                            <Chip label={entry.name} size="small" sx={{ bgcolor: entry.color, color: "white" }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${entry.value} (${Math.round((entry.value / stats.total) * 100)}%)`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>

                {/* Lab Usage Trend Chart */}
                <Grid item xs={12} md={12} mt={3}>
                  <Card sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Lab Usage Trend (Last 7 Days)
                    </Typography>
                    <Box sx={{ height: 350, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={recentLabActivity
                            .filter((labactivity) => {
                              const activityDate = parseISO(labactivity.created_at);
                              const sevenDaysAgo = new Date();
                              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                              return activityDate >= sevenDaysAgo;
                            })
                            .map((labactivity) => ({
                              date: labactivity.created_at,
                              status: labactivity.status,
                              value:
                                statusToValue[(labactivity.status as keyof typeof statusToValue)] || 0,
                              labName: labactivity.lab?.name || 'Unknown Lab',
                            }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            type="category"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(unixTime) => {
                              try {
                                const date = parseISO(unixTime);
                                if (isNaN(date.getTime())) return '';
                                return format(date, 'MMM d hh:mm a');
                              } catch {
                                return '';
                              }
                            }}
                            interval={1}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            type="number"
                            domain={[1, 5]}
                            ticks={[1, 2, 3, 4, 5]}
                            tickFormatter={(tick: number) => {
                              const statusMap: Record<number, string> = {
                                1: 'Approved',
                                2: 'Pending',
                                3: 'Denied',
                                4: 'Canceled',
                                5: 'Completed',
                              };
                              return statusMap[tick] || '';
                            }}
                            interval={0}
                            width={100}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#ccc"
                            dot={(props) => {
                              const { cx, cy, payload } = props as { cx: number; cy: number; payload: any };
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={6}
                                  stroke="#fff"
                                  strokeWidth={2}
                                  fill={statusColorMap[payload.value]}
                                />
                              );
                            }}
                            activeDot={(props: any) => {
                              const { cx, cy, payload } = props as { cx: number; cy: number; payload: any };
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={8}
                                  stroke="#000"
                                  strokeWidth={2}
                                  fill={statusColorMap[payload.value]}
                                />
                              );
                            }}
                            strokeDasharray="3 3"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Status Legend */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, mt: 2 }}>
                      {Object.entries({
                        Approved: '#4caf50',
                        Pending: '#ff9800',
                        Denied: '#f44336',
                        Canceled: '#9e9e9e',
                        Completed: '#2196f3',
                      }).map(([status, color]) => (
                        <Chip key={status} label={status} size="small" sx={{ bgcolor: color, color: 'white' }} />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Last 7 Days ({format(new Date(Date.now() - 604800000), 'MMM d hh:mm a')} –{' '}
                      {format(new Date(), 'MMM d hh:mm a')})
                    </Typography>
                  </Card>
                </Grid>

                {/* Usage Statistics Grid */}
                <Grid container spacing={3} mt={2}>
                  {/* Equipment Statistics */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', boxShadow: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Equipment Usage Statistics
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters>
                          <ListItemText
                            primary="Success Rate"
                            secondary={`${stats.total ? Math.round(((stats.approved + stats.completed) / stats.total) * 100) : 0}% of your reservations are approved or completed.`}
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemText
                            primary="Average Response Time"
                            secondary={averageResponseTime || "Data not available"}
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon>
                            <ScienceIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Most Reserved Equipment"
                            secondary={
                              mostReservedEquipment
                                ? `${mostReservedEquipment.name} (${mostReservedEquipment.count} times)`
                                : "No data available"
                            }
                          />
                        </ListItem>
                      </List>
                    </Card>
                  </Grid>

                  {/* Lab Statistics */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', boxShadow: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Lab Usage Statistics
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters>
                          <ListItemText
                            primary="Lab Success Rate"
                            secondary={`${labStats.total ? Math.round((labStats.approved + labStats.completed) / labStats.total * 100) : 0}% of your lab reservations are approved or completed.`}
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemText
                            primary="Lab Average Response Time"
                            secondary={labAverageResponseTime || "Data not available"}
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon>
                            <ScienceIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Most Reserved Lab"
                            secondary={
                              mostReservedLabs
                                ? `${mostReservedLabs.name} (${mostReservedLabs.count} times)`
                                : "No lab reservation history"
                            }
                          />
                        </ListItem>
                      </List>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
      </Grid>
      </Grid>
      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={formData.currentPassword}
            onChange={(e) =>
              setFormData({ ...formData, currentPassword: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={formData.newPassword}
            onChange={(e) =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
      {/* Notification Preferences Dialog */}
      <Dialog open={notificationDialog} onClose={() => setNotificationDialog(false)}>
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <Switch
                checked={formData.notifications.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      email: e.target.checked,
                    },
                  })
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Reservation Updates"
                secondary="Get notified about changes to your reservations"
              />
              <Switch
                checked={formData.notifications.reservationUpdates}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      reservationUpdates: e.target.checked,
                    },
                  })
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Maintenance Alerts"
                secondary="Receive alerts about equipment maintenance"
              />
              <Switch
                checked={formData.notifications.maintenanceAlerts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      maintenanceAlerts: e.target.checked,
                    },
                  })
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="System Announcements"
                secondary="Get important system updates and announcements"
              />
              <Switch
                checked={formData.notifications.systemAnnouncements}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      systemAnnouncements: e.target.checked,
                    },
                  })
                }
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNotificationPreferences}>
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
      {/* Notification Component */}
      {NotificationComponent()}
    </Container>
  );
}
