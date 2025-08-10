import React, { useState, useEffect, useRef } from 'react';
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
  Box
} from '@mui/material';
import { useSushi } from '../contexts/SushiContext';
import { getInternalPluginsByCategory, getAllCategories, getInternalPluginByUid } from '../data/sushiInternalPlugins';

interface CreateProcessorDialogProps {
  open: boolean;
  onClose: () => void;
  trackId: number;
  trackName: string;
}

export function CreateProcessorDialog({ open, onClose, trackId, trackName }: CreateProcessorDialogProps) {
  const { createProcessor } = useSushi();
  const [processorName, setProcessorName] = useState('');
  const [processorUid, setProcessorUid] = useState('');
  const [pluginPath, setPluginPath] = useState('');
  const [pluginType, setPluginType] = useState<number>(0); // Default to Internal
  const [selectedInternalPlugin, setSelectedInternalPlugin] = useState('');
  const [pluginProperties, setPluginProperties] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const pluginTypeFieldRef = useRef<HTMLInputElement>(null);

  // Form validation logic
  const isFormValid = () => {
    if (!processorName.trim()) return false;
    
    switch (pluginType) {
      case 0: // Internal
        return selectedInternalPlugin.trim() !== '';
      case 1: // VST2X
      case 2: // VST3X
      case 4: // Dummy
        return processorUid.trim() !== '' && pluginPath.trim() !== '';
      case 3: // LV2
        return pluginPath.trim() !== '';
      default:
        return false;
    }
  };

  // Get selected plugin details
  const selectedPlugin = selectedInternalPlugin ? getInternalPluginByUid(selectedInternalPlugin) : null;

  // Focus on plugin type field when dialog opens
  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setProcessorName('');
      setProcessorUid('');
      setPluginPath('');
      setPluginType(0); // Default to Internal
      setSelectedInternalPlugin('');
      setPluginProperties({});
      
      // Focus with delay to ensure dialog is fully rendered
      setTimeout(() => {
        pluginTypeFieldRef.current?.focus();
      }, 150);
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
    if (!isFormValid()) return;
    
    setIsCreating(true);
    try {
      let uid = processorUid;
      let path = pluginPath;
      
      // For internal plugins, use the selected plugin's UID
      if (pluginType === 0 && selectedInternalPlugin) {
        uid = selectedInternalPlugin;
        path = ''; // Internal plugins don't need a path
      }
      
      await createProcessor(processorName, uid, path, pluginType, trackId);
      
      // TODO: Set plugin properties if any
      // This would require additional gRPC calls to set processor parameters
      
      handleClose();
    } catch (error) {
      // TODO: Show error message to user
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
          {/* Plugin Type - First field */}
          <FormControl fullWidth required disabled={isCreating}>
            <InputLabel>Plugin Type</InputLabel>
            <Select
              inputRef={pluginTypeFieldRef}
              value={pluginType}
              label="Plugin Type"
              onChange={(e) => {
                setPluginType(e.target.value as number);
                // Reset dependent fields when plugin type changes
                setSelectedInternalPlugin('');
                setProcessorUid('');
                setPluginPath('');
                setPluginProperties({});
              }}
            >
              <MenuItem value={0}>Internal</MenuItem>
              <MenuItem value={1}>VST2X</MenuItem>
              <MenuItem value={2}>VST3X</MenuItem>
              <MenuItem value={3}>LV2</MenuItem>
              <MenuItem value={4}>Dummy</MenuItem>
            </Select>
          </FormControl>
          
          {/* Internal Plugin Selector - Only for Internal plugins */}
          {pluginType === 0 && (
            <FormControl fullWidth required disabled={isCreating}>
              <InputLabel>Internal Plugin</InputLabel>
              <Select
                value={selectedInternalPlugin}
                label="Internal Plugin"
                onChange={(e) => {
                  setSelectedInternalPlugin(e.target.value);
                  setPluginProperties({}); // Reset properties when plugin changes
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select an internal plugin</em>
                </MenuItem>
                {getAllCategories().map((category) => [
                  <MenuItem key={`header-${category}`} disabled sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                    {category}
                  </MenuItem>,
                  ...getInternalPluginsByCategory(category).map((plugin) => (
                    <MenuItem key={plugin.uid} value={plugin.uid} sx={{ pl: 3 }}>
                      {plugin.name} - {plugin.description}
                    </MenuItem>
                  ))
                ]).flat()}
              </Select>
            </FormControl>
          )}
          
          {/* Processor UID - Not for Internal or LV2 */}
          {pluginType !== 0 && pluginType !== 3 && (
            <TextField
              label="Processor UID"
              value={processorUid}
              onChange={(e) => setProcessorUid(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required
              disabled={isCreating}
            />
          )}
          
          {/* Plugin Path - Not for Internal */}
          {pluginType !== 0 && (
            <TextField
              label="Plugin Path"
              value={pluginPath}
              onChange={(e) => setPluginPath(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required={pluginType === 3} // Required for LV2
              disabled={isCreating}
            />
          )}
          
          {/* Plugin Properties - For internal plugins with properties */}
          {pluginType === 0 && selectedPlugin?.properties?.map((property) => (
            <TextField
              key={property.name}
              label={`${property.name} (${property.description})`}
              value={pluginProperties[property.name] || ''}
              onChange={(e) => setPluginProperties(prev => ({
                ...prev,
                [property.name]: e.target.value
              }))}
              onKeyPress={handleKeyPress}
              fullWidth
              disabled={isCreating}
              helperText={property.description}
            />
          ))}
          
          {/* Processor Name - Last field */}
          <TextField
            label="Processor Name"
            value={processorName}
            onChange={(e) => setProcessorName(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            required
            disabled={isCreating}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={!isFormValid() || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
