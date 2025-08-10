import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button
} from '@mui/material';
import { useState } from 'react';
import { useSushi } from '../contexts/SushiContext';
import { TrackChannel } from './TrackChannel';
import { CreateTrackDialog } from './CreateTrackDialog';

export function MixerView() {
  const { state, setParameterValue, deleteTrack } = useSushi();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [soloedTrackId, setSoloedTrackId] = useState<number | null>(null);

  const handleSoloTrack = (trackId: number) => {
    if (soloedTrackId === trackId) {
      // Unsolo - unmute all tracks
      setSoloedTrackId(null);
      state.tracks.forEach(track => {
        const muteParam = track.parameters.find(p => p.name.toLowerCase() === 'mute');
        if (muteParam && muteParam.value > 0.5) {
          setParameterValue(track.id, muteParam.parameterId, 0); // Unmute
        }
      });
    } else {
      // Solo this track - mute all others
      setSoloedTrackId(trackId);
      state.tracks.forEach(track => {
        const muteParam = track.parameters.find(p => p.name.toLowerCase() === 'mute');
        if (muteParam) {
          if (track.id === trackId) {
            setParameterValue(track.id, muteParam.parameterId, 0); // Unmute soloed track
          } else {
            setParameterValue(track.id, muteParam.parameterId, 1); // Mute other tracks
          }
        }
      });
    }
  };

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

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
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
          {/* Track Channels */}
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
                onSoloTrack={handleSoloTrack}
                isSoloed={soloedTrackId === track.id}
              />
            ))}
          </Box>
          
          {/* Delete Buttons Row */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              overflowX: 'auto',
              mt: 2
            }}
          >
            {state.tracks.map((track) => (
              <Box key={`delete-${track.id}`} sx={{ minWidth: 120 }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => deleteTrack(track.id)}
                  sx={{ width: '100%' }}
                >
                  Delete
                </Button>
              </Box>
            ))}
            
            {/* Create Track Button - aligned with Delete buttons */}
            <Box sx={{ minWidth: 120 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCreateDialogOpen(true)}
                sx={{ width: '100%' }}
              >
                Create
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Create Track Dialog */}
      <CreateTrackDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </Box>
  );
}
