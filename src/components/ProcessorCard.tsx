import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Remove as RemoveIcon } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Processor } from '../contexts/SushiContext';

interface ProcessorCardProps {
  processor: Processor;
  trackId: number;
  onDeleteProcessor: (processorId: number, trackId: number) => void;
}

export function ProcessorCard({ processor, trackId, onDeleteProcessor }: ProcessorCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `processor-${processor.id}`,
    data: {
      type: 'processor',
      processor,
      trackId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Special handling for send and return processors
  let displayText = processor.label;
  
  if (processor.label === 'Send') {
    // For send processors: <label> → <destination_name>
    const destinationName = processor.properties?.destination_name;
    if (destinationName) {
      displayText = `${processor.label} → ${destinationName}`;
    } else {
      displayText = `${processor.label} →`;
    }
  } else if (processor.label === 'Return') {
    // For return processors: <label> (<name>)
    displayText = `${processor.label} (${processor.name})`;
  }

  return (
    <Box 
      ref={setNodeRef} 
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        minHeight: 40,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': {
          boxShadow: 2,
        },
        p: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        position: 'relative'
      }}
      {...attributes}
      {...listeners}
    >
      {/* Processor Name - Full width draggable area */}
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.7rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          pr: isHovered ? 3 : 0, // Add padding when delete button is visible
          transition: 'padding-right 0.2s ease'
        }}
      >
        {displayText}
      </Typography>
      
      {/* Delete Button - Only visible on hover */}
      {isHovered && (
        <IconButton 
          size="small" 
          color="error"
          sx={{ 
            p: 0.25, 
            minWidth: 'auto',
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteProcessor(processor.id, trackId);
          }}
        >
          <RemoveIcon sx={{ fontSize: '0.8rem' }} />
        </IconButton>
      )}
    </Box>
  );
}
