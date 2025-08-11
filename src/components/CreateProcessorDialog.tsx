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

// Utility function to convert plugin name to snake_case
function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Generate unique processor name with auto-incrementing numbers
function generateUniqueProcessorName(
  baseName: string,
  existingNames: Set<string>,
  isReturnPlugin: boolean = false,
  trackName: string = ''
): string {
  let candidateName = baseName;
  
  // Special handling for Return plugin
  if (isReturnPlugin && trackName) {
    const trackSnakeName = toSnakeCase(trackName);
    candidateName = `${trackSnakeName}_return`;
  }
  
  // Check if name is unique
  if (!existingNames.has(candidateName)) {
    return candidateName;
  }
  
  // Find next available number
  let counter = 2;
  while (existingNames.has(`${candidateName}${counter}`)) {
    counter++;
  }
  
  return `${candidateName}${counter}`;
}

interface CreateProcessorDialogProps {
  open: boolean;
  onClose: () => void;
  trackId: number;
  trackName: string;
}

export function CreateProcessorDialog({ open, onClose, trackId, trackName }: CreateProcessorDialogProps) {
  const { createProcessor, state } = useSushi();
  const [processorName, setProcessorName] = useState('');
  const [processorUid, setProcessorUid] = useState('');
  const [pluginPath, setPluginPath] = useState('');
  const [pluginType, setPluginType] = useState<number>(0); // Default to Internal
  const [selectedInternalPlugin, setSelectedInternalPlugin] = useState('');
  const [pluginProperties, setPluginProperties] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [userEditedName, setUserEditedName] = useState(false);
  const pluginTypeFieldRef = useRef<HTMLInputElement>(null);

  // Get all existing processor and track names for uniqueness checking
  const getAllExistingNames = (): Set<string> => {
    const names = new Set<string>();
    
    // Add all track names
    state.tracks.forEach(track => {
      names.add(track.name.toLowerCase());
      
      // Add all processor names from all tracks
      track.processors.forEach(processor => {
        names.add(processor.name.toLowerCase());
      });
    });
    
    return names;
  };

  // Auto-generate processor name when plugin is selected
  const generateProcessorName = (pluginUid: string) => {
    const plugin = getInternalPluginByUid(pluginUid);
    if (!plugin) return;
    
    const baseName = toSnakeCase(plugin.name);
    const existingNames = getAllExistingNames();
    const isReturnPlugin = pluginUid === 'sushi.testing.return';
    
    const uniqueName = generateUniqueProcessorName(
      baseName,
      existingNames,
      isReturnPlugin,
      trackName
    );
    
    setProcessorName(uniqueName);
    setUserEditedName(false); // Reset user edit flag
  };

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
      setUserEditedName(false);
      
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
                setProcessorName(''); // Clear processor name when plugin type changes
                setUserEditedName(false);
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
                  const selectedUid = e.target.value;
                  setSelectedInternalPlugin(selectedUid);
                  setPluginProperties({}); // Reset properties when plugin changes
                  
                  // Auto-generate processor name if user hasn't manually edited it
                  if (!userEditedName && selectedUid) {
                    generateProcessorName(selectedUid);
                  }
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
            onChange={(e) => {
              setProcessorName(e.target.value);
              setUserEditedName(true); // Mark that user has manually edited the name
            }}
            onKeyPress={handleKeyPress}
            fullWidth
            required
            disabled={isCreating}
            helperText="Auto-generated from plugin name. Edit to customize."
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
