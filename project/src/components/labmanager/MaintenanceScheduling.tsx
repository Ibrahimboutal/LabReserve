import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Pagination,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import { format, isToday, parseISO, isBefore, isAfter, addDays } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import { Equipment } from '@/types';
import { Lab } from '@/types';
import { lab_maintenance_schedules } from '@/types';

interface MaintenanceSchedule {
  id: string;
  equipment_id: string;
  scheduled_date: string;
  type: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  units: number;
  technician_notes?: string;
  completed_at?: string;
  equipment?: Equipment;
}

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
      id={`maintenance-tabpanel-${index}`}
      aria-labelledby={`maintenance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const maintenanceTypes = [
  'Routine Inspection',
  'Calibration',
  'Repair',
  'Preventive Maintenance',
  'Software Update',
  'Hardware Update',
  'Safety Check',
];

export default function MaintenanceScheduling() {
  const [users, setUsers] = useState<any[]>([]); // Fetch users for notifications
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [labSchedule, setLabSchedules] = useState<lab_maintenance_schedules[]>([]);
  const [labs, setLab] = useState<Lab[]>([]);
  const [labLoading, setLabLoading] = useState(true);
  const [labError, setLabError] = useState<string | null>(null);
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [labEditingSchedule, setLabEditingSchedule] = useState<lab_maintenance_schedules | null>(null);
  const [labDeletingSchedule, setLabDeletingSchedule] = useState<lab_maintenance_schedules | null>(null);
  const [labDeletingDialogOpen, setLabDeleteDialogOpen] = useState(false);
  const [labFormData, setLabFormData] = useState({
    lab_id: '',
    scheduled_date: '',
    type: '',
    description: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    technician_notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusLabFilter, setStatusLabFilter] = useState('');
  const [LabFilterName, setLabFilterName] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [labsearchQuery, setLabSearchQuery] = useState('');
  const [labtypeFilter, setLabTypeFilter] = useState('');
  const [labdateFilter, setLabDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLabFilters, setShowLabFilters] = useState(false);
  const [EquipmenttabValue, setEquipmentTabValue] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [labtabValue, setlabtabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [labPage, setlabPage] =useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const rowsPerPage = 6;
  const [formData, setFormData] = useState({
    equipment_id: '',
    scheduled_date: '',
    type: '',
    description: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    units: 0,
    technician_notes: '',
  });

  useEffect(() => {
    fetchData();
    fetchLabData();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        setUsers(data);
      } catch (error: any) {
        console.error('Error fetching users:', error.message);
      }
    };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const managerId = user.id;
      
      // Step 1: Fetch labs managed by the current user
      const { data: managedLabs, error: labsError } = await supabase
        .from('lab')
        .select('id')
        .eq('manager_id', managerId);
  
      if (labsError) throw labsError;
      if (!managedLabs || managedLabs.length === 0) {
        setSchedules([]);
        setEquipment([]);
        return;
      }
  
      const managedLabIds = managedLabs.map((lab: any) => lab.id);
  
      // Step 2: Fetch equipment IDs associated with the managed labs
      const { data: managedEquipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id')
        .in('lab_id', managedLabIds);
  
      if (equipmentError) throw equipmentError;
      if (!managedEquipment || managedEquipment.length === 0) {
        setSchedules([]);
        setEquipment([]);
        return;
      }
  
      const managedEquipmentIds = managedEquipment.map((eq: any) => eq.id);
  
      // Step 3: Fetch maintenance schedules only for the managed equipment
      const [schedulesResponse, equipmentResponse] = await Promise.all([
        supabase
          .from('maintenance_schedules')
          .select(`
            *,
            equipment (
              id,
              name,
              category,
              manufacturer,
              model,
              quantity,
              status,
              lab_id
            )
          `)
          .in('equipment_id', managedEquipmentIds)
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('equipment')
          .select('*')
          .in('id', managedEquipmentIds)
          .order('name'),
      ]);
  
      if (schedulesResponse.error) throw schedulesResponse.error;
      if (equipmentResponse.error) throw equipmentResponse.error;
  
      // Additional filter to ensure we only show equipment from managed labs
      const filteredSchedules = schedulesResponse.data.filter(schedule => 
        managedEquipmentIds.includes(schedule.equipment_id)
      );
  
      setSchedules(filteredSchedules);
      setEquipment(equipmentResponse.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchLabData = async () => {
    try {
      setLabLoading(true);
      setLabError(null);
  
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      const managerId = user.id;
  
      // Fetch labs managed by the current user
      const { data: managedLabs, error: labsError } = await supabase
        .from('lab')
        .select('id, name, status', { count: 'exact' })
        .eq('manager_id', managerId);
  
      if (labsError) throw labsError;
      if (!managedLabs || managedLabs.length === 0) {
        setLabSchedules([]);
        setLab([]);
        return;
      }
  
      const managedLabIds = managedLabs.map(lab => lab.id);
  
      // Fetch lab maintenance schedules and lab data in parallel
      const [labSchedulesResponse, labResponse] = await Promise.all([
        supabase
          .from('lab_maintenance_schedules')
          .select(`
            *,
            lab (
              id,
              name,
              location,
              status
            )
          `)
          .in('lab_id', managedLabIds)
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('lab')
          .select('*')
          .in('id', managedLabIds)
          .order('name'),
      ]);
  
      if (labSchedulesResponse.error) throw labSchedulesResponse.error;
      if (labResponse.error) throw labResponse.error;
  
      // Additional filter to ensure we only show schedules for managed labs
      const filteredSchedules = labSchedulesResponse.data?.filter(schedule => 
        managedLabIds.includes(schedule.lab_id)
      ) || [];
  
      setLabSchedules(filteredSchedules);
      setLab(labResponse.data);
  
    } catch (error: any) {
      setLabError(error.message || 'Failed to fetch lab maintenance data');
      console.error('Error fetching lab data:', error);
    } finally {
      setLabLoading(false);
    }
  };
  const handleAddEditLab = (labSchedule?: lab_maintenance_schedules) => {
    if (labSchedule) {
      setLabFormData({
        lab_id: labSchedule.lab_id,
        scheduled_date: labSchedule.scheduled_date.split('T')[0],
        type: labSchedule.type,
        description: labSchedule.description,
        status: labSchedule.status,
        technician_notes: labSchedule.technician_notes || '',
      });
      setLabEditingSchedule(labSchedule);
    } else {
      setLabFormData({
        lab_id: '',
        scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        type: '',
        description: '',
        status: 'scheduled',
        technician_notes: '',
      });
      setLabEditingSchedule(null);
    } 
    setLabDialogOpen(true);
  

  };
  const handleDeleteLabClick = (labSchedule: lab_maintenance_schedules) => {
    setLabDeletingSchedule(labSchedule);
    setLabDeleteDialogOpen(true);

  };
  const handleLabDelete = async () => {
    if (!labDeletingSchedule) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('lab_maintenance_schedules')
        .delete()
        .eq('id', labDeletingSchedule.id);

      if (error) throw error;
      
      setSnackbarMessage('Lab maintenance schedule deleted successfully');
      setSnackbarOpen(true);
      fetchLabData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setLabDeleteDialogOpen(false);
    }
  };

  const sendNotificationToAllUsers = async (
      title: string,
      message: string,
      type: string
    ) => {
      try {
        const { error } = await supabase.from('notifications').insert(
          users.map((user) => ({
            id: crypto.randomUUID(),
            user_id: user.id,
            title,
            message,
            type,
            read: false,
            created_at: new Date().toISOString(),
          }))
        );
  
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error('Error sending notifications:', error.message);
      }
  };
  const handleLabSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLabLoading(true);
    setLabError(null);
  
    // Validate required fields
    if (!labFormData.lab_id || !labFormData.scheduled_date || !labFormData.type) {
      setLabError('Please fill in all required fields');
      setLabLoading(false);
      return;
    }
  
    try {
      // First, check if the lab exists and get its current status
      const { data: labData, error: labFetchError } = await supabase
        .from('lab')
        .select('status')
        .eq('id', labFormData.lab_id)
        .single();
  
      if (labFetchError) throw labFetchError;
      if (!labData) throw new Error('Lab not found');
  
      // Check lab availability based on the operation type
      if (!labEditingSchedule) {
        if (labData.status === 'occupied') {
          throw new Error('Lab is currently occupied and cannot be scheduled for maintenance');
        }
        if (labData.status === 'maintenance') {
          throw new Error('Lab is already under maintenance');
        }
        if (labData.status !== 'available') {
          throw new Error('Lab is not available for maintenance');
        }
      }
  
      // Perform the appropriate database operation
      let result;
      if (labEditingSchedule) {
        // Update existing schedule
        result = await supabase
          .from('lab_maintenance_schedules')
          .update(labFormData)
          .eq('id', labEditingSchedule.id)
          .single();
  
        // Update lab status based on maintenance status change
        if (labFormData.status === 'in_progress') {
          await supabase
            .from('lab')
            .update({ status: 'maintenance' })
            .eq('id', labFormData.lab_id);
        } else if (['completed', 'cancelled'].includes(labFormData.status)) {
          await supabase
            .from('lab')
            .update({ status: 'available' })
            .eq('id', labFormData.lab_id);
        }
      } else {
        // Insert new schedule
        result = await supabase
          .from('lab_maintenance_schedules')
          .insert([labFormData])
          .single();
  
        // Only set to maintenance if starting immediately
        if (labFormData.status === 'in_progress') {
          await supabase
            .from('lab')
            .update({ status: 'maintenance' })
            .eq('id', labFormData.lab_id);
        }
      }
  
      // Handle Supabase errors
      if (result.error) throw result.error;

      // Send notification
      const lab = labs.find((l) => l.id === labFormData.lab_id);
      const action = labEditingSchedule ? 'updated' : 'scheduled';
      const title = `Lab Maintenance ${action.charAt(0).toUpperCase() + action.slice(1)}: ${lab?.name}`;
      let message = `Maintenance for lab "${lab?.name}" has been ${action}. `;
      message += `Status: ${labFormData.status}. `;
      message += `Type: ${labFormData.type}.`;

      await sendNotificationToAllUsers(title, message, 'info');
  
      // Success message and UI updates
      setLabDialogOpen(false);
      setSnackbarMessage(
        labEditingSchedule
          ? 'Lab maintenance schedule updated successfully'
          : 'Lab maintenance schedule created successfully'
      );
      setSnackbarOpen(true);
      fetchLabData(); // Refresh lab data after successful operation
  
    } catch (error: any) {
      // Handle errors gracefully
      setLabError(error.message || 'Failed to save lab maintenance schedule');
      console.error('Error:', error);
    } finally {
      // Ensure loading state is reset
      setLabLoading(false);
    }
  };

  const handleAddEdit = (schedule?: MaintenanceSchedule) => {
    if (schedule && (schedule.status === 'completed' || schedule.status === 'cancelled')) {
      setError('Cannot edit a completed or cancelled maintenance schedule');
      return;
    }
    if (schedule) {
      setFormData({
        equipment_id: schedule.equipment_id,
        scheduled_date: schedule.scheduled_date.split('T')[0],
        type: schedule.type,
        description: schedule.description,
        status: schedule.status,
        units: schedule.units,
        technician_notes: schedule.technician_notes || '',
      });
      setEditingSchedule(schedule);
    } else {
      setFormData({
        equipment_id: '',
        scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        type: '',
        description: '',
        status: 'scheduled',
        units: 0,
        technician_notes: '',
      });
      setEditingSchedule(null);
    }
    setDialogOpen(true);
  };

  const handleDeleteClick = (schedule: MaintenanceSchedule) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSchedule) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('maintenance_schedules')
        .delete()
        .eq('id', deletingSchedule.id);

      if (error) throw error;
      
      setSnackbarMessage('Maintenance schedule deleted successfully');
      setSnackbarOpen(true);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const { equipment_id, scheduled_date, units } = formData;
      // Prevent resubmitting the same status
      if (editingSchedule && editingSchedule.status === formData.status) {
        setError('No changes detected in the status');
        return;
      }
      // Validate required fields
      if (!equipment_id || !scheduled_date || !units) {
        setError('Please fill in all required fields');
        return;
      }
      // Validate units
      if (units <= 0) {
        setError('Units must be greater than 0');
        return;
      }
      // Validate scheduled date
      const scheduledDate = new Date(scheduled_date);
      if (isNaN(scheduledDate.getTime())) {
        setError('Invalid scheduled date');
        return;
      }
      if (scheduledDate < new Date()) {
        setError('Scheduled date cannot be in the past');
        return;
      }
  
      // Fetch equipment details
      const { data: equipmentData, error: equipmentFetchError } = await supabase
        .from('equipment')
        .select('quantity, units_under_maintenance')
        .eq('id', equipment_id)
        .single();
  
      if (equipmentFetchError) throw equipmentFetchError;
  
      const { quantity, units_under_maintenance } = equipmentData;
  
      // Parse the scheduled date and time range
      const startTime = new Date(scheduled_date);
      const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000); // Example: 1-hour maintenance window
  
      // Fetch all approved and pending reservations for the selected equipment during the requested time period
      const { data: reservations, error: conflictError } = await supabase
        .from('reservations')
        .select('*')
        .eq('equipment_id', equipment_id)
        .in('status', ['approved', 'pending'])
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);
  
      if (conflictError) throw conflictError;
  
      // Calculate the total number of reserved units
      const reservedUnits = reservations.reduce((total, reservation) => total + reservation.quantity, 0);
  
      // Adjust units_under_maintenance to exclude the current schedule's units (if editing)
      let adjustedUnitsUnderMaintenance = units_under_maintenance;
      if (editingSchedule) {
        const previousUnits = editingSchedule.units;
        adjustedUnitsUnderMaintenance -= previousUnits; // Subtract the units already allocated to this schedule
      }
  
      // Calculate the available units
      const availableUnits = quantity - reservedUnits - adjustedUnitsUnderMaintenance;
  
      // Validate unit availability
      if (units > availableUnits) {
        throw new Error(
          `Not enough available units. Requested: ${units}, Available: ${availableUnits}`
        );
      }
  
      // Prepare the maintenance schedule data
      const data = {
        ...formData,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      };
  
      if (editingSchedule) {
        // Update the maintenance schedule
        const { error: scheduleError } = await supabase
          .from('maintenance_schedules')
          .update(data)
          .eq('id', editingSchedule.id);
  
        if (scheduleError) throw scheduleError;
  
        // Fetch the previous units under maintenance for this schedule
        const previousUnits = editingSchedule.units;
  
        // Calculate the new units_under_maintenance count
        let newUnitsUnderMaintenance = adjustedUnitsUnderMaintenance;
  
        if (formData.status === 'completed') {
          // Decrement the units_under_maintenance count when maintenance is completed
          newUnitsUnderMaintenance -= previousUnits;
        } else if (formData.status === 'cancelled') {
          // Decrement the units_under_maintenance count when maintenance is cancelled
          newUnitsUnderMaintenance -= previousUnits;
        } else if (formData.status === editingSchedule.status) {
          // If the status hasn't changed, only update the units if they have been modified
          newUnitsUnderMaintenance += formData.units - previousUnits;
        } else {
          // Handle status changes (e.g., re-scheduling or transitioning to "in_progress")
          if (editingSchedule.status === 'completed' || editingSchedule.status === 'cancelled') {
            // If the previous status was "completed" or "cancelled", add the units back
            newUnitsUnderMaintenance += previousUnits;
          }
          if (formData.status === 'in_progress' || formData.status === 'scheduled') {
            // If the new status is "in_progress" or "scheduled", ensure the units remain under maintenance
            newUnitsUnderMaintenance = Math.max(newUnitsUnderMaintenance, formData.units);
          }
        }
  
        // Ensure the count does not go below 0 or above the total quantity
        newUnitsUnderMaintenance = Math.max(0, Math.min(newUnitsUnderMaintenance, quantity));
  
        // Determine the new equipment status
        let newEquipmentStatus = 'operational'; // Default to operational
        if (newUnitsUnderMaintenance === quantity) {
          newEquipmentStatus = 'maintenance'; // All units are under maintenance
        }
  
        // Update the equipment record
        const { error: equipmentError } = await supabase
          .from('equipment')
          .update({ units_under_maintenance: newUnitsUnderMaintenance, status: newEquipmentStatus })
          .eq('id', equipment_id);
  
        if (equipmentError) throw equipmentError;
        // Send notification for updated maintenance schedule
      const equipmentItem = equipment.find((e) => e.id === formData.equipment_id);
      const title = `Maintenance Schedule Updated: ${equipmentItem?.name}`;
      let message = `The maintenance schedule for "${equipmentItem?.name}" has been updated to "${formData.status}".`;
      if (formData.status === 'in_progress') {
        message += ` "${equipmentItem?.units_under_maintenance}" units of this equipment are now under maintenance.`;
      } else if (formData.status === 'completed') {
        message += ` The maintenance has been completed and "${equipmentItem?.units_under_maintenance}" units of this equipment are now available for reservations.`;
      } else if (formData.status === 'cancelled') {
        message += ` The maintenance has been cancelled and "${equipmentItem?.units_under_maintenance}" units of this equipment are now available for reservations.`;
      }
      await sendNotificationToAllUsers(title, message, 'info');
  
        setSnackbarMessage('Maintenance schedule updated successfully');
      } else {
        // Insert a new maintenance schedule
        const { error: insertError } = await supabase
          .from('maintenance_schedules')
          .insert([data]);
  
        if (insertError) throw insertError;
  
        // Increment the units_under_maintenance count
        let newUnitsUnderMaintenance = units_under_maintenance + formData.units;
  
        // Ensure the count does not exceed the total quantity
        newUnitsUnderMaintenance = Math.min(newUnitsUnderMaintenance, quantity);
  
        // Determine the new equipment status
        let newEquipmentStatus = 'operational'; // Default to operational
        if (newUnitsUnderMaintenance === quantity) {
          newEquipmentStatus = 'maintenance'; // All units are under maintenance
        }
  
        // Update the equipment record
        const { error: equipmentError } = await supabase
          .from('equipment')
          .update({ units_under_maintenance: newUnitsUnderMaintenance, status: newEquipmentStatus })
          .eq('id', equipment_id);
  
        if (equipmentError) throw equipmentError;

        

  
        setSnackbarMessage('Maintenance scheduled successfully');

        // Send notification for new maintenance schedule
      const equipmentItem = equipment.find((e) => e.id === formData.equipment_id);
      const title = `New Maintenance Scheduled: ${equipmentItem?.name}`;
      const message = `A new maintenance schedule has been created for "${equipmentItem?.name}" with "${formData.units}" units.`;
      await sendNotificationToAllUsers(title, message, 'info');

        
      }
  
      setDialogOpen(false);
      setSnackbarOpen(true);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleEquipmentTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setEquipmentTabValue(newValue);
  };
  const handleTabChange =(_: React.SyntheticEvent, newValue: number) =>{
    setTabValue(newValue)
  };
  const handleLabTabChange =(_: React.SyntheticEvent, newValue: number) =>{
    setlabtabValue(newValue)
  };
  const handleChangePage = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  const handleLabChangePage = (_: React.ChangeEvent<unknown>, value: number) => {
    setlabPage(value);

  };

  const handleEventClick = (info: any) => {
    const schedule = schedules.find(s => s.id === info.event.id);
    if (schedule) {
      handleAddEdit(schedule);
    }
  };
  const handleLabEventClick =(info: any) => {
    const labschedule = labSchedule.find(s => s.id === info.event.id);
    if (labschedule) {
      handleAddEditLab(labschedule);
      }
  }

  // Apply filters
  const filteredSchedules = schedules.filter(schedule => {
    // Search filter
    const matchesSearch = 
      schedule.equipment?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.units.toString().includes(searchQuery.toLowerCase());

    
    // Status filter
    const matchesStatus = !statusFilter || schedule.status === statusFilter;
    
    // Type filter
    const matchesType = !typeFilter || schedule.type === typeFilter;
    
    // Date filter
    let matchesDate = true;
    const scheduleDate = parseISO(schedule.scheduled_date);
    const now = new Date();
    
    if (dateFilter === 'today') {
      matchesDate = isToday(scheduleDate);
    } else if (dateFilter === 'upcoming') {
      matchesDate = isAfter(scheduleDate, now);
    } else if (dateFilter === 'past') {
      matchesDate = isBefore(scheduleDate, now);
    } else if (dateFilter === 'thisWeek') {
      const nextWeek = addDays(now, 7);
      matchesDate = isAfter(scheduleDate, now) && isBefore(scheduleDate, nextWeek);
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });
  const labfilteredSchedules = labSchedule.filter(labSchedule => {
    // Search filter
    const matchesSearch = 
    labSchedule.lab?.name?.toLowerCase().includes(labsearchQuery.toLowerCase()) ||
    labSchedule.description?.toLowerCase().includes(labsearchQuery.toLowerCase()) ||
    labSchedule.type?.toLowerCase().includes(labsearchQuery.toLowerCase());


    // Lab Name filter
    const matchesLabName = !LabFilterName || labSchedule.lab_id === LabFilterName;

    // Status filter
    const matchesStatus = !statusLabFilter || labSchedule.status === statusLabFilter;
    // Type filter
    const matchesType = !labtypeFilter || labSchedule.type === labtypeFilter;
    // Date filter
    let matchesDate = true;
    const labscheduleDate = parseISO(labSchedule.scheduled_date);
    const now = new Date();
    if (labdateFilter === 'today') {
      matchesDate = isToday(labscheduleDate);
    } else if (labdateFilter === 'upcoming') {
      matchesDate = isAfter(labscheduleDate, now);
    }
    else if (labdateFilter === 'past') {
      matchesDate = isBefore(labscheduleDate, now);
    } else if (labdateFilter === 'thisWeek') {
      const nextWeek = addDays(now, 7);
      matchesDate = isAfter(labscheduleDate, now) && isBefore(labscheduleDate, nextWeek);
    }
    return matchesSearch && matchesLabName && matchesStatus && matchesType && matchesDate;
  });

  // Pagination
  const pageCount = Math.ceil(filteredSchedules.length / rowsPerPage);
  const labPageCount = Math.ceil(labfilteredSchedules.length / rowsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const labPaginatedSchedules = labfilteredSchedules.slice(
    (labPage - 1) * rowsPerPage,
    labPage * rowsPerPage
  )

  // Calendar events
  const calendarEvents = schedules.map(schedule => ({
    id: schedule.id,
    title: `${schedule.type}: ${schedule.equipment?.name}`,
    start: schedule.scheduled_date,
    backgroundColor: 
      schedule.status === 'completed' ? '#4caf50' :
      schedule.status === 'in_progress' ? '#ff9800' :
      schedule.status === 'cancelled' ? '#f44336' : '#2196f3',
    borderColor: 
      schedule.status === 'completed' ? '#2e7d32' :
      schedule.status === 'in_progress' ? '#e65100' :
      schedule.status === 'cancelled' ? '#c62828' : '#1565c0',
    extendedProps: {
      status: schedule.status,
      description: schedule.description,
      equipment: schedule.equipment
    }
  }));
  const calendarLabEvents = labSchedule.map(labSchedule =>({
    id: labSchedule.id,
    title: `${labSchedule.type}: ${labSchedule.lab?.name}`,
    start: labSchedule.scheduled_date,
    backgroundColor: 
      labSchedule.status === 'completed' ? '#4caf50' :
      labSchedule.status === 'in_progress' ? '#ff9800' :
      labSchedule.status === 'cancelled' ? '#f44336' : '#2196f3',
    borderColor: 
      labSchedule.status === 'completed' ? '#2e7d32' :
      labSchedule.status === 'in_progress' ? '#e65100' :
      labSchedule.status === 'cancelled' ? '#c62828' : '#1565c0',
    extendedProps: {
      status: labSchedule.status,
      description: labSchedule.description,
      equipment: labSchedule.lab
    }
    
    

  }));

  if (loading && schedules.length === 0) {
    return <CircularProgress />;
  }
  if(labLoading && labSchedule.length === 0){

    return <CircularProgress />;
  }

  return (
    <Box>
      <Box >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="maintenance view tabs">
          <Tab label="Lab Maintenance Scheduling"/>
          <Tab label="Maintenance Scheduling" />
        </Tabs>
      </Box>
      
      
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Lab Maintenance Scheduling
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleAddEditLab()}
            >
              Schedule a Lab Maintenance
            </Button>
          </Box>
          {labError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLabError(null)}>
              {labError}
            </Alert>
          )}
          {/* Lab Search and Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search lab maintenance schedules..."
                variant="outlined"
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
                onClick={() => setShowLabFilters(!showLabFilters)}
                size="small"
              >
                {showLabFilters ? 'Hide Lab Filters' : 'Show Lab Filters'}
              </Button>
            </Box>
            {showLabFilters && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Lab</InputLabel>
                      <Select
                        value={LabFilterName}
                        label="Lab"
                        onChange={(e) => setLabFilterName(e.target.value )}
                      >
                        <MenuItem value="">All Labs</MenuItem>
                        {labs.map((lab) => (
                          

                          <MenuItem key={lab.id} value={lab.id}>
                            {lab.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusLabFilter}
                        label="Status"
                        onChange={(e) => setStatusLabFilter(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={labtypeFilter}
                        label="Type"
                        onChange={(e) => setLabTypeFilter(e.target.value)}
                        >
                        <MenuItem value="">All Types</MenuItem>
                        {maintenanceTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Date</InputLabel>
                      <Select
                        value={labdateFilter}
                        label="Date"
                        onChange={(e) => setLabDateFilter(e.target.value)}
                      >
                        <MenuItem value="">All Dates</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="upcoming">Upcoming</MenuItem>
                        <MenuItem value="thisWeek">This Week</MenuItem>
                        <MenuItem value="past">Past</MenuItem>
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
                      setLabFilterName('');
                      setStatusLabFilter('');
                      setTypeFilter('');
                      setDateFilter('');
                      setShowLabFilters(false);
                    }}
                  >
                    Clear Lab Filters
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
          {/* View Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={labtabValue} onChange={handleLabTabChange} aria-label="lab maintenance view tabs">
              <Tab label="Lab Grid View" />
              <Tab label="Lab Table View" />
              <Tab label="Lab Calendar View" icon={<EventIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Grid View */}
          <TabPanel value={labtabValue} index={0}>
            <Grid container spacing={3}>
              {labfilteredSchedules.length > 0 ? (
                labPaginatedSchedules.map((labSchedule) => (
                  <Grid item key={labSchedule.id} xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {labSchedule.lab?.name}
                          </Typography>
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleAddEditLab(labSchedule)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteLabClick(labSchedule)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={labSchedule.type}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                          <Chip
                            label={labSchedule.status}
                            color={getStatusColor(labSchedule.status)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        <Box component="span" fontWeight="medium">
                          Scheduled:
                        </Box>{' '}
                        {format(new Date(labSchedule.scheduled_date), 'PPp')}
                        {isToday(new Date(labSchedule.scheduled_date)) && (
                          <Chip
                            label="Today"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                        <Typography variant="body2" paragraph>
                          {labSchedule.description}
                        </Typography>
                        {labSchedule.technician_notes && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                              Notes:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {labSchedule.technician_notes}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddEditLab(labSchedule)}
                          >
                            Update Status
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6">No Lab maintenance schedules found</Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {searchQuery || statusLabFilter || typeFilter || dateFilter
                        ? 'Try adjusting your search or filter criteria'
                        : 'No Lab maintenance schedules have been created yet'}
                    </Typography>
                    {!searchQuery && !statusLabFilter && !typeFilter && !dateFilter && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddEditLab()}
                        sx={{ mt: 2 }}
                      >
                        Schedule Lab Maintenance
                      </Button>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
            {/* Pagination */}
            {labPageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={labPageCount}
                  page={labPage}
                  onChange={handleLabChangePage}
                  color="primary"
                />
              </Box>
            )}
          </TabPanel>
          {/* Table View */}
          <TabPanel value={labtabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lab</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labfilteredSchedules.length > 0 ? (
                    labPaginatedSchedules.map((labSchedule) => (
                      <TableRow key={labSchedule.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {labSchedule.lab?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {labSchedule.lab?.location}
                          </Typography>
                        </TableCell>
                        <TableCell>{labSchedule.type}</TableCell>
                        <TableCell>
                          {format(new Date(labSchedule.scheduled_date), 'PPp')}
                          {isToday(new Date(labSchedule.scheduled_date)) && (
                            <Chip
                              label="Today"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={labSchedule.status}
                            color={getStatusColor(labSchedule.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAddEditLab(labSchedule)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteLabClick(labSchedule)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="subtitle1" sx={{ py: 2 }}>
                          No Lab maintenance schedules found
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
                  onChange={handleLabChangePage}
                  color="primary"
                />
              </Box>
            )}
          </TabPanel>
          {/* Calendar View */}
          <TabPanel value={labtabValue} index={2}>
            <Paper sx={{ p: 2 }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarLabEvents}
                eventClick={handleLabEventClick}
                height="auto"
                aspectRatio={1.5}
              />
            </Paper>
          </TabPanel>
          {/* Add/Edit Dialog */}
          <Dialog
            open={labDialogOpen}
            onClose={() => {
              setLabDialogOpen(false);
              setLabFormData({
                lab_id: '',
                scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                type: '',
                description: '',
                status: 'scheduled',
                technician_notes: '',
              });
              setLabEditingSchedule(null); // Clear editing state
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {labEditingSchedule ? 'Update Lab Maintenance Schedule' : 'Lab Schedule Maintenance'}
            </DialogTitle>
            <DialogContent>
              {labError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {labError}
                </Alert>
              )}
              <form onSubmit={handleLabSubmit}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Lab Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Lab</InputLabel>
                      <Select
                        value={labFormData.lab_id}
                        label="Lab"
                        onChange={(e) => setLabFormData({ ...labFormData, lab_id: e.target.value })}
                      >
                        {labs.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name} ({item.location}) 
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Maintenance Type */}
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Maintenance Type</InputLabel>
                      <Select
                        value={labFormData.type}
                        label="Maintenance Type"
                        onChange={(e) => setLabFormData({ ...labFormData, type: e.target.value })}
                      >
                        {maintenanceTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                

                  {/* Scheduled Date */}
                  <Grid item xs={12}>
                    <TextField
                      type="datetime-local"
                      label="Scheduled Date"
                      fullWidth
                      required
                      value={labFormData.scheduled_date}
                      onChange={(e) => setLabFormData({ ...labFormData, scheduled_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      value={labFormData.description}
                      onChange={(e) => setLabFormData({ ...labFormData, description: e.target.value })}
                      placeholder="Describe the maintenance to be performed"
                    />
                  </Grid>

                  {/* Additional Fields for Editing */}
                  {labEditingSchedule && (
                    <>
                      {/* Status */}
                      <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={labFormData.status}
                          label="Status"
                          onChange={(e) =>
                            setLabFormData({
                              ...labFormData,
                              status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                            })
                          }
                        >
                          {/* Always include the current status */}
                            <MenuItem value={labFormData.status} disabled>
                              {labFormData.status.charAt(0).toUpperCase() + labFormData.status.slice(1).replace('_', ' ')}
                            </MenuItem>
                          {/* Exclude the current status from the list of options */}
                          {['scheduled', 'in_progress', 'completed', 'cancelled']
                            .filter((status) => status !== labFormData.status)
                            .map((status) => (
                              <MenuItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                      </Grid>

                      {/* Technician Notes */}
                      <Grid item xs={12}>
                        <TextField
                          label="Technician Notes"
                          fullWidth
                          multiline
                          rows={3}
                          value={labFormData.technician_notes}
                          onChange={(e) =>
                            setLabFormData({ ...labFormData, technician_notes: e.target.value })
                          }
                          placeholder="Add notes about the maintenance performed or issues encountered"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLabDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleLabSubmit}
                color="primary"
                variant="contained"
                disabled={labLoading}
              >
                {labLoading ? <CircularProgress size={24} /> : labEditingSchedule ? 'Update' : 'Schedule'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={labDeletingDialogOpen}
            onClose={() => setLabDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this lab maintenance schedule for "{labDeletingSchedule?.lab?.name}"?
              </Typography>
              {labDeletingSchedule && (
                <Box sx={{ mt: 2 }}>
                  
                  <Typography variant="body2">
                    <strong>Scheduled Date:</strong> {format(new Date(labDeletingSchedule.scheduled_date), 'PPp')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {labDeletingSchedule.status}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLabDeleteDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleLabDelete} 
                color="error" 
                variant="contained"
                disabled={labLoading}
              >
                {labLoading ? <CircularProgress size={24} /> : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
        </TabPanel>



        <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Maintenance Scheduling
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleAddEdit()}
            
          >
            Schedule Equipment Maintenance
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search maintenance schedules..."
              variant="outlined"
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
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>

          {showFilters && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>  
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Type"

                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {maintenanceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Date"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="">All Dates</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="upcoming">Upcoming</MenuItem>
                      <MenuItem value="thisWeek">This Week</MenuItem>
                      <MenuItem value="past">Past</MenuItem>
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
                    setTypeFilter('');
                    setDateFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* View Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={EquipmenttabValue} onChange={handleEquipmentTabChange} aria-label="maintenance view tabs">
            <Tab label="Grid View" />
            <Tab label="Table View" />
            <Tab label="Calendar View" icon={<EventIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Grid View */}
        <TabPanel value={EquipmenttabValue} index={0}>
          <Grid container spacing={3}>
            {filteredSchedules.length > 0 ? (
              paginatedSchedules.map((schedule) => (
                <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {schedule.equipment?.name}
                        </Typography>
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleAddEdit(schedule)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(schedule)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={schedule.type}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <Box component="span" fontWeight="medium">Quantity:</Box> {schedule.units}
                          </Typography>
                        </Box>

                        <Box component="span" fontWeight="medium">Scheduled:</Box> {format(new Date(schedule.scheduled_date), 'PPp')}
                        {isToday(new Date(schedule.scheduled_date)) && (
                          <Chip 
                            label="Today" 
                            color="error" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      
                      <Typography variant="body2" paragraph>
                        {schedule.description}
                      </Typography>
                      {schedule.technician_notes && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium">
                            Notes:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.technician_notes}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddEdit(schedule)}
                        >
                          Update Status
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6">No Equipment maintenance schedules found</Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {searchQuery || statusFilter || typeFilter || dateFilter 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No Equipment maintenance schedules have been created yet'}
                  </Typography>
                  {!searchQuery && !statusFilter && !typeFilter && !dateFilter && (
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={() => handleAddEdit()}
                      sx={{ mt: 2 }}
                    >
                      Schedule Maintenance
                    </Button>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>

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

        {/* Table View */}
        <TabPanel value={EquipmenttabValue} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Units</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.length > 0 ? (
                  paginatedSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {schedule.equipment?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {schedule.equipment?.category}
                        </Typography>
                      </TableCell>
                      <TableCell>{schedule.type}</TableCell>
                      <TableCell>
                        {format(new Date(schedule.scheduled_date), 'PPp')}
                        {isToday(new Date(schedule.scheduled_date)) && (
                          <Chip 
                            label="Today" 
                            color="error" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{schedule.units}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddEdit(schedule)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteClick(schedule)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="subtitle1" sx={{ py: 2 }}>
                        No Equipment maintenance schedules found
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

        {/* Calendar View */}
        <TabPanel value={EquipmenttabValue} index={2}>
          <Paper sx={{ p: 2 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              aspectRatio={1.5}
            />
          </Paper>
        </TabPanel>
          {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setFormData({
              equipment_id: '',
              scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
              type: '',
              description: '',
              status: 'scheduled',
              units: 0,
              technician_notes: '',
            });
            setEditingSchedule(null); // Clear editing state
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingSchedule ? 'Update Maintenance Schedule' : 'Schedule Maintenance'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Equipment Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Equipment</InputLabel>
                    <Select
                      value={formData.equipment_id}
                      label="Equipment"
                      onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                    >
                      {equipment.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name} ({item.category}) ({item.quantity} units)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Maintenance Type */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Maintenance Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Maintenance Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {maintenanceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Number of Units */}
                <Grid item xs={12}>
                  <TextField
                    margin="dense"
                    label="How many units need to be maintained?"
                    type="number"
                    fullWidth
                    required
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    InputProps={{
                      inputProps: { min: 1 },
                    }}
                  />
                </Grid>

                {/* Scheduled Date */}
                <Grid item xs={12}>
                  <TextField
                    type="datetime-local"
                    label="Scheduled Date"
                    fullWidth
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the maintenance to be performed"
                  />
                </Grid>

                {/* Additional Fields for Editing */}
                {editingSchedule && (
                  <>
                    {/* Status */}
                    <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                          })
                        }
                      >
                        {/* Always include the current status */}
                          <MenuItem value={formData.status} disabled>
                            {formData.status.charAt(0).toUpperCase() + formData.status.slice(1).replace('_', ' ')}
                          </MenuItem>
                        {/* Exclude the current status from the list of options */}
                        {['scheduled', 'in_progress', 'completed', 'cancelled']
                          .filter((status) => status !== formData.status)
                          .map((status) => (
                            <MenuItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    </Grid>

                    {/* Technician Notes */}
                    <Grid item xs={12}>
                      <TextField
                        label="Technician Notes"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.technician_notes}
                        onChange={(e) =>
                          setFormData({ ...formData, technician_notes: e.target.value })
                        }
                        placeholder="Add notes about the maintenance performed or issues encountered"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              color="primary"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : editingSchedule ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this maintenance schedule for "{deletingSchedule?.equipment?.name}"?
            </Typography>
            {deletingSchedule && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Type:</strong> {deletingSchedule.type}
                </Typography>
                <Typography variant="body2">
                  <strong>Scheduled Date:</strong> {format(new Date(deletingSchedule.scheduled_date), 'PPp')}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {deletingSchedule.status}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
        </TabPanel>

      </Box>
    </Box>
  );
}