import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { addHours, format, isAfter, isBefore, parseISO } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { setReservations, setReservationLoading, setReservationError } from '../store';
import { useNavigate } from 'react-router-dom';

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

export default function Reservations() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const reservations = useSelector((state: any) => state.reservations.items);
  const loading = useSelector((state: any) => state.reservations.loading);
  const error = useSelector((state: any) => state.reservations.error);
  const navigate = useNavigate();
  const [labs, setLabs] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [showLabFilters, setShowLabFilters] = useState(false);
  const [labTabValue, setLabTabValue] = useState(0);
  const [labDetailsDialog, setLabDetailsDialog] = useState(false);
  const [selectedLabReservation, setSelectedLabReservation] = useState<any>(null);
  const [labConfirmDialog, setLabConfirmDialog] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [labStatusFilter, setLabStatusFilter] = useState('');
  const [labDateFilter, setLabDateFilter] = useState('');
  const [labReservations, setLabReservations] = useState<any[]>([]);
  const [, setLabLoading] = useState(false);
  const [, setLabError] = useState<string | null>(null);
  const [labCancelLoading, setLabCancelLoading] = useState(false);
  const [equipmentPage, setEquipmentPage] = useState(1); // Pagination for equipment reservations
  const [equipmentPageSize, setEquipmentPageSize] = useState(5); // Items per page for equipment reservations
  const [labPage, setLabPage] = useState(1); // Pagination for lab reservations
  const [labPageSize, setLabPageSize] = useState(5); // Items per page for lab reservations
    


  useEffect(() => {
    fetchReservations();
    fetchLabs();
    fetchAllUser();
  }, [user]);

  const fetchLabs = async () => {
      try {
        const { data, error } = await supabase
          .from('lab')
          .select('*')
          .order('name');
  
        if (error) throw error;
        setLabs(data);
      } catch (error) {
        console.error('Error fetching labs:', error);
      }
    };

  const fetchReservations = async () => {
    if (!user) return;
    
    dispatch(setReservationLoading(true));
    try {
      const { data, error } = await supabase
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
          )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      dispatch(setReservations(data));
    } catch (error: any) {
      dispatch(setReservationError(error.message));
    }
  };

  const fetchAllUser = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);
      if (error) throw error;
      return data[0];
    } catch (error: any) {
      console.error('Error fetching user:', error);
    }
  };
  const sendNotification = async (
    recipientId: string,
    createdBy: string,
    title: string,
    message: string,
    type: string
  ) => {
    try {
      const { error } = await supabase.from('notifications').insert([
        {
          id: crypto.randomUUID(),
          user_id: recipientId, // Recipient ID (user or lab manager)
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
      console.error(`Error sending notification to recipient ${recipientId}:`, error.message);
      // Optionally, display an error message to the user
    }
  };


  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
  
    setCancelLoading(true);
    try {
      // Update the reservation status to "cancelled"
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', selectedReservation.id)
        .eq('user_id', user?.id);
  
      if (error) throw error;
  
      // Send notification to the user who made the reservation
      await sendNotification(
        selectedReservation.user_id,
        'System',
        'Reservation Cancelled',
        `Your reservation for ${selectedReservation.equipment?.name} has been cancelled.`,
        'cancelled'
      );
  
      // Check if the reservation is associated with a lab
      
  
      // Close dialogs and refresh reservations
      setConfirmDialog(false);
      setDetailsDialog(false);
      fetchReservations();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setDetailsDialog(true);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const handleLabTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setLabTabValue(newValue);
  };
  const handleLabViewDetails = (reservation: any) => {
    setSelectedLabReservation(reservation);
    setLabDetailsDialog(true);
  };
  const handleLabEventClick = (info: any) => {
    const reservation = labReservations.find((r: any) => r.id === info.event.id);
    if (reservation) {
      setSelectedLabReservation(reservation);
      setLabDetailsDialog(true);
    }
  };
  const handleLabCancelReservation = async () => {
    if (!selectedLabReservation) return;
    setLabCancelLoading(true);
    try {
      const { error } = await supabase
        .from('lab_reservations')
        .update({ status: 'cancelled' })  
        .eq('id', selectedLabReservation.id)
        .eq('user_id', user?.id);
      if (error) throw error;

      // Send notification to the user
      await sendNotification(
        selectedLabReservation.user_id, 
        'System', 
        'Lab Reservation Cancelled', 
        `Your lab reservation for ${selectedLabReservation.lab?.name} has been cancelled.`, 
        'cancelled'
      );
      setLabConfirmDialog(false);
      setLabDetailsDialog(false);
      fetchLabReservations();
    } catch (error: any) {
      console.error('Error cancelling lab reservation:', error);
    } finally {
      setLabCancelLoading(false);
    }
  };
  const fetchLabReservations = async () => {
    if (!user) return;
    setLabLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_reservations')
        .select(`
          *,
          lab (
            id,
            name,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
      if (error) throw error;
      setLabReservations(data);
    } catch (error: any) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };
  useEffect(() => {
    fetchLabReservations();
  }, [user]);


  const filteredLabReservations = labReservations.filter((reservation: any) => {
    // Search filter
    const matchesSearch =
      reservation.lab?.name.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
      reservation.purpose?.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
      reservation.lab?.location.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
      reservation.attendees?.toString().includes(labSearchQuery.toLowerCase());
    

    // Status filter
    const matchesStatus = !labStatusFilter || reservation.status === labStatusFilter;
    // 
    // Date filter
    let matchesDate = true;
    const now = new Date();
    const startDate = parseISO(reservation.start_time);
    const endDate = parseISO(reservation.end_time);
    if (labDateFilter === 'upcoming') {
      matchesDate = isAfter(startDate, now);
    } else if (labDateFilter === 'past') {
      matchesDate = isBefore(endDate, now);
    } else if (labDateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = isAfter(startDate, today) && isBefore(startDate, tomorrow);
    } else if (labDateFilter === 'thisWeek') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today); 
      nextWeek.setDate(nextWeek.getDate() + 7);
      matchesDate = isAfter(startDate, today) && isBefore(startDate, nextWeek);
    } return matchesSearch && matchesStatus && matchesDate;
  
  }
  );
  const labCalendarEvents = labReservations.map((reservation: any) => ({
    id: reservation.id,
    title: reservation.lab?.name,
    start: reservation.start_time,
    end: reservation.end_time,
    extendedProps: {
      status: reservation.status,
      lab: reservation.lab,
      purpose: reservation.purpose
    },
    backgroundColor: 
      reservation.status === 'approved' ? '#4caf50' :
      reservation.status === 'pending' ? '#ff9800' :
      reservation.status === 'denied' ? '#f44336' : 
      reservation.status === 'cancelled' ? '#9e9e9e' :
      reservation.status === 'completed' ? '#2196f3' : '#9e9e9e',
    borderColor: 
      reservation.status === 'approved' ? '#2e7d32' :
      reservation.status === 'pending' ? '#e65100' :
      reservation.status === 'denied' ? '#c62828' :
      reservation.status === 'cancelled' ? '#616161' :
      reservation.status === 'completed' ? '#1976d2' : '#616161',

  }));

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

  const filteredReservations = reservations.filter((reservation: any) => {
    // Search filter
    const matchesSearch = 
      reservation.equipment?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.equipment?.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.quantity?.toString().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = !statusFilter || reservation.status === statusFilter;
    const matcheslab = !labFilter || reservation.equipment?.lab_id === labFilter;
    
    // Date filter
    let matchesDate = true;
    const now = new Date();
    const startDate = parseISO(reservation.start_time);
    const endDate = parseISO(reservation.end_time);
    
    if (dateFilter === 'upcoming') {
      matchesDate = isAfter(startDate, now);
    } else if (dateFilter === 'past') {
      matchesDate = isBefore(endDate, now);
    } else if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = isAfter(startDate, today) && isBefore(startDate, tomorrow);
    } else if (dateFilter === 'thisWeek') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      matchesDate = isAfter(startDate, today) && isBefore(startDate, nextWeek);
    }
    
    return matchesSearch && matchesStatus && matcheslab && matchesDate;
  });

  const calendarEvents = reservations.map((reservation: any) => ({
    id: reservation.id,
    title: reservation.equipment?.name,
    start: reservation.start_time,
    end: reservation.end_time,
    extendedProps: {
      status: reservation.status,
      equipment: reservation.equipment,
      lab: reservation.lab,
      purpose: reservation.purpose
    },
    backgroundColor: 
      reservation.status === 'approved' ? '#4caf50' :
      reservation.status === 'pending' ? '#ff9800' :
      reservation.status === 'denied' ? '#f44336' : 
      reservation.status === 'cancelled' ? '#9e9e9e' :
      reservation.status === 'completed' ? '#2196f3' : '#9e9e9e',
    borderColor: 
      reservation.status === 'approved' ? '#2e7d32' :
      reservation.status === 'pending' ? '#e65100' :
      reservation.status === 'denied' ? '#c62828' : 
      reservation.status === 'cancelled' ? '#616161' :
      reservation.status === 'completed' ? '#1976d2' : '#616161',
  }));

  const handleEventClick = (info: any) => {
    const reservation = reservations.find((r: any) => r.id === info.event.id);
    if (reservation) {
      setSelectedReservation(reservation);
      setDetailsDialog(true);
    }
  };

   // Pagination logic for equipment reservations
  const paginatedReservations = filteredReservations.slice(
    (equipmentPage - 1) * equipmentPageSize,
    equipmentPage * equipmentPageSize
  );

  // Pagination logic for lab reservations
  const paginatedLabReservations = filteredLabReservations.slice(
    (labPage - 1) * labPageSize,
    labPage * labPageSize
  );

  // Handle page change for equipment reservations
  const handleEquipmentPageChange = (newPage: number) => {
    setEquipmentPage(newPage);
  };

  // Handle page change for lab reservations
  const handleLabPageChange = (newPage: number) => {
    setLabPage(newPage);
  };

  

  if (loading && reservations.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Equipment Reservation Section */}
      <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              My Equipment Reservations
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
          {showFilters && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Search reservations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
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
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
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
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Date"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="">All Dates</MenuItem>
                      <MenuItem value="upcoming">Upcoming</MenuItem>
                      <MenuItem value="past">Past</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="thisWeek">This Week</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="text" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setLabFilter('');
                    setDateFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Paper>
          )}

          {/* View Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="reservation view tabs">
              <Tab label="List View" />
              <Tab label="Calendar View" icon={<EventIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* List View */}
          <TabPanel value={tabValue} index={0}>
            {filteredReservations.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipment</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedReservations.map((reservation: any) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              component="img"
                              src={reservation.equipment?.image_url || 'https://picsum.photos/200/300'}
                              alt={reservation.equipment?.name}
                              sx={{ width: 40, height: 40, mr: 2, borderRadius: 1, objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {reservation.equipment?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {reservation.equipment?.category}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {format(new Date(reservation.start_time), 'PPpp')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(reservation.end_time), 'PPpp')}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(reservation.status)}
                        </TableCell>
                        <TableCell>
                          {reservation.quantity}
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
                            
                            {(reservation.status === 'pending' || reservation.status === 'approved') && 
                            isAfter(new Date(reservation.start_time), addHours(new Date(), 24)) && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setConfirmDialog(true);
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}> 
                <InputLabel id="equipment-page-size-label" sx={{ whiteSpace: 'nowrap' }}>
                  Items Per Page
                </InputLabel>
                <Select
                  labelId="equipment-page-size-label"
                  value={equipmentPageSize}
                  label="Items Per Page"
                  onChange={(e) => {
                    setEquipmentPageSize(Number(e.target.value));
                    setEquipmentPage(1); // Reset to the first page when page size changes
                  }}
                  sx={{ textAlign: 'left' }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>

                {/* Pagination Controls for Equipment Reservations */}
                <Button
                  variant="outlined"
                  disabled={equipmentPage === 1}
                  onClick={() => handleEquipmentPageChange(equipmentPage - 1)}
                  sx={{ mr: 1 }}
                >
                  Previous
                </Button>
                <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                  Page {equipmentPage} of {Math.ceil(filteredReservations.length / equipmentPageSize)}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={equipmentPage >= Math.ceil(filteredReservations.length / equipmentPageSize)}
                  onClick={() => handleEquipmentPageChange(equipmentPage + 1)}
                  sx={{ ml: 1 }}
                >
                  Next
                </Button>
              </Box>
              </>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">No reservations found</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {searchQuery || statusFilter || dateFilter 
                    ? 'Try adjusting your search or filter criteria'
                    : 'You have not made any reservations yet'}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/equipment')}
                >
                  Browse Equipment
                </Button>
              </Paper>
            )}
          </TabPanel>

          {/* Calendar View */}
          <TabPanel value={tabValue} index={1}>
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
                eventClick={handleEventClick}
                height="auto"
                aspectRatio={1.5}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
              />
            </Paper>
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
                      <Typography variant="subtitle1" fontWeight="medium">
                        {selectedReservation.equipment?.name}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {selectedReservation.equipment?.manufacturer} {selectedReservation.equipment?.model}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip 
                          label={selectedReservation.equipment?.category} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        <strong>Laboratory:</strong> {selectedReservation.equipment.lab_id? labs.find(lab => lab.id === selectedReservation.equipment.lab_id)?.name|| 'Unknown Lab'
                            : 'No Lab Assigned'}  {selectedReservation.equipment.lab_id? `(${labs.find(lab => lab.id === selectedReservation.equipment.lab_id)?.location|| 'Unknown Location'})`:''}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Reservation Information
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Status:</strong> {getStatusChip(selectedReservation.status)}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Start Time:</strong> {format(new Date(selectedReservation.start_time), 'PPpp')}
                          </Typography>
                          <Typography variant="body2">
                            <strong>End Time:</strong> {format(new Date(selectedReservation.end_time), 'PPpp')}
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
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Created:</strong> {format(new Date(selectedReservation.created_at), 'PPp')}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Purpose:
                        </Typography>
                        <Typography variant="body2">
                          {selectedReservation.purpose}
                        </Typography>
                      </Paper>
                      
                      {(selectedReservation.status === 'pending' || selectedReservation.status === 'approved') && 
                      isAfter(new Date(selectedReservation.start_time), new Date()) && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            onClick={() => {
                              setDetailsDialog(false);
                              setConfirmDialog(true);
                            }}
                          >
                            Cancel Reservation
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Note: Cancellations should be made at least 12 hours before the scheduled time.
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDetailsDialog(false)}>Close</Button>
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
              Cancel Reservation
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to cancel this reservation? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog(false)}>
                No, Keep Reservation
              </Button>
              <Button 
                onClick={handleCancelReservation} 
                color="error"
                variant="contained"
                disabled={cancelLoading}
              >
                {cancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Reservation'}
              </Button>
            </DialogActions>
          </Dialog>
      </Box>
    
      {/* Lab Reservations Section */}
      <Box sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Lab Reservations
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowLabFilters(!showLabFilters)}
          >
            Filters
          </Button>
        </Box>

        {/* Search and Filters for Labs */}
        {showLabFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search lab reservations..."
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={labStatusFilter}
                    label="Status"
                    onChange={(e) => setLabStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="denied">Denied</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date</InputLabel>
                  <Select
                    value={labDateFilter}
                    label="Date"
                    onChange={(e) => setLabDateFilter(e.target.value)}
                  >
                    <MenuItem value="">All Dates</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="past">Past</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="thisWeek">This Week</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
          </Paper>
        )}

        {/* View Tabs for Labs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={labTabValue} onChange={handleLabTabChange} aria-label="lab reservation view tabs">
            <Tab label="List View" />
            <Tab label="Calendar View" icon={<EventIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* List View for Labs */}
        <TabPanel value={labTabValue} index={0}>
          {filteredLabReservations.length > 0 ? (
            <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lab Name</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Attendees</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLabReservations.map((reservation: any) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={reservation.lab?.image_url || 'https://picsum.photos/200/300'}
                            alt={reservation.lab?.name}
                            sx={{ width: 40, height: 40, mr: 2, borderRadius: 1, objectFit: 'cover' }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {reservation.lab?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.lab?.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.start_time), 'PPpp')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.end_time), 'PPpp')}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(reservation.status)}
                      </TableCell>
                      <TableCell>
                        {reservation.attendees}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleLabViewDetails(reservation)}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {(reservation.status === 'pending' || reservation.status === 'approved') && 
                          isAfter(new Date(reservation.start_time), new Date()) && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => {
                                setSelectedLabReservation(reservation);
                                setLabConfirmDialog(true);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls for Lab Reservations */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel id="lab-page-size-label" sx={{ whiteSpace: 'nowrap' }}> 
                Items Per Page
              </InputLabel>
              <Select
                labelId="lab-page-size-label"
                value={labPageSize}
                label="Items Per Page"
                onChange={(e) => {
                  setLabPageSize(Number(e.target.value));
                  setLabPage(1); // Reset to the first page when page size changes
                }}
                sx={{ textAlign: 'left' }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>

              {/* Pagination Controls for Lab Reservations */}
              <Button
                variant="outlined"
                disabled={labPage === 1}
                onClick={() => handleLabPageChange(labPage - 1)}
                sx={{ mr: 1 }}
              >
                Previous
              </Button>
              <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                Page {labPage} of {Math.ceil(filteredLabReservations.length / labPageSize)}
              </Typography>
              <Button
                variant="outlined"
                disabled={labPage >= Math.ceil(filteredLabReservations.length / labPageSize)}
                onClick={() => handleLabPageChange(labPage + 1)}
                sx={{ ml: 1 }}
              >
                Next
              </Button>
            </Box>
            </>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No lab reservations found</Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {labSearchQuery || labStatusFilter || labDateFilter 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You have not made any lab reservations yet'}
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/labs')}
              >
                Browse Labs
              </Button>
            </Paper>
          )}
        </TabPanel>

        {/* Calendar View for Labs */}
        <TabPanel value={labTabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={labCalendarEvents}
              eventClick={handleLabEventClick}
              height="auto"
              aspectRatio={1.5}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
            />
          </Paper>
        </TabPanel>

        {/* Lab Reservation Details Dialog */}
        <Dialog
          open={labDetailsDialog}
          onClose={() => setLabDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedLabReservation && (
            <>
              <DialogTitle>
                Lab Reservation Details
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
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedLabReservation.lab?.name}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {selectedLabReservation.lab?.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Location:</strong> {selectedLabReservation.lab?.location}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Reservation Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Status:</strong> {getStatusChip(selectedLabReservation.status)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Start Time:</strong> {format(new Date(selectedLabReservation.start_time), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>End Time:</strong> {format(new Date(selectedLabReservation.end_time), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Duration:</strong> {Math.ceil((new Date(selectedLabReservation.end_time).getTime() - new Date(selectedLabReservation.start_time).getTime()) / (1000 * 60 * 60))} hours
                        </Typography>
                        <Typography variant='body2'>
                          <strong>Attendees:</strong> {selectedLabReservation.attendees}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Created:</strong> {format(new Date(selectedLabReservation.created_at), 'PPp')}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Purpose:
                      </Typography>
                      <Typography variant="body2">
                        {selectedLabReservation.purpose}
                      </Typography>
                    </Paper>
                    {(selectedLabReservation.status === 'pending' || selectedLabReservation.status === 'approved') && 
                    isAfter(new Date(selectedLabReservation.start_time), new Date()) && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          onClick={() => {
                            setLabDetailsDialog(false);
                            setLabConfirmDialog(true);
                          }}
                        >
                          Cancel Reservation
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Note: Cancellations should be made at least 12 hours before the scheduled time.
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setLabDetailsDialog(false)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirmation Dialog for Lab Reservations */}
        <Dialog
          open={labConfirmDialog}
          onClose={() => setLabConfirmDialog(false)}
        >
          <DialogTitle>
            Cancel Lab Reservation
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this lab reservation? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLabConfirmDialog(false)}>
              No, Keep Reservation
            </Button>
            <Button 
              onClick={handleLabCancelReservation} 
              color="error"
              variant="contained"
              disabled={labCancelLoading}
            >
              {labCancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Reservation'}
            </Button>
          </DialogActions>
        </Dialog>
        
      </Box>
    </Container>
  );
}