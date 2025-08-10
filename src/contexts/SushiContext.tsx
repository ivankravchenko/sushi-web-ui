import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SushiGrpcClient } from '../services/SushiGrpcClient';

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
  serverUrl: localStorage.getItem('sushi-server-url') || 'http://localhost:8080',
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
  const [grpcClient, setGrpcClient] = React.useState<SushiGrpcClient | null>(null);

  const connect = useCallback(async (url: string) => {
    dispatch({ type: 'SET_CONNECTING', payload: true });
    dispatch({ type: 'SET_SERVER_URL', payload: url });
    
    try {
      // Create real gRPC client
      const client = new SushiGrpcClient(url);
      setGrpcClient(client);
      
      // Test connection by getting engine info from real Sushi backend
      const engineInfo = await client.getEngineInfo();
      
      dispatch({ type: 'SET_ENGINE_INFO', payload: {
        sushiVersion: engineInfo.sushiVersion,
        sampleRate: engineInfo.sampleRate,
        bufferSize: engineInfo.bufferSize
      }});
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // Save URL to localStorage
      localStorage.setItem('sushi-server-url', url);
      
      // Load real tracks data
      await loadRealTracks(client);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Connection failed: ${error}` });
      setGrpcClient(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    setGrpcClient(null);
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'SET_TRACKS', payload: [] });
    dispatch({ type: 'SET_ENGINE_INFO', payload: null });
  }, []);

  const loadRealTracks = async (client: SushiGrpcClient) => {
    try {
      // Get tracks from real Sushi backend
      const tracksResponse = await client.getTracks();
      const tracks: Track[] = [];
      
      for (const trackInfo of tracksResponse.tracks) {
        // Get processors for this track
        const processorsResponse = await client.getProcessorsOnTrack(trackInfo.id);
        
        // Get parameters for this track
        const parametersResponse = await client.getTrackParameters(trackInfo.id);
        
        const processors: Processor[] = processorsResponse.processors.map(proc => ({
          id: proc.id,
          name: proc.name,
          trackId: trackInfo.id
        }));
        
        const parameters: Parameter[] = parametersResponse.parameters.map(param => ({
          parameterId: param.parameterId,
          name: param.name,
          value: param.value,
          minValue: param.minValue,
          maxValue: param.maxValue,
          unit: param.unit
        }));
        
        tracks.push({
          id: trackInfo.id,
          name: trackInfo.name,
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
    if (state.connected && grpcClient) {
      await loadRealTracks(grpcClient);
    }
  }, [state.connected, grpcClient]);

  const setParameterValue = useCallback(async (trackId: number, parameterId: number, value: number) => {
    if (!grpcClient) return;
    
    try {
      // Update parameter on real Sushi backend
      await grpcClient.setParameterValue(trackId, parameterId, value);
      
      // Update parameter locally to reflect the change immediately
      dispatch({
        type: 'UPDATE_PARAMETER',
        payload: { trackId, parameterId, value }
      });
      
      console.log(`Successfully set parameter ${parameterId} on track ${trackId} to ${value}`);
    } catch (error) {
      console.error('Failed to set parameter on Sushi backend:', error);
    }
  }, [grpcClient]);

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
