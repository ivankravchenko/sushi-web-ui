import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Slider,
  Switch,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';

import { Settings as SettingsIcon, Close as CloseIcon } from '@mui/icons-material';
import { sushiGrpcService } from '../services/SushiGrpcService';
import type { ParametersResponse, PropertiesResponse } from '../services/SushiGrpcService';
import type { ParameterInfo, PropertyInfo } from '../../codegen-grpc/sushi_rpc';
import { useProcessorConfig } from '../contexts/ProcessorConfigContext';
import { ProcessorConfigDialog } from './ProcessorConfigDialog';
import type { ParameterDisplayConfig, PropertyDisplayConfig } from '../types/ProcessorConfig';
import { 
  createDefaultParameterConfig, 
  createDefaultPropertyConfig 
} from '../types/ProcessorConfig';


interface ProcessorDialogProps {
  open: boolean;
  onClose: () => void;
  processor: {
    id: number;
    name: string;
  };
}

interface ParameterState {
  id: number;
  info: ParameterInfo;
  value: number;
}

interface PropertyState {
  id: number;
  info: PropertyInfo;
  value: string;
}

export function ProcessorDialog({ open, onClose, processor }: ProcessorDialogProps) {
  const [parameters, setParameters] = useState<ParameterState[]>([]);
  const [properties, setProperties] = useState<PropertyState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary'>('primary');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Get processor configuration context
  const { getProcessorConfig } = useProcessorConfig();

  // Convert normalized 0..1 value to domain range for UI display
  const normalizedToDomain = (normalizedValue: number, min: number, max: number): number => {
    return min + normalizedValue * (max - min);
  };

  useEffect(() => {
    if (open && processor) {
      loadProcessorData();
      
      // Subscribe to parameter and property updates
      let subscription: any = null;
      let propertySubscription: any = null;
      
      const setupSubscription = async () => {
        try {
          const observable = await sushiGrpcService.subscribeToParameterUpdates();
          subscription = observable.subscribe({
            next: (update: any) => {
              console.log('Parameter update received:', update);
              console.log('Parameter object keys:', Object.keys(update.parameter || {}));
              console.log('Parameter object:', JSON.stringify(update.parameter, null, 2));
              
              // ParameterUpdate has: parameter (ParameterIdentifier), domainValue
              const param = update.parameter;
              if (param && param.processorId === processor.id) {
                const parameterId = param.parameterId; // ParameterIdentifier.parameterId
                const domainValue = update.domainValue;
                
                console.log(`Processor ID match: ${param.processorId} === ${processor.id}`);
                console.log(`Parameter ID: ${parameterId}, Domain value: ${domainValue}`);
                
                // Update parameter with the domain value directly
                setParameters(prev => prev.map((p: ParameterState) => {
                  if (p.id === parameterId) {
                    console.log(`Updated parameter ${parameterId}: ${p.value} -> ${domainValue}`);
                    return { ...p, value: domainValue };
                  }
                  return p;
                }));
              }
            },
            error: (err: any) => console.warn('Parameter subscription error:', err)
          });
        } catch (err) {
          console.warn('Failed to setup parameter subscription:', err);
        }
      };

      const setupPropertySubscription = async () => {
        try {
          const observable = await sushiGrpcService.subscribeToPropertyUpdates();
          propertySubscription = observable.subscribe({
            next: (update: any) => {
              console.log('Property update received:', update);
              console.log('Property object keys:', Object.keys(update.property || {}));
              console.log('Property object:', JSON.stringify(update.property, null, 2));
              
              // PropertyValue has: property (PropertyIdentifier), value
              const prop = update.property;
              if (prop && prop.processorId === processor.id) {
                const propertyId = prop.propertyId; // PropertyIdentifier.propertyId
                const value = update.value;
                
                console.log(`Property Processor ID match: ${prop.processorId} === ${processor.id}`);
                console.log(`Property ID: ${propertyId}, Value: ${value}`);
                
                // Update property with the new value
                setProperties(prev => prev.map((p: PropertyState) => {
                  if (p.id === propertyId) {
                    console.log(`Updated property ${propertyId}: ${p.value} -> ${value}`);
                    return { ...p, value: value };
                  }
                  return p;
                }));
              }
            },
            error: (err: any) => console.warn('Property subscription error:', err)
          });
        } catch (err) {
          console.warn('Failed to setup property subscription:', err);
        }
      };
      
      setupSubscription();
      setupPropertySubscription();
      
      // Add polling for parameter and property updates to ensure UI stays in sync
      const pollInterval = setInterval(async () => {
        if (parameters.length > 0 || properties.length > 0) {
          try {
            // Poll parameter values
            if (parameters.length > 0) {
              const updatedParams: ParameterState[] = [];
              let hasParamChanges = false;
              
              for (const param of parameters) {
                const currentDomainValue = await sushiGrpcService.getParameterValueInDomain(processor.id, param.id);
                if (currentDomainValue !== null) {
                  if (Math.abs(currentDomainValue - param.value) > 0.001) {
                    console.log(`Polling detected change for parameter ${param.id}: ${param.value} -> ${currentDomainValue}`);
                    hasParamChanges = true;
                  }
                  updatedParams.push({ ...param, value: currentDomainValue });
                } else {
                  updatedParams.push(param);
                }
              }
              
              if (hasParamChanges) {
                console.log('Polling updating parameters:', updatedParams);
                setParameters(updatedParams);
              }
            }

            // Poll property values
            if (properties.length > 0) {
              const updatedProps: PropertyState[] = [];
              let hasPropChanges = false;
              
              for (const prop of properties) {
                const currentValue = await sushiGrpcService.getPropertyValue(processor.id, prop.info.name);
                if (currentValue !== null && currentValue !== prop.value) {
                  console.log(`Polling detected change for property ${prop.info.name}: ${prop.value} -> ${currentValue}`);
                  hasPropChanges = true;
                  updatedProps.push({ ...prop, value: currentValue });
                } else {
                  updatedProps.push(prop);
                }
              }
              
              if (hasPropChanges) {
                console.log('Polling updating properties:', updatedProps);
                setProperties(updatedProps);
              }
            }
          } catch (err) {
            console.warn('Polling error:', err);
          }
        }
      }, 200); // Poll every 200ms for responsive updates
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (propertySubscription) {
          propertySubscription.unsubscribe();
        }
        clearInterval(pollInterval);
      };
    }
  }, [open, processor]);

  const loadProcessorData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load parameters
      const parametersResponse: ParametersResponse = await sushiGrpcService.getProcessorParameters(processor.id);
      const parameterStates: ParameterState[] = [];
      
      for (const paramInfo of parametersResponse.parameters) {
        try {
          // getParameterValueInDomain should return the domain-scaled value
          const domainValue = await sushiGrpcService.getParameterValueInDomain(processor.id, paramInfo.id);
          
          // If getParameterValueInDomain fails, fall back to getting normalized value and converting
          let finalValue = domainValue;
          if (finalValue === null) {
            console.warn(`getParameterValueInDomain failed for parameter ${paramInfo.id}, trying normalized value`);
            // Fallback: get normalized value and convert to domain
            const normalizedValue = await sushiGrpcService.getParameterValue(processor.id, paramInfo.id);
            if (normalizedValue !== null) {
              const min = paramInfo.minDomainValue ?? 0;
              const max = paramInfo.maxDomainValue ?? 1;
              finalValue = normalizedToDomain(normalizedValue, min, max);
            } else {
              // Last resort: use minimum domain value
              finalValue = paramInfo.minDomainValue ?? 0;
            }
          }
          
          parameterStates.push({
            id: paramInfo.id,
            info: paramInfo,
            value: finalValue ?? 0
          });
        } catch (err) {
          console.warn(`Failed to load parameter ${paramInfo.id}:`, err);
          // Use minimum domain value as fallback
          parameterStates.push({
            id: paramInfo.id,
            info: paramInfo,
            value: paramInfo.minDomainValue ?? 0
          });
        }
      }
      
      setParameters(parameterStates);

      // Load properties
      const propertiesResponse: PropertiesResponse = await sushiGrpcService.getProcessorProperties(processor.id);
      const propertyStates: PropertyState[] = [];
      
      for (const propInfo of propertiesResponse.properties) {
        try {
          const value = await sushiGrpcService.getPropertyValue(processor.id, propInfo.name);
          propertyStates.push({
            id: propInfo.id,
            info: propInfo,
            value: value ?? ''
          });
        } catch (err) {
          console.warn(`Failed to load property ${propInfo.name}:`, err);
        }
      }
      
      setProperties(propertyStates);
    } catch (err) {
      console.error('Failed to load processor data:', err);
      setError('Failed to load processor data');
    } finally {
      setLoading(false);
    }
  };

  // Convert domain value to normalized 0..1 range for Sushi
  const domainToNormalized = (domainValue: number, min: number, max: number): number => {
    if (max === min) return 0;
    return (domainValue - min) / (max - min);
  };

  const handleParameterChange = async (parameterId: number, domainValue: number) => {
    try {
      // Find the parameter info to get min/max domain values
      const param = parameters.find(p => p.id === parameterId);
      if (!param) return;

      const min = param.info.minDomainValue ?? 0;
      const max = param.info.maxDomainValue ?? 1;
      
      // Convert domain value to normalized 0..1 range for Sushi
      const normalizedValue = domainToNormalized(domainValue, min, max);
      
      await sushiGrpcService.setParameterValue(processor.id, parameterId, normalizedValue);
      
      // Update local state with domain value for UI display
      setParameters(prev => prev.map(p => 
        p.id === parameterId ? { ...p, value: domainValue } : p
      ));
    } catch (err) {
      console.error('Failed to set parameter:', err);
    }
  };

  const handlePropertyChange = async (propertyName: string, value: string) => {
    try {
      await sushiGrpcService.setPropertyValue(processor.id, propertyName, value);
      
      // Update local state
      setProperties(prev => prev.map(prop => 
        prop.info.name === propertyName ? { ...prop, value } : prop
      ));
    } catch (err) {
      console.error('Failed to set property:', err);
    }
  };



  // Get processor configuration
  const config = getProcessorConfig(processor.id, processor.name);

  // Create parameter configs with defaults if not configured
  const parameterConfigs = parameters.map((param, index) => {
    const existingConfig = config.parameters.find(p => p.parameterId === param.id);
    return existingConfig || createDefaultParameterConfig(
      param.id, 
      param.info.name, 
      param.info.type?.type || 0, 
      index
    );
  });

  // Create property configs with defaults if not configured
  const propertyConfigs = properties.map((prop, index) => {
    const existingConfig = config.properties.find(p => p.propertyId === prop.id);
    return existingConfig || createDefaultPropertyConfig(
      prop.id,
      prop.info.name,
      index
    );
  });

  // Filter and sort parameters/properties by tab and visibility
  const primaryParameters = parameterConfigs
    .filter(config => config.tab === 'primary' && config.visible)
    .sort((a, b) => a.order - b.order)
    .map(config => {
      const param = parameters.find(p => p.id === config.parameterId);
      return param ? { config, param } : null;
    })
    .filter((item): item is { config: ParameterDisplayConfig; param: ParameterState } => item !== null);

  const secondaryParameters = parameterConfigs
    .filter(config => config.tab === 'secondary' && config.visible)
    .sort((a, b) => a.order - b.order)
    .map(config => {
      const param = parameters.find(p => p.id === config.parameterId);
      return param ? { config, param } : null;
    })
    .filter((item): item is { config: ParameterDisplayConfig; param: ParameterState } => item !== null);

  const primaryProperties = propertyConfigs
    .filter(config => config.tab === 'primary' && config.visible)
    .sort((a, b) => a.order - b.order)
    .map(config => {
      const prop = properties.find(p => p.id === config.propertyId);
      return prop ? { config, prop } : null;
    })
    .filter((item): item is { config: PropertyDisplayConfig; prop: PropertyState } => item !== null);

  const secondaryProperties = propertyConfigs
    .filter(config => config.tab === 'secondary' && config.visible)
    .sort((a, b) => a.order - b.order)
    .map(config => {
      const prop = properties.find(p => p.id === config.propertyId);
      return prop ? { config, prop } : null;
    })
    .filter((item): item is { config: PropertyDisplayConfig; prop: PropertyState } => item !== null);

  // Enhanced parameter control with grid layout and bottom labels
  const renderEnhancedParameterControl = (param: ParameterState) => {
    const { info, value } = param;
    
    switch (info.type?.type) {
      case 1: // BOOL
        return (
          <Box key={param.id} sx={{ 
            p: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Switch
                checked={value > 0.5}
                onChange={async (e) => {
                  // For boolean parameters, use domain min/max values
                  const min = info.minDomainValue ?? 0;
                  const max = info.maxDomainValue ?? 1;
                  const domainValue = e.target.checked ? max : min;
                  
                  // Update UI immediately for responsiveness
                  setParameters(prev => prev.map((p: ParameterState) => 
                    p.id === param.id ? { ...p, value: domainValue } : p
                  ));
                  
                  // Send to Sushi
                  await handleParameterChange(param.id, domainValue);
                }}
                size="medium"
              />
            </Box>
            <Typography variant="caption" sx={{ textAlign: 'center', mt: 0.5 }}>
              {info.label || info.name}
            </Typography>
          </Box>
        );
        
      case 2: // INT
      case 3: // FLOAT
        const min = info.minDomainValue ?? 0;
        const max = info.maxDomainValue ?? 1;
        const step = info.type?.type === 2 ? 1 : 0.01;
        
        return (
          <Box key={param.id} sx={{ 
            p: 1, 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 1 }}>
              <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(_, newValue) => {
                  const domainValue = newValue as number;
                  
                  // Update UI immediately for responsiveness
                  setParameters(prev => prev.map((p: ParameterState) => 
                    p.id === param.id ? { ...p, value: domainValue } : p
                  ));
                  
                  // Send to Sushi (async without await to avoid blocking UI)
                  handleParameterChange(param.id, domainValue);
                }}
                valueLabelDisplay="on"
                valueLabelFormat={(val) => val.toFixed(info.type?.type === 2 ? 0 : 2)}
                sx={{ 
                  width: '100%',
                  '& .MuiSlider-valueLabel': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ textAlign: 'center', mt: 0.5 }}>
              {info.label || info.name}
            </Typography>
          </Box>
        );
        
      default:
        return (
          <Box key={param.id} sx={{ 
            p: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {value}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ textAlign: 'center', mt: 0.5 }}>
              {info.label || info.name}
            </Typography>
          </Box>
        );
    }
  };

  const renderEnhancedPropertyControl = (prop: PropertyState) => {
    return (
      <Box key={prop.id} sx={{ 
        p: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={prop.value}
            onChange={(e) => handlePropertyChange(prop.info.name, e.target.value)}
            variant="outlined"
            size="small"
            placeholder="Enter value..."
          />
        </Box>
        <Typography variant="caption" sx={{ textAlign: 'center', mt: 0.5 }}>
          {prop.info.label || prop.info.name}
        </Typography>
      </Box>
    );
  };

  const renderTabContent = (tab: 'primary' | 'secondary') => {
    const tabParameters = tab === 'primary' ? primaryParameters : secondaryParameters;
    const tabProperties = tab === 'primary' ? primaryProperties : secondaryProperties;

    if (tabParameters.length === 0 && tabProperties.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No {tab} parameters or properties configured.
        </Typography>
      );
    }

    return (
      <Box sx={{ py: 2 }}>
        {/* Parameters in Flexbox Grid Layout - 5 per row */}
        {tabParameters.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            mb: 3 
          }}>
            {tabParameters.map(({ param }) => (
              <Box 
                key={param.id} 
                sx={{ 
                  flex: '1 1 calc(18% - 16px)', // Slightly narrower to prevent overlaps
                  minWidth: '140px',
                  minHeight: '80px',
                  maxWidth: 'calc(18% - 16px)'
                }}
              >
                {renderEnhancedParameterControl(param)}
              </Box>
            ))}
          </Box>
        )}

        {/* Properties in Flexbox Grid Layout */}
        {tabProperties.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            {tabProperties.map(({ prop }) => (
              <Box 
                key={prop.id} 
                sx={{ 
                  flex: '1 1 calc(18% - 16px)', // Slightly narrower to prevent overlaps
                  minWidth: '140px',
                  minHeight: '80px',
                  maxWidth: 'calc(18% - 16px)'
                }}
              >
                {renderEnhancedPropertyControl(prop)}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Title and buttons in one line */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6">
                {processor.name}
              </Typography>
            </Box>
            
            <Tooltip title="Configure processor display">
              <IconButton onClick={() => setConfigDialogOpen(true)} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Tabs below title */}
          <Box sx={{ mt: 2 }}>
            <Tabs 
              value={activeTab === 'primary' ? 0 : 1} 
              onChange={(_, newValue) => setActiveTab(newValue === 0 ? 'primary' : 'secondary')}
              centered
            >
              <Tab label={config.primaryTabName} />
              <Tab label={config.secondaryTabName} />
            </Tabs>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!loading && !error && (
            <Box>
              {/* Tab Content with Grid Layout */}
              {activeTab === 'primary' && renderTabContent('primary')}
              {activeTab === 'secondary' && renderTabContent('secondary')}
              
              {/* No data message */}
              {parameters.length === 0 && properties.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No parameters or properties available for this processor.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <ProcessorConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        processor={{ 
          id: processor.id, 
          name: processor.name, 
          label: processor.name, 
          trackId: 0 
        } as any}
        parameters={parameters}
        properties={properties}
      />
    </>
  );
}
