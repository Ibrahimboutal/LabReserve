import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format, addHours } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Lab } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { setLabLoading, setLabs, setLabError } from '../store';
import { RootState } from '../store';



export default function Labs() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const labs = useSelector((state: RootState) => state.labs.items);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationDialog, setReservationDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    capacity: '',
    location: '',
    availability: '',
    searchQuery: '',

  });
  const [formData, setFormData] = useState({
    startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
    purpose: '',
    attendees: 1,
  });
  const [reservationError, setReservationError] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  useEffect(() => {
    const fetchReservedLab = async () => {
      const params = new URLSearchParams(location.search);
      const reserveId = params.get('reserve');
      if (reserveId) {
        const { data: labToReserve } = await supabase
          .from('lab')
          .select('*')
          .eq('id', reserveId)
          .single();
        if (labToReserve) {
          setSelectedLab(labToReserve);
          setReservationDialog(true);
        }
      }
    };
    fetchReservedLab();
  }, [location.search]);

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    applyFilters(labs);
    fetchUsers();
  }, [filters, labs]);
  const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, department')
          .eq('role', 'lab_manager')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        setError(error.message);
      }
    };

  const fetchLabs = async () => {
    dispatch(setLabLoading(true));
    try {
      const { data, error } = await supabase
        .from('lab')
        .select('*')
        
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Fetch all approved and pending lab reservations
      const { data: reservations, error: reservationError } = await supabase
        .from('lab_reservations')
        .select('*')
        .in('status', ['approved', 'pending']); 
      if (reservationError) throw reservationError;
      // Update lab status based on reservations
      const updatedLabs = data.map((lab: Lab) => {
        const reservation = reservations.find(
          (reservation: any) => reservation.lab_id === lab.id
        );
        if (reservation) {
          const now = new Date();
          if (new Date(reservation.start_time) > now) {
            return { ...lab, status: 'available' as 'available' };
          } else if (new Date(reservation.end_time) > now) {
            return { ...lab, status: 'occupied' as 'occupied' };
          }
        }
        return { ...lab, status: 'maintenance' as 'maintenance' };
      });
      setFilteredLabs(updatedLabs);
      setLoading(false);

      // Update labs in local state
      setFilteredLabs(updatedLabs);

      // Update labs in Redux store





      dispatch(setLabs(data));
    } catch (error: any) {
      dispatch(setLabError(error.message || 'Failed to fetch labs'));
    } finally {
      setLoading(false);
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
  
  const applyFilters = (labsList: Lab[]) => {
    let filtered = [...labsList];
    const searchQuery = filters.searchQuery || '';

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lab) =>
          lab.name.toLowerCase().includes(query) ||
          lab.location.toLowerCase().includes(query) ||
          lab.capacity.toString().includes(query) ||
          (lab.description && lab.description.toLowerCase().includes(query))
      );
      
    }

    // Capacity filter
    if (filters.capacity) {
      const minCapacity = parseInt(filters.capacity);
      filtered = filtered.filter((lab) => lab.capacity >= minCapacity);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter((lab) =>
        lab.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Availability filter
    if (filters.availability) {
      filtered = filtered.filter((lab) => lab.status === filters.availability);
    }

    

    setFilteredLabs(filtered);
    


  };

  const handleReservationClick = (lab: Lab) => {
    setSelectedLab(lab);
    setReservationDialog(true);
    setFormData({
      startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
      purpose: '',
      attendees: 1,
    });
    setReservationError('');
  };

  const handleReservationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLab || !user) return;

      // Check if attendees exceed lab capacity
    if (formData.attendees > selectedLab.capacity) {
      setReservationError('Number of attendees exceeds the lab capacity.');
      return;
    }

    setReservationLoading(true);
    setReservationError('');

    try {
      const starttime = new Date(formData.startTime).toISOString();
      const endtime = new Date(formData.endTime).toISOString();
      const now = new Date();

      if (new Date(starttime) <= now) {
        throw new Error('Start time must be in the future');
      }

      if (new Date(endtime) <= new Date(starttime)) {
        throw new Error('End time must be after start time');
      }

      // Check for conflicts [[2]]
      const { data: conflicts, error: conflictError } = await supabase
        .from('lab_reservations')
        .select('*')
        .eq('lab_id', selectedLab.id)
        .in('status', ['approved', 'pending'])
        .lt('start_time', endtime)
        .gt('end_time', starttime);

      if (conflictError) throw conflictError;
      if (conflicts && conflicts.length > 0) {
        throw new Error('Lab is already reserved during this time');
      }

      // Create reservation
      const { error } = await supabase
        .from('lab_reservations')
        .insert({
          lab_id: selectedLab.id,
          user_id: user.id,
          start_time: starttime,
          end_time: endtime,
          purpose: formData.purpose,
          attendees: parseInt(formData.attendees.toString(), 10),
          status: 'pending',
          
        });
      // Update lab status to occupied
      await supabase
        .from('lab')
        .update({ status: 'occupied' })
        .eq('id', selectedLab.id);

      // Send notification to the user 
      await sendNotificationToUser(
        user.id,
        'System',
        'Lab Reservation Request',
        `Your reservation request for ${selectedLab.name} has been submitted.`,
        'lab_reservation'
      );
      

      if (error) throw error;
      setReservationError('');
      setFormData({
        startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
        purpose: '',
        attendees: 1,
      });
      setSelectedLab(null);
      setReservationDialog(false);
      // Show success message
      setReservationSuccess(true);
      setReservationDialog(false);
      fetchLabs(); // Refresh lab status
    } catch (error) {
      setReservationError((error as Error).message || 'Failed to reserve lab');
    } finally {
      setReservationLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      capacity: '',
      location: '',
      availability: '',
      searchQuery: '',

    });
    applyFilters(labs);
  };

  if (error) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }} data-testid="error-message">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Available Labs
        </Typography>
        <Typography color="textSecondary">
          Browse and reserve laboratory spaces for your research and educational needs
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search labs by name, location, or description..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({...filters, searchQuery: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              data-testid="search-input"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterListIcon />}
              >
                Filters
              </Button>
              {(showFilters || searchQuery || Object.values(filters).some(Boolean)) && (
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Min Capacity</InputLabel>
                <Select
                  value={filters.capacity}
                  label="Min Capacity"
                  onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
                >
                  <MenuItem value="">Any Capacity</MenuItem>
                  <MenuItem value="5">5+ People</MenuItem>
                  <MenuItem value="10">10+ People</MenuItem>
                  <MenuItem value="20">20+ People</MenuItem>
                  <MenuItem value="30">30+ People</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={filters.availability}
                  label="Availability"
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                >
                  <MenuItem value="">Any Status</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="occupied">Occupied</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Labs Grid */}
      <Grid container spacing={3}>
        {filteredLabs.map((lab) => (
          <Grid item xs={12} md={6} key={lab.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={lab.image_url || "https://via.placeholder.com/612x612"}
                alt={lab.name}
                onError={(e: any) => {
                  e.target.src = "https://via.placeholder.com/612x612";
                }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {lab.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography color="textSecondary">
                        {lab.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={lab.status}
                    color={
                      lab.status === 'available' ? 'success' :
                      lab.status === 'occupied' ? 'error' :
                      lab.status === 'maintenance' ? 'warning' : 'default'

                    }
                  />
                </Box>
                <Typography variant="body2" paragraph>
                  {lab.description || 'No description available'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Capacity: {lab.capacity || 'N/A'} people
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {lab.features
                      ? lab.features.split(',').map((feature: string, index: number) => (
                          <Chip
                            key={index}
                            label={feature.trim()}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      : 'No features available'}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Lab Manager:
                  </Typography>
                  <Typography variant="body2">
                    {users.find((user) => user.id === lab.manager_id)?.email || 'Unassigned'}
                    ({users.find((user) => user.id === lab.manager_id)?.department  || 'Unassigned'})
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary" 
                  onClick={() => handleReservationClick(lab)}
                  fullWidth
                  startIcon={<EventIcon />}
                  disabled={lab.status !== 'available'}
                >
                  {lab.status === 'available' ? 'Reserve Lab' : 'Currently Unavailable'}
                </Button>
              </CardContent>
            
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Reservation Dialog */}
      <Dialog
        open={reservationDialog}
        onClose={() => setReservationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reserve Lab</DialogTitle>
        <DialogContent>
          {reservationError && <Alert severity="error">{reservationError}</Alert>}
          <form onSubmit={handleReservationSubmit}>

            <Typography variant="h6" gutterBottom>
              {selectedLab?.name}
            </Typography>
            
              <TextField
              margin="dense"
              label="Start Time"
              type="datetime-local"
              fullWidth
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              data-testid="start-time-input"
            />
            <TextField
              margin="dense"
              label="End Time"
              type="datetime-local"
              fullWidth
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              data-testid="end-time-input"
            />
            <TextField
              margin="dense"
              label="Purpose"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              data-testid="purpose-input"
            />
            <TextField
              margin="dense"
              label="Number of Attendees"
              type="number"
              fullWidth
              required
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
              InputProps={{
                inputProps: { min: 1 },
              }}
              data-testid="attendees-input"
            />
            <DialogActions>
              <Button onClick={() => setReservationDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={reservationLoading}
                data-testid="reservation-form"
              >
                Submit Reservation
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={reservationSuccess}
        autoHideDuration={6000}
        onClose={() => setReservationSuccess(false)}
        message="Reservation request submitted successfully"
        action={
          <Button color="secondary" size="small" onClick={() => navigate('/reservations')}>
            View My Reservations
          </Button>
        }
        data-testid="reservation-success-snackbar"
      />
    </Container>
  );
}


