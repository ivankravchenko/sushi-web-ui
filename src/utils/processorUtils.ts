import type { Processor } from '../contexts/SushiContext';

/**
 * Generate display text for a processor following consistent labeling rules
 */
export function getProcessorDisplayText(processor: Processor): string {
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
  
  return displayText;
}
