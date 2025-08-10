
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  PowerSettingsNew as DisconnectIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useSushi } from '../contexts/SushiContext';
import { ConnectionStatus } from './ConnectionStatus';

interface ToolbarProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function Toolbar({ onOpenSettings, onOpenHelp }: ToolbarProps) {
  const { state, disconnect, refreshData } = useSushi();

  const formatCpuLoad = (load: number) => {
    return `${(load * 100).toFixed(1)}%`;
  };

  const getTotalProcessors = () => {
    return state.tracks.reduce((total, track) => total + track.processors.length, 0);
  };

  return (
    <AppBar position="static" elevation={1}>
      <MuiToolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sushi Web UI
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ConnectionStatus />
          
          {state.connected && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Version: ${state.engineInfo?.sushiVersion || 'Unknown'}`}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip
                label={`CPU: ${formatCpuLoad(state.cpuLoad)}`}
                size="small"
                variant="outlined"
                color={state.cpuLoad > 0.8 ? 'error' : state.cpuLoad > 0.6 ? 'warning' : 'default'}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip
                label={`Tracks: ${state.tracks.length}`}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip
                label={`Processors: ${getTotalProcessors()}`}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
            </Box>
          )}
          
          {state.connected && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Refresh Data">
                <IconButton color="inherit" onClick={refreshData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Help & Shortcuts">
                <IconButton color="inherit" onClick={onOpenHelp}>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton color="inherit" onClick={onOpenSettings}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Disconnect">
                <IconButton color="inherit" onClick={disconnect}>
                  <DisconnectIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </MuiToolbar>
    </AppBar>
  );
}
