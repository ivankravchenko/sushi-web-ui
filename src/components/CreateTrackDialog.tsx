import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { useSushi } from '../contexts/SushiContext';

interface CreateTrackDialogProps {
  open: boolean;
  onClose: () => void;
}

type TrackType = 'mono' | 'stereo' | 'multibus' | 'pre' | 'post';

export function CreateTrackDialog({ open, onClose }: CreateTrackDialogProps) {
  const { createTrack, createMultibusTrack, createPreTrack, createPostTrack } = useSushi();
  const [trackName, setTrackName] = useState('');
  const [trackType, setTrackType] = useState<TrackType>('stereo');
  const [stereoBuses, setStereoBuses] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const nameFieldRef = useRef<HTMLInputElement>(null);

  // Focus on track name field when dialog opens
  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setTrackName('');
      setTrackType('stereo');
      setStereoBuses(1);
      
      // Focus with delay to ensure dialog is fully rendered
      const focusTimeout = setTimeout(() => {
        if (nameFieldRef.current) {
          nameFieldRef.current.focus();
          nameFieldRef.current.select();
        }
      }, 200);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [open]);

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!trackName.trim()) return;

    setIsCreating(true);
    try {
      switch (trackType) {
        case 'mono':
          await createTrack(trackName, 1);
          break;
        case 'stereo':
          await createTrack(trackName, 2);
          break;
        case 'multibus':
          await createMultibusTrack(trackName, stereoBuses);
          break;
        case 'pre':
          await createPreTrack(trackName);
          break;
        case 'post':
          await createPostTrack(trackName);
          break;
      }
      handleClose();
    } catch (error) {
      // TODO: Show error message to user
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Track</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              inputRef={nameFieldRef}
              autoFocus
              margin="dense"
              label="Track Name"
              fullWidth
              variant="outlined"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isCreating}
            />
          
          <FormControl fullWidth disabled={isCreating}>
            <InputLabel>Track Type</InputLabel>
            <Select
              value={trackType}
              label="Track Type"
              onChange={(e) => setTrackType(e.target.value as TrackType)}
            >
              <MenuItem value="mono">Mono (1 channel)</MenuItem>
              <MenuItem value="stereo">Stereo (2 channels)</MenuItem>
              <MenuItem value="multibus">Multibus</MenuItem>
              <MenuItem value="pre">Pre Track</MenuItem>
              <MenuItem value="post">Post Track</MenuItem>
            </Select>
          </FormControl>

          {trackType === 'multibus' && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Multibus Configuration
              </Typography>
              <TextField
                label="Stereo Buses"
                type="number"
                value={stereoBuses}
                onChange={(e) => setStereoBuses(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                inputProps={{ min: 1, max: 16 }}
                disabled={isCreating}
                helperText="Number of stereo bus pairs"
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={!trackName.trim() || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
