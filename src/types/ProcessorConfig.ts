// Configuration types for processor parameter/property UI customization

export type ParameterComponentType = 
  | 'slider'
  | 'knob'
  | 'toggle'
  | 'dropdown'
  | 'textfield'
  | 'button';

export interface ParameterDisplayConfig {
  parameterId: number;
  parameterName: string;
  displayName?: string; // Custom display name
  componentType?: ParameterComponentType; // Override default component
  order: number; // Display order
  tab: 'primary' | 'secondary'; // Which tab to show in
  visible: boolean; // Whether to show this parameter
  customOptions?: {
    // For dropdown components
    options?: { value: number; label: string }[];
    // For sliders/knobs
    step?: number;
    precision?: number;
    description?: string;
  };
}

export type PropertyComponentType = 
  | 'textfield'
  | 'textarea';

export interface PropertyDisplayConfig {
  propertyId: number;
  propertyName: string;
  componentType: PropertyComponentType;
  visible: boolean;
  tab: 'primary' | 'secondary';
  order: number;
  customization?: {
    multiline?: boolean;
    placeholder?: string;
    description?: string;
  };
}

export interface ProcessorDisplayConfig {
  processorId: number;
  processorName: string;
  parameters: ParameterDisplayConfig[];
  properties: PropertyDisplayConfig[];
  tabOrder: ('primary' | 'secondary')[];
  primaryTabName: string;
  secondaryTabName: string;
}

export interface ProcessorConfigurationState {
  configurations: { [processorId: number]: ProcessorDisplayConfig };
}

// Helper function to get default component type
export function getDefaultComponentType(parameterType: number): ParameterComponentType {
  switch (parameterType) {
    case 1: // BOOL
      return 'toggle';
    case 2: // INT
    case 3: // FLOAT
      return 'slider';
    default:
      return 'textfield';
  }
}

// Default configuration generators
export function createDefaultParameterConfig(
  parameterId: number, 
  parameterName: string, 
  parameterType: number,
  order: number
): ParameterDisplayConfig {
  return {
    parameterId,
    parameterName,
    componentType: getDefaultComponentType(parameterType),
    visible: true,
    tab: 'primary',
    order
  };
}

export function createDefaultPropertyConfig(
  propertyId: number,
  propertyName: string,
  order: number
): PropertyDisplayConfig {
  return {
    propertyId,
    propertyName,
    componentType: 'textfield',
    visible: true,
    tab: 'primary', // Properties go to main tab by default
    order
  };
}

export function createDefaultProcessorConfig(processorId: number, processorName: string): ProcessorDisplayConfig {
  return {
    processorId,
    processorName,
    primaryTabName: '1',
    secondaryTabName: '2',
    parameters: [],
    properties: [],
    tabOrder: ['primary', 'secondary']
  };
}
