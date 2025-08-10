import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  SushiControllerClient,
  GetEngineInfoRequest,
  GetEngineInfoResponse,
  GetTracksRequest,
  GetTracksResponse,
  GetProcessorsOnTrackRequest,
  GetProcessorsOnTrackResponse,
  GetTrackParametersRequest,
  GetTrackParametersResponse,
  SubscribeToNotificationsRequest,
  NotificationResponse
} from '../generated/sushi_rpc';

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
  engineInfo: GetEngineInfoResponse | null;
  tracks: Track[];
  cpuLoad: number;
}

type SushiAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SERVER_URL'; payload: string }
  | { type: 'SET_ENGINE_INFO'; payload: GetEngineInfoResponse }
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
  const [client, setClient] = React.useState<SushiControllerClient | null>(null);
  const [notificationStream, setNotificationStream] = React.useState<any>(null);

  const connect = useCallback(async (url: string) => {
    dispatch({ type: 'SET_CONNECTING', payload: true });
    dispatch({ type: 'SET_SERVER_URL', payload: url });
    
    try {
      const newClient = new SushiControllerClient(url);
      setClient(newClient);
      
      // Test connection by getting engine info
      const engineInfo = await newClient.getEngineInfo(new GetEngineInfoRequest());
      dispatch({ type: 'SET_ENGINE_INFO', payload: engineInfo });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // Save URL to localStorage
      localStorage.setItem('sushi-server-url', url);
      
      // Load initial data
      await loadTracks(newClient);
      
      // Subscribe to notifications
      subscribeToNotifications(newClient);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Connection failed: ${error}` });
      setClient(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (notificationStream) {
      notificationStream.cancel();
      setNotificationStream(null);
    }
    setClient(null);
    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, [notificationStream]);

  const loadTracks = async (sushiClient: SushiControllerClient) => {
    try {
      const tracksResponse = await sushiClient.getTracks(new GetTracksRequest());
      const tracks: Track[] = [];
      
      for (const trackInfo of tracksResponse.tracks) {
        // Get processors for this track
        const processorsResponse = await sushiClient.getProcessorsOnTrack(
          new GetProcessorsOnTrackRequest({ trackId: trackInfo.id })
        );
        
        // Get parameters for this track
        const parametersResponse = await sushiClient.getTrackParameters(
          new GetTrackParametersRequest({ trackId: trackInfo.id })
        );
        
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
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  };

  const subscribeToNotifications = (sushiClient: SushiControllerClient) => {
    try {
      const stream = sushiClient.subscribeToNotifications(new SubscribeToNotificationsRequest());
      setNotificationStream(stream);
      
      stream.on('data', (notification: NotificationResponse) => {
        // Handle different notification types
        if (notification.parameterChange) {
          dispatch({
            type: 'UPDATE_PARAMETER',
            payload: {
              trackId: notification.parameterChange.trackId,
              parameterId: notification.parameterChange.parameterId,
              value: notification.parameterChange.normalizedValue
            }
          });
        }
        
        if (notification.cpuTimings) {
          dispatch({
            type: 'SET_CPU_LOAD',
            payload: notification.cpuTimings.averageLoad
          });
        }
      });
      
      stream.on('error', (error: any) => {
        console.error('Notification stream error:', error);
      });
      
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  };

  const refreshData = useCallback(async () => {
    if (client) {
      await loadTracks(client);
    }
  }, [client]);

  const setParameterValue = useCallback(async (trackId: number, parameterId: number, value: number) => {
    if (!client) return;
    
    try {
      // This would use the appropriate parameter setting method from the generated client
      // The exact method depends on the proto definition
      console.log(`Setting parameter ${parameterId} on track ${trackId} to ${value}`);
    } catch (error) {
      console.error('Failed to set parameter:', error);
    }
  }, [client]);

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
