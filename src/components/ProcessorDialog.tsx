import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { sushiGrpcService } from '../services/SushiGrpcService';
import type { ParametersResponse, PropertiesResponse } from '../services/SushiGrpcService';
import type { ParameterInfo, PropertyInfo } from '../../codegen-grpc/sushi_rpc';

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

  useEffect(() => {
    if (open && processor) {
      loadProcessorData();
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

  // Convert normalized 0..1 value to domain range for UI display
  const normalizedToDomain = (normalizedValue: number, min: number, max: number): number => {
    return min + normalizedValue * (max - min);
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

  const renderParameterControl = (param: ParameterState) => {
    const { info, value } = param;
    
    switch (info.type?.type) {
      case 1: // BOOL
        return (
          <FormControlLabel
            key={param.id}
            control={
              <Switch
                checked={value > 0.5}
                onChange={(e) => handleParameterChange(param.id, e.target.checked ? 1 : 0)}
              />
            }
            label={info.label || info.name}
          />
        );
        
      case 2: // INT
      case 3: // FLOAT
        const min = info.minDomainValue ?? 0;
        const max = info.maxDomainValue ?? 1;
        const step = info.type?.type === 2 ? 1 : 0.01;
        
        return (
          <Box key={param.id} sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              {info.label || info.name}
              {info.unit && ` (${info.unit})`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" sx={{ minWidth: '3em' }}>
                {min}
              </Typography>
              <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(_, newValue) => handleParameterChange(param.id, newValue as number)}
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" sx={{ minWidth: '3em' }}>
                {max}
              </Typography>
              <Typography variant="body2" sx={{ minWidth: '4em', textAlign: 'right' }}>
                {value.toFixed(info.type?.type === 2 ? 0 : 2)}
              </Typography>
            </Box>
          </Box>
        );
        
      default:
        return (
          <Box key={param.id} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {info.label || info.name}: {value} (Unknown type)
            </Typography>
          </Box>
        );
    }
  };

  const renderPropertyControl = (prop: PropertyState) => {
    return (
      <Box key={prop.id} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label={prop.info.label || prop.info.name}
          value={prop.value}
          onChange={(e) => handlePropertyChange(prop.info.name, e.target.value)}
          variant="outlined"
          size="small"
        />
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">
          {processor.name} - Parameters & Properties
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
            {/* Parameters Section */}
            {parameters.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Parameters
                </Typography>
                {parameters.map(renderParameterControl)}
              </Box>
            )}

            {/* Properties Section */}
            {properties.length > 0 && (
              <Box>
                {parameters.length > 0 && <Divider sx={{ mb: 2 }} />}
                <Typography variant="h6" gutterBottom>
                  Properties
                </Typography>
                {properties.map(renderPropertyControl)}
              </Box>
            )}

            {/* Empty state */}
            {parameters.length === 0 && properties.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No parameters or properties found for this processor.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
