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
              onDeleteTrack={deleteTrack}
            />
          ))}
          
          {/* Create Track Button */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minWidth: 120,
            height: 600
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                height: 60,
                minWidth: 100,
                fontSize: '1.1rem'
              }}
            >
              Create
            </Button>
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
