import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableFooter,
  TablePagination,
} from '@mui/material';
import { format } from 'date-fns';
import HistoryIcon from '@mui/icons-material/History';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AutoApprovalSetting, AutoApprovalLog } from '@/types';

export default function AutoApprovalSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AutoApprovalSetting[]>([]);
  const [logs, setLogs] = useState<AutoApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [systemSetting, setSystemSetting] = useState<boolean>(false);
  const [labPage, setLabPage] = useState(0);
  const [labRowsPerPage, setLabRowsPerPage] = useState(5); // Default rows per page for Labs
  const [equipmentPage, setEquipmentPage] = useState(0);
  const [equipmentRowsPerPage, setEquipmentRowsPerPage] = useState(5);
  

  useEffect(() => {
    fetchData();
    subscribeToChanges();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

      const [settingsData, logsData, equipmentData, labsData, usersData] = await Promise.all([
        supabase.from('auto_approval_settings').select('*').order('created_at', { ascending: false }),
        supabase.from('auto_approval_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('equipment').select('id, name, lab_id').eq('status', 'operational'),
        supabase.from('lab').select('id, name'),
        supabase.from('users').select('*'),
      ]);
      if (settingsData.error) throw settingsData.error;
      if (logsData.error) throw logsData.error;
      if (equipmentData.error) throw equipmentData.error;
      if (labsData.error) throw labsData.error;
      if (usersData.error) throw usersData.error;

      // Enrich logs data
      const enrichedLogs = logsData.data.map((log) => {
        const setting = settingsData.data.find((s) => s.id === log.setting_id);
        let targetName = 'Unknown Target';
        if (setting) {
          if (setting.target_type === 'system') {
            targetName = 'System';
          } else if (setting.target_type === 'lab') {
            const lab = labsData.data.find((l) => l.id === setting.target_id);
            targetName = lab ? lab.name : 'Unknown Lab';
          } else if (setting.target_type === 'equipment') {
            const equipment = equipmentData.data.find((e) => e.id === setting.target_id);
            targetName = equipment ? equipment.name : 'Unknown Equipment';
          }
        }
        const user = usersData.data.find((u) => u.id === log.performed_by);
        const performedByEmail = user ? user.email : 'Unknown User';
        const performedByRole = user ? user.role : 'Unknown User';
        return {
          ...log,
          target_name: targetName,
          performed_by_email: performedByEmail,
          performed_by_role: performedByRole,
        };
      });

      setSettings(settingsData.data);
      setLogs(enrichedLogs);
      setEquipment(equipmentData.data);
      setLabs(labsData.data);
      setUsers(usersData.data || []);

      // Set system-wide setting
      const systemSettings = settingsData.data.find(
        (s: AutoApprovalSetting) => s.target_type === 'system'
      );
      setSystemSetting(systemSettings?.enabled || false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateAutoApprovalSetting = (data: any): AutoApprovalSetting => {
    const requiredFields = [
      'id',
      'target_type',
      'enabled',
      'created_by',
      'last_modified_by',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field '${field}' in AutoApprovalSetting`);
      }
    }
    return data as AutoApprovalSetting;
  };

  const subscribeToChanges = () => {
    // Helper to avoid duplicates by ID
    const upsertById = <T extends { id: string }>(array: T[], newItem: T): T[] => {
      return array.some((item) => item.id === newItem.id)
        ? array.map((item) => (item.id === newItem.id ? newItem : item))
        : [newItem, ...array];
    };
  
    // Subscribe to changes in 'auto_approval_settings'
    const settingsSubscription = supabase
      .channel('auto-approval-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auto_approval_settings',
        },
        (payload) => {
          setSettings((prev) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              try {
                const validatedSetting = validateAutoApprovalSetting(payload.new);
  
                // Update systemSetting if it's a system-wide setting
                if (validatedSetting.target_type === 'system') {
                  setSystemSetting(validatedSetting.enabled);
                }
  
                // Deduplicate based on ID
                const updatedSettings = upsertById(prev, validatedSetting);
                return updatedSettings;
              } catch (error) {
                console.error('Invalid payload:', error);
                return prev;
              }
            } else if (payload.eventType === 'DELETE') {
              return prev.filter((s) => s.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
  
    // Subscribe to changes in 'auto_approval_logs'
    const logsSubscription = supabase
      .channel('auto-approval-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auto_approval_logs',
        },
        async (payload) => {
          console.log('New log entry received:', payload);
          try {
            const newLog = payload.new as AutoApprovalLog;
  
            let setting = settings.find((s) => s.id === newLog.setting_id);
            if (!setting) {
              console.warn('Setting not found locally, fetching from database...');
              const { data: fetchedSetting, error: settingError } = await supabase
                .from('auto_approval_settings')
                .select('*')
                .eq('id', newLog.setting_id)
                .single();
              if (settingError) {
                console.error('Error fetching setting:', settingError);
                return;
              }
              setting = fetchedSetting;
              setSettings((prev) => upsertById(prev, fetchedSetting));
            }
  
            let targetName = 'Unknown Target';
            if (setting) {
              if (setting.target_type === 'system') {
                targetName = 'System';
              } else if (setting.target_type === 'lab') {
                let lab = labs.find((l) => l.id === setting.target_id);
                if (!lab) {
                  console.warn('Lab not found locally, fetching from database...');
                  const { data: fetchedLab, error: labError } = await supabase
                    .from('lab')
                    .select('*')
                    .eq('id', setting.target_id)
                    .single();
                  if (labError) {
                    console.error('Error fetching lab:', labError);
                  } else {
                    lab = fetchedLab;
                    setLabs((prev) => upsertById(prev, fetchedLab));
                  }
                }
                targetName = lab ? lab.name : 'Unknown Lab';
              } else if (setting.target_type === 'equipment') {
                let equipmentItem = equipment.find((e) => e.id === setting.target_id);
                if (!equipmentItem) {
                  console.warn('Equipment not found locally, fetching from database...');
                  const { data: fetchedEquipment, error: equipmentError } = await supabase
                    .from('equipment')
                    .select('*')
                    .eq('id', setting.target_id)
                    .single();
                  if (equipmentError) {
                    console.error('Error fetching equipment:', equipmentError);
                  } else {
                    equipmentItem = fetchedEquipment;
                    setEquipment((prev) => upsertById(prev, fetchedEquipment));
                  }
                }
                targetName = equipmentItem ? equipmentItem.name : 'Unknown Equipment';
              }
            }
  
            let performedByUser = users.find((u) => u.id === newLog.performed_by);
            if (!performedByUser) {
              console.warn('User not found locally, fetching from database...');
              const { data: fetchedUser, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', newLog.performed_by)
                .single();
              if (userError) {
                console.error('Error fetching user:', userError);
              } else {
                performedByUser = fetchedUser;
                setUsers((prev) => upsertById(prev, fetchedUser));
              }
            }
  
            const performedByEmail = performedByUser ? performedByUser.email : 'Unknown User';
            const performedByRole = performedByUser ? performedByUser.role : 'Unknown Role';
  
            const enrichedLog = {
              ...newLog,
              target_name: targetName,
              performed_by_email: performedByEmail,
              performed_by_role: performedByRole,
            };
  
            console.log('Enriched log:', enrichedLog);
            setLogs((prev) => [enrichedLog, ...prev]);
          } catch (error) {
            console.error('Error enriching log:', error);
          }
        }
      )
      .subscribe();
  
    // Subscribe to changes in 'users'
    const usersSubscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          setUsers((prev) => {
            if (payload.eventType === 'INSERT') {
              return upsertById(prev, payload.new);
            } else if (payload.eventType === 'UPDATE') {
              return prev.map((u) => (u.id === payload.old.id ? payload.new : u));
            } else if (payload.eventType === 'DELETE') {
              return prev.filter((u) => u.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
  
    // Subscribe to changes in 'lab'
    const labsSubscription = supabase
      .channel('labs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lab',
        },
        (payload) => {
          setLabs((prev) => {
            if (payload.eventType === 'INSERT') {
              return upsertById(prev, payload.new);
            } else if (payload.eventType === 'UPDATE') {
              return prev.map((l) => (l.id === payload.old.id ? payload.new : l));
            } else if (payload.eventType === 'DELETE') {
              return prev.filter((l) => l.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
  
    // Subscribe to changes in 'equipment'
    const equipmentSubscription = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        (payload) => {
          setEquipment((prev) => {
            if (payload.eventType === 'INSERT') {
              return upsertById(prev, payload.new);
            } else if (payload.eventType === 'UPDATE') {
              return prev.map((e) => (e.id === payload.old.id ? payload.new : e));
            } else if (payload.eventType === 'DELETE') {
              return prev.filter((e) => e.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
  
    // Cleanup subscriptions on unmount
    return () => {
      settingsSubscription.unsubscribe();
      logsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      labsSubscription.unsubscribe();
      equipmentSubscription.unsubscribe();
    };
  };

  const sendNotificationToAllUsers = async (
  createdBy: string,
  title: string,
  message: string,
  type: string
) => {
  try {
    const notifications = users.map((user) => ({
      id: crypto.randomUUID(), // Ensure unique ID per notification
      user_id: user.id,
      created_by: createdBy,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error sending notifications:', error.message);
  }
};

  const handleToggle = async (
    targetType: 'system' | 'lab' | 'equipment',
    targetId: string | null,
    currentEnabled: boolean
  ) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
  
    try {
      // Optimistically update UI
      if (targetType === 'system') {
        setSystemSetting((prev) => !prev); // Toggle systemSetting state
      }
      setSettings((prev) => {
        const existingSetting = prev.find(
          (s) => s.target_type === targetType && s.target_id === targetId
        );
        if (existingSetting) {
          return prev.map((s) =>
            s.id === existingSetting.id
              ? { ...s, enabled: !currentEnabled, updated_at: new Date().toISOString() }
              : s
          );
        } else {
          const newSetting: AutoApprovalSetting = {
            id: crypto.randomUUID(), 
            target_type: targetType,
            target_id: targetType === 'system' ? null : targetId || '', 
            enabled: !currentEnabled,
            created_by: user.id,
            last_modified_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [newSetting, ...prev];
        }
      });
  
      // Perform actual DB operation
      const existingSetting = settings.find(
        (s) => s.target_type === targetType && s.target_id === targetId
      );
      let settingId = existingSetting?.id;
  
      if (existingSetting) {
        const { error: updateError } = await supabase
          .from('auto_approval_settings')
          .update({
            enabled: !currentEnabled,
            last_modified_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSetting.id);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('auto_approval_settings')
          .insert([{
            target_type: targetType,
            target_id: targetType === 'system' ? null : targetId || '', // Ensure null for system
            enabled: !currentEnabled,
            created_by: user.id,
            last_modified_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        if (insertError) throw insertError;
        settingId = data?.[0]?.id;
      }
  
      // Insert log entry
      if (settingId) {
        const { error: logError } = await supabase
          .from('auto_approval_logs')
          .insert([{
            setting_id: settingId,
            action: !currentEnabled ? 'enabled' : 'disabled',
            performed_by: user.id,
          }]);
        if (logError) throw logError;
      }
      
    let title = '';
    let message = '';
    const createdBy = 'System'; 
    if (targetType === 'system') {
      title = !currentEnabled ? 'System-wide Auto-Approval Activated' : 'System-wide Auto-Approval Deactivated';
      message = !currentEnabled
        ? 'All equipment reservations are now auto-approved.'
        : 'Auto-approval for all equipment reservations has been disabled.';
    } else if (targetType === 'lab') {
      const lab = labs.find((l) => l.id === targetId);
      title = !currentEnabled
        ? `Auto-Approval Activated for Lab: ${lab?.name || 'Unknown Lab'}`
        : `Auto-Approval Deactivated for Lab: ${lab?.name || 'Unknown Lab'}`;
      message = !currentEnabled
        ? `All equipment in this lab is now auto-approved for reservations.`
        : `Auto-approval for equipment in this lab has been disabled.`;
    } else if (targetType === 'equipment') {
      const equipmentItem = equipment.find((e) => e.id === targetId);
      title = !currentEnabled
        ? `Auto-Approval Activated for Equipment: ${equipmentItem?.name || 'Unknown Equipment'}`
        : `Auto-Approval Deactivated for Equipment: ${equipmentItem?.name || 'Unknown Equipment'}`;
      message = !currentEnabled
        ? `This equipment is now auto-approved for reservations.`
        : `Auto-approval for this equipment has been disabled.`;
    }
    await sendNotificationToAllUsers(createdBy, title, message, 'info');
      // Success feedback
      setSnackbarMessage(`Auto-approval ${!currentEnabled ? 'enabled' : 'disabled'} successfully`);
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Error toggling auto-approval:', error.message);
      setError(error.message);
  
      // Rollback optimistic update
      if (targetType === 'system') {
        setSystemSetting((prev) => !prev); // Revert systemSetting state
      }
      fetchData(); // Fallback to re-fetching data
    }
  };

  const getLatestSetting = (targetType: string, targetId?: string) => {
    const relevantSettings = settings
      .filter(
        (s) =>
          s.target_type === targetType &&
          s.target_id === (targetId || null)
      )
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    return relevantSettings[0]?.enabled || false;
  };

  const handleChangeLabPage = (_: unknown, newPage: number) => {
    setLabPage(newPage);
  };


  const handleChangeLabRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLabRowsPerPage(parseInt(event.target.value, 10));
    setLabPage(0); // Reset to the first page when changing rows per page
  };

  const handleChangeEquipmentPage = (_: unknown, newPage: number) => {
    setEquipmentPage(newPage);
  };

  const handleChangeEquipmentRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEquipmentRowsPerPage(parseInt(event.target.value, 10));
    setEquipmentPage(0); // Reset to the first page when changing rows per page
  };

  const paginatedData = <T extends any[]>(data: T, equipmentPage: number, equipmentRowsPerPage: number): T => {
    return data.slice(equipmentPage * equipmentRowsPerPage, equipmentPage * equipmentRowsPerPage + equipmentRowsPerPage) as T;
  };
  const labpaginatedData = <T extends any[]>(data: T, labPage: number, labRowsPerPage: number): T => {
    return data.slice(labPage * labRowsPerPage, labPage * labRowsPerPage + labRowsPerPage) as T;
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h5" gutterBottom>
        Auto-Approval Settings
      </Typography>

      {/* System-wide Setting */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={systemSetting}
              onChange={() => handleToggle('system', null, systemSetting)}
            />
          }
          label={
            <Box>
              <Typography variant="h6">System-wide Auto-Approval</Typography>
              <Typography variant="body2" color="text.secondary">
                Enable automatic approval for all equipment reservations
              </Typography>
            </Box>
          }
        />
      </Paper>

      {/* Lab Settings */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Laboratory Settings
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Laboratory</TableCell>
              <TableCell>Auto-Approval Status</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>

            {labpaginatedData.length > 0 && labpaginatedData(labs, labPage, labRowsPerPage).map((lab) => {
            
              const isEnabled = getLatestSetting('lab', lab.id);
              return (
                <TableRow key={lab.id}>
                  <TableCell>{lab.name}</TableCell>

                  <TableCell>
                    <Chip
                      label={isEnabled ? 'Enabled' : 'Disabled'}
                      color={isEnabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>


                  <TableCell>{format(new Date(), 'PPp')}</TableCell>

                  <TableCell>
                    <Switch
                      checked={isEnabled}
                      onChange={() => handleToggle('lab', lab.id, isEnabled)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={4}
                count={labs.length}
                rowsPerPage={labRowsPerPage}
                page={labPage}
                onPageChange={handleChangeLabPage}
                onRowsPerPageChange={handleChangeLabRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Equipment Settings */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Equipment Settings
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              <TableCell>Laboratory</TableCell>
              <TableCell>Auto-Approval Status</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 && paginatedData(equipment, equipmentPage, equipmentRowsPerPage).map((item) => {
           
              const isEnabled = getLatestSetting('equipment', item.id);
              const lab = labs.find((l) => l.id === item.lab_id);
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{lab?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip
                      label={isEnabled ? 'Enabled' : 'Disabled'}
                      color={isEnabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(), 'PPp')}</TableCell>
                  <TableCell>
                    <Switch
                      checked={isEnabled}
                      onChange={() => handleToggle('equipment', item.id, isEnabled)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={5}
                count={equipment.length}
                rowsPerPage={equipmentRowsPerPage}
                page={equipmentPage}
                onPageChange={handleChangeEquipmentPage}
                onRowsPerPageChange={handleChangeEquipmentRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* View Logs Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<HistoryIcon />}
          onClick={() => setLogsDialogOpen(true)}
        >
          View Audit Logs
        </Button>
      </Box>

      {/* Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Auto-Approval Audit Logs</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Performed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.created_at), 'PPp')}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={log.action === 'enabled' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.target_name}</TableCell>
                  <TableCell>{log.performed_by_email}({log.performed_by_role})</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
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
