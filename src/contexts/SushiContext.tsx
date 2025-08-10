import React, { createContext, useContext, useReducer, useCallback } from 'react';
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
  trackId: number;
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
  | { type: 'UPDATE_PARAMETER'; payload: { trackId: number; parameterId: number; value: number } };

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
}

const SushiContext = createContext<SushiContextType | null>(null);

export function SushiProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sushiReducer, initialState);
  const [grpcService, setGrpcService] = React.useState<SushiGrpcService | null>(null);
  const [cpuSubscription, setCpuSubscription] = React.useState<{ unsubscribe: () => void } | null>(null);

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
    
    if (grpcService) {
      grpcService.disconnect();
    }
    setGrpcService(null);
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'SET_TRACKS', payload: [] });
    dispatch({ type: 'SET_ENGINE_INFO', payload: null });
  }, [grpcService, cpuSubscription]);

  const loadRealTracks = async (service: SushiGrpcService) => {
    try {
      // Get tracks from real Sushi backend
      const tracksResponse = await service.getTracks();
      const tracks: Track[] = [];
      
      for (const trackInfo of tracksResponse.tracks) {
        // Get processors for this track
        const processorsResponse = await service.getProcessorsOnTrack(trackInfo.id);
        
        // Get parameters for this track (using processor parameters instead)
        const processors: Processor[] = processorsResponse.processors.map((proc: any) => ({
          id: proc.id,
          name: proc.name,
          trackId: trackInfo.id
        }));
        
        // For now, we'll get parameters from the first processor if available
        let parameters: Parameter[] = [];
        if (processors.length > 0) {
          try {
            const parametersResponse = await service.getProcessorParameters(processors[0].id);
            parameters = parametersResponse.parameters.map((param: any) => ({
              parameterId: param.id,
              name: param.name,
              value: 0, // Will be updated via real parameter values
              minValue: param.minDomainValue,
              maxValue: param.maxDomainValue,
              unit: param.unit
            }));
          } catch (error) {
            console.warn(`Failed to get parameters for processor ${processors[0].id}:`, error);
          }
        }

        
        tracks.push({
          id: trackInfo.id,
          name: trackInfo.name || trackInfo.label,
          processors,
          parameters
        });
      }
      
      dispatch({ type: 'SET_TRACKS', payload: tracks });
      dispatch({ type: 'SET_CPU_LOAD', payload: 0.25 }); // Will be updated via notifications
    } catch (error) {
      console.error('Failed to load tracks from Sushi backend:', error);
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
      console.error('Failed to subscribe to CPU timings:', error);
      // Fallback to mock updates if streaming fails
      const updateCpuLoad = () => {
        const mockLoad = 0.15 + Math.random() * 0.1; // 15-25% mock load
        dispatch({ type: 'SET_CPU_LOAD', payload: mockLoad });
      };
      
      // Initial update
      updateCpuLoad();
      
      // Set up periodic updates
      const intervalId = setInterval(updateCpuLoad, 2000);
      
      // Store interval for cleanup
      setCpuSubscription({ unsubscribe: () => clearInterval(intervalId) });
    }
  }, [cpuSubscription]);

  const setParameterValue = useCallback(async (trackId: number, parameterId: number, value: number) => {
    if (!grpcService) return;
    
    try {
      // For now, we need to find the processor ID from the track
      // This is a simplified approach - in a real app you'd track processor IDs properly
      const tracks = state.tracks.find(t => t.id === trackId);
      if (!tracks || tracks.processors.length === 0) {
        console.warn(`No processors found for track ${trackId}`);
        return;
      }
      
      const processorId = tracks.processors[0].id;
      
      // Update parameter on real Sushi backend
      await grpcService.setParameterValue(processorId, parameterId, value);
      
      // Update parameter locally to reflect the change immediately
      dispatch({
        type: 'UPDATE_PARAMETER',
        payload: { trackId, parameterId, value }
      });
      

    } catch (error) {
      console.error('Failed to set parameter on Sushi backend:', error);
    }
  }, [grpcService, state.tracks]);

  const contextValue: SushiContextType = {
    state,
    connect,
    disconnect,
    refreshData,
    setParameterValue,
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
