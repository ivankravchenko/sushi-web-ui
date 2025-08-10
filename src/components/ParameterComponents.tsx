import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import type { ParameterDisplayConfig, PropertyDisplayConfig } from '../types/ProcessorConfig';
import type { ParameterInfo, PropertyInfo } from '../../codegen-grpc/sushi_rpc';

interface ParameterComponentProps {
  config: ParameterDisplayConfig;
  parameterInfo: ParameterInfo;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

interface PropertyComponentProps {
  config: PropertyDisplayConfig;
  propertyInfo: PropertyInfo;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Knob Component (circular slider)
function KnobComponent({ config, parameterInfo, value, onChange, disabled }: ParameterComponentProps) {
  const min = parameterInfo.minDomainValue ?? 0;
  const max = parameterInfo.maxDomainValue ?? 1;
  const step = config.customOptions?.step ?? (parameterInfo.type?.type === 2 ? 1 : 0.01);
  const precision = config.customOptions?.precision ?? (parameterInfo.type?.type === 2 ? 0 : 2);

  // Calculate angle for knob (270 degrees range)
  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + (normalizedValue * 270);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - centerX;
      const deltaY = moveEvent.clientY - centerY;
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Normalize angle to 0-270 range starting from top
      angle = ((angle + 90 + 360) % 360);
      if (angle > 270) angle = angle - 360;
      
      const normalizedAngle = Math.max(0, Math.min(270, angle)) / 270;
      const newValue = min + (normalizedAngle * (max - min));
      const steppedValue = Math.round(newValue / step) * step;
      
      onChange(Math.max(min, Math.min(max, steppedValue)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [min, max, step, onChange, disabled]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        {config.displayName || parameterInfo.label || parameterInfo.name}
      </Typography>
      
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '3px solid',
          borderColor: disabled ? 'action.disabled' : 'primary.main',
          position: 'relative',
          cursor: disabled ? 'default' : 'pointer',
          backgroundColor: 'background.paper',
          '&:hover': disabled ? {} : {
            borderColor: 'primary.dark',
          }
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Knob indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            width: 2,
            height: '40%',
            backgroundColor: disabled ? 'action.disabled' : 'primary.main',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transition: 'transform 0.1s ease',
          }}
        />
      </Box>
      
      <Typography variant="caption" sx={{ mt: 1 }}>
        {value.toFixed(precision)}{parameterInfo.unit && ` ${parameterInfo.unit}`}
      </Typography>
      
      {config.customOptions?.description && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
          {config.customOptions.description}
        </Typography>
      )}
    </Box>
  );
}

// Slider Component (enhanced version)
function SliderComponent({ config, parameterInfo, value, onChange, disabled }: ParameterComponentProps) {
  const min = parameterInfo.minDomainValue ?? 0;
  const max = parameterInfo.maxDomainValue ?? 1;
  const step = config.customOptions?.step ?? (parameterInfo.type?.type === 2 ? 1 : 0.01);
  const precision = config.customOptions?.precision ?? (parameterInfo.type?.type === 2 ? 0 : 2);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        {config.displayName || parameterInfo.label || parameterInfo.name}
        {parameterInfo.unit && ` (${parameterInfo.unit})`}
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
          onChange={(_, newValue) => onChange(newValue as number)}
          disabled={disabled}
          sx={{ 
            flex: 1,
            color: config.customOptions?.color || 'primary.main'
          }}
        />
        <Typography variant="caption" sx={{ minWidth: '3em' }}>
          {max}
        </Typography>
        <Typography variant="body2" sx={{ minWidth: '4em', textAlign: 'right' }}>
          {value.toFixed(precision)}
        </Typography>
      </Box>
      
      {config.customOptions?.description && (
        <Typography variant="caption" color="text.secondary">
          {config.customOptions.description}
        </Typography>
      )}
    </Box>
  );
}

// Toggle Component
function ToggleComponent({ config, parameterInfo, value, onChange, disabled }: ParameterComponentProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={value > 0.5}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            disabled={disabled}
            color={config.customOptions?.color as any || 'primary'}
          />
        }
        label={config.displayName || parameterInfo.label || parameterInfo.name}
      />
      
      {config.customOptions?.description && (
        <Typography variant="caption" color="text.secondary" display="block">
          {config.customOptions.description}
        </Typography>
      )}
    </Box>
  );
}

// Dropdown Component
function DropdownComponent({ config, parameterInfo, value, onChange, disabled }: ParameterComponentProps) {
  const options = config.customOptions?.options || [];

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>
          {config.displayName || parameterInfo.label || parameterInfo.name}
        </InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value as number)}
          label={config.displayName || parameterInfo.label || parameterInfo.name}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {config.customOptions?.description && (
        <Typography variant="caption" color="text.secondary">
          {config.customOptions.description}
        </Typography>
      )}
    </Box>
  );
}

// Button Component (for trigger parameters)
function ButtonComponent({ config, parameterInfo, onChange, disabled }: ParameterComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      onChange(1); // Trigger the parameter
      setTimeout(() => setLoading(false), 200); // Brief loading state
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="contained"
        onClick={handleClick}
        disabled={disabled || loading}
        fullWidth
        startIcon={loading ? <CircularProgress size={16} /> : undefined}
        sx={{ color: config.customOptions?.color }}
      >
        {config.displayName || parameterInfo.label || parameterInfo.name}
      </Button>
      
      {config.customOptions?.description && (
        <Typography variant="caption" color="text.secondary">
          {config.customOptions.description}
        </Typography>
      )}
    </Box>
  );
}

// Text Field Component for Parameters
function TextFieldParameterComponent({ config, parameterInfo, value, onChange, disabled }: ParameterComponentProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else {
      setLocalValue(value.toString());
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        label={config.displayName || parameterInfo.label || parameterInfo.name}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        helperText={config.customOptions?.description}
      />
    </Box>
  );
}

// Property Text Field Component
function PropertyTextFieldComponent({ config, propertyInfo, value, onChange, disabled }: PropertyComponentProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        label={config.displayName || propertyInfo.label || propertyInfo.name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        multiline={config.customOptions?.multiline}
        rows={config.customOptions?.multiline ? 3 : 1}
        placeholder={config.customOptions?.placeholder}
        helperText={config.customOptions?.description}
      />
    </Box>
  );
}

// Main Parameter Component Renderer
export function ParameterComponent(props: ParameterComponentProps) {
  const { config } = props;

  const ComponentMap = {
    slider: SliderComponent,
    knob: KnobComponent,
    toggle: ToggleComponent,
    dropdown: DropdownComponent,
    button: ButtonComponent,
    textfield: TextFieldParameterComponent,
  };

  const Component = ComponentMap[config.componentType || 'slider'];
  
  if (config.customOptions?.description) {
    return (
      <Tooltip title={config.customOptions.description} placement="top">
        <Box>
          <Component {...props} />
        </Box>
      </Tooltip>
    );
  }

  return <Component {...props} />;
}

// Main Property Component Renderer
export function PropertyComponent(props: PropertyComponentProps) {
  return <PropertyTextFieldComponent {...props} />;
}
