import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { ProcessorCard } from './ProcessorCard';
import type { Processor } from '../contexts/SushiContext';

interface ProcessorListProps {
  processors: Processor[];
  trackId: number;
  trackName: string;
  onCreateProcessor: (trackId: number) => void;
  onDeleteProcessor: (processorId: number, trackId: number) => void;
}

export function ProcessorList({ 
  processors, 
  trackId, 
  trackName, 
  onCreateProcessor, 
  onDeleteProcessor 
}: ProcessorListProps) {
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `track-${trackId}`,
    data: {
      type: 'track',
      trackId,
      trackName,
    },
  });

  const processorIds = processors.map(p => `processor-${p.id}`);

  return (
    <Box 
      ref={setNodeRef}
      sx={{ 
        mb: 2, 
        flexGrow: 1,
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        borderRadius: 1,
        p: 0.5,
        transition: 'background-color 0.2s ease',
      }}
    >
      <SortableContext items={processorIds} strategy={verticalListSortingStrategy}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {processors.map((processor) => (
            <ProcessorCard
              key={processor.id}
              processor={processor}
              trackId={trackId}
              onDeleteProcessor={onDeleteProcessor}
            />
          ))}
          
          {processors.length === 0 && (
            <Typography variant="caption" color="text.secondary" align="center">
              No processors
            </Typography>
          )}
          
          {/* Add Processor Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onCreateProcessor(trackId)}
              sx={{ 
                border: '1px dashed',
                borderColor: 'primary.main',
                borderRadius: 1,
                width: '100%',
                height: 32
              }}
            >
              <AddIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>
        </Box>
      </SortableContext>
    </Box>
  );
}
