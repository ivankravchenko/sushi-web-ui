
import React from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  PowerSettingsNew as DisconnectIcon,
  Info as InfoIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useSushi } from '../contexts/SushiContext';
import { ConnectionStatus } from './ConnectionStatus';
import { SushiLogo } from './SushiLogo';

interface ToolbarProps {}

export function Toolbar({}: ToolbarProps) {
  const { state, disconnect } = useSushi();
  const [showDetails, setShowDetails] = React.useState(false);

  const formatCpuLoad = (load: number) => {
    return `${(load * 100).toFixed(1)}%`;
  };

  const getTotalProcessors = () => {
    return state.tracks.reduce((total, track) => total + track.processors.length, 0);
  };

  return (
    <AppBar position="static" elevation={1} sx={{ width: '100vw', left: 0, right: 0 }}>
      <MuiToolbar sx={{ width: '100%', maxWidth: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 3 }}>
          <SushiLogo size={32} />
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            Sushi
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ConnectionStatus />
          
          {state.connected && (
            <>
              {/* Always visible: CPU load */}
              <Chip
                label={`CPU: ${formatCpuLoad(state.cpuLoad)}`}
                size="small"
                variant="outlined"
                color={state.cpuLoad > 0.8 ? 'error' : state.cpuLoad > 0.6 ? 'warning' : 'default'}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              
              {/* Info toggle button */}
              <Tooltip title={showDetails ? "Hide details" : "Show details"}>
                <IconButton 
                  color="inherit" 
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <ExpandLessIcon /> : <InfoIcon />}
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {state.connected && (
            <Tooltip title="Disconnect">
              <IconButton color="inherit" onClick={disconnect}>
                <DisconnectIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </MuiToolbar>
      
      {/* Collapsible details section */}
      {state.connected && (
        <Collapse in={showDetails}>
          <Box sx={{ 
            px: 3, 
            pb: 2, 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            <Chip
              label={`Version: ${state.engineInfo?.sushiVersion || 'Unknown'}`}
              size="small"
              variant="outlined"
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
            <Chip
              label={`Sample Rate: ${state.engineInfo?.sampleRate ? `${state.engineInfo.sampleRate} Hz` : 'Unknown'}`}
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <Chip
              label={`In: ${state.engineInfo?.inputChannels ?? 'Unknown'}`}
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <Chip
              label={`Out: ${state.engineInfo?.outputChannels ?? 'Unknown'}`}
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
          </Box>
        </Collapse>
      )}
    </AppBar>
  );
}
