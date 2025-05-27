import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { format, isValid } from 'date-fns';

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  equipment?: { name: string };
}

interface LabReservation {
  id: string;
  start_time: string;
  end_time: string;
  lab?: { name: string };
}

interface ReservationsProps<T> {
  reservations: T[];
  title: string;
  getReservationName: (reservation: T) => string;
}

export default function TodayReservations<T>({
  reservations,
  title,
  getReservationName,
}: ReservationsProps<T>) {
  // Return null if there are no reservations
  if (reservations.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Title */}
      <Typography variant="h6" gutterBottom fontWeight="bold">
        {title}
      </Typography>

      {/* Paper Container */}
      <Paper sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        {/* Header with Current Date */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {format(new Date(), 'EEEE, MMMM d')}
          </Typography>
        </Box>

        {/* Reservations List */}
        <List sx={{ p: 0, height: '300px', overflow: 'auto' }}>
          {reservations.map((reservation, _index) => {
            // Validate start_time and end_time
            const startTime = isValid(new Date((reservation as any).start_time))
              ? format(new Date((reservation as any).start_time), 'h:mm a')
              : 'Invalid Time';
            const endTime = isValid(new Date((reservation as any).end_time))
              ? format(new Date((reservation as any).end_time), 'h:mm a')
              : 'Invalid Time';

            return (
              <ListItem key={(reservation as any).id} sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Time Box */}
                  <Box
                    sx={{
                      mr: 2,
                      p: 1,
                      bgcolor: 'primary.light',
                      borderRadius: 1,
                      minWidth: '80px',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {startTime}
                    </Typography>
                  </Box>

                  {/* Reservation Details */}
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {getReservationName(reservation)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {startTime} - {endTime}
                      </Typography>
                    }
                  />
                </Box>
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
}


export function EquipmentReservations({ reservations, title }: { reservations: Reservation[]; title: string }) {
  return (
    <TodayReservations
      reservations={reservations}
      title={title}
      getReservationName={(reservation) => reservation.equipment?.name || 'Unknown Equipment'}
    />
  );
}

export function LabReservations({ reservations, title }: { reservations: LabReservation[]; title: string }) {
  return (
    <TodayReservations
      reservations={reservations}
      title={title}
      getReservationName={(reservation) => reservation.lab?.name || 'Unknown Lab'}
    />
  );
}