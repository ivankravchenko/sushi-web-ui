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

interface CreateProcessorDialogProps {
  open: boolean;
  onClose: () => void;
  trackId: number;
  trackName: string;
}

// Plugin types from the proto file
const PLUGIN_TYPES = {
  DUMMY: 0,
  INTERNAL: 1,
  VST2X: 2,
  VST3X: 3,
  LV2: 4
};

export function CreateProcessorDialog({ open, onClose, trackId, trackName }: CreateProcessorDialogProps) {
  const { createProcessor } = useSushi();
  const [processorName, setProcessorName] = useState('');
  const [processorUid, setProcessorUid] = useState('');
  const [processorPath, setProcessorPath] = useState('');
  const [pluginType, setPluginType] = useState<number>(PLUGIN_TYPES.VST3X);
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = () => {
    if (isCreating) return;
    setProcessorName('');
    setProcessorUid('');
    setProcessorPath('');
    setPluginType(PLUGIN_TYPES.VST3X);
    onClose();
  };

  const handleCreate = async () => {
    if (!processorName.trim() || !processorUid.trim()) return;
    
    setIsCreating(true);
    try {
      await createProcessor(processorName, processorUid, processorPath, pluginType, trackId);
      handleClose();
    } catch (error) {
      console.error('Failed to create processor:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Create Processor on "{trackName}"
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Processor Name"
            value={processorName}
            onChange={(e) => setProcessorName(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Reverb, Compressor, EQ"
          />
          
          <TextField
            label="Processor UID"
            value={processorUid}
            onChange={(e) => setProcessorUid(e.target.value)}
            fullWidth
            required
            placeholder="e.g., com.company.plugin.reverb"
          />
          
          <TextField
            label="Plugin Path"
            value={processorPath}
            onChange={(e) => setProcessorPath(e.target.value)}
            fullWidth
            placeholder="Path to plugin file (optional for internal plugins)"
          />
          
          <FormControl fullWidth>
            <InputLabel>Plugin Type</InputLabel>
            <Select
              value={pluginType}
              onChange={(e) => setPluginType(e.target.value as number)}
              label="Plugin Type"
            >
              <MenuItem value={PLUGIN_TYPES.INTERNAL}>Internal</MenuItem>
              <MenuItem value={PLUGIN_TYPES.VST2X}>VST 2.x</MenuItem>
              <MenuItem value={PLUGIN_TYPES.VST3X}>VST 3.x</MenuItem>
              <MenuItem value={PLUGIN_TYPES.LV2}>LV2</MenuItem>
              <MenuItem value={PLUGIN_TYPES.DUMMY}>Dummy</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary">
            The processor will be added to the end of the track's processor chain.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={!processorName.trim() || !processorUid.trim() || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
