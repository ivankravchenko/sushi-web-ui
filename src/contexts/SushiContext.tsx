import React, { createContext, useContext, useReducer, useCallback, useState } from 'react';
import { SushiGrpcService } from '../services/SushiGrpcService';

export interface Track {
  id: number;
  name: string;
  processors: Processor[];
  parameters: Parameter[];
}

export interface Processor {
  id: number;
  name: string;
  label: string;
  trackId: number;
  bypassed?: boolean;
  properties?: { [key: string]: string };
}

export interface Parameter {
  parameterId: number;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface SushiState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  serverUrl: string;
  engineInfo: {
    sushiVersion?: string;
    sampleRate?: number;
    bufferSize?: number;
    inputChannels?: number;
    outputChannels?: number;
  } | null;
  tracks: Track[];
  cpuLoad: number;
}

type SushiAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SERVER_URL'; payload: string }
  | { type: 'SET_ENGINE_INFO'; payload: SushiState['engineInfo'] }
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'SET_CPU_LOAD'; payload: number }
  | { type: 'UPDATE_PARAMETER'; payload: { trackId: number; parameterId: number; value: number } }
  | { type: 'REMOVE_TRACK'; payload: number }
  | { type: 'REMOVE_PROCESSOR'; payload: { trackId: number; processorId: number } }
  | { type: 'UPDATE_TRACK_PROCESSORS'; payload: { trackId: number; processors: Processor[] } };

const initialState: SushiState = {
  connected: false,
  connecting: false,
  error: null,
  serverUrl: localStorage.getItem('sushi-server-url') || 'http://localhost:8081',
  engineInfo: null,
  tracks: [],
  cpuLoad: 0,
};

function sushiReducer(state: SushiState, action: SushiAction): SushiState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload, error: null };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload, connecting: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, connecting: false, connected: false };
    case 'SET_SERVER_URL':
      return { ...state, serverUrl: action.payload };
    case 'SET_ENGINE_INFO':
      return { ...state, engineInfo: action.payload };
    case 'SET_TRACKS':
      return { ...state, tracks: action.payload };
    case 'SET_CPU_LOAD':
      return { ...state, cpuLoad: action.payload };
    case 'UPDATE_PARAMETER':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                parameters: track.parameters.map(param =>
                  param.parameterId === action.payload.parameterId
                    ? { ...param, value: action.payload.value }
                    : param
                )
              }
            : track
        )
      };
    case 'REMOVE_TRACK':
      return {
        ...state,
        tracks: state.tracks.filter(track => track.id !== action.payload)
      };
    case 'REMOVE_PROCESSOR':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                processors: track.processors.filter(processor => processor.id !== action.payload.processorId)
              }
            : track
        )
      };
    case 'UPDATE_TRACK_PROCESSORS':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                processors: action.payload.processors
              }
            : track
        )
      };
    default:
      return state;
  }
}

interface SushiContextType {
  state: SushiState;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  refreshData: () => Promise<void>;
  setParameterValue: (trackId: number, parameterId: number, value: number) => Promise<void>;
  createTrack: (name: string, channels: number) => Promise<void>;
  createMultibusTrack: (name: string, buses: number) => Promise<void>;
  createPreTrack: (name: string) => Promise<void>;
  createPostTrack: (name: string) => Promise<void>;
  deleteTrack: (trackId: number) => Promise<void>;
  createProcessor: (name: string, uid: string, path: string, type: number, trackId: number) => Promise<void>;
  deleteProcessor: (processorId: number, trackId: number) => Promise<void>;
  moveProcessor: (processorId: number, sourceTrackId: number, destTrackId: number, addToBack?: boolean, beforeProcessorId?: number) => Promise<void>;
}

const SushiContext = createContext<SushiContextType | null>(null);

export function SushiProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sushiReducer, initialState);
  const [grpcService, setGrpcService] = useState<SushiGrpcService | null>(null);
  const [cpuSubscription, setCpuSubscription] = useState<any>(null);
  const [parameterSubscription, setParameterSubscription] = useState<any>(null);
  const [trackSubscription, setTrackSubscription] = useState<any>(null);
  const [processorSubscription, setProcessorSubscription] = useState<any>(null);

  const connect = useCallback(async (url: string) => {
    dispatch({ type: 'SET_CONNECTING', payload: true });
    dispatch({ type: 'SET_SERVER_URL', payload: url });
    
    try {
      // Create real gRPC service
      const service = new SushiGrpcService(url);
      setGrpcService(service);
      
      // Test connection by getting engine info from real Sushi backend
      const engineInfo = await service.getEngineInfo();
      
      dispatch({ type: 'SET_ENGINE_INFO', payload: {
        sushiVersion: engineInfo.sushiVersion,
        sampleRate: engineInfo.sampleRate,
        bufferSize: engineInfo.bufferSize,
        inputChannels: engineInfo.inputChannels,
        outputChannels: engineInfo.outputChannels
      }});
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // Save URL to localStorage
      localStorage.setItem('sushi-server-url', url);
      
      // Load real tracks data
      await loadRealTracks(service);
      
      // Start CPU monitoring
      startCpuMonitoring(service);
      
      // Start parameter monitoring
      startParameterMonitoring(service).catch(() => {
        // Parameter monitoring failed - handled silently
      });
      
      // Start track monitoring
      startTrackMonitoring(service).catch(() => {
        // Track monitoring failed - handled silently
      });
      
      // Start processor monitoring
      startProcessorMonitoring(service).catch(() => {
        // Processor monitoring failed - handled silently
      });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Connection failed: ${error}` });
      setGrpcService(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Clean up CPU subscription
    if (cpuSubscription) {
      cpuSubscription.unsubscribe();
      setCpuSubscription(null);
    }
    
    // Clean up parameter subscription
    if (parameterSubscription) {
      parameterSubscription.unsubscribe();
      setParameterSubscription(null);
    }
    
    // Clean up track subscription
    if (trackSubscription) {
      trackSubscription.unsubscribe();
      setTrackSubscription(null);
    }
    
    // Clean up processor subscription
    if (processorSubscription) {
      processorSubscription.unsubscribe();
      setProcessorSubscription(null);
    }
    
    if (grpcService) {
      grpcService.disconnect();
    }
    setGrpcService(null);
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'SET_TRACKS', payload: [] });
    dispatch({ type: 'SET_ENGINE_INFO', payload: null });
  }, [grpcService, cpuSubscription, parameterSubscription, trackSubscription, processorSubscription]);

  const loadTrackProcessors = async (service: SushiGrpcService, trackId: number) => {
    try {
      // Get processors for this specific track
      const processorsResponse = await service.getProcessorsOnTrack(trackId);
      
      // Get processor properties for send/return processors
      const processors: Processor[] = [];
      for (const proc of processorsResponse.processors) {
        const processor: Processor = {
          id: proc.id,
          name: proc.name,
          label: proc.label,
          trackId: trackId
        };

        // Get properties for send and return processors
        if (proc.label === 'Send' || proc.label === 'Return') {
          try {
            const properties = await service.getProcessorProperties(proc.id);
            const processorProperties: { [key: string]: string } = {};
            
            for (const property of properties.properties || []) {
              const propertyValue = await service.getPropertyValue(proc.id, property.name);
              if (propertyValue) {
                processorProperties[property.name] = propertyValue;
              }
            }
            
            processor.properties = processorProperties;
          } catch (error) {
          }
        }

        processors.push(processor);
      }

      // Update processors for this track
      dispatch({ 
        type: 'UPDATE_TRACK_PROCESSORS', 
        payload: { trackId, processors } 
      });
    } catch (error) {
    }
  };

  const loadRealTracks = async (service: SushiGrpcService) => {
    try {
      // Get tracks from real Sushi backend
      const tracksResponse = await service.getTracks();
      const tracks: Track[] = [];
      
      for (const trackInfo of tracksResponse.tracks) {
        // Get processors for this track
        const processorsResponse = await service.getProcessorsOnTrack(trackInfo.id);
        

        
        // Get parameters for this track and processor properties for send/return processors
        const processors: Processor[] = [];
        for (const proc of processorsResponse.processors) {

          const processor: Processor = {
            id: proc.id,
            name: proc.name,
            label: proc.label,
            trackId: trackInfo.id
          };

          // Fetch properties for send and return processors
          if (proc.label === 'Send' || proc.label === 'Return') {
            try {
              const properties: { [key: string]: string } = {};
              
              if (proc.label === 'Send') {
                // Get destination_name property for send processors
                const destinationName = await service.getPropertyValue(proc.id, 'destination_name');

                if (destinationName) {
                  properties.destination_name = destinationName;
                }
              }
              
              processor.properties = properties;
              // Properties loaded successfully
            } catch (error) {
            }
          }

          processors.push(processor);
        }
        
        // Get track-level parameters (level, pan, etc.)
        let parameters: Parameter[] = [];
        try {
          const trackParametersResponse = await service.getTrackParameters(trackInfo.id);
          // Fetch initial parameter values
          const parametersWithValues = await Promise.all(
            trackParametersResponse.parameters.map(async (param: any) => {
              let initialValue = 0;
              try {
                // Get the current parameter value from Sushi (normalized 0-1)
                const normalizedValue = await service.getParameterValue(trackInfo.id, param.id);
                if (normalizedValue !== null) {
                  // Store the normalized value (0-1) since that's what our UI expects
                  initialValue = normalizedValue;
                }
              } catch (error) {
              }
              
              return {
                parameterId: param.id,
                name: param.name,
                value: initialValue,
                minValue: param.minDomainValue,
                maxValue: param.maxDomainValue,
                unit: param.unit
              };
            })
          );
          
          parameters = parametersWithValues;

        } catch (error) {
        }
        


        
        tracks.push({
          id: trackInfo.id,
          name: trackInfo.name || trackInfo.label,
          processors,
          parameters
        });
      }
      
      dispatch({ type: 'SET_TRACKS', payload: tracks });
      // CPU load will be updated via real-time streaming notifications
    } catch (error) {
      // Fallback to empty tracks on error
      dispatch({ type: 'SET_TRACKS', payload: [] });
    }
  };

  const refreshData = useCallback(async () => {
    if (state.connected && grpcService) {
      await loadRealTracks(grpcService);
    }
  }, [state.connected, grpcService]);

  const startCpuMonitoring = useCallback((service: SushiGrpcService) => {
    // Clean up any existing subscription first
    if (cpuSubscription) {
      cpuSubscription.unsubscribe();
    }
    
    // Subscribe to CPU timing updates via streaming
    try {
      const subscription = service.subscribeToCpuTimings((update) => {
        const cpuLoad = update.average || 0;
        dispatch({ type: 'SET_CPU_LOAD', payload: cpuLoad });
      });
      
      setCpuSubscription(subscription);
        // CPU monitoring subscription cleaned up
      
    } catch (error) {
      // No fallback - if CPU monitoring fails, leave it at 0
    }
  }, [cpuSubscription]);

  const startParameterMonitoring = useCallback(async (service: SushiGrpcService) => {
    // Clean up any existing subscription first
    if (parameterSubscription) {
      parameterSubscription.unsubscribe();
    }
    
    // Subscribe to parameter updates via streaming
    try {
      const observable = await service.subscribeToParameterUpdates();
      const subscription = observable.subscribe({
        next: (update: any) => {
          // Update parameter value in state when we receive updates from Sushi
          if (update.parameter && update.parameter.processorId !== undefined && update.parameter.parameterId !== undefined) {
            // Always use normalizedValue for consistency (0-1 range)
            const normalizedValue = update.normalizedValue;
            if (normalizedValue !== undefined) {
              dispatch({ 
                type: 'UPDATE_PARAMETER', 
                payload: {
                  trackId: update.parameter.processorId, // For track parameters, processorId is trackId
                  parameterId: update.parameter.parameterId,
                  value: normalizedValue
                }
              });
            }
          }
        },
        error: (error: any) => {
        }
      });
      
      setParameterSubscription(subscription);
    } catch (error) {
    }
  }, [parameterSubscription]);

  const startTrackMonitoring = useCallback(async (service: SushiGrpcService) => {
    // Clean up any existing subscription first
    if (trackSubscription) {
      trackSubscription.unsubscribe();
    }
    
    // Subscribe to track changes via streaming
    try {
      const observable = await service.subscribeToTrackChanges();
      const subscription = observable.subscribe({
        next: (update: any) => {
          // Handle track updates (TRACK_ADDED, TRACK_DELETED)
          if (update.action && update.track) {
            if (update.action === 1) { // TRACK_ADDED
              // Reload tracks to get the new track
              loadRealTracks(service);
            } else if (update.action === 2) { // TRACK_DELETED
              // Remove track from state
              dispatch({ 
                type: 'REMOVE_TRACK', 
                payload: update.track.id 
              });
            }
          }
        },
        error: (error: any) => {
        }
      });
      
      setTrackSubscription(subscription);
    } catch (error) {
    }
  }, [trackSubscription]);

  const startProcessorMonitoring = useCallback(async (service: SushiGrpcService) => {
    // Clean up any existing subscription first
    if (processorSubscription) {
      processorSubscription.unsubscribe();
    }
    
    // Subscribe to processor changes via streaming
    try {
      const observable = await service.subscribeToProcessorChanges();
      const subscription = observable.subscribe({
        next: (update: any) => {
          // Handle processor updates (PROCESSOR_ADDED, PROCESSOR_DELETED)
          if (update.action && update.processor && update.parentTrack) {
            if (update.action === 1) { // PROCESSOR_ADDED
              // Reload processors for the affected track
              loadTrackProcessors(service, update.parentTrack.id);
            } else if (update.action === 2) { // PROCESSOR_DELETED
              // Remove processor from the affected track
              dispatch({ 
                type: 'REMOVE_PROCESSOR', 
                payload: {
                  trackId: update.parentTrack.id,
                  processorId: update.processor.id
                }
              });
            }
          }
        },
        error: (error: any) => {
        }
      });
      
      setProcessorSubscription(subscription);
    } catch (error) {
    }
  }, [processorSubscription]);

  const setParameterValue = useCallback(async (trackId: number, parameterId: number, value: number) => {
    if (!grpcService) return;
    
    try {
      // Use track-level parameter method for track parameters (gain, pan, mute)
      await grpcService.setTrackParameterValue(trackId, parameterId, value);
      
      // Update parameter locally to reflect the change immediately
      dispatch({
        type: 'UPDATE_PARAMETER',
        payload: { trackId, parameterId, value }
      });

    } catch (error) {
    }
  }, [grpcService]);

  // Track management methods
  const createTrack = useCallback(async (name: string, channels: number) => {
    if (!grpcService) return;
    try {
      await grpcService.createTrack(name, channels);
    } catch (error) {
    }
  }, [grpcService]);

  const createMultibusTrack = useCallback(async (name: string, buses: number) => {
    if (!grpcService) return;
    try {
      await grpcService.createMultibusTrack(name, buses);
    } catch (error) {
    }
  }, [grpcService]);

  const createPreTrack = useCallback(async (name: string) => {
    if (!grpcService) return;
    try {
      await grpcService.createPreTrack(name);
    } catch (error) {
    }
  }, [grpcService]);

  const createPostTrack = useCallback(async (name: string) => {
    if (!grpcService) return;
    try {
      await grpcService.createPostTrack(name);
    } catch (error) {
    }
  }, [grpcService]);

  const deleteTrack = useCallback(async (trackId: number) => {
    if (!grpcService) return;
    try {
      await grpcService.deleteTrack(trackId);
    } catch (error) {
    }
  }, [grpcService]);

  const createProcessor = useCallback(async (name: string, uid: string, path: string, type: number, trackId: number) => {
    if (!grpcService) return;
    try {
      await grpcService.createProcessor(name, uid, path, type, trackId);
    } catch (error) {
    }
  }, [grpcService]);

  const deleteProcessor = useCallback(async (processorId: number, trackId: number) => {
    if (!grpcService) return;
    try {
      await grpcService.deleteProcessor(processorId, trackId);
    } catch (error) {
    }
  }, [grpcService]);

  const moveProcessor = useCallback(async (processorId: number, sourceTrackId: number, destTrackId: number, addToBack: boolean = true, beforeProcessorId?: number) => {
    if (!grpcService) return;
    try {
      await grpcService.moveProcessor(processorId, sourceTrackId, destTrackId, addToBack, beforeProcessorId);
    } catch (error) {
    }
  }, [grpcService]);

  const contextValue: SushiContextType = {
    state,
    connect,
    disconnect,
    refreshData,
    setParameterValue,
    createTrack,
    createMultibusTrack,
    createPreTrack,
    createPostTrack,
    deleteTrack,
    createProcessor,
    deleteProcessor,
    moveProcessor,
  };

  return (
    <SushiContext.Provider value={contextValue}>
      {children}
    </SushiContext.Provider>
  );
}

export function useSushi() {
  const context = useContext(SushiContext);
  if (!context) {
    throw new Error('useSushi must be used within a SushiProvider');
  }
  return context;
}
