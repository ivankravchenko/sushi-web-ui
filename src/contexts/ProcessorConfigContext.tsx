import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type {
  ProcessorConfigurationState,
  ProcessorDisplayConfig,
  ParameterDisplayConfig,
  PropertyDisplayConfig,
  createDefaultProcessorConfig,
  createDefaultParameterConfig,
  createDefaultPropertyConfig
} from '../types/ProcessorConfig';

// Import the default creators
import {
  createDefaultProcessorConfig as createDefaultConfig,
  createDefaultParameterConfig as createDefaultParamConfig,
  createDefaultPropertyConfig as createDefaultPropConfig
} from '../types/ProcessorConfig';

type ConfigAction =
  | { type: 'LOAD_CONFIG'; payload: ProcessorConfigurationState }
  | { type: 'UPDATE_PROCESSOR_CONFIG'; payload: ProcessorDisplayConfig }
  | { type: 'UPDATE_PARAMETER_CONFIG'; processorId: number; parameter: ParameterDisplayConfig }
  | { type: 'UPDATE_PROPERTY_CONFIG'; processorId: number; property: PropertyDisplayConfig }
  | { type: 'REORDER_PARAMETERS'; processorId: number; parameterIds: number[] }
  | { type: 'REORDER_PROPERTIES'; processorId: number; propertyIds: number[] }
  | { type: 'MOVE_PARAMETER_TO_TAB'; processorId: number; parameterId: number; tab: 'primary' | 'secondary' }
  | { type: 'MOVE_PROPERTY_TO_TAB'; processorId: number; propertyId: number; tab: 'primary' | 'secondary' }
  | { type: 'UPDATE_TAB_NAMES'; processorId: number; primaryName: string; secondaryName: string }
  | { type: 'RESET_PROCESSOR_CONFIG'; processorId: number };

const initialState: ProcessorConfigurationState = {
  configurations: {},
  globalDefaults: {
    primaryTabName: 'Main',
    secondaryTabName: 'Advanced',
    defaultParameterTab: 'primary',
    defaultPropertyTab: 'secondary',
  },
};

function configReducer(state: ProcessorConfigurationState, action: ConfigAction): ProcessorConfigurationState {
  switch (action.type) {
    case 'LOAD_CONFIG':
      return action.payload;

    case 'UPDATE_PROCESSOR_CONFIG':
      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.payload.processorId]: action.payload,
        },
      };

    case 'UPDATE_PARAMETER_CONFIG': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const updatedParameters = processorConfig.parameters.map(param =>
        param.parameterId === action.parameter.parameterId ? action.parameter : param
      );

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            parameters: updatedParameters,
          },
        },
      };
    }

    case 'UPDATE_PROPERTY_CONFIG': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const updatedProperties = processorConfig.properties.map(prop =>
        prop.propertyId === action.property.propertyId ? action.property : prop
      );

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            properties: updatedProperties,
          },
        },
      };
    }

    case 'REORDER_PARAMETERS': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const reorderedParameters = action.parameterIds.map((id, index) => {
        const param = processorConfig.parameters.find(p => p.parameterId === id);
        return param ? { ...param, order: index } : null;
      }).filter(Boolean) as ParameterDisplayConfig[];

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            parameters: reorderedParameters,
          },
        },
      };
    }

    case 'REORDER_PROPERTIES': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const reorderedProperties = action.propertyIds.map((id, index) => {
        const prop = processorConfig.properties.find(p => p.propertyId === id);
        return prop ? { ...prop, order: index } : null;
      }).filter(Boolean) as PropertyDisplayConfig[];

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            properties: reorderedProperties,
          },
        },
      };
    }

    case 'MOVE_PARAMETER_TO_TAB': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const updatedParameters = processorConfig.parameters.map(param =>
        param.parameterId === action.parameterId ? { ...param, tab: action.tab } : param
      );

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            parameters: updatedParameters,
          },
        },
      };
    }

    case 'MOVE_PROPERTY_TO_TAB': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      const updatedProperties = processorConfig.properties.map(prop =>
        prop.propertyId === action.propertyId ? { ...prop, tab: action.tab } : prop
      );

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            properties: updatedProperties,
          },
        },
      };
    }

    case 'UPDATE_TAB_NAMES': {
      const processorConfig = state.configurations[action.processorId];
      if (!processorConfig) return state;

      return {
        ...state,
        configurations: {
          ...state.configurations,
          [action.processorId]: {
            ...processorConfig,
            primaryTabName: action.primaryName,
            secondaryTabName: action.secondaryName,
          },
        },
      };
    }

    case 'RESET_PROCESSOR_CONFIG': {
      const { [action.processorId]: removed, ...remainingConfigs } = state.configurations;
      return {
        ...state,
        configurations: remainingConfigs,
      };
    }

    default:
      return state;
  }
}

interface ProcessorConfigContextType {
  state: ProcessorConfigurationState;
  getProcessorConfig: (processorId: number, processorName: string) => ProcessorDisplayConfig;
  updateProcessorConfig: (config: ProcessorDisplayConfig) => void;
  updateParameterConfig: (processorId: number, parameter: ParameterDisplayConfig) => void;
  updatePropertyConfig: (processorId: number, property: PropertyDisplayConfig) => void;
  reorderParameters: (processorId: number, parameterIds: number[]) => void;
  reorderProperties: (processorId: number, propertyIds: number[]) => void;
  moveParameterToTab: (processorId: number, parameterId: number, tab: 'primary' | 'secondary') => void;
  movePropertyToTab: (processorId: number, propertyId: number, tab: 'primary' | 'secondary') => void;
  updateTabNames: (processorId: number, primaryName: string, secondaryName: string) => void;
  resetProcessorConfig: (processorId: number) => void;
  saveConfiguration: () => void;
  loadConfiguration: () => void;
}

const ProcessorConfigContext = createContext<ProcessorConfigContextType | null>(null);

export function ProcessorConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, initialState);

  const getProcessorConfig = useCallback((processorId: number, processorName: string): ProcessorDisplayConfig => {
    const existing = state.configurations[processorId];
    if (existing) {
      return existing;
    }

    // Create default configuration
    const defaultConfig = createDefaultConfig(processorId, processorName);
    return defaultConfig;
  }, [state.configurations]);

  const updateProcessorConfig = useCallback((config: ProcessorDisplayConfig) => {
    dispatch({ type: 'UPDATE_PROCESSOR_CONFIG', payload: config });
  }, []);

  const updateParameterConfig = useCallback((processorId: number, parameter: ParameterDisplayConfig) => {
    dispatch({ type: 'UPDATE_PARAMETER_CONFIG', processorId, parameter });
  }, []);

  const updatePropertyConfig = useCallback((processorId: number, property: PropertyDisplayConfig) => {
    dispatch({ type: 'UPDATE_PROPERTY_CONFIG', processorId, property });
  }, []);

  const reorderParameters = useCallback((processorId: number, parameterIds: number[]) => {
    dispatch({ type: 'REORDER_PARAMETERS', processorId, parameterIds });
  }, []);

  const reorderProperties = useCallback((processorId: number, propertyIds: number[]) => {
    dispatch({ type: 'REORDER_PROPERTIES', processorId, propertyIds });
  }, []);

  const moveParameterToTab = useCallback((processorId: number, parameterId: number, tab: 'primary' | 'secondary') => {
    dispatch({ type: 'MOVE_PARAMETER_TO_TAB', processorId, parameterId, tab });
  }, []);

  const movePropertyToTab = useCallback((processorId: number, propertyId: number, tab: 'primary' | 'secondary') => {
    dispatch({ type: 'MOVE_PROPERTY_TO_TAB', processorId, propertyId, tab });
  }, []);

  const updateTabNames = useCallback((processorId: number, primaryName: string, secondaryName: string) => {
    dispatch({ type: 'UPDATE_TAB_NAMES', processorId, primaryName, secondaryName });
  }, []);

  const resetProcessorConfig = useCallback((processorId: number) => {
    dispatch({ type: 'RESET_PROCESSOR_CONFIG', processorId });
  }, []);

  const saveConfiguration = useCallback(() => {
    try {
      localStorage.setItem('sushi-processor-config', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save processor configuration:', error);
    }
  }, [state]);

  const loadConfiguration = useCallback(() => {
    try {
      const saved = localStorage.getItem('sushi-processor-config');
      if (saved) {
        const config = JSON.parse(saved) as ProcessorConfigurationState;
        dispatch({ type: 'LOAD_CONFIG', payload: config });
      }
    } catch (error) {
      console.warn('Failed to load processor configuration:', error);
    }
  }, []);

  const contextValue: ProcessorConfigContextType = {
    state,
    getProcessorConfig,
    updateProcessorConfig,
    updateParameterConfig,
    updatePropertyConfig,
    reorderParameters,
    reorderProperties,
    moveParameterToTab,
    movePropertyToTab,
    updateTabNames,
    resetProcessorConfig,
    saveConfiguration,
    loadConfiguration,
  };

  return (
    <ProcessorConfigContext.Provider value={contextValue}>
      {children}
    </ProcessorConfigContext.Provider>
  );
}

export function useProcessorConfig() {
  const context = useContext(ProcessorConfigContext);
  if (!context) {
    throw new Error('useProcessorConfig must be used within a ProcessorConfigProvider');
  }
  return context;
}
