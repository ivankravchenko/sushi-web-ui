
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import { TrackChannel } from './TrackChannel';
import { useSushi } from '../contexts/SushiContext';

export function MixerView() {
  const { state, setParameterValue } = useSushi();

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

  if (state.tracks.length === 0) {
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
            No tracks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The connected Sushi instance doesn't have any tracks configured
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
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
  );
}
