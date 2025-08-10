import { Chip, Tooltip } from '@mui/material';
import { 
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  HourglassEmpty as ConnectingIcon,
  CloudOff as DisconnectedIcon
} from '@mui/icons-material';
import { useSushi } from '../contexts/SushiContext';

export function ConnectionStatus() {
  const { state } = useSushi();

  const getStatusProps = () => {
    if (state.connecting) {
      return {
        label: 'Connecting...',
        color: 'default' as const,
        icon: <ConnectingIcon />,
        tooltip: 'Connecting to Sushi backend...'
      };
    }
    
    if (state.connected) {
      return {
        label: 'Connected',
        color: 'success' as const,
        icon: <ConnectedIcon />,
        tooltip: `Connected to ${state.serverUrl}`
      };
    }
    
    if (state.error) {
      return {
        label: 'Error',
        color: 'error' as const,
        icon: <ErrorIcon />,
        tooltip: state.error
      };
    }
    
    return {
      label: 'Disconnected',
      color: 'default' as const,
      icon: <DisconnectedIcon />,
      tooltip: 'Not connected to Sushi'
    };
  };

  const { label, color, icon, tooltip } = getStatusProps();

  return (
    <Tooltip title={tooltip}>
      <Chip
        label={label}
        color={color}
        size="small"
        icon={icon}
        variant="outlined"
        sx={{ 
          color: 'white', 
          borderColor: 'rgba(255,255,255,0.3)',
          '& .MuiChip-icon': {
            color: 'inherit'
          }
        }}
      />
    </Tooltip>
  );
}
