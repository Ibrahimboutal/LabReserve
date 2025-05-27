import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Equipment, Lab } from '@/types';

interface AvailableResourcesProps {
  equipment: Equipment[];
  labs: Lab[];
  onReserveEquipment: (id: string) => void;
  onReserveLab: (id: string) => void;
}

export default function AvailableResources({
  equipment,
  labs,
  onReserveEquipment,
  onReserveLab,
}: AvailableResourcesProps) {
  const navigate = useNavigate();

  return (
    <Grid item xs={12} md={6}>
    <Paper sx={{ p: 0, height: '100%', overflow: 'hidden', borderRadius: 2 }}>
      {/* Equipment Section */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <Typography variant="h6" fontWeight="bold">
          Available Equipment
        </Typography>
      </Box>
      <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
        {equipment.length > 0 ? (
          equipment.map((item, _index) => (
            <ListItem key={item.id} sx={{ py: 2 }}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {item.name || 'Unknown Equipment'}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {item.category || 'Unknown Category'}
                  </Typography>
                }
              />
              <Button
                variant="contained"
                size="small"
                aria-label={`Reserve equipment ${item.id}`}
                onClick={() => onReserveEquipment?.(item.id)}
              >
                Reserve
              </Button>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No equipment available
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="text"
          endIcon={<ArrowForwardIcon />}
          aria-label="Browse all equipment"
          onClick={() => navigate('/equipment')}
        >
          Browse All Equipment
        </Button>
      </Box>

      {/* Labs Section */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" fontWeight="bold">
          Available Labs
        </Typography>
      </Box>
      <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
        {labs.length > 0 ? (
          labs.map((lab, _index) => (
            <ListItem key={lab.id} sx={{ py: 2 }}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {lab.name || 'Unknown Lab'}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {lab.location || 'Unknown Location'}
                  </Typography>
                }
              />
              <Button
                variant="contained"
                size="small"
                aria-label={`Reserve lab ${lab.id}`}
                onClick={() => onReserveLab?.(lab.id)}
              >
                Reserve
              </Button>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No labs available
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="text"
          endIcon={<ArrowForwardIcon />}
          aria-label="Browse all labs"
          onClick={() => navigate('/labs')}
        >
          Browse All Labs
        </Button>
      </Box>
    </Paper>
    </Grid>
  );
}