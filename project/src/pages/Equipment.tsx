import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Chip,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Divider,
  Paper,
  Tooltip,
  Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';
import { format, addHours } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Equipment as EquipmentType } from '../types';
import { setEquipment, setEquipmentLoading, setEquipmentError } from '../store';
import { useAuth } from '../hooks/useAuth';
 
export default function Equipment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const equipment = useSelector((state: any) => state.equipment.items);
  const loading = useSelector((state: any) => state.equipment.loading);
  const error = useSelector((state: any) => state.equipment.error);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [reservationDialog, setReservationDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [quantityFilter, setQuantityFilter] = useState<string | null>(null);
  const [labFilter, setLabFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const setError = (message: string) => {
    console.error('Error:', message);
  };
  const [reservationData, setReservationData] = useState({
    start_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
    purpose: '',
    quantity: 1,
  });
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState(false);

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
    fetchLabs();
    fetchAllUsers();
    
    // Check if we need to open reservation dialog from URL params
    const params = new URLSearchParams(location.search);
    const reserveId = params.get('reserve');
    if (reserveId) {
      const equipmentToReserve = equipment.find((item: EquipmentType) => item.id === reserveId);
      if (equipmentToReserve) {
        setSelectedEquipment(equipmentToReserve);
        setReservationDialog(true);
      }
    }
  }, [location.search]);

  useEffect(() => {
  const channel = supabase
    .channel('equipment-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'equipment',
      },
      (_payload) => {
        fetchEquipment(); // Refresh when equipment table changes
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const fetchEquipment = async () => {
    dispatch(setEquipmentLoading(true));
    try {
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'operational');
  
      if (error) throw error;
  
      const equipmentWithRemainingUnits = equipmentData.map((item: EquipmentType) => {
        const remainingUnits = item.quantity - item.units_under_reservation - (item.units_under_maintenance || 0);
        return {
          ...item,
          remainingUnits: remainingUnits > 0 ? remainingUnits : 0,
        };
        
    });
  
      dispatch(setEquipment(equipmentWithRemainingUnits));
    } catch (error: any) {
      dispatch(setEquipmentError(error.message));
    } finally {
    dispatch(setEquipmentLoading(false));
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


  const handleReservationClick = (equipment: EquipmentType) => {
    setSelectedEquipment(equipment);
    setReservationDialog(true);
    
    // Reset form data
    setReservationData({
      start_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
      purpose: '',
      quantity: 1,
    });
    setReservationError('');
  };

  const handleDetailsClick = (equipment: EquipmentType) => {
    setSelectedEquipment(equipment);
    setDetailsDialog(true);
  };

  const handleReservationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    if (!user || !selectedEquipment) return;
  
    setReservationError('');
    if (!reservationData.purpose.trim()) {
        setReservationError("Purpose is required");
        return;
    }
    setReservationLoading(true);

    try {
      // Validate dates
      const startTime = new Date(reservationData.start_time);
      const endTime = new Date(reservationData.end_time);
      const now = new Date();
  
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
  
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
  
      // Fetch all approved  and pending reservations for the selected equipment during the requested time period
      const { data: reservations, error: conflictError } = await supabase
        .from('reservations')
        .select('*')
        .eq('equipment_id', selectedEquipment.id)
        .in('status', ['approved', 'pending']  )
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);
  
      if (conflictError) throw conflictError;
  
      // Calculate total reserved quantity during the requested time period
      const totalReservedQuantity = reservations.reduce((total, reservation) => {
        return total + (reservation.quantity || 0); // Sum up reserved quantities
      }, 0);
  
      // Calculate remaining available quantity
      const remainingQuantity = Math.max(
        0, 
        selectedEquipment.quantity - totalReservedQuantity - (selectedEquipment.units_under_maintenance || 0)
      );
      // Check if the equipment is available for the requested time period
      if (remainingQuantity <= 0) {
        throw new Error('No units available for reservation during the selected time period.');
      }
      // Check if the requested quantity is valid
      if (reservationData.quantity <= 0) {
        throw new Error('Requested quantity must be greater than 0.');
      }
  
      // Check if the requested quantity exceeds the remaining available quantity
      if (reservationData.quantity > remainingQuantity) {
        throw new Error(
          `Only ${remainingQuantity} unit(s) of this equipment are available for reservation during the selected time period.`
        );
      }

      // 🔍 Fetch applicable auto-approval setting based on equipment, lab, or system level
    const fetchAutoApprovalStatus = async (equipment: EquipmentType): Promise<boolean> => {
      // 1️⃣ First check equipment-specific setting
      const { data: equipmentSetting, error: equipmentError } = await supabase
        .from('auto_approval_settings')
        .select('enabled')
        .eq('target_type', 'equipment')
        .eq('target_id', equipment.id)
        .single();

      if (!equipmentError) {
        return equipmentSetting.enabled;
      }

      // 2️⃣ No equipment-specific setting, check lab-level setting
      if (equipment.lab_id) {
        const { data: labSetting, error: labError } = await supabase
          .from('auto_approval_settings')
          .select('enabled')
          .eq('target_type', 'lab')
          .eq('target_id', equipment.lab_id)
          .single();

        if (!labError) {
          return labSetting.enabled;
        }
      }

      // 3️⃣ Finally, check system-wide setting
      const { data: systemSetting, error: systemError } = await supabase
        .from('auto_approval_settings')
        .select('enabled')
        .eq('target_type', 'system')
        .is('target_id', null)
        .single();

      if (!systemError && systemSetting) {
        return systemSetting.enabled;
      }

      // Default: auto approval disabled
      return false;
    };

    const isAutoApproved = await fetchAutoApprovalStatus(selectedEquipment);

  
      // Create reservation
      const { error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: user.id,
            equipment_id: selectedEquipment.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            purpose: reservationData.purpose,
            status: isAutoApproved ? 'approved' : 'pending', // ✅ Fixed here
            quantity: reservationData.quantity, // Include the requested quantity
          },
          
        ]);

      if (error) throw error;

      // Send notification to the user who made the reservation
      
      // 📣 Prepare notification message
      const approvalStatusMessage = isAutoApproved
      ? `Your reservation for ${reservationData.quantity} unit(s) of ${selectedEquipment.name} has been automatically approved.`
      : `Your reservation request for ${reservationData.quantity} unit(s) of ${selectedEquipment.name} has been submitted successfully. It is currently pending approval.`;

      const notificationTitle = isAutoApproved
      ? 'Reservation Approved Automatically'
      : 'Reservation Request Submitted';

      // 📨 Send notification
      await sendNotificationToUser(
      users.find((u) => u.id === user.id)?.id || user.id,
      'system',
      notificationTitle,
      approvalStatusMessage,
      'reservation'
      );
      
  
      setReservationSuccess(true);
      setReservationDialog(false);
  
      // Clear URL parameter
      navigate('/equipment', { replace: true });
    } catch (error: any) {
      setReservationError(error.message);
    } finally {
      setReservationLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredEquipment = equipment.filter((item: EquipmentType) => {
    // Search Query Matching
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.quantity?.toString().includes(searchQuery.toLowerCase()); // Include quantity in search
  
    // Category Filter Matching
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
  
    // Lab Filter Matching
    const matchesLab = !labFilter || item.lab_id === labFilter;
  
    // Quantity Filter Matching (if quantityFilter is defined)
    const matchesQuantity = !quantityFilter || item.quantity >= Number(quantityFilter);
  
    // Return combined conditions
    return matchesSearch && matchesCategory && matchesLab && matchesQuantity;
  });

  if (loading && equipment.length === 0) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Laboratory Equipment
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
          fullWidth
          placeholder="Search equipment by name, description, or category..."
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
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Min Quantity</InputLabel>
                      <Select
                        value={quantityFilter}
                        label="Min Quantity"
                        onChange={(e) => setQuantityFilter(e.target.value)}
                      >
                        <MenuItem value="">Any Quantity</MenuItem>
                        <MenuItem value="1">1+ Units</MenuItem>
                        <MenuItem value="5">5+ Units</MenuItem>
                        <MenuItem value="10">10+ Units</MenuItem>
                        <MenuItem value="20">20+ Units</MenuItem>
                        <MenuItem value="30">30+ Units</MenuItem>
                        <MenuItem value="100">100+ Units</MenuItem>
                      </Select>
                    </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
              <Button 
                variant="text" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setLabFilter('');
                  setQuantityFilter('');
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* View Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Grid View" />
          <Tab label="List View" />
        </Tabs>
      </Box>

      {/* Equipment Display */}
      {tabValue === 0 ? (
        // Grid View
        <Grid container spacing={3}>
          {filteredEquipment.length > 0 ? (
            filteredEquipment.map((item: EquipmentType) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image_url || 'https://picsum.photos/200/300'}
                    alt={item.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {item.name}
                      </Typography>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleDetailsClick(item)}>
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={item.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip 
                        label={(labs.find((lab: { id: string; name: string }) => lab.id === item.lab_id)?.name) || 'Unknown Lab'} 
                        color="secondary"
                        variant="outlined"
                        size="small" 
                        sx={{mr: 1, mb: 1  }}
                      />
                      <Chip 
                        label={item.status} 
                        color= {item.status === 'operational' ? 'success' : 'error'}
                        variant="outlined"
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.manufacturer} {item.model}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {item.description?.length > 100 
                        ? `${item.description.substring(0, 100)}...` 
                        : item.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {item.quantity !== undefined && item.quantity !== null ? item.quantity : 'Unknown quantity'}
                    </Typography>
                    
                    
                    <Typography variant="body2" color="text.secondary">
                      Units still available for reservation: {item.remainingUnits}
                      <Tooltip title={`Total Quantity: ${item.quantity}, Reserved: ${item.units_under_reservation}, Under Maintenance: ${item.units_under_maintenance || 0}`}>
                        <InfoIcon fontSize="small" sx={{ ml: 2 }} />
                      </Tooltip>
                    </Typography>

                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => handleReservationClick(item)}
                      disabled={item.remainingUnits === 0} // Disable if no units are available

                    >
                      {item.remainingUnits === 0 ? 'No Units Available' : 'Reserve'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">No equipment found</Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search or filter criteria
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        // List View
        <Paper>
          {filteredEquipment.length > 0 ? (
            filteredEquipment.map((item: EquipmentType, index: number) => (
              <Box key={item.id}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Box 
                    component="img"
                    src={item.image_url || 'https://picsum.photos/200/300'}
                    alt={item.name}
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" component="h2">
                        {item.name}
                      </Typography>
                        <Box>
                        <Chip 
                          label={item.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={(labs.find((lab: { id: string; name: string }) => lab.id === item.lab_id)?.name) || 'Unknown Lab'} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.manufacturer} {item.model}
                    </Typography>
                    <Typography variant="body2">
                      {item.description?.length > 150 
                        ? `${item.description.substring(0, 150)}...` 
                        : item.description}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleReservationClick(item)}
                    >
                      Reserve
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDetailsClick(item)}
                    >
                      Details
                    </Button>
                  </Box>
                </Box>
                {index < filteredEquipment.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No equipment found</Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Reservation Dialog */}
      <Dialog 
        open={reservationDialog} 
        onClose={() => setReservationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reserve Equipment: {selectedEquipment?.name}
        </DialogTitle>
        <DialogContent>
          {reservationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {reservationError}
            </Alert>
          )}
          <form id="reservation-form" onSubmit={handleReservationSubmit}>
            
            <TextField
              margin="dense"
              label="Start Time"
              type="datetime-local"
              fullWidth
              required
              value={reservationData.start_time}
              onChange={(e) => setReservationData({ ...reservationData, start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="End Time"
              type="datetime-local"
              fullWidth
              required
              value={reservationData.end_time}
              onChange={(e) => setReservationData({ ...reservationData, end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Purpose"
              fullWidth
              multiline
              rows={4}
              required
              value={reservationData.purpose}
              onChange={(e) => setReservationData({ ...reservationData, purpose: e.target.value })}
              placeholder="Please describe the purpose of your reservation and any specific requirements"

              error={!!reservationError && !reservationData.purpose.trim()}
              helperText={
                !!reservationError && !reservationData.purpose.trim()
                  ? "Purpose is required"
                  : "Please describe the purpose of your reservation"
              }
            />
            <TextField
              margin="dense"
              label="How many units do you need?"
              type="number"
              fullWidth
              required
              value={reservationData.quantity}
              onChange={(e) => setReservationData({ ...reservationData, quantity: Number(e.target.value) })}
              InputProps={{
                inputProps: { min: 1 },
              }}
            />
          </form>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              • Reservation requests must be approved by a lab manager. If no approval is given at least 20 minutes before the reservation start time, the request will be automatically canceled by the system.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • Ensure you have the required training and permissions to use the equipment or lab facilities before making a reservation.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • If you have any questions or special requirements, please contact the lab manager.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • All reservation requests are subject to availability and lab policies. Approval is not guaranteed.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • If you need to cancel or modify your reservation, please do so at least 24 hours in advance through the system.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • For urgent or last-minute requests, directly contact the lab manager to expedite the review process.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReservationDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReservationSubmit} 
            color="primary"
            variant="contained"
            disabled={reservationLoading}
          >
            {reservationLoading ? <CircularProgress size={24} /> : 'Submit Reservation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Equipment Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEquipment && (
          <>
            <DialogTitle>
              {selectedEquipment.name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box 
                    component="img"
                    src={selectedEquipment.image_url || 'https://picsum.photos/200/300'}
                    alt={selectedEquipment.name}
                    sx={{ width: '100%', borderRadius: 1, mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    General Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Category:</strong> {selectedEquipment.category}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Manufacturer:</strong> {selectedEquipment.manufacturer}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Model:</strong> {selectedEquipment.model}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Laboratory:</strong>  {selectedEquipment.lab_id 
                        ? labs.find(lab => lab.id === selectedEquipment.lab_id)?.name|| 'Unknown Lab'
                        : 'No Lab Assigned'} 
                        {selectedEquipment.lab_id? `(${labs.find(lab => lab.id ===selectedEquipment.lab_id)?.location|| 'Unkonwn Location' })`: ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedEquipment.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Quantity Available:</strong> {selectedEquipment.quantity || 'Unknown quantity'}
                    </Typography>
                  </Box>
                  <Typography variant="body1" paragraph>
                    {selectedEquipment.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Technical Specifications
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    {selectedEquipment.detailed_specs && Object.entries(selectedEquipment.detailed_specs).map(([key, value]) => (
                      value && (
                        <Box key={key} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                          </Typography>
                        </Box>
                      )
                    ))}
                    {(!selectedEquipment.detailed_specs || Object.values(selectedEquipment.detailed_specs).every(v => !v)) && (
                      <Typography variant="body2" color="text.secondary">
                        No detailed specifications available
                      </Typography>
                    )}
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Usage Guidelines
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" paragraph>
                      <strong>Reservation Policy:</strong> Equipment must be reserved at least 24 hours in advance. Cancellations should be made at least 12 hours before the scheduled time.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Safety Requirements:</strong> Users must have completed the required safety training before operating this equipment. Always follow the laboratory safety protocols.
                    </Typography>
                    <Typography variant="body2">
                      <strong>Support Contact:</strong> For technical assistance, please contact the lab manager at lab-support@example.com
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setDetailsDialog(false);
                  handleReservationClick(selectedEquipment);
                }}
              >
                Reserve This Equipment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Success Snackbar */}
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
      />
    </Container>
  );
}

