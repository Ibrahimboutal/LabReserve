import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Snackbar,
} from '@mui/material';
import { Select, MenuItem, ListItemIcon } from '@mui/material';
import {
  Message as MessageIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../types';
import { users } from '../types';





export default function MessageCenter() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<users[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchUsers();
      subscribeToMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(email)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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
        .select('*')
        .neq('id', user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: selectedUser,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Update local state without re-fetching
      const newMessageObject: Message = {
        id: crypto.randomUUID(),
        sender_id: user?.id || '',
        receiver_id: selectedUser,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString(),
        sender: { email: user?.email || '' },
      };

      setMessages((prev) => [newMessageObject, ...prev]);
      setNewMessage('');
      setSelectedUser(null);
      setSnackbarOpen(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      console.log('Marking message as read:', messageId, 'for user:', user?.id);

      // Update the database
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('receiver_id', user?.id);

      if (error) throw error;

      // Broadcast the read status
      supabase.channel('messages').send({
        type: 'broadcast',
        event: 'mark_as_read',
        payload: { messageId },
      });

      // Update the frontend state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.receiver_id === user?.id ? { ...m, read: true } : m
        )
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadMessageIds = messages
        .filter((m) => !m.read && m.receiver_id === user?.id)
        .map((m) => m.id);

      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadMessageIds);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          unreadMessageIds.includes(m.id) ? { ...m, read: true } : m
        )
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
    if (error) throw error;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  } catch (error: any) {
    setError(error.message);
  }
};

  const handleDeleteAllMessages = async () => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
    if (error) throw error;
    // Clear all messages from the frontend state
    setMessages((prev) => prev.filter(
      (m) => m.sender_id !== user?.id && m.receiver_id !== user?.id
    ));
  } catch (error: any) {
    setError(error.message);
  }
};

  const unreadCount = messages.filter(
    (m) => !m.read && m.receiver_id === user?.id
  ).length;

  useEffect(() => {
    const channel = supabase.channel('messages');
    channel.on('broadcast', { event: 'mark_as_read' }, (payload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, read: true } : m
        )
      );
    });
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          <MessageIcon />
        </Badge>
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Messages</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <label htmlFor="user-select">Send to</label>
              <Box sx={{ mb: 2 }}>
              <Select
                id="user-select"
                fullWidth
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                displayEmpty
                renderValue={(value) =>
                  value
                    ? users.find((u) => u.id === value)?.email ||
                      "Select a user"
                    : "Select a user"
                }
              >
                <MenuItem value="" disabled>
                  <em>Select a user</em>
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    <ListItemIcon>
                      {u.image_url ? (
                        <Avatar src={u.image_url} alt={u.email} sx={{ width: 24, height: 24 }} />
                      ) : (
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {u.email[0].toUpperCase()}
                        </Avatar>
                      )}
                    </ListItemIcon>
                    <ListItemText primary={`${u.email} (${u.role})`} />
                  </MenuItem>
                ))}
              </Select>
            </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="New Message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedUser}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={!selectedUser || !newMessage.trim()}
              >
                Send
              </Button>
              <Button
                variant="outlined"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All as Read
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteAllMessages}
                disabled={messages.length === 0}
              >
                Delete All
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography color="textSecondary">No messages</Typography>
            </Box>
          ) : (
            <List>
              {messages.map((message) => (
                <Paper
                  key={message.id}
                  elevation={message.read ? 0 : 1}
                  sx={{ mb: 1 }}
                >
                  <ListItem
                    sx={{
                      bgcolor: message.read ? 'transparent' : 'action.hover',
                    }}
                    onClick={() => {
                      if (!message.read && message.receiver_id === user?.id) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    secondaryAction={
                      message.sender_id === user?.id ? (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <CloseIcon />
                        </IconButton>
                      ) : null
                    }
                    

                  >
                    <ListItemAvatar>
                      <Avatar>{message.sender?.email[0].toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {message.sender_id === user?.id ? 'You' : message.sender?.email}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="textSecondary"
                          >
                            {format(new Date(message.created_at), 'PPp')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Message sent successfully!"
      />
    </>
  );
}