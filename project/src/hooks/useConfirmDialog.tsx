import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    open: boolean;
    options: ConfirmDialogOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((confirmed: boolean) => {
    dialog.resolve?.(confirmed);
    setDialog(prev => ({
      ...prev,
      open: false,
    }));
  }, [dialog]);

  const ConfirmDialogComponent = useCallback(() => (
    <Dialog
      open={dialog.open}
      onClose={() => handleClose(false)}
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title">
        {dialog.options.title || 'Confirm Action'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{dialog.options.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>
          {dialog.options.cancelText || 'Cancel'}
        </Button>
        <Button
          onClick={() => handleClose(true)}
          color={dialog.options.severity || 'primary'}
          variant="contained"
          autoFocus
        >
          {dialog.options.confirmText || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  ), [dialog, handleClose]);

  return {
    confirm,
    ConfirmDialogComponent,
  };
}