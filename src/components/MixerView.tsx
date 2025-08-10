import {
  Box,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import { useSushi } from '../contexts/SushiContext';

export function MixerView() {
  const { state } = useSushi();

  if (state.connecting) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        gap: 2
      }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading tracks...</Typography>
      </Box>
    );
  }

  if (!state.connected) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Not connected to Sushi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please connect to a Sushi instance to view the mixer
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Simplified view - focus on connection info only, mixer functionality commented out
  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Sushi Engine Status
      </Typography>
      
      {state.engineInfo && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Engine Information
          </Typography>
          <Typography variant="body2">
            Version: {state.engineInfo.sushiVersion || 'Not available'}
          </Typography>
          <Typography variant="body2">
            Sample Rate: {state.engineInfo.sampleRate ? `${state.engineInfo.sampleRate} Hz` : 'Not available'}
          </Typography>
          <Typography variant="body2">
            Buffer Size: {state.engineInfo.bufferSize ? `${state.engineInfo.bufferSize} samples` : 'Not available'}
          </Typography>
          <Typography variant="body2">
            Input Channels: {state.engineInfo.inputChannels ?? 'Not available'}
          </Typography>
          <Typography variant="body2">
            Output Channels: {state.engineInfo.outputChannels ?? 'Not available'}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Performance
        </Typography>
        <Typography variant="body1">
          <strong>CPU Load:</strong> {(state.cpuLoad * 100).toFixed(1)}%
        </Typography>
      </Paper>

      {/* Mixer functionality commented out for now
      {state.tracks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No tracks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The connected Sushi instance doesn't have any tracks configured
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Mixer
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              overflowX: 'auto',
              pb: 2,
              minHeight: 600
            }}
          >
            {state.tracks.map((track) => (
              <TrackChannel
                key={track.id}
                track={track}
                onParameterChange={setParameterValue}
              />
            ))}
          </Box>
        </Box>
      )}
      */}
    </Box>
  );
}
