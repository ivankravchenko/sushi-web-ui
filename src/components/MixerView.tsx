import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useSushi } from '../contexts/SushiContext';
import { TrackChannel } from './TrackChannel';
import { CreateTrackDialog } from './CreateTrackDialog';
import { CreateProcessorDialog } from './CreateProcessorDialog';
import { ProcessorCard } from './ProcessorCard';
import type { Processor } from '../contexts/SushiContext';

export function MixerView() {
  const { state, setParameterValue, deleteTrack, createProcessor, deleteProcessor, moveProcessor } = useSushi();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [soloedTrackId, setSoloedTrackId] = useState<number | null>(null);
  const [createProcessorDialogOpen, setCreateProcessorDialogOpen] = useState(false);
  const [selectedTrackForProcessor, setSelectedTrackForProcessor] = useState<{ id: number; name: string } | null>(null);
  const [activeProcessor, setActiveProcessor] = useState<Processor | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleCreateProcessor = (trackId: number) => {
    const track = state.tracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrackForProcessor({ id: trackId, name: track.name });
      setCreateProcessorDialogOpen(true);
    }
  };

  const handleDeleteProcessor = async (processorId: number, trackId: number) => {
    await deleteProcessor(processorId, trackId);
  };

  const handleMoveProcessor = async (processorId: number, sourceTrackId: number, destTrackId: number, addToBack?: boolean, beforeProcessorId?: number) => {
    await moveProcessor(processorId, sourceTrackId, destTrackId, addToBack, beforeProcessorId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'processor') {
      setActiveProcessor(active.data.current.processor);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProcessor(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'processor') return;

    const activeProcessor = activeData.processor;
    const activeTrackId = activeData.trackId;

    // If dropped on a track (not on another processor)
    if (overData?.type === 'track') {
      const destTrackId = overData.trackId;
      
      // Move to end of destination track
      if (activeTrackId !== destTrackId) {
        await handleMoveProcessor(activeProcessor.id, activeTrackId, destTrackId, true);
      }
    }
    // If dropped on another processor
    else if (overData?.type === 'processor') {
      const overProcessor = overData.processor;
      const destTrackId = overData.trackId;
      
      // Move before the target processor
      if (activeProcessor.id !== overProcessor.id) {
        await handleMoveProcessor(activeProcessor.id, activeTrackId, destTrackId, false, overProcessor.id);
      }
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                  onCreateProcessor={handleCreateProcessor}
                  onDeleteProcessor={handleDeleteProcessor}
                  onMoveProcessor={handleMoveProcessor}
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
          
          <DragOverlay>
            {activeProcessor ? (
              <ProcessorCard
                processor={activeProcessor}
                trackId={0}
                onDeleteProcessor={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      
      <CreateTrackDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />
      
      {selectedTrackForProcessor && (
        <CreateProcessorDialog
          open={createProcessorDialogOpen}
          onClose={() => {
            setCreateProcessorDialogOpen(false);
            setSelectedTrackForProcessor(null);
          }}
          trackId={selectedTrackForProcessor.id}
          trackName={selectedTrackForProcessor.name}
        />
      )}
    </Box>
  );
}
