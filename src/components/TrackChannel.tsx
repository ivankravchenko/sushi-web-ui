import {
  Box,
  Paper,
  Typography,
  Slider,
  Button
} from '@mui/material';
import { ProcessorList } from './ProcessorList';
import type { Track } from '../contexts/SushiContext';

interface TrackChannelProps {
  track: Track;
  onParameterChange: (trackId: number, parameterId: number, value: number) => void;
  onSoloTrack: (trackId: number) => void;
  isSoloed: boolean;
  onCreateProcessor: (trackId: number) => void;
  onDeleteProcessor: (processorId: number, trackId: number) => void;
  onMoveProcessor: (processorId: number, sourceTrackId: number, destTrackId: number, addToBack?: boolean, beforeProcessorId?: number) => void;
}

export function TrackChannel({ track, onParameterChange, onSoloTrack, isSoloed, onCreateProcessor, onDeleteProcessor }: TrackChannelProps) {
  const getLevelParameter = () => {
    return track.parameters.find(p => 
      p.name.toLowerCase() === 'gain'
    );
  };

  const getPanParameter = () => {
    return track.parameters.find(p => 
      p.name.toLowerCase() === 'pan'
    );
  };

  const getMuteParameter = () => {
    return track.parameters.find(p => 
      p.name.toLowerCase() === 'mute'
    );
  };

  const levelParam = getLevelParameter();
  const panParam = getPanParameter();
  const muteParam = getMuteParameter();

  // Helper functions for parameter value conversion
  // Sushi uses normalized values (0.0-1.0) internally
  const normalizedToDomain = (normalizedValue: number, minDomain: number, maxDomain: number): number => {
    return minDomain + (normalizedValue * (maxDomain - minDomain));
  };

  const domainToNormalized = (domainValue: number, minDomain: number, maxDomain: number): number => {
    return (domainValue - minDomain) / (maxDomain - minDomain);
  };

  const handleLevelChange = (domainValue: number) => {
    if (levelParam) {
      // Convert domain value to normalized value for Sushi
      const normalizedValue = domainToNormalized(domainValue, levelParam.minValue, levelParam.maxValue);
      onParameterChange(track.id, levelParam.parameterId, normalizedValue);
    }
  };

  const handlePanChange = (domainValue: number) => {
    if (panParam) {
      // Convert domain value to normalized value for Sushi
      const normalizedValue = domainToNormalized(domainValue, panParam.minValue, panParam.maxValue);
      onParameterChange(track.id, panParam.parameterId, normalizedValue);
    }
  };

  const handleMuteToggle = () => {
    if (muteParam) {
      // For mute, toggle between 0.0 and 1.0 (already normalized)
      const newNormalizedValue = muteParam.value > 0.5 ? 0.0 : 1.0;
      onParameterChange(track.id, muteParam.parameterId, newNormalizedValue);
    }
  };

  const formatParameterValue = (param: any) => {
    // Convert normalized value to domain value for display
    const domainValue = normalizedToDomain(param.value, param.minValue, param.maxValue);
    if (param.unit) {
      return `${domainValue.toFixed(2)} ${param.unit}`;
    }
    return domainValue.toFixed(2);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: 120, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        p: 1,
        minHeight: 600
      }}
    >
      {/* Processors */}
      <ProcessorList
        processors={track.processors}
        trackId={track.id}
        trackName={track.name}
        onCreateProcessor={onCreateProcessor}
        onDeleteProcessor={onDeleteProcessor}
      />

      {/* Pan Control */}
      {panParam && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ px: 1 }}>
            <Slider
              value={normalizedToDomain(panParam.value, panParam.minValue, panParam.maxValue)}
              min={panParam.minValue}
              max={panParam.maxValue}
              onChange={(_, value) => handlePanChange(value as number)}
              size="small"
              step={0.01}
            />
          </Box>
        </Box>
      )}

      {/* Level Fader */}
      {levelParam && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 200 }}>
          <Box sx={{ height: 150, display: 'flex', justifyContent: 'center' }}>
            <Slider
              orientation="vertical"
              value={normalizedToDomain(levelParam.value, levelParam.minValue, levelParam.maxValue)}
              min={levelParam.minValue}
              max={levelParam.maxValue}
              onChange={(_, value) => handleLevelChange(value as number)}
              sx={{ height: '100%' }}
            />
          </Box>
          <Typography variant="caption" align="center" sx={{ mt: 1 }}>
            {formatParameterValue(levelParam)}
          </Typography>
          
          {/* Mute and Solo Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {/* Mute Button */}
            {muteParam && (
              <Button
                variant={muteParam.value > 0.5 ? "contained" : "outlined"}
                color={muteParam.value > 0.5 ? "error" : "primary"}
                size="small"
                onClick={handleMuteToggle}
                sx={{ minWidth: 32, width: 32, height: 32 }}
              >
                M
              </Button>
            )}
            
            {/* Solo Button */}
            <Button
              variant={isSoloed ? "contained" : "outlined"}
              color={isSoloed ? "warning" : "primary"}
              size="small"
              onClick={() => onSoloTrack(track.id)}
              sx={{ minWidth: 32, width: 32, height: 32 }}
            >
              S
            </Button>
          </Box>
        </Box>
      )}

      {/* Track Name - moved to bottom */}
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Typography 
          variant="subtitle2" 
          align="center" 
          sx={{ 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {track.name}
        </Typography>
      </Box>
    </Paper>
  );
}
