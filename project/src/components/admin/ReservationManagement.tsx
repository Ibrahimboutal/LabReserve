import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Pagination,
  Tabs,
  Tab,
  Grid,
  Divider,
  Card,
  CardContent,
  List
} from '@mui/material';
import { format, parseISO, isToday, isTomorrow, isAfter, isBefore, addDays, endOfDay, startOfDay } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import { Reservation } from '@/types';
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [labreservation, setLabReservation] = useState<lab_reservations[]>([]);
  const [filteredLabReservations, setFilteredLabReservations] = useState<lab_reservations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labsearchQuery, setlabSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [labstatusFilter, setlabStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [labdateFilter, setlabDateFilter] = useState<string>('');
  const [labFilter, setLabFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showlabFilters, setlabShowFilters] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [labdetailsDialog, setLabDetailsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedlabReservation, setSelectedlabReservation] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [labconfirmDialog, setLabConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
  const [labactionType, setLabActionType] = useState<'approve' | 'deny' | null>(null);
  const [page, setPage] = useState(1);
  const [labPage, setLabPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [labs, setLabs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [labactionLoading, setLabActionLoading] = useState(false);
  const [_users, setUsers] = useState<any[]>([]);
  const rowsPerPage = 10; // Number of rows per page

  useEffect(() => {
    fetchReservations();
    fetchLabReservation();
    fetchLabs();
  }, []);

  useEffect(() => {
    applyFilters();
    applyLabFilters();
    fetchAllUsers();

  }, [labreservation, reservations, searchQuery, statusFilter, dateFilter, labFilter, labdateFilter, labstatusFilter, labsearchQuery]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          equipment (
            id,
            name,
            category,
            status,
            lab_id,
            manufacturer,
            model,
            image_url
          ),
          users (
            id,
            email,
            department,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data);
      setFilteredReservations(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchLabReservation = async () => {
    try {
      const { data: labReservations, error: labError } = await supabase
        .from('lab_reservations')
        .select(`*,
          lab (
            id,
            name,
            location,
            status,
            image_url
            ),
          users (
            id,
            email,
            department,
            role
          ) `)
        .order('created_at', { ascending: false });
        
  
      if (labError) throw labError;
  
      // Fetch related labs
      const labIds = labReservations.map((lr) => lr.lab_id);
      const { data: labs, error: labFetchError } = await supabase
        .from('lab')
        .select('*')
        .in('id', labIds);
  
      if (labFetchError) throw labFetchError;
  
      // Fetch related users
      const userIds = labReservations.map((lr) => lr.user_id);
      const { data: users, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
  
      if (userFetchError) throw userFetchError;
  
      // Combine data
      const enrichedReservations = labReservations.map((lr) => ({
        ...lr,
        lab: labs.find((l) => l.id === lr.lab_id),
        user: users.find((u) => u.id === lr.user_id),
      }));
  
      setLabReservation(enrichedReservations);
      setFilteredLabReservations(enrichedReservations);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from('lab')
        .select('*')
        .order('name');

      if (error) throw error;
      setLabs(data);
    } catch (error: any) {
      console.error('Error fetching labs:', error);
    }
  };
  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
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
  

  const applyFilters = () => {
    let filtered = [...reservations];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reservation: any) =>
          reservation.equipment?.name.toLowerCase().includes(query) ||
          reservation.users?.email.toLowerCase().includes(query) ||
          reservation.purpose?.toLowerCase().includes(query) ||
          reservation.equipment?.category.toLowerCase().includes(query)||
          reservation.quantity.toString().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((reservation) => reservation.status === statusFilter);
    }

    // Apply lab filter
    if (labFilter) {
      filtered = filtered.filter((reservation) => reservation.equipment_id === labFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter((reservation) => {
            const startDate = parseISO(reservation.start_time);
            return isToday(startDate);
          });
          break;
        case 'tomorrow':
          filtered = filtered.filter((reservation) => {
            const startDate = parseISO(reservation.start_time);
            return isTomorrow(startDate);
          });
          break;
        case 'upcoming':
          filtered = filtered.filter((reservation) => {
            const startDate = parseISO(reservation.start_time);
            return isAfter(startDate, today);
          });
          break;
        case 'past':
          filtered = filtered.filter((reservation) => {
            const endDate = parseISO(reservation.end_time);
            return isBefore(endDate, today);
          });
          break;
        case 'thisWeek':
          const nextWeek = addDays(today, 7);
          filtered = filtered.filter((reservation) => {
            const startDate = parseISO(reservation.start_time);
            return isAfter(startDate, today) && isBefore(startDate, nextWeek);
          });
          break;
      }
      
    }
    

    setFilteredReservations(filtered);
    setPage(1); // Reset to first page when filters change
  };
  const applyLabFilters = () => {
    let flabiltered = [...labreservation];

    // Apply search filter
    if (labsearchQuery) {
      const query = labsearchQuery.toLowerCase();
      flabiltered = flabiltered.filter(
        (labreservation: any) =>
            labreservation.lab?.name.toLowerCase().includes(query) ||
            labreservation.users?.email.toLowerCase().includes(query) ||
            labreservation.purpose?.toLowerCase().includes(query) ||
            labreservation.attendees?.toString().includes(query)
      );
    }

    // Apply status filter
    if (labstatusFilter) {
      flabiltered = flabiltered.filter((labreservation) => labreservation.status === labstatusFilter);
    }

    

    // Apply date filter
    if (labdateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (labdateFilter) {
        case 'today':
          flabiltered = flabiltered.filter((labreservation) => {
            const startDate = parseISO(labreservation.start_time);
            return isToday(startDate);
          });
          break;
        case 'tomorrow':
          flabiltered = flabiltered.filter((labreservation) => {
            const startDate = parseISO(labreservation.start_time);
            return isTomorrow(startDate);
          });
          break;
        case 'upcoming':
          flabiltered = flabiltered.filter((labreservation) => {
            const startDate = parseISO(labreservation.start_time);
            return isAfter(startDate, today);
          });
          break;
        case 'past':
          flabiltered = flabiltered.filter((labreservation) => {
            const endDate = parseISO(labreservation.end_time);
            return isBefore(endDate, today);
          });
          break;
        case 'thisWeek':
          const nextWeek = addDays(today, 7);
          flabiltered = flabiltered.filter((labreservation) => {
            const startDate = parseISO(labreservation.start_time);
            return isAfter(startDate, today) && isBefore(startDate, nextWeek);
          });
          break;
      }
      
    }
    

    setFilteredLabReservations(flabiltered);
    setLabPage(1); // Reset to first page when filters change
  };
  const handleStatusUpdate = async (reservationId: string, status: 'approved' | 'denied') => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('reservations')
        .update({ 
        status, 
        updated_at: new Date().toISOString() // Add the current timestamp
      })
        .eq('id', reservationId);

      if (error) throw error;
      
      // Update local state
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === reservationId 
          ? { ...reservation, status, updated_at: new Date().toISOString() } // Update local state with new timestamp

            : reservation
        )
      );
      
      setConfirmDialog(false);
      setDetailsDialog(false);
      setActionType(null);

      // send notification to user  
      await sendNotificationToUser(
        selectedReservation.user_id,
        'System', // Assuming the system is the one sending the notification
        `Reservation ${status}`,
        `Your reservation for ${selectedReservation.equipment.name} has been ${status}.`,
        'reservation'
      );
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };
  const handleLabStatusUpdate = async (labreservationId: string, status: 'approved' | 'denied') => {
    try {
      setLabActionLoading(true);
      const { error } = await supabase
        .from('lab_reservations')
        .update({ status })
        .eq('id', labreservationId);
      if (error) throw error;
  
      // Update local state
      setLabReservation(prevLabReservations =>
        prevLabReservations.map(labreservation =>
          labreservation.id === labreservationId
            ? { ...labreservation, status }
            : labreservation
        )
      );
      setLabConfirmDialog(false);
      setLabDetailsDialog(false);
      setLabActionType(null);
      // send notification to user
      await sendNotificationToUser(
        selectedlabReservation.user_id,
        'System',
        `Lab Reservation ${status}`,
        `Your lab reservation for ${selectedlabReservation.lab.name} has been ${status}.`,
        'lab_reservation'
      );
    } catch (error: any) {
      console.error('Error updating lab reservation:', error);
      setError(error.message);
    } finally {
      setLabActionLoading(false);
    }
  };
  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setDetailsDialog(true);
  };
  const handleViewlabDetails = (labreservation: any) => {
    setSelectedlabReservation(labreservation);
    setLabDetailsDialog(true);
  };
  const handleConfirmAction = (reservation: any, action: 'approve' | 'deny') => {
    setSelectedReservation(reservation);
    setActionType(action);
    setConfirmDialog(true);
  };
  const handleLabConfirmAction = (labreservation: any, action: 'approve' | 'deny') => {
    setSelectedlabReservation(labreservation);
    setLabActionType(action);
    setLabConfirmDialog(true);
  };
  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (status) {
      case 'pending':
        color = 'warning';
        break;
      case 'approved':
        color = 'success';
        break;
      case 'denied':
        color = 'error';
        break;
      case 'cancelled':
        color = 'default';
        break;
      case 'completed':
        color = 'info';
        break;
      default:
    }
    
    return <Chip label={status} color={color} size="small" />;
  };
  const handleChangePage = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  const handleChangeLabPage = (_: React.ChangeEvent<unknown>, value: number) => {
    setLabPage(value);
  }
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const calendarEvents = [
    ...filteredReservations.map((reservation: any) => ({
      id: reservation.id,
      title: `${reservation.equipment?.name} (${reservation.users?.email.split('@')[0]})`,
      start: reservation.start_time,
      end: reservation.end_time,
      extendedProps: {
        type: 'equipment',
        status: reservation.status,
        equipment: reservation.equipment,
        user: reservation.users,
        purpose: reservation.purpose,
      },
      backgroundColor: reservation.status === 'approved' 
        ?'#4caf50'
        : reservation.status === 'pending'
        ? '#ff9800'
        : reservation.status === 'denied'
        ? '#e53935'
        : reservation.status === 'cancelled'
        ? '#9e9e9e'
        : reservation.status === 'completed'
        ? '#1e88e5'
        : '#ff9800',
      borderColor: reservation.status === 'approved' 
        ?'#4caf50'
        : reservation.status === 'pending'
        ? '#ff9800'
        : reservation.status === 'denied'
        ? '#e53935'
        : reservation.status === 'cancelled'
        ? '#9e9e9e'
        : reservation.status === 'completed'
        ? '#1e88e5'
        : '#ff9800',



    })),
    ...filteredLabReservations.map((labreservation: any) => ({
      id: labreservation.id,
      title: `${labreservation.lab?.name} (${labreservation.user?.email.split('@')[0]})`,
      start: labreservation.start_time,
      end: labreservation.end_time,
      extendedProps: {
        type: 'lab',
        status: labreservation.status,
        lab: labreservation.lab,
        user: labreservation.user,
        purpose: labreservation.purpose,
      },
      backgroundColor: labreservation.status === 'approved'
        ? '#4caf50'
        : labreservation.status === 'pending'
        ? '#ff9800'
        : labreservation.status === 'denied'
        ? '#e53935'
        : labreservation.status === 'cancelled'
        ? '#9e9e9e'
        : labreservation.status === 'completed'
        ? '#1e88e5'
        : '#ff9800',

      borderColor: labreservation.status === 'approved' 
       ?'#2e7d32'
        : labreservation.status === 'pending'
        ? '#e65100'
        : labreservation.status === 'denied'
        ? '#c62828'
        : labreservation.status === 'cancelled'
        ? '#616161'
        : labreservation.status === 'completed'
        ? '#1976d2'
        : '#e65100',
      

    })),
  ];
  const handleEventClick = (info: any) => {
    const { extendedProps } = info.event;
    if (extendedProps.type === 'equipment') {
      const reservation = reservations.find((r: any) => r.id === info.event.id);
      if (reservation) {
        setSelectedReservation(reservation);
        setDetailsDialog(true);
      }
    } else if (extendedProps.type === 'lab') {
      const labReservation = labreservation.find((lr: any) => lr.id === info.event.id);
      if (labReservation) {
        setSelectedlabReservation(labReservation);
        setLabDetailsDialog(true);
      }
    }
  };
  if (loading && reservations.length === 0) {
    return <CircularProgress />;
  }
  if (loading && labreservation.length === 0) {
    return <CircularProgress />;
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  // Calculate pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);
  const pageCount = Math.ceil(filteredReservations.length / rowsPerPage);
  // Calculate lab pagination
  const stratLabIndex =(labPage -1) * rowsPerPage;
  const endLabIndex = stratLabIndex + rowsPerPage;
  const paginatedLabReservations = filteredLabReservations.slice(stratLabIndex, endLabIndex);
  const labPageCount = Math.ceil(filteredLabReservations.length / rowsPerPage);

  const getLabUtilization = (labs: any[], labReservations: any[]) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return labs.map((lab) => {
    // Ensure lab.id is string/number consistent with lab_reservations.lab_id
    const labId = String(lab.id); // normalize to string

    // Filter approved reservations for this lab
    const labReservationsForLab = labReservations.filter(
      (lr) => String(lr.lab_id) === labId && lr.status === 'approved'
    );

    // Count today's reservations
    const todaysReservations = labReservationsForLab.filter((lr) => {
      const reservationDate = parseISO(lr.start_time);
      return reservationDate >= todayStart && reservationDate <= todayEnd;
    });

    return {
      ...lab,
      activeReservations: labReservationsForLab.length,
      todaysReservations: todaysReservations.length,
    };
  });
};
  const labUtilizationData = getLabUtilization(labs, labreservation);


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Reservation Management
        </Typography>
      </Box>

      {/* View Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="reservation view tabs">
          <Tab label="Equipment Reservation" />
          <Tab label="Lab Reservations" />
          <Tab label="Calendar View" icon={<EventIcon />} iconPosition="start" />
          <Tab label="Dashboard" />
        </Tabs>
      </Box>

      {/* Equipment Reservation */}
      <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Equipment Reservation Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
          </Box>
         {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            placeholder="Search by equipment, user, quantity, or purpose..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: showFilters ? 2 : 0 }}
          />

          {showFilters && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="denied">Denied</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Date"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="">All Dates</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="tomorrow">Tomorrow</MenuItem>
                      <MenuItem value="thisWeek">This Week</MenuItem>
                      <MenuItem value="upcoming">All Upcoming</MenuItem>
                      <MenuItem value="past">Past</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Laboratory</InputLabel>
                    <Select
                      value={labFilter}
                      label="Laboratory"
                      onChange={(e) => setLabFilter(e.target.value)}
                    >
                      <MenuItem value="">All Laboratories</MenuItem>
                      {labs.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="text" 
                  color="secondary" 
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setDateFilter('');
                    setLabFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {paginatedReservations.length > 0 ? (
                paginatedReservations.map((reservation: any) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {reservation.users?.email.split('@')[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reservation.users?.department} • {reservation.users?.role}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {reservation.equipment?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reservation.equipment?.category} • {reservation.labs?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(reservation.start_time), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(reservation.end_time), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {reservation.quantity}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(reservation.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(reservation)}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {reservation.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => handleConfirmAction(reservation, 'approve')}
                              startIcon={<CheckCircleIcon />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleConfirmAction(reservation, 'deny')}
                              startIcon={<CancelIcon />}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="subtitle1" sx={{ py: 2 }}>
                      No reservations found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filter criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={pageCount} 
              page={page} 
              onChange={handleChangePage} 
              color="primary" 
            />
          </Box>
        )}
      </TabPanel>

        {/* Lab Reservation */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Lab Reservation Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setlabShowFilters(!showlabFilters)}
        >
          Filters
        </Button>
          </Box>
         {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            placeholder="Search by lab, user, attendees, or purpose..."
            variant="outlined"
            size="small"
            fullWidth
            value={labsearchQuery}
            onChange={(e) => setlabSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: showlabFilters ? 2 : 0 }}
          />

          {showlabFilters && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={labstatusFilter}
                      label="Status"
                      onChange={(e) => setlabStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="denied">Denied</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={labdateFilter}
                      label="Date"
                      onChange={(e) => setlabDateFilter(e.target.value)}
                    >
                      <MenuItem value="">All Dates</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="tomorrow">Tomorrow</MenuItem>
                      <MenuItem value="thisWeek">This Week</MenuItem>
                      <MenuItem value="upcoming">All Upcoming</MenuItem>
                      <MenuItem value="past">Past</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Laboratory</InputLabel>
                    <Select
                      value={labFilter}
                      label="Laboratory"
                      onChange={(e) => setLabFilter(e.target.value)}
                    >
                      <MenuItem value="">All Laboratories</MenuItem>
                      {labs.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="text" 
                  color="secondary" 
                  size="small"
                  onClick={() => {
                    setlabSearchQuery('');
                    setlabStatusFilter('');
                    setlabDateFilter('');
                    setLabFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Lab</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLabReservations.length > 0 ? (
                paginatedLabReservations.map((labreservation: any) => (
                  <TableRow key={labreservation.id}>
                    <TableCell>
                      <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {labreservation.user?.email?.split('@')[0] || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {labreservation.user?.department || 'Unknown Department'}{' '}
                        {labreservation.user?.role || 'Unknown Role'}
                      </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {labreservation.lab?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {labreservation.lab?.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(labreservation.start_time), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(labreservation.end_time), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(labreservation.status)}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewlabDetails(labreservation)}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {labreservation.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => handleLabConfirmAction(labreservation, 'approve')}
                              startIcon={<CheckCircleIcon />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleLabConfirmAction(labreservation, 'deny')}
                              startIcon={<CancelIcon />}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="subtitle1" sx={{ py: 2 }}>
                      No lab reservations found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filter criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      {/* Pagination */}
      {labPageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={labPageCount} 
            page={labPage} 
            onChange={handleChangeLabPage} 
            color="primary" 
          />
        </Box>
      )}
      </TabPanel>

      {/* Calendar View */}
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
            eventClick={handleEventClick } 
            height="auto"
            aspectRatio={1.5}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
          />

        </Paper>
      </TabPanel>

      {/* Dashboard View */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Equipment Status  Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Equipment Reservation Status Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
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
                    <Typography variant="h4" color="text.secondary">
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
              </CardContent>
            </Card>
          </Grid>
          {/* Status Lab Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Lab Reservation Status Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="warning.main">
                      {labreservation.filter(r => r.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2">Pending</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="success.main">
                      {labreservation.filter(r => r.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2">Approved</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="error.main">
                      {labreservation.filter(r => r.status === 'denied').length}
                    </Typography>
                    <Typography variant="body2">Denied</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="text.secondary">
                      {labreservation.filter(r => r.status === 'cancelled').length}
                    </Typography>
                    <Typography variant="body2">Cancelled</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h4" color="text.secondary">
                      {labreservation.filter(r => r.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2">Complated</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Today's Lab Reservation: {labreservation.filter(r => {
                    const startDate = parseISO(r.start_time);
                    return isToday(startDate);
                  }).length}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Tomorrow's Reservations: {labreservation.filter(r => {
                    const startDate = parseISO(r.start_time);
                    return isTomorrow(startDate);
                  }).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Recent Pending Reservations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Recent Pending Equipment Reservations
                </Typography>
                <List>
                  {reservations
                    .filter(r => r.status === 'pending')
                    .slice(0, 5)
                    .map((reservation, index) => (
                      <Box key={reservation.id}>
                        <Box sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {reservation.equipment?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(reservation.created_at), 'PPp')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Requested by: {reservation.users?.email}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {format(parseISO(reservation.start_time), 'PPp')} - {format(parseISO(reservation.end_time), 'p')}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleConfirmAction(reservation, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleConfirmAction(reservation, 'deny')}
                            >
                              Deny
                            </Button>
                          </Box>
                        </Box>
                        {index < Math.min(reservations.filter(r => r.status === 'pending').length, 5) - 1 && <Divider />}
                      </Box>
                    ))}
                  {reservations.filter(r => r.status === 'pending').length === 0 && (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No pending reservations
                      </Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          {/* Recent Pending Lab Reservations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Recent Pending Lab Reservations
                </Typography>
                <List>
                  {labreservation
                    .filter(r => r.status === 'pending')
                    .slice(0, 5)
                    .map((labreservation, index) => (
                      <Box key={labreservation.id}>
                        <Box sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {labreservation.lab?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(labreservation.created_at), 'PPp')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Requested by: {labreservation.users?.email}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {format(parseISO(labreservation.start_time), 'PPp')} - {format(parseISO(labreservation.end_time), 'p')}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleLabConfirmAction(labreservation, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleLabConfirmAction(labreservation, 'deny')}
                            >
                              Deny
                            </Button>
                          </Box>
                        </Box>
                        {index < Math.min(filteredLabReservations.filter(r => r.status === 'pending').length, 5) - 1 && <Divider />}
                      </Box>
                    ))}
                  {labreservation.filter(r => r.status === 'pending').length === 0 && (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No pending lab reservations
                      </Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          {/* Lab Utilization */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Laboratory Utilization
              </Typography>
              <Grid container spacing={2}>
                {labUtilizationData.map((lab) => (
                  <Grid item xs={12} sm={6} md={4} key={lab.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {lab.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {lab.location}
                      </Typography>
                      <Typography variant="body2">
                        Active Reservations: {lab.activeReservations}
                      </Typography>
                      <Typography variant="body2">
                        Today's Reservations: {lab.todaysReservations}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </TabPanel>

      {/* Reservation Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReservation && (
          <>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Equipment Information
                  </Typography>
                  <Box 
                    component="img"
                    src={selectedReservation.equipment?.image_url || 'https://picsum.photos/200/300'}
                    alt={selectedReservation.equipment?.name}
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                  />
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedReservation.equipment?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedReservation.equipment?.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Manufacturer:</strong> {selectedReservation.equipment?.manufacturer}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Model:</strong> {selectedReservation.equipment?.model}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedReservation.equipment?.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lab:</strong> 
                    {selectedReservation.equipment?.lab_id
                      ? labs.find(lab => lab.id === selectedReservation.equipment.lab_id)?.name || 'Unknown Lab'
                      : 'No Lab Assigned'}
                    {selectedReservation.equipment?.lab_id
                      ? ` (${labs.find(lab => lab.id === selectedReservation.equipment.lab_id)?.location || 'Unknown Location'})`
                      : ''}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    User Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedReservation.users?.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedReservation.users?.department}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Role:</strong> {selectedReservation.users?.role}
                    </Typography>
                  </Paper>

                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Reservation Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        <strong>Status:</strong>
                      </Typography>
                      {getStatusChip(selectedReservation.status)}
                    </Box>
                    <Typography variant="body2">
                      <strong>Created:</strong> {format(parseISO(selectedReservation.created_at), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start Time:</strong> {format(parseISO(selectedReservation.start_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Time:</strong> {format(parseISO(selectedReservation.end_time), 'PPpp')}
                    </Typography>
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
                    <Typography variant="body2">
                      <strong>Quantity:</strong> {selectedReservation.quantity}
                    </Typography>

              
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Purpose:
                    </Typography>
                    <Typography variant="body2">
                      {selectedReservation.purpose}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
            
              {selectedReservation.status === 'pending' && (
                <>
                  <Button 
                    color="success" 
                    variant="contained"
                    onClick={() => handleConfirmAction(selectedReservation, 'approve')}
                    disabled={actionLoading}
                  >
                    Approve
                  </Button>
                  <Button 
                    color="error"
                    variant="contained"
                    onClick={() => handleConfirmAction(selectedReservation, 'deny')}
                    disabled={actionLoading}
                  >
                    Deny
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog> 

        {/* Lab Reservation Details Dialog */}
      <Dialog
        open={labdetailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedlabReservation && (
          <>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Lab Information
                  </Typography>
                  <Box 
                    component="img"
                    src={selectedlabReservation.lab?.image_url || 'https://picsum.photos/200/300'}
                    alt={selectedlabReservation.lab?.name}
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                  />
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedlabReservation.lab?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedlabReservation.lab?.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>location:</strong>  {selectedlabReservation.lab?.location}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    User Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedlabReservation.user?.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedlabReservation.user?.department}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Role:</strong> {selectedlabReservation.user?.role}
                    </Typography>
                  </Paper>

                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Lab Reservation Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        <strong>Status:</strong>
                      </Typography>
                      {getStatusChip(selectedlabReservation.status)}
                    </Box>
                    <Typography variant="body2">
                      <strong>Created:</strong> {format(parseISO(selectedlabReservation.created_at), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start Time:</strong> {format(parseISO(selectedlabReservation.start_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Time:</strong> {format(parseISO(selectedlabReservation.end_time), 'PPpp')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Duration:</strong>
                      {
                        (() => {
                          const start = new Date(selectedlabReservation.start_time);
                          const end = new Date(selectedlabReservation.end_time);
                          let diffMs = end.getTime() - start.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          diffMs -= hours * (1000 * 60 * 60);
                          const minutes = Math.floor(diffMs / (1000 * 60));
                          
                          return `${hours} hour(s), ${minutes} minute(s)`;
                        })()
                      }
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Attendees:</strong> {selectedlabReservation.attendees}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Purpose:
                    </Typography>
                    <Typography variant="body2">
                      {selectedlabReservation.purpose}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLabDetailsDialog(false)}>Close</Button>
              {selectedlabReservation.status === 'pending' && (
                <>
                  <Button 
                    color="success" 
                    variant="contained"
                    onClick={() => handleLabConfirmAction(selectedlabReservation, 'approve')}
                    disabled={labactionLoading}
                  >
                    Approve
                  </Button>
                  <Button 
                    color="error"
                    variant="contained"
                    onClick={() => handleLabConfirmAction(selectedlabReservation, 'deny')}
                    disabled={labactionLoading}
                  >
                    Deny
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
        onClose={() => {
          setConfirmDialog(false);
          setActionType(null);
        }}
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Reservation' : 'Deny Reservation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'approve'
              ? 'Are you sure you want to approve this reservation? The equipment will be reserved for the requested time slot.'
              : 'Are you sure you want to deny this reservation? The user will be notified that their request was denied.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setConfirmDialog(false);
              setActionType(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            onClick={() => {
              if (selectedReservation && actionType) {
                handleStatusUpdate(selectedReservation.id, actionType === 'approve' ? 'approved' : 'denied');
              }
            }}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : actionType === 'approve' ? 'Approve' : 'Deny'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lab Confirmation Dialog */}
      <Dialog
        open={labconfirmDialog}
        onClose={() => {
          setLabConfirmDialog(false);
          setLabActionType(null);
        }}
      >
        <DialogTitle>
          {labactionType === 'approve' ? 'Approve Lab Reservation' : 'Deny LabReservation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {labactionType === 'approve'
              ? 'Are you sure you want to approve this lab reservation? The lab will be reserved for the requested time slot.'
              : 'Are you sure you want to deny this lab reservation? The user will be notified that their request was denied.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setLabConfirmDialog(false);
              setLabActionType(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            color={labactionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            onClick={() => {
              if (selectedlabReservation && labactionType) {
                handleLabStatusUpdate(selectedlabReservation.id, labactionType === 'approve' ? 'approved' : 'denied');
              }
            }}
            disabled={labactionLoading}
          >
            {labactionLoading ? <CircularProgress size={24} /> : labactionType === 'approve' ? 'Approve' : 'Deny'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}