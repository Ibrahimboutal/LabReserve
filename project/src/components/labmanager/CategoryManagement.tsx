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
  IconButton,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  equipment_count?: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // First get all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      
      // Then get equipment counts for each category
      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('equipment')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name);
            
          if (countError) throw countError;
          
          return {
            ...category,
            equipment_count: count || 0
          };
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = (category?: Category) => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
      });
      setEditingCategory(category);
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setEditingCategory(null);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('equipment_categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        
        setSnackbarMessage('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('equipment_categories')
          .insert([formData]);
        if (error) throw error;
        
        setSnackbarMessage('Category created successfully');
      }
      setDialogOpen(false);
      setSnackbarOpen(true);
      fetchCategories();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    try {
      setLoading(true);
      
      // Check if category is in use
      const { count, error: countError } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('category', deletingCategory.name);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        setError(`Cannot delete category "${deletingCategory.name}" because it is used by ${count} equipment items.`);
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) throw error;
      
      setSnackbarMessage('Category deleted successfully');
      setSnackbarOpen(true);
      fetchCategories();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Category Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleAddEdit()}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search categories..."
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
      </Paper>

      <Grid container spacing={3}>
        {filteredCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3">
                    {category.name}
                  </Typography>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleAddEdit(category)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {category.description || 'No description provided'}
                </Typography>
                <Chip 
                  label={`${category.equipment_count} equipment items`} 
                  size="small" 
                  color={category.equipment_count ? 'primary' : 'default'}
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {filteredCategories.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1">No categories found</Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try adjusting your search query' : 'Add your first category to get started'}
              </Typography>
              {!searchQuery && (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  sx={{ mt: 2 }}
                  onClick={() => handleAddEdit()}
                >
                  Add Category
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="dense"
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a description of this category"
            />
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
            {loading ? <CircularProgress size={24} /> : (editingCategory ? 'Update' : 'Create')}
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
            Are you sure you want to delete the category "{deletingCategory?.name}"?
            {deletingCategory?.equipment_count ? (
              <Typography color="error" sx={{ mt: 1 }}>
                Warning: This category is used by {deletingCategory.equipment_count} equipment items.
                Deleting it may cause issues.
              </Typography>
            ) : (
              <Typography sx={{ mt: 1 }}>
                This category is not currently used by any equipment.
              </Typography>
            )}
          </Typography>
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
    </Box>
  );
}