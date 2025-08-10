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
    // For any component
    description?: string;
    color?: string;
  };
}

export interface PropertyDisplayConfig {
  propertyId: number;
  propertyName: string;
  displayName?: string;
  componentType?: ParameterComponentType;
  order: number;
  tab: 'primary' | 'secondary';
  visible: boolean;
  customOptions?: {
    multiline?: boolean;
    placeholder?: string;
    description?: string;
  };
}

export interface ProcessorDisplayConfig {
  processorId: number;
  processorName: string;
  displayName?: string;
  parameters: ParameterDisplayConfig[];
  properties: PropertyDisplayConfig[];
  tabOrder: ('primary' | 'secondary')[];
  primaryTabName: string;
  secondaryTabName: string;
}

export interface ProcessorConfigurationState {
  configurations: { [processorId: number]: ProcessorDisplayConfig };
  globalDefaults: {
    primaryTabName: string;
    secondaryTabName: string;
    defaultParameterTab: 'primary' | 'secondary';
    defaultPropertyTab: 'primary' | 'secondary';
  };
}

// Default configuration generator
export function createDefaultParameterConfig(
  parameterId: number,
  parameterName: string,
  parameterType: number,
  order: number
): ParameterDisplayConfig {
  let defaultComponent: ParameterComponentType = 'slider';
  
  switch (parameterType) {
    case 1: // BOOL
      defaultComponent = 'toggle';
      break;
    case 2: // INT
    case 3: // FLOAT
      defaultComponent = 'slider';
      break;
    default:
      defaultComponent = 'textfield';
  }

  return {
    parameterId,
    parameterName,
    componentType: defaultComponent,
    order,
    tab: 'primary',
    visible: true,
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
    order,
    tab: 'secondary',
    visible: true,
  };
}

export function createDefaultProcessorConfig(
  processorId: number,
  processorName: string
): ProcessorDisplayConfig {
  return {
    processorId,
    processorName,
    parameters: [],
    properties: [],
    tabOrder: ['primary', 'secondary'],
    primaryTabName: 'Main',
    secondaryTabName: 'Advanced',
  };
}
