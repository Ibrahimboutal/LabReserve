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
  MenuItem,
  CircularProgress,
  Alert,
  TableContainer,
} from '@mui/material';
import { supabase } from '@/lib/supabase';
import { users } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function UserManagement() {
  const [users, setUsers] = useState<users[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<users | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const { user: authUser } = useAuth(); // Get current user from auth context
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
    
  
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      department: '',
      role: 'lab_manager' as 'lab_manager' | 'admin',
    });


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: users) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser || !newRole || !authUser) return;

    try {
      // Check if current user has admin privileges
      if (authUser.role !== 'admin') {
        throw new Error('Admin privileges required');
      }

      const normalizedRole = newRole.toLowerCase();

      const { data, error } = await supabase
        .from('users')
        .update({ role: normalizedRole })
        .eq('id', selectedUser.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      setError(`Update failed: ${error.message}`);
    }
  };
  // Handle creating a staff account
  const handleCreateStaff = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('No user ID returned');

      // Create user profile with admin/lab_manager role
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            role: formData.role,
            department: formData.department,
          },
        ]);

      if (profileError) throw profileError;



      setOpenStaffDialog(false);

      // Reset form
      setFormData({
        email: '',
        password: '',
        department: '',
        role: 'lab_manager',
      });
    } catch (error) {
      console.error('Error creating staff account:', error);
      // Handle error (show error message to user)
    }
  };


  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
    <Typography variant="h6" gutterBottom>
    User Management
    </Typography>
             <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenStaffDialog(true)} // Open staff dialog
               >
                Create Staff Account
             </Button>
    </Box>
    
    {/* User Table */}
    <TableContainer component={Paper}>
    <Table>
    <TableHead>
    <TableRow>
    <TableCell>Email</TableCell>
    <TableCell>Department</TableCell>
    <TableCell>Role</TableCell>
    <TableCell>Actions</TableCell>
    </TableRow>
    </TableHead>
    <TableBody>
    {users.map((user) => (
    <TableRow key={user.id}>
    <TableCell>{user.email}</TableCell>
    <TableCell>{user.department}</TableCell>
    <TableCell>{user.role}</TableCell>
    <TableCell>
    <Button size="small" onClick={() => handleEditUser(user)}>
    Edit Role
    </Button>
    </TableCell>
    </TableRow>
    ))}
    </TableBody>
    </Table>
    </TableContainer>
    
    {/* Edit Role Dialog */}
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
    <DialogTitle>Edit User Role</DialogTitle>
    <DialogContent>
    <form onSubmit={handleSubmit}>
    <TextField
    margin="dense"
    label="Role"
    select
    fullWidth
    required
    value={newRole}
    onChange={(e) => setNewRole(e.target.value)}
    >
    <MenuItem value="student">Student</MenuItem>
    <MenuItem value="lab_manager">Lab Manager</MenuItem>
    <MenuItem value="admin">Admin</MenuItem>
    </TextField>
    </form>
    </DialogContent>
    <DialogActions>
    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
    <Button type="submit" onClick={handleSubmit} color="primary">
    Update
    </Button>
    </DialogActions>
    </Dialog>
    {/* Create Staff Account Dialog */}
    <Dialog open={openStaffDialog} onClose={() => setOpenStaffDialog(false)}>
        <DialogTitle>Create Staff Account</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            required
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Role"
            select
            fullWidth
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'lab_manager' | 'admin' })}
          >
            <MenuItem value="lab_manager">Lab Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStaffDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateStaff} color="primary">
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    );
    }