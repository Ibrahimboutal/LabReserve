import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  LinearProgress,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Science as ScienceIcon,

} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { lab_reservations } from '@/types';

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
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReservationManagement() {
  const theme = useTheme();
  const [reservations, setReservations] = useState<any[]>([]);
  const [labreservations, setLabReservations] = useState<lab_reservations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [labsearchQuery, setLabSearchQuery] = useState('');
  const [labstatusFilter, setLabStatusFilter] = useState('');
  const [LabdateFilter, setLabDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLabFilters, setLabShowFilters] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedLabReservation, setSelectedLabReservation] = useState<any>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [detailsLabDialog, setDetailsLabDialog] = useState(false);
  const [labconfirmDialog, setLabConfirmDialog] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
  const [labActionType, setLabActionType] = useState<'approve' | 'deny' | null>(null);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [lab, setLab] = useState<any[]>([]);
  const [_users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    cancelled: 0,
    completed: 0,
    utilizationRate: '0.00', // Initialize with a string
  });
  const [labStats, setLabStats] = useState({
    labtotal: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    cancelled: 0,
    completed: 0,
    labutilizationRate: '0.00',
  });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLabData, setAnalyticsLabData] = useState<any[]>([]);

  useEffect(() => {
    const checkCompletedReservations = async () => {
      const { data: activeReservations } = await supabase
        .from('reservations')
        .select('*')
        .not('status', 'in', '(completed, cancelled, denied)');
  
      for (const reservation of activeReservations || []) {
        const endTimeUTC = parseISO(reservation.end_time);
        const currentTimeUTC = new Date();
        if (isBefore(endTimeUTC, currentTimeUTC)) {
          await supabase
            .from('reservations')
            .update({ status: 'completed' })
            .eq('id', reservation.id);
        }
      }
      
      fetchData(); // Refresh data after updates
      
      
    };
  
    fetchData();
    fetchCategories();
    fetchLabData();
    checkCompletedReservations();
    fetchAllUsers();
    const interval = setInterval(checkCompletedReservations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
  
      // Step 1: Get the current user's ID (logged-in lab manager)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      const managerId = user.id;
  
      // Step 2: Fetch labs managed by the current user
      const { data: managedLabs, error: labsError } = await supabase
        .from('lab')
        .select('id')
        .eq('manager_id', managerId); // Fetch labs where the manager_id matches the logged-in user
  
      if (labsError) throw labsError;
  
      // Extract lab IDs managed by the user
      const managedLabIds = managedLabs.map((lab: any) => lab.id);
  
      // Step 3: Fetch equipment IDs associated with the managed labs
      const { data: managedEquipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .in('lab_id', managedLabIds); // Fetch equipment where lab_id is in the managed labs
  
      if (equipmentError) throw equipmentError;
  
      // Extract equipment IDs
      const managedEquipmentIds = managedEquipment.map((eq: any) => eq.id);

      // Calculate total equipment units (sum of quantities)
      const totalEquipmentUnits = managedEquipment.reduce(
        (total, eq: any) => {
          const equipmentQuantity = eq.quantity || 1; // Default to 1 if quantity is missing
          return total + equipmentQuantity;
        },
        0
      );
      // Store equipment in state or use it directly
      setEquipment(managedEquipment);
      // Step 4: Fetch reservations for the managed equipment
      const [reservationsResponse, equipmentResponse] = await Promise.all([
        supabase
          .from('reservations')
          .select(`
            *,
            equipment (
              id,
              name,
              category,
              manufacturer,
              model,
              image_url,
              lab_id
            ),
            users (
              id,
              email,
              department,
              role
            )
          `)
          .in('equipment_id', managedEquipmentIds) // Filter reservations by managed equipment IDs
          .order('created_at', { ascending: false }),
        supabase
          .from('equipment')
          .select('*')
          .order('name'),
      ]);
  
      if (reservationsResponse.error) throw reservationsResponse.error;
      if (equipmentResponse.error) throw equipmentResponse.error;
  
      setReservations(reservationsResponse.data);
      setEquipment(equipmentResponse.data);

      
  
      // Calculate statistics
      const stats = reservationsResponse.data.reduce((acc: any, curr: any) => {
        acc.total++;
        acc[curr.status]++;
        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        cancelled: 0,
        completed: 0,
        utilizationRate: '0.00', // Initialize with a string
      });
      setStats(stats);

          // Step 5: Calculate total units reserved in completed reservations
          const totalReservedUnits = reservationsResponse.data
          .filter((r: any) => r.status === 'completed') // Only consider completed reservations
          .reduce((total: number, r: any) => {
            const reservedQuantity = r.quantity || 1; // Default to 1 if quantity is missing
            return total + reservedQuantity;
          }, 0);

          const utilizationRate =
          totalEquipmentUnits > 0
            ? Math.min((totalReservedUnits / totalEquipmentUnits) * 100, 100) // Cap at 100%
            : 0;
        
          setStats((prevStats) => ({
            ...prevStats,
            utilizationRate: utilizationRate.toFixed(2), // Store as a string with 2 decimal places
          }));

      
    
      // Prepare analytics data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), -i);
        return format(date, 'yyyy-MM-dd');
      }).reverse();
  
      const analyticsData = last7Days.map(date => {
        const dayReservations = reservationsResponse.data.filter((r: any) =>
          format(parseISO(r.created_at), 'yyyy-MM-dd') === date
        );
  
        return {
          date: format(parseISO(date), 'MMM dd'),
          total: dayReservations.length,
          approved: dayReservations.filter((r: any) => r.status === 'approved').length,
          pending: dayReservations.filter((r: any) => r.status === 'pending').length,
          completed: dayReservations.filter((r: any) => r.status === 'completed').length,
          cancelled: dayReservations.filter((r: any) => r.status === 'cancelled').length,
          denied: dayReservations.filter((r: any) => r.status === 'denied').length,
        };
      });
      setAnalyticsData(analyticsData);
  
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('category')
          .eq('status', 'operational');
  
        if (error) throw error;
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
  const fetchLabData = async () => {
    try {
      setLoading(true);
  
      // Get the current user's ID (assuming it's stored in Supabase auth session)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      const managerId = user.id;
  
      // Fetch labs managed by the current user
      const { data: managedLabs, error: labsError } = await supabase
        .from('lab')
        .select('id')
        .eq('manager_id', managerId);
  
      if (labsError) throw labsError;
  
      // Extract lab IDs managed by the user
      const managedLabIds = managedLabs.map((lab: any) => lab.id);
  
      // Fetch lab reservations for the managed labs
      const [labreservationsResponse, labResponse] = await Promise.all([
        supabase
          .from('lab_reservations')
          .select(`*,
            lab (
              id,
              name,
              location,
              image_url
            ),
            users (
              id,
              email,
              department,
              role
            )
          `)
          .in('lab_id', managedLabIds) // Filter by managed lab IDs
          .order('created_at', { ascending: false }),
        supabase
          .from('lab')
          .select('*')
          .eq('manager_id', managerId) // Fetch only labs managed by the user
          .order('name'),
      ]);
  
      if (labreservationsResponse.error) throw labreservationsResponse.error;
      if (labResponse.error) throw labResponse.error;
  
      setLabReservations(labreservationsResponse.data);
      setLab(labResponse.data);
  
      // Calculate statistics
      const labstats = labreservationsResponse.data.reduce((acc: any, curr: any) => {
        acc.labtotal++;
        acc[curr.status]++;
        return acc;
      }, {
        labtotal: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        cancelled: 0,
        completed: 0,
        labutilizationRate: '0.00',

      });
      setLabStats(labstats)

  
      // Prepare analytics data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), -i);
        return format(date, 'yyyy-MM-dd');
      }).reverse();
      const analyticsLabData = last7Days.map(date => {
        const dayReservations = labreservationsResponse.data.filter((r: any) => 
          format(parseISO(r.created_at), 'yyyy-MM-dd') === date
        );
        return {
          date: format(parseISO(date), 'MMM dd'),
          labtotal: dayReservations.length,
          approved: dayReservations.filter((r: any) => r.status === 'approved').length,
          pending: dayReservations.filter((r: any) => r.status === 'pending').length,
          completed: dayReservations.filter((r: any) => r.status === 'completed').length,
          cancelled: dayReservations.filter((r: any) => r.status === 'cancelled').length,
          denied: dayReservations.filter((r: any) => r.status === 'denied').length,
        };
      });
      setAnalyticsLabData(analyticsLabData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };
  const sendNotificationToUser = async (
      userId: string,
      createdBy: string,
      title: string,
      message: string,
      type: string
    ) => {
      try {
        const { error } = await supabase.from('notifications').insert([
          {
            id: crypto.randomUUID(),
            user_id: userId, // Send to the specific user
            created_by: createdBy,
            title,
            message,
            type,
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error('Error sending notification to user:', error.message);
      }
    };
  const handleStatusUpdate = async (reservationId: string, status: 'approved' | 'denied' | 'completed' | 'cancelled') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId);

      if (error) throw error;

      // send notification to user  
      await sendNotificationToUser(
        selectedReservation.user_id,
        'System', // Assuming the system is the one sending the notification
        `Reservation ${status}`,
        `Your reservation for ${selectedReservation.equipment.name} has been ${status}.`,
        'reservation'
      );
      fetchData();
      setConfirmDialog(false);
      setDetailsDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLabStatusUpdate = async (labreservationId: string, status: 'approved' | 'denied' | 'completed' | 'cancelled') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('lab_reservations')
        .update({ status })
        .eq('id', labreservationId);

      if (error) throw error;

      // send notification to user
      await sendNotificationToUser(
        selectedLabReservation.user_id,
        'System', // Assuming the system is the one sending the notification
        `Lab Reservation ${status}`,
        `Your lab reservation for ${selectedLabReservation.lab.name} has been ${status}.`,
        'lab_reservation'
      );
      fetchLabData();
      setLabConfirmDialog(false);
      setDetailsLabDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }   

  }

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.equipment?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.users?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.quantity?.toString().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || reservation.status === statusFilter;
    const matchesCategory = !categoryFilter || reservation.equipment?.category === categoryFilter;


    let matchesDate = true;
    if (dateFilter) {
      const reservationDate = parseISO(reservation.start_time);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = isToday(reservationDate);
          break;
        case 'tomorrow':
          matchesDate = isTomorrow(reservationDate);
          break;
        case 'upcoming':
          matchesDate = isAfter(reservationDate, now);
          break;
        case 'thisWeek':
          const nextWeek = addDays(now, 7);
          matchesDate = isAfter(reservationDate, now) && isBefore(reservationDate, nextWeek);
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate ;
  });

  const filteredLabReservations = labreservations.filter(labreservation => {
    const matcheslabSearch = 
      labreservation.lab?.name.toLowerCase().includes(labsearchQuery.toLowerCase()) ||
      labreservation.users?.email.toLowerCase().includes(labsearchQuery.toLowerCase()) ||
      labreservation.purpose?.toLowerCase().includes(labsearchQuery.toLowerCase()) ||
      labreservation.attendees?.toString().includes(labsearchQuery.toLowerCase());
    const matcheslabStatus = !labstatusFilter || labreservation.status === labstatusFilter;

    let matcheslabDate = true;
    if (LabdateFilter) {
      const labreservationDate = parseISO(labreservation.start_time);
      const now = new Date();
      switch (LabdateFilter) {
        case 'today':
          matcheslabDate = isToday(labreservationDate);
          break;
        case 'tomorrow':
          matcheslabDate = isTomorrow(labreservationDate);
          break;
        case 'upcoming':
          matcheslabDate = isAfter(labreservationDate, now);
          break;
        case 'thisWeek':
          const nextWeek = addDays(now, 7);
          matcheslabDate = isAfter(labreservationDate, now) && isBefore(labreservationDate, nextWeek);
          break;
      }
    }
    return matcheslabSearch && matcheslabStatus && matcheslabDate;
  });

  const calendarEvents = [
    ...filteredReservations.map(reservation => ({
      id: reservation.id,
      title: `${reservation.equipment?.name} - ${reservation.users?.email}`,
      start: reservation.start_time,
      end: reservation.end_time,
      allDay: false,
      backgroundColor: getEventBackgroundColor(reservation.status),
      borderColor: getEventBorderColor(reservation.status),
      textColor: getEventTextColor(reservation.status),
    })),
    ...filteredLabReservations.map(labreservation => ({
      id: labreservation.id,
      title: `${labreservation.lab?.name} - ${labreservation.users?.email}`,
      start: labreservation.start_time,
      end: labreservation.end_time,
      allDay: false,
      backgroundColor: getEventBackgroundColor(labreservation.status),
      borderColor: getEventBorderColor(labreservation.status),
      textColor: getEventTextColor(labreservation.status),
    })),
  ];
  
  function getEventBackgroundColor(status: string): string {
    switch (status) {
      case 'completed':
        return theme.palette.info.light;
      case 'cancelled':
        return theme.palette.error.light;
      case 'approved':
        return theme.palette.success.light;
      case 'pending':
        return theme.palette.warning.light;
      case 'denied':
        return theme.palette.error.light;
      default:
        return theme.palette.grey[300];
    }
  }
  
  function getEventBorderColor(status: string): string {
    switch (status) {
      case 'completed':
        return theme.palette.info.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'approved':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'denied':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  }
  
  function getEventTextColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'pending':
      case 'denied':
      case 'cancelled':
        return '#fff';
      default:
        return theme.palette.text.primary;
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'info';
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'denied':
        return 'error';
      case 'cancelled':
        return 'default';
      
      default:
        return 'default';
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
    );
  }
  return (
    <Box>
      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<AssessmentIcon />} label="Equipment" />
          <Tab icon={<ScienceIcon />} label="Lab" />
          <Tab icon={<EventIcon />} label="Calendar" />
          <Tab icon={<TimelineIcon />} label="Analytics" />
        </Tabs>
        {/* Equipment  Tab */}
        <TabPanel value={tabValue} index={0}>          
           {/* Equipment Status  Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                Equipment Reservation Status Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="info">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2">Total Equipment Reservations</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="warning.main">
                      {reservations.filter(r => r.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2">Pending</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="success.main">
                      {reservations.filter(r => r.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2">Approved</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="error.main">
                      {reservations.filter(r => r.status === 'denied').length}
                    </Typography>
                    <Typography variant="body2">Denied</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="text.secondary">
                                {reservations.filter(r => r.status === 'cancelled').length}
                    </Typography>
                    <Typography variant="body2">Cancelled</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="info.main">
                                {reservations.filter(r => r.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2">Completed</Typography>
                    </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                            Today's Reservations: {reservations.filter(r => {
                              const startDate = parseISO(r.start_time);
                              return isToday(startDate);
                            }).length}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                            Tomorrow's Reservations: {reservations.filter(r => {
                              const startDate = parseISO(r.start_time);
                              return isTomorrow(startDate);
                            }).length}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Equipment Utilization Rate
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.utilizationRate || '0.00'}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(stats.utilizationRate) || 0} // Fallback to 0 if invalid
                  color="info"
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search reservations..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>

            {showFilters && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    {/* Status Select */}
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="denied">Denied</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {/* Category Select */}
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        label="Category"
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {/* Date Select */}
                    <FormControl fullWidth size="small">
                      <InputLabel>Date</InputLabel>
                      <Select
                        value={dateFilter}
                        label="Date"
                        onChange={(e) => setDateFilter(e.target.value)}
                      >
                        <MenuItem value="">All Dates</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="tomorrow">Tomorrow</MenuItem>
                        <MenuItem value="upcoming">Upcoming</MenuItem>
                        <MenuItem value="thisWeek">This Week</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="text" 
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('');
                          setDateFilter('');
                          setStatusFilter('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
          </Paper>
          <List>
            {filteredReservations.map((reservation) => (
              <Paper key={reservation.id} sx={{ mb: 2 }}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">
                          {reservation.equipment?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Reserved by: {reservation.users?.email}
                        </Typography>
                      </Box>
                      <Chip
                        label={reservation.status}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Start:</strong> {format(parseISO(reservation.start_time), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>End:</strong> {format(parseISO(reservation.end_time), 'PPpp')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Department:</strong> {reservation.users?.department}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Equipment Category:</strong> {reservation.equipment?.category}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Quantity:</strong>{reservation.quantity}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setDetailsDialog(true);
                        }}
                        startIcon={<InfoIcon />}
                      >
                        Details
                      </Button>
                      
                      {reservation.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setActionType('approve');
                              setConfirmDialog(true);
                            }}
                            startIcon={<CheckCircleIcon />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setActionType('deny');
                              setConfirmDialog(true);
                            }}
                            startIcon={<CancelIcon />}
                          >
                            Deny
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </ListItem>

              </Paper>
            ))}
            {filteredReservations.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
              No Equipment reservations found.
            </Typography>)}
          </List>
        </TabPanel>
        {/* Lab Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Status Lab Summary */}
          <Grid item xs={12} md={6}>
            <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            Lab Reservation Status Summary
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="info">
                                {labStats.labtotal}
                              </Typography>
                              <Typography variant="body2">Total Lab Reservations</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="warning.main">
                                {labreservations.filter(r => r.status === 'pending').length}
                              </Typography>
                              <Typography variant="body2">Pending</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="success.main">
                                {labreservations.filter(r => r.status === 'approved').length}
                              </Typography>
                              <Typography variant="body2">Approved</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="error.main">
                                {labreservations.filter(r => r.status === 'denied').length}
                              </Typography>
                              <Typography variant="body2">Denied</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="text.secondary">
                                {labreservations.filter(r => r.status === 'cancelled').length}
                              </Typography>
                              <Typography variant="body2">Cancelled</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" color="info.main">
                                {labreservations.filter(r => r.status === 'completed').length}
                              </Typography>
                              <Typography variant="body2">Complated</Typography>
                            </Box>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle1" gutterBottom>
                            Today's Lab Reservation: {labreservations.filter(r => {
                              const startDate = parseISO(r.start_time);
                              return isToday(startDate);
                            }).length}
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom>
                            Tomorrow's Reservations: {labreservations.filter(r => {
                              const startDate = parseISO(r.start_time);
                              return isTomorrow(startDate);
                            }).length}
                          </Typography>
                          
                        </CardContent>
                      </Card>
          </Grid>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search Lab reservations..."
                size="small"
                value={labsearchQuery}
                onChange={(e) => setLabSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setLabShowFilters(!showLabFilters)}
              >
                {showLabFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>

            {showLabFilters && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={labstatusFilter}
                      label="Status"
                      onChange={(e) => setLabStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="denied">Denied</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={LabdateFilter}
                      label="Date"
                      onChange={(e) => setLabDateFilter(e.target.value)}
                    >
                      <MenuItem value="">All Dates</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="tomorrow">Tomorrow</MenuItem>
                      <MenuItem value="upcoming">Upcoming</MenuItem>
                      <MenuItem value="thisWeek">This Week</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="text" 
                        onClick={() => {
                          setLabSearchQuery('');
                          setLabStatusFilter('');
                          setLabDateFilter('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
          <Grid item mt={2}>
          {filteredLabReservations.length > 0 ? (
          <List>
            {filteredLabReservations.map((labreservation) => (
              <Paper key={labreservation.id} sx={{ mb: 2 }}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">
                          {labreservation.lab?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Reserved by: {labreservation.users?.email?.split('@')[0] || 'Unknown User'}
                        </Typography>
                      </Box>
                      <Chip
                        label={labreservation.status}
                        color={getStatusColor(labreservation.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Start:</strong> {format(parseISO(labreservation.start_time), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>End:</strong> {format(parseISO(labreservation.end_time), 'PPpp')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Department:</strong> {labreservation.users?.department || 'Unknown Department'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Lab Location:</strong> {labreservation.lab?.location || 'Unknown Location'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedLabReservation(labreservation);
                          setDetailsLabDialog(true);
                        }}
                        startIcon={<InfoIcon />}
                      >
                        Details
                      </Button>
                      
                      {labreservation.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => {
                              setSelectedLabReservation(labreservation);
                              setLabActionType('approve');
                              setLabConfirmDialog(true);
                            }}
                            startIcon={<CheckCircleIcon />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => {
                              setSelectedLabReservation(labreservation);
                              setActionType('deny');
                              setConfirmDialog(true);
                            }}
                            startIcon={<CancelIcon />}
                          >
                            Deny
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              </Paper>
            ))}
          </List>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
            No lab reservations found.
          </Typography>
          )}
          </Grid>
        </TabPanel>
        {/* Calendar Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventClick={(info) => {
                const reservation = reservations.find(r => r.id === info.event.id);
                if (reservation) {
                  setSelectedReservation(reservation);
                  setDetailsDialog(true);
                }
                const labreservation = labreservations.find(r => r.id === info.event.id);
                if (labreservation) {
                  setSelectedLabReservation(labreservation);
                  setDetailsLabDialog(true);
                }
              }

            }
              height="auto"
              aspectRatio={1.5}
            />
          </Paper>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={4}>
            {/* Equipment Reservation Trends */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Equipment Reservation Trends
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }} />
                    <Line type="monotone" dataKey="total" name="Total" stroke={theme.palette.primary.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" name="Approved" stroke={theme.palette.success.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" name="Pending" stroke={theme.palette.warning.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke={theme.palette.info.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke={theme.palette.error.main} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Lab Reservation Trends */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Lab Reservation Trends
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analyticsLabData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }} />
                    <Line type="monotone" dataKey="total" name="Total" stroke={theme.palette.primary.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" name="Approved" stroke={theme.palette.success.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" name="Pending" stroke={theme.palette.warning.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke={theme.palette.info.main} strokeWidth={2} />
                    <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke={theme.palette.error.main} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Equipment Usage */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Equipment Usage
                </Typography>
                {equipment.length > 0 ? (
                  <List>
                    {equipment
                      .map((item) => {
                        const itemReservations = reservations.filter(
                          (r) =>
                            r.equipment_id === item.id &&
                            ['approved', 'completed'].includes(r.status)
                        );
                        const usagePercentage =
                          stats.total > 0
                            ? (itemReservations.length  / stats.total) * 100
                            : 0;

                        return {
                          ...item,
                          reservationCount: itemReservations.length,
                          usagePercentage: Math.round(usagePercentage),
                        };
                      })
                      .filter((item) => item.reservationCount > 0)
                      .sort((a, b) => b.reservationCount - a.reservationCount)
                      .map((item) => (
                        <ListItem key={item.id} sx={{ py: 1 }}>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {item.name}
                              </Typography>
                            }
                            secondary={`${item.reservationCount} reservations`}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={`${item.usagePercentage}%`}
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.common.white,
                                fontWeight: 'bold',
                              }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: theme.palette.text.secondary }}>
                    No equipment data available.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Lab Usage */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Lab Usage
                </Typography>
                {lab.length > 0 ? (
                  <List>
                    {lab.map((item) => {
                      const itemReservations = labreservations.filter(
                        (r) =>
                          r.lab_id === item.id &&
                          ['approved', 'completed'].includes(r.status)
                      );
                      const usagePercentage =
                        labStats.labtotal > 0
                          ? (itemReservations.length / labStats.labtotal) * 100
                          : 0;
                      return (
                        <ListItem key={item.id} sx={{ py: 1 }}>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {item.name}
                              </Typography>
                            }
                            secondary={`${itemReservations.length} reservations`}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={`${Math.round(usagePercentage)}%`}
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.common.white,
                                fontWeight: 'bold',
                              }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: theme.palette.text.secondary }}>
                    No lab data available.
                  </Typography>
                )}
              </Paper>
            </Grid>


            
          </Grid>
        </TabPanel>
      </Paper>
      {/* Equipment Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReservation && (
          <>
            <DialogTitle>
              Reservation Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Equipment Information
                  </Typography>
                  <Box 
                    component="img"
                    src={selectedReservation.equipment?.image_url || 'https://picsum.photos/200/300'}
                    alt={selectedReservation.equipment?.name}
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    {selectedReservation.equipment?.name}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedReservation.equipment?.manufacturer} {selectedReservation.equipment?.model}
                  </Typography>
                  <Typography variant="body2">
                    Category: {selectedReservation.equipment?.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lab:</strong> 
                    {selectedReservation.equipment?.lab_id
                      ? lab.find(lab => lab.id === selectedReservation.equipment.lab_id)?.name || 'Unknown Lab'
                      : 'No Lab Assigned'}
                    {selectedReservation.equipment?.lab_id
                      ? ` (${lab.find(lab => lab.id === selectedReservation.equipment.lab_id)?.location || 'Unknown Location'})`
                      : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Reservation Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong>{' '}
                      <Chip 
                        label={selectedReservation.status}
                        color={getStatusColor(selectedReservation.status)}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Start Time:</strong> {format(parseISO(selectedReservation.start_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>End Time:</strong> {format(parseISO(selectedReservation.end_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Created:</strong> {format(parseISO(selectedReservation.created_at), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <Typography variant="body2">
                            <strong>Duration:</strong>
                            {
                              (() => {
                                const start = new Date(selectedReservation.start_time);
                                const end = new Date(selectedReservation.end_time);
                                let diffMs = end.getTime() - start.getTime();
                                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                diffMs -= hours * (1000 * 60 * 60);
                                const minutes = Math.floor(diffMs / (1000 * 60));
                                
                                return `${hours} hour(s), ${minutes} minute(s)`;
                              })()
                            }
                          </Typography>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Quantity:</strong> {selectedReservation.quantity}
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Email:</strong> {selectedReservation.users?.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Department:</strong> {selectedReservation.users?.department}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Role:</strong> {selectedReservation.users?.role}
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Purpose
                  </Typography>
                  <Typography variant="body2">
                    {selectedReservation.purpose}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>
                Close
              </Button>
              {selectedReservation.status === 'pending' && (
                <>
                  <Button
                    color="success"
                    variant="contained"
                    onClick={() => {
                      setActionType('approve');
                      setConfirmDialog(true);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => {
                      setActionType('deny');
                      setConfirmDialog(true);
                    }}
                  >
                    Deny
                  </Button>
                  <Button
                    color="info"
                    variant="contained"
                    onClick={() => {
                      handleStatusUpdate(selectedReservation.id, 'completed');
                    }}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* Lab Details Dialog */}
      <Dialog
        open={detailsLabDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLabReservation && (
          <>
            <DialogTitle>
              Reservation Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Lab Information
                  </Typography>
                  <Box 
                    component="img"
                    src={selectedLabReservation.lab?.image_url || 'https://picsum.photos/200/300'}
                    alt={selectedLabReservation.lab?.name}
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    {selectedLabReservation.lab?.name}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedLabReservation.lab?.location}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Reservation Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong>{' '}
                      <Chip 
                        label={selectedLabReservation.status}
                        color={getStatusColor(selectedLabReservation.status)}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Start Time:</strong> {format(parseISO(selectedLabReservation.start_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>End Time:</strong> {format(parseISO(selectedLabReservation.end_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Created:</strong> {format(parseISO(selectedLabReservation.created_at), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <Typography variant="body2">
                            <strong>Duration:</strong>
                            {
                              (() => {
                                const start = new Date(selectedLabReservation.start_time);
                                const end = new Date(selectedLabReservation.end_time);
                                let diffMs = end.getTime() - start.getTime();
                                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                diffMs -= hours * (1000 * 60 * 60);
                                const minutes = Math.floor(diffMs / (1000 * 60));
                                
                                return `${hours} hour(s), ${minutes} minute(s)`;
                              })()
                            }
                          </Typography>
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Attendees:</strong> {selectedLabReservation.attendees}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Email:</strong> {selectedLabReservation.users?.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Department:</strong> {selectedLabReservation.users?.department}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Role:</strong> {selectedLabReservation.users?.role}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Purpose
                  </Typography>
                  <Typography variant="body2">
                    {selectedLabReservation.purpose}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsLabDialog(false)}>
                Close
              </Button>
              {selectedLabReservation.status === 'pending' && (
                <>
                  <Button
                    color="success"
                    variant="contained"
                    onClick={() => {
                      setLabActionType('approve');
                      setLabConfirmDialog(true);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => {
                      setLabActionType('deny');
                      setLabConfirmDialog(true);
                    }}
                  >
                    Deny
                  </Button>
                  <Button
                    color="info"
                    variant="contained"
                    onClick={() => {
                      handleLabStatusUpdate(selectedLabReservation.id, 'completed');
                    }}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Reservation' : 'Deny Reservation'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType} this reservation?
            {actionType === 'approve' 
              ? ' The equipment will be reserved for the requested time slot.'
              : ' The user will be notified that their request was denied.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            onClick={() => {
              if (selectedReservation && actionType) {
                handleStatusUpdate(
                  selectedReservation.id,
                  actionType === 'approve' ? 'approved' : 'denied'
                );
              }
            }}
          >
            {actionType === 'approve' ? 'Approve' : 'Deny' }
          </Button>
        </DialogActions>
      </Dialog>
      {/* Lab Confirmation Dialog */}
      <Dialog
        open={labconfirmDialog}
        onClose={() => setLabConfirmDialog(false)}
      >
        <DialogTitle>
        {labActionType === 'approve' ? 'Approve Reservation' : 'Deny Reservation'}
        </DialogTitle>
        <DialogContent>
        <Typography>
            Are you sure you want to {labActionType} this lab reservation?
            {labActionType === 'approve' 
              ? ' The lab  will be reserved for the requested time slot.'
              : ' The user will be notified that their request was denied.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            color={labActionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            onClick={() => {
              if (selectedLabReservation && labActionType) {
                handleLabStatusUpdate(
                  selectedLabReservation.id,
                  labActionType === 'approve' ? 'approved' : 'denied'
                );
              }
            }}
          >
            {labActionType === 'approve' ? 'Approve' : 'Deny' }
          </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
}
