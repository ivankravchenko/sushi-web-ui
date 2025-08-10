import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  SwapHoriz as SwapIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProcessorConfig } from '../contexts/ProcessorConfigContext';
import type { 
  ParameterDisplayConfig, 
  PropertyDisplayConfig, 
  ParameterComponentType 
} from '../types/ProcessorConfig';
import type { ParameterInfo, PropertyInfo } from '../../codegen-grpc/sushi_rpc';

interface ProcessorConfigDialogProps {
  open: boolean;
  onClose: () => void;
  processor: {
    id: number;
    name: string;
    label: string;
  };
  parameters: Array<{ info: ParameterInfo; value: number }>;
  properties: Array<{ info: PropertyInfo; value: string }>;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ListItem
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <IconButton {...attributes} {...listeners} size="small">
          <DragIcon />
        </IconButton>
        {children}
      </ListItem>
    </div>
  );
}

export function ProcessorConfigDialog({ 
  open, 
  onClose, 
  processor, 
  parameters, 
  properties 
}: ProcessorConfigDialogProps) {
  const {
    getProcessorConfig,
    updateProcessorConfig,
    updateParameterConfig,
    updatePropertyConfig,
    reorderParameters,
    reorderProperties,
    moveParameterToTab,
    movePropertyToTab,
    updateTabNames,
    resetProcessorConfig,
    saveConfiguration
  } = useProcessorConfig();

  const [config, setConfig] = useState(() => 
    getProcessorConfig(processor.id, processor.name)
  );
  const [activeTab, setActiveTab] = useState(0);
  const [editingTabNames, setEditingTabNames] = useState(false);
  const [primaryTabName, setPrimaryTabName] = useState(config.primaryTabName);
  const [secondaryTabName, setSecondaryTabName] = useState(config.secondaryTabName);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize configuration with current parameters/properties
  useEffect(() => {
    if (open && parameters.length > 0) {
      const updatedConfig = { ...config };
      
      // Add any new parameters not in config
      parameters.forEach((param, index) => {
        const existingParam = updatedConfig.parameters.find(p => p.parameterId === param.info.id);
        if (!existingParam) {
          const defaultComponent = param.info.type?.type === 1 ? 'toggle' : 'slider';
          updatedConfig.parameters.push({
            parameterId: param.info.id,
            parameterName: param.info.name,
            displayName: param.info.label || param.info.name,
            componentType: defaultComponent,
            order: index,
            tab: 'primary',
            visible: true,
          });
        }
      });

      // Add any new properties not in config
      properties.forEach((prop, index) => {
        const existingProp = updatedConfig.properties.find(p => p.propertyId === prop.info.id);
        if (!existingProp) {
          updatedConfig.properties.push({
            propertyId: prop.info.id,
            propertyName: prop.info.name,
            displayName: prop.info.label || prop.info.name,
            componentType: 'textfield',
            order: index,
            tab: 'secondary',
            visible: true,
          });
        }
      });

      setConfig(updatedConfig);
    }
  }, [open, parameters, properties, config]);

  const handleParameterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.parameters.findIndex(p => `param-${p.parameterId}` === active.id);
    const newIndex = config.parameters.findIndex(p => `param-${p.parameterId}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newParameters = arrayMove(config.parameters, oldIndex, newIndex);
      const updatedConfig = { ...config, parameters: newParameters };
      setConfig(updatedConfig);
      reorderParameters(processor.id, newParameters.map(p => p.parameterId));
    }
  };

  const handlePropertyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.properties.findIndex(p => `prop-${p.propertyId}` === active.id);
    const newIndex = config.properties.findIndex(p => `prop-${p.propertyId}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newProperties = arrayMove(config.properties, oldIndex, newIndex);
      const updatedConfig = { ...config, properties: newProperties };
      setConfig(updatedConfig);
      reorderProperties(processor.id, newProperties.map(p => p.propertyId));
    }
  };

  const handleParameterUpdate = (parameterId: number, updates: Partial<ParameterDisplayConfig>) => {
    const updatedParameters = config.parameters.map(param =>
      param.parameterId === parameterId ? { ...param, ...updates } : param
    );
    const updatedConfig = { ...config, parameters: updatedParameters };
    setConfig(updatedConfig);
    
    const updatedParam = updatedParameters.find(p => p.parameterId === parameterId);
    if (updatedParam) {
      updateParameterConfig(processor.id, updatedParam);
    }
  };

  const handlePropertyUpdate = (propertyId: number, updates: Partial<PropertyDisplayConfig>) => {
    const updatedProperties = config.properties.map(prop =>
      prop.propertyId === propertyId ? { ...prop, ...updates } : prop
    );
    const updatedConfig = { ...config, properties: updatedProperties };
    setConfig(updatedConfig);
    
    const updatedProp = updatedProperties.find(p => p.propertyId === propertyId);
    if (updatedProp) {
      updatePropertyConfig(processor.id, updatedProp);
    }
  };

  const handleTabNamesSave = () => {
    updateTabNames(processor.id, primaryTabName, secondaryTabName);
    const updatedConfig = { 
      ...config, 
      primaryTabName, 
      secondaryTabName 
    };
    setConfig(updatedConfig);
    setEditingTabNames(false);
  };

  const handleSave = () => {
    updateProcessorConfig(config);
    saveConfiguration();
    onClose();
  };

  const handleReset = () => {
    resetProcessorConfig(processor.id);
    setConfig(getProcessorConfig(processor.id, processor.name));
  };

  const componentTypeOptions: { value: ParameterComponentType; label: string }[] = [
    { value: 'slider', label: 'Slider' },
    { value: 'knob', label: 'Knob' },
    { value: 'toggle', label: 'Toggle' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'textfield', label: 'Text Field' },
    { value: 'button', label: 'Button' },
  ];

  const renderParameterConfig = (param: ParameterDisplayConfig) => {
    const paramInfo = parameters.find(p => p.info.id === param.parameterId)?.info;
    if (!paramInfo) return null;

    return (
      <SortableItem key={param.parameterId} id={`param-${param.parameterId}`}>
        <Box sx={{ flex: 1, ml: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {param.displayName || paramInfo.label || paramInfo.name}
            </Typography>
            <Chip 
              label={param.tab} 
              size="small" 
              color={param.tab === 'primary' ? 'primary' : 'secondary'}
            />
            <IconButton
              size="small"
              onClick={() => handleParameterUpdate(param.parameterId, { 
                tab: param.tab === 'primary' ? 'secondary' : 'primary' 
              })}
            >
              <SwapIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleParameterUpdate(param.parameterId, { 
                visible: !param.visible 
              })}
            >
              {param.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Display Name"
              value={param.displayName || ''}
              onChange={(e) => handleParameterUpdate(param.parameterId, { 
                displayName: e.target.value 
              })}
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Component</InputLabel>
              <Select
                value={param.componentType || 'slider'}
                onChange={(e) => handleParameterUpdate(param.parameterId, { 
                  componentType: e.target.value as ParameterComponentType 
                })}
                label="Component"
              >
                {componentTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </SortableItem>
    );
  };

  const renderPropertyConfig = (prop: PropertyDisplayConfig) => {
    const propInfo = properties.find(p => p.info.id === prop.propertyId)?.info;
    if (!propInfo) return null;

    return (
      <SortableItem key={prop.propertyId} id={`prop-${prop.propertyId}`}>
        <Box sx={{ flex: 1, ml: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {prop.displayName || propInfo.label || propInfo.name}
            </Typography>
            <Chip 
              label={prop.tab} 
              size="small" 
              color={prop.tab === 'primary' ? 'primary' : 'secondary'}
            />
            <IconButton
              size="small"
              onClick={() => handlePropertyUpdate(prop.propertyId, { 
                tab: prop.tab === 'primary' ? 'secondary' : 'primary' 
              })}
            >
              <SwapIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handlePropertyUpdate(prop.propertyId, { 
                visible: !prop.visible 
              })}
            >
              {prop.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <TextField
            size="small"
            label="Display Name"
            value={prop.displayName || ''}
            onChange={(e) => handlePropertyUpdate(prop.propertyId, { 
              displayName: e.target.value 
            })}
            fullWidth
          />
        </Box>
      </SortableItem>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon />
          Configure: {processor.label || processor.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Tab Names</Typography>
            <Button 
              size="small" 
              onClick={() => setEditingTabNames(!editingTabNames)}
            >
              {editingTabNames ? 'Cancel' : 'Edit'}
            </Button>
          </Box>
          
          {editingTabNames ? (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                size="small"
                label="Primary Tab"
                value={primaryTabName}
                onChange={(e) => setPrimaryTabName(e.target.value)}
              />
              <TextField
                size="small"
                label="Secondary Tab"
                value={secondaryTabName}
                onChange={(e) => setSecondaryTabName(e.target.value)}
              />
              <Button onClick={handleTabNamesSave}>Save</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`Primary: ${config.primaryTabName}`} />
              <Chip label={`Secondary: ${config.secondaryTabName}`} />
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Parameters" />
          <Tab label="Properties" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Drag to reorder parameters. Use the swap icon to move between tabs.
            </Alert>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleParameterDragEnd}
            >
              <SortableContext
                items={config.parameters.map(p => `param-${p.parameterId}`)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {config.parameters
                    .sort((a, b) => a.order - b.order)
                    .map(renderParameterConfig)}
                </List>
              </SortableContext>
            </DndContext>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Drag to reorder properties. Use the swap icon to move between tabs.
            </Alert>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePropertyDragEnd}
            >
              <SortableContext
                items={config.properties.map(p => `prop-${p.propertyId}`)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {config.properties
                    .sort((a, b) => a.order - b.order)
                    .map(renderPropertyConfig)}
                </List>
              </SortableContext>
            </DndContext>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleReset} color="warning">
          Reset to Default
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}
