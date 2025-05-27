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
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { Equipment } from '@/types';

const defaultSpecs = {
  dimensions: '',
  weight: '',
  power_requirements: '',
  calibration_interval: '',
  safety_requirements: '',
  operating_conditions: ''
};





export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    manufacturer: '',
    model: '',
    quantity: 1,
    image_url: '',
    detailed_specs: defaultSpecs,
    status: 'operational',
    lab_id: '',
  });
  
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetchLabs();
  }, []);
  
  const fetchLabs = async () => {
    try {
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
        

        setLabs([]);
        return;
      }
  
      const managedLabIds = managedLabs.map(lab => lab.id);
      const { data, error } = await supabase
        .from('lab')
        .select('id, name, location')
        .in('id', managedLabIds)
        .order('name');
  
      if (error) throw error;
      setLabs(data);
    } catch (error: any) {
      setError(error.message);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchCategories().then((categories) => setCategories(categories || []));
    fetchCategories();
    fetchAllUsers();
    
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
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
        .select('id')
        .in('lab_id', managedLabIds); // Fetch equipment where lab_id is in the managed labs

      if (equipmentError) throw equipmentError;

      // Extract equipment IDs
      const managedEquipmentIds = managedEquipment.map((eq: any) => eq.id);



      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .in('id', managedEquipmentIds) // Fetch equipment where id is in the managed equipment
        .order('name');

      if (error) throw error;
      setEquipment(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ? data.map((category: any) => category.name) : [];
    }
    catch (error: any) {
      setError(error.message);
    }
    finally {
      setLoading(false);
    }
  }
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

  const sendNotificationToAllUsers = async (
        createdBy: string,
        title: string,
        message: string,
        type: string
      ) => {
        try {
          const { error } = await supabase.from('notifications').insert(
            users.map((user) => ({
              id: crypto.randomUUID(),
              user_id: user.id,
              created_by: createdBy,
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
  

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));
    } catch (error: any) {
      setError('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddEdit = (equipment?: Equipment) => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        category: equipment.category,
        description: equipment.description || '',
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        quantity: 1,
        image_url: equipment.image_url || '',
        detailed_specs: equipment.detailed_specs || defaultSpecs,
        status: equipment.status,
        lab_id: equipment.lab_id
      });
      setEditingEquipment(equipment);
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        manufacturer: '',
        model: '',
        quantity: 1,
        image_url: '',
        detailed_specs: defaultSpecs,
        status: 'operational',
        lab_id: '',
      });
      setEditingEquipment(null);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingEquipment) {
        const { error } = await supabase
          .from('equipment')
          .update(formData)
          .eq('id', editingEquipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([formData]);
        if (error) throw error;

        await sendNotificationToAllUsers(
          'System',
          'New Equipment Added',
          `New equipment "${formData.name}" has been added.`,
          'Equipment created'
        );
      }
      setDialogOpen(false);
      fetchEquipment();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      detailed_specs: {
        ...prev.detailed_specs,
        [key]: value
      }
    }));
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  async function handleDelete(id: string, name: string) {
    const confirmDelete = window.confirm('Are you sure you want to delete this equipment?');
    if (!confirmDelete) return;
  
    try {
      // Step 1: Fetch the equipment details to check its status
      const { data: equipmentData, error: fetchError } = await supabase
        .from('equipment')
        .select('status')
        .eq('id', id)
        .single();
  
      if (fetchError) throw new Error(`Failed to fetch equipment details: ${fetchError.message}`);
      if (!equipmentData) throw new Error('Equipment not found');
  
      // Step 2: Check if the equipment is in an invalid state for deletion
      const invalidStates = {
        reserved: 'This equipment is currently reserved and cannot be deleted.',
        maintenance: 'This equipment is currently under maintenance and cannot be deleted.',
        out_of_order: 'This equipment is out of order and cannot be deleted until resolved.',
      };
  
      const currentStatus = equipmentData.status as keyof typeof invalidStates;
      if (invalidStates[currentStatus]) {
        throw new Error(invalidStates[currentStatus]);
      }
  
      // Step 3: Check the Reservation table for active reservations ('pending' or 'approved')
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('equipment_id', id)
        .in('status', ['pending', 'approved']); // Check for 'pending' or 'approved' reservations
  
      if (reservationError) throw new Error(`Failed to check reservations: ${reservationError.message}`);
      if (reservations && reservations.length > 0) {
        throw new Error('This equipment has active reservations and cannot be deleted.');
      }
  
      // Step 4: Proceed with deletion if the equipment is in an appropriate state
      const { error: deleteError } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
  
      if (deleteError) throw new Error(`Failed to delete equipment: ${deleteError.message}`);

       // Step 5: Send notification to all users about the deletion
      await sendNotificationToAllUsers(
        'System',
        'Equipment Deleted',
        `Equipment: "${name}" has been deleted.`,
        'Equipment deleted'
      );
  
      // Success: Refresh the equipment list
      fetchEquipment();
    } catch (error: any) {
      // Handle errors gracefully with a popup message
      let errorMessage = error.message || 'An unexpected error occurred while deleting the equipment.';
      
      // Display specific error messages for known cases
      if (errorMessage.includes('active reservations')) {
        errorMessage = 'This equipment has active reservations and cannot be deleted.';
      }
  
      // Show the error message in a popup
      window.alert(errorMessage);
      console.error('Error:', error);
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Equipment Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleAddEdit()}
        >
          Add Equipment
        </Button>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Search Equipment"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category Filter</InputLabel>
            <Select
              value={categoryFilter}
              label="Category Filter"
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
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="operational">Operational</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="out_of_order">Out of Order</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      


      {/* Equipment Grid */}
      <Grid container spacing={3}>
        {filteredEquipment.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={item.image_url || 'https://picsum.photos/200/300'}
                alt={item.name}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{item.name}</Typography>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleAddEdit(item)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error"onClick={() => {
                          handleDelete(item.id, item.name);
                        }}
                        >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Chip
                  label={item.category}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={item.status}
                  color={
                    item.status === 'operational' ? 'success' :
                    item.status === 'maintenance' ? 'warning' : 'error'
                  }
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  {item.manufacturer} {item.model}
                </Typography>
                <Typography variant="body2">
                  {item.description}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                Quantity: {item.quantity}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Lab</InputLabel>
                  <Select
                  value={formData.lab_id}
                  label="Lab"
                  onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
                >
                  {labs.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </MenuItem>
                  ))}
                </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Manufacturer"
                  fullWidth
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model"
                  fullWidth
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploadingImage}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  {uploadingImage && <CircularProgress size={24} />}
                  {formData.image_url && (
                    <Typography variant="body2" color="textSecondary">
                      Image uploaded successfully
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Specifications</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Dimensions"
                      fullWidth
                      value={formData.detailed_specs.dimensions}
                      onChange={(e) => handleSpecChange('dimensions', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Weight"
                      fullWidth
                      value={formData.detailed_specs.weight}
                      onChange={(e) => handleSpecChange('weight', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Power Requirements"
                      fullWidth
                      value={formData.detailed_specs.power_requirements}
                      onChange={(e) => handleSpecChange('power_requirements', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Calibration Interval"
                      fullWidth
                      value={formData.detailed_specs.calibration_interval}
                      onChange={(e) => handleSpecChange('calibration_interval', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Safety Requirements"
                      fullWidth
                      value={formData.detailed_specs.safety_requirements}
                      onChange={(e) => handleSpecChange('safety_requirements', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Operating Conditions"
                      fullWidth
                      value={formData.detailed_specs.operating_conditions}
                      onChange={(e) => handleSpecChange('operating_conditions', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="operational">Operational</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="out_of_order">Out of Order</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingEquipment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}