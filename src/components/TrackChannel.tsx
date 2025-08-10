
import {
  Box,
  Paper,
  Typography,
  Slider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import type { Track } from '../contexts/SushiContext';

interface TrackChannelProps {
  track: Track;
  onParameterChange: (trackId: number, parameterId: number, value: number) => void;
}

export function TrackChannel({ track, onParameterChange }: TrackChannelProps) {
  const getLevelParameter = () => {
    return track.parameters.find(p => 
      p.name.toLowerCase().includes('level') || 
      p.name.toLowerCase().includes('gain') ||
      p.name.toLowerCase().includes('volume')
    );
  };

  const getPanParameter = () => {
    return track.parameters.find(p => 
      p.name.toLowerCase().includes('pan') || 
      p.name.toLowerCase().includes('balance')
    );
  };

  const levelParam = getLevelParameter();
  const panParam = getPanParameter();

  const handleLevelChange = (value: number) => {
    if (levelParam) {
      onParameterChange(track.id, levelParam.parameterId, value);
    }
  };

  const handlePanChange = (value: number) => {
    if (panParam) {
      onParameterChange(track.id, panParam.parameterId, value);
    }
  };

  const formatParameterValue = (param: any) => {
    if (param.unit) {
      return `${param.value.toFixed(2)} ${param.unit}`;
    }
    return param.value.toFixed(2);
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
      {/* Track Name */}
      <Typography 
        variant="subtitle2" 
        align="center" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {track.name}
      </Typography>

      {/* Processors */}
      <Box sx={{ mb: 2, flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Processors
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {track.processors.map((processor) => (
            <Card key={processor.id} variant="outlined" sx={{ minHeight: 40 }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.7rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}
                >
                  {processor.name}
                </Typography>
              </CardContent>
            </Card>
          ))}
          {track.processors.length === 0 && (
            <Typography variant="caption" color="text.secondary" align="center">
              No processors
            </Typography>
          )}
        </Box>
      </Box>

      {/* Pan Control */}
      {panParam && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 1 }}>
            Pan
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={panParam.value}
              min={panParam.minValue}
              max={panParam.maxValue}
              onChange={(_, value) => handlePanChange(value as number)}
              size="small"
              marks={[
                { value: panParam.minValue, label: 'L' },
                { value: (panParam.minValue + panParam.maxValue) / 2, label: 'C' },
                { value: panParam.maxValue, label: 'R' }
              ]}
            />
            <Typography variant="caption" align="center" sx={{ display: 'block', mt: 0.5 }}>
              {formatParameterValue(panParam)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Level Fader */}
      {levelParam && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 200 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Level
          </Typography>
          <Box sx={{ height: 150, display: 'flex', justifyContent: 'center' }}>
            <Slider
              orientation="vertical"
              value={levelParam.value}
              min={levelParam.minValue}
              max={levelParam.maxValue}
              onChange={(_, value) => handleLevelChange(value as number)}
              sx={{ height: '100%' }}
            />
          </Box>
          <Typography variant="caption" align="center" sx={{ mt: 1 }}>
            {formatParameterValue(levelParam)}
          </Typography>
        </Box>
      )}

      {/* Track ID Chip */}
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Chip 
          label={`ID: ${track.id}`} 
          size="small" 
          variant="outlined" 
          sx={{ width: '100%' }}
        />
      </Box>
    </Paper>
  );
}
