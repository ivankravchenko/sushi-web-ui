import { useState } from 'react';
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

  const handleClose = () => {
    if (!isCreating) {
      setTrackName('');
      setTrackType('stereo');
      setStereoBuses(1);
      onClose();
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
      console.error('Failed to create track:', error);
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
            label="Track Name"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            fullWidth
            required
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
