import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  TableContainer,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Grid,
  Container,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { supabase } from '@/lib/supabase';
import { Lab } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function LabManagement() {
  const [lab, setLab] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [newManager, setNewManager] = useState<string>('');
  const [newImageurl, setNewImageurl] = useState<string>('')
  const [newLocation, setNewLocation] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newFeatures, setNewFeatures] = useState('');
  const [newStatus, setNewStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [newCapacity, setNewCapacity] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const { user: authUser } = useAuth(); // Get current user from auth context
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reservationError, setReservationError] = useState('');
  

  // Separate state for each dialog
  const [openLabDialog, setOpenLabDialog] = useState(false);
  const [labFormData, setLabFormData] = useState({
    name: '',
    location: '',
    manager_id: '',
    image_url: '',
    capacity: '',
    status: '',
    features: [] as string[],
    description: '',
  });
  const [page, setPage] = useState(1); // Current page for lab
  const [pageSize, setPageSize] = useState(5); // Items per page for lab

  useEffect(() => {
    fetchLabs();
    fetchUsers();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from('lab')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLab(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
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

  const handleEditLab = (lab: Lab) => {
    setReservationError('');
        
    setSelectedLab(lab);
    setNewName(lab.name);
    setNewManager(lab.manager_id);
    setNewImageurl(lab.image_url);
    setNewLocation(lab.location);
    setNewCapacity(lab.capacity);
    setNewDescription(lab.description);
    setNewFeatures(lab.features);
    setNewStatus(lab.status);

    setDialogOpen(true);
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
          .from('lab-images')
          .upload(filePath, file);
  
        if (uploadError) throw uploadError;
  
        const { data: { publicUrl } } = supabase.storage
          .from('lab-images')
          .getPublicUrl(filePath);
  
        setLabFormData(prev => ({
          ...prev,
          image_url: publicUrl
        }));
      } catch (error: any) {
        setError('Error uploading image: ' + error.message);
      } finally {
        setUploadingImage(false);
      }
    };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Validate required fields
    if (!selectedLab || !newName || !newManager || !newImageurl || !newLocation || !newCapacity || !newDescription || !newFeatures || !newStatus) {
      setError('Please fill all fields');
      console.error('Validation failed:', {
        selectedLab,
        newName,
        newManager,
        uploadingImage,
        newLocation,
        newCapacity,
        newDescription,
        newFeatures,
        newStatus,
      });
      return;
    }
  
    try {
      console.log('Updating lab with ID:', selectedLab.id);
  
      const { data, error } = await supabase
        .from('lab')
        .update({
          name: newName,
          manager_id: newManager,
          image_url: newImageurl,
          location: newLocation,
          capacity: newCapacity,
          description: newDescription,
          features: newFeatures,
          status: newStatus,
        })
        .eq('id', selectedLab.id);
  
      console.log('Update Response:', { data, error });
  
      if (error) {
        throw error;
      }
      // Send notification to all users

      await sendNotificationToAllUsers(
        'system',
        'Lab Updated',
        `Lab ${newName} has been updated.`,
        'lab_update'
      );

  
      // Close the dialog and refresh the labs list
      setDialogOpen(false);
      fetchLabs();
    } catch (error: any) {
      console.error('Error updating lab:', error.message);
      setError(error.message);
    }
  };
  

  const handleCreateLab = async () => {
    try {
      // Check if current user has admin privileges
      if (!authUser || authUser.role !== 'admin') {
        throw new Error('Admin privileges required');
      }

      // Validate required fields
      if (
        !labFormData.name ||
        !labFormData.location ||
        !labFormData.manager_id ||
        !labFormData.image_url ||
        !labFormData.capacity ||
        !labFormData.description ||
        !labFormData.features ||
        !labFormData.status
      ) {
        throw new Error('Please fill all required fields');
      }

      // Convert capacity to a number
      const capacity = Number(labFormData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        throw new Error('Capacity must be a positive number');
      }

      // Create lab entry in the database
      const { data: labData, error: labError } = await supabase
        .from('lab')
        .insert([
          {
            name: labFormData.name,
            location: labFormData.location,
            manager_id: labFormData.manager_id,
            image_url: labFormData.image_url,
            capacity: capacity,
            description: labFormData.description,
            features: labFormData.features.map((feature: string) => feature.trim()),
            status: labFormData.status,
          },
        ])
        .select();

      if (labError) throw labError;

      // Success handling
      setOpenLabDialog(false);

      // Reset form fields
      setLabFormData({
        name: '',
        location: '',
        manager_id: '',
        image_url: '',
        capacity: '',
        description: '',
        features: [],
        status: '',
      });

      // Fetch updated labs
      fetchLabs();

      // Send notification to all users
      await sendNotificationToAllUsers(
        'system',
        'New Lab Created',
        `Lab ${labFormData.name} has been created.`,
        'lab_creation'
      );

      // Optional: Show success notification
      console.log('Lab created successfully:', labData);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating lab:', error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error('Error creating lab:', error);
        alert('An unexpected error occurred.');
      }
    }
  };
  

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Pagination logic for lab
  const paginatedLab = lab.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Handle page change for lab
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  if (error) {
      return (
        <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      );
    }

  return (
    <Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Lab Management</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenLabDialog(true)}>
          Create Lab
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Features</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLab.map((lab) => (
              <TableRow key={lab.id}>
                <TableCell>{lab.name}</TableCell>
                <TableCell>{lab.location}</TableCell>
                <TableCell>{users.find((user) => user.role === 'lab_manager' && user.id === lab.manager_id)?.email || 'Unassigned'}</TableCell>
                <TableCell>{lab.capacity}</TableCell>
                <TableCell>{lab.description}</TableCell>
                <TableCell>{lab.features}</TableCell>
                <TableCell>{lab.status}</TableCell>
                <TableCell>
                  <Button variant="contained" color="primary" onClick={() => handleEditLab(lab)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                  <InputLabel>Items Per Page</InputLabel>
                  <Select
                    value={pageSize}
                    label="Items Per Page"
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1); // Reset to the first page when page size changes
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={15}>15</MenuItem>
                  </Select>
          </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Typography variant="body1">Page {page}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handlePageChange(page + 1)}
          disabled={paginatedLab.length < pageSize}
        >
          Next
        </Button>
      </Box>

      {/* Edit Lab Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Lab</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Manager</InputLabel>
            <Select
              value={newManager}
              onChange={(e) => setNewManager(e.target.value as string)}
              label="Manager"
            >
            {users
              .filter((user) => user.role === 'lab_manager')
              .map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
                  {labFormData.image_url && (
                    <Typography variant="body2" color="textSecondary">
                      Image uploaded successfully
                    </Typography>
                  )}
                </Box>
              </Grid>

          <TextField
            label="Location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Capacity"
            value={newCapacity}
            onChange={(e) => setNewCapacity(Number(e.target.value))}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Features"
            value={newFeatures}
            onChange={(e) => setNewFeatures(e.target.value)} // Store the raw input as a string
            fullWidth
            required
            margin="normal"
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as 'available' | 'occupied' | 'maintenance')}
              label="Status"
              
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Lab Dialog */}
      <Dialog open={openLabDialog} onClose={() => setOpenLabDialog(false)}>
        <DialogTitle>Create Lab</DialogTitle>
        <DialogContent>
          {reservationError && <Alert severity="error">{reservationError}</Alert>}
          {/* Name Field */}
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            required
            value={labFormData.name}
            onChange={(e) => setLabFormData({ ...labFormData, name: e.target.value })}
          />
          {/* Location Field */}
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            required
            value={labFormData.location}
            onChange={(e) => setLabFormData({ ...labFormData, location: e.target.value })}
          />
          {/* Manager ID Dropdown */}
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Manager ID</InputLabel>
            <Select
              label="Manager ID"
              value={labFormData.manager_id}
              onChange={(e) => setLabFormData({ ...labFormData, manager_id: e.target.value })}
            >
              {users
              .filter((user) => user.role === 'lab_manager')
              .map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
                  {labFormData.image_url && (
                    <Typography variant="body2" color="textSecondary">
                      Image uploaded successfully
                    </Typography>
                  )}
                </Box>
              </Grid>
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            required
            value={labFormData.capacity}
            onChange={(e) => setLabFormData({ ...labFormData, capacity: e.target.value })}
            InputProps={{
              inputProps: { min: 1 },
            }}
          />
          <TextField
            label="Description"
            value={labFormData.description}
            onChange={(e) => setLabFormData({ ...labFormData, description: e.target.value })}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Features"
            value={labFormData.features}
            onChange={(e) => setLabFormData({ ...labFormData, features: e.target.value.split(',') })}
            fullWidth
            required
            margin="normal"
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Status</InputLabel>
            <Select
              value={labFormData.status}
              onChange={(e) =>
                setLabFormData({ ...labFormData, status: e.target.value as 'available' | 'occupied' | 'maintenance' })
              }
              label="Status"
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLabDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateLab} color="primary">
            Create Lab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}