import React from 'react';
import { Dialog, DialogContent, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventForm from './EventForm';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 2, pt: 4 }}>
        <EventForm 
          paperProps={{ 
            elevation: 0,
            sx: { p: 0 }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventFormModal; 