import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { PowerSettingsNew as BypassIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Processor } from '../contexts/SushiContext';
import { ProcessorDialog } from './ProcessorDialog';
import { getProcessorDisplayText } from '../utils/processorUtils';
import { sushiGrpcService } from '../services/SushiGrpcService';

interface ProcessorCardProps {
  processor: Processor;
  trackId: number;
  onDeleteProcessor: (processorId: number, trackId: number) => void;
}

export function ProcessorCard({ processor, trackId, onDeleteProcessor }: ProcessorCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bypassed, setBypassed] = useState(processor.bypassed ?? false);

  // Load initial bypass state from backend
  useEffect(() => {
    const loadBypassState = async () => {
      try {
        const currentBypassState = await sushiGrpcService.getProcessorBypassState(processor.id);
        setBypassed(currentBypassState);
      } catch (error) {
        console.warn(`ProcessorCard: Failed to load bypass state for processor ${processor.id}:`, error);
      }
    };

    loadBypassState();
  }, [processor.id]);
  
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

  // Get consistent processor display text
  const displayText = getProcessorDisplayText(processor);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open dialog if not dragging and not clicking action buttons
    const target = e.target as HTMLElement;
    const isDeleteButton = target.closest('[data-delete-button]');
    const isBypassButton = target.closest('[data-bypass-button]');
    
    if (!isDragging && !isDeleteButton && !isBypassButton) {
      setDialogOpen(true);
    }
  };

  const handleBypassToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await sushiGrpcService.setProcessorBypassState(processor.id, !bypassed);
      setBypassed(!bypassed);
    } catch (error) {
      console.error('ProcessorCard: Failed to toggle processor bypass:', error);
      // Revert state on error
      setBypassed(!bypassed);
    }
  };

  return (
    <>
      <Box 
        ref={setNodeRef} 
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        sx={{ 
          minHeight: 40,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          cursor: isDragging ? 'grabbing' : 'pointer',
          backgroundColor: bypassed ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)', // Lighter for bypassed, darker for active
          '&:hover': {
            boxShadow: 2,
            backgroundColor: bypassed ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.3)', // Hover states
          },
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          position: 'relative',
          overflow: 'visible' // Ensure buttons are not clipped
        }}
        {...attributes}
        {...listeners}
      >
      {/* Processor Name - Flexible width */}
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.7rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          mr: 1, // Margin for buttons
          color: bypassed ? 'rgba(255, 255, 255, 0.7)' : 'inherit' // Slightly gray for bypassed processors
        }}
      >
        {displayText}
      </Typography>
      
      {/* Delete Button - Only visible on hover (first button) */}
      {isHovered && (
        <IconButton 
          size="small" 
          color="error"
          data-delete-button
          sx={{ 
            p: 0.25, 
            minWidth: 'auto',
            width: 24,
            height: 24,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid rgba(244, 67, 54, 0.5)',
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteProcessor(processor.id, trackId);
          }}
        >
          <RemoveIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      )}

      {/* Bypass Button - Always visible for bypassed processors, hover-only for active processors */}
      {(bypassed || isHovered) && (
        <IconButton 
          size="small" 
          color={bypassed ? "secondary" : "default"}
          data-bypass-button
          sx={{ 
            p: 0.25, 
            minWidth: 'auto',
            width: 24,
            height: 24,
            backgroundColor: bypassed ? 'rgba(156, 39, 176, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&:hover': {
              backgroundColor: bypassed ? 'rgba(156, 39, 176, 0.25)' : 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            }
          }}
          onClick={handleBypassToggle}
        >
          <BypassIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      )}
      </Box>
      
      <ProcessorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        processor={processor}
      />
    </>
  );
}
