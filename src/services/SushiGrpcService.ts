// Sushi gRPC Service using generated gRPC-Web clients
import { 
  SystemControllerClientImpl, 
  GrpcWebImpl, 
  NotificationControllerClientImpl, 
  AudioGraphControllerClientImpl, 
  ParameterControllerClientImpl,
  TransportControllerClientImpl,
  CpuTimings, 
  TrackInfo, 
  ProcessorInfo, 
  ParameterInfo,
  TrackIdentifier,
  ProcessorIdentifier,
  ParameterIdentifier,
  ParameterValue
} from '../../codegen-grpc/sushi_rpc';
import { grpc } from '@improbable-eng/grpc-web';

// Response interfaces for easier consumption
export interface EngineInfoResponse {
  sushiVersion: string;
  sampleRate: number;
  bufferSize: number;
  inputChannels: number;
  outputChannels: number;
}

export interface TracksResponse {
  tracks: TrackInfo[];
}

export interface ProcessorsResponse {
  processors: ProcessorInfo[];
}

export interface ParametersResponse {
  parameters: ParameterInfo[];
}

export interface CpuTimingResponse {
  cpuLoad: CpuTimings;
}

export class SushiGrpcService {
  private rpc: GrpcWebImpl;
  private systemController: SystemControllerClientImpl;
  private audioGraphController: AudioGraphControllerClientImpl;
  private notificationController: NotificationControllerClientImpl;
  private parameterController: ParameterControllerClientImpl;
  private transportController: TransportControllerClientImpl;

  constructor(baseUrl: string = 'http://localhost:8081') {
    console.log('Creating SushiGrpcService with baseUrl:', baseUrl);
    
    // Create gRPC-Web implementation with WebSocket transport for streaming
    this.rpc = new GrpcWebImpl(baseUrl, {
      streamingTransport: grpc.WebsocketTransport()
    });
    
    // Initialize all controller clients
    this.systemController = new SystemControllerClientImpl(this.rpc);
    this.audioGraphController = new AudioGraphControllerClientImpl(this.rpc);
    this.notificationController = new NotificationControllerClientImpl(this.rpc);
    this.parameterController = new ParameterControllerClientImpl(this.rpc);
    this.transportController = new TransportControllerClientImpl(this.rpc);
  }

  // Test connection to Sushi
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.systemController.GetSushiVersion({});
      console.log('Connection test successful, Sushi version:', response.value);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get comprehensive engine information
  async getEngineInfo(): Promise<EngineInfoResponse> {
    try {
      const [versionResponse, sampleRateResponse, inputChannelsResponse, outputChannelsResponse] = await Promise.all([
        this.systemController.GetSushiVersion({}),
        this.transportController.GetSamplerate({}),
        this.systemController.GetInputAudioChannelCount({}),
        this.systemController.GetOutputAudioChannelCount({})
      ]);

      return {
        sushiVersion: versionResponse.value,
        sampleRate: sampleRateResponse.value,
        bufferSize: 0, // Not available in current API
        inputChannels: inputChannelsResponse.value,
        outputChannels: outputChannelsResponse.value
      };
    } catch (error) {
      console.error('Failed to get engine info:', error);
      throw error;
    }
  }

  // Get CPU timing information
  async getCpuTimings(): Promise<CpuTimingResponse> {
    try {
      // Note: CPU timings are typically received via streaming subscription
      // This is a placeholder for the streaming implementation
      throw new Error('CPU timings should be subscribed to via streaming');
    } catch (error) {
      console.error('Failed to get CPU timings:', error);
      throw error;
    }
  }

  // Subscribe to CPU timing updates
  subscribeToCpuTimings(callback: (timings: CpuTimings) => void) {
    try {
      const stream = this.notificationController.SubscribeToEngineCpuTimingUpdates({});
      stream.subscribe((timings: CpuTimings) => {
        callback(timings);
      });
      return stream;
    } catch (error) {
      console.error('Failed to subscribe to CPU timings:', error);
      throw error;
    }
  }

  // Get all tracks
  async getTracks(): Promise<TracksResponse> {
    try {
      const response = await this.audioGraphController.GetAllTracks({});
      return {
        tracks: response.tracks
      };
    } catch (error) {
      console.error('Failed to get tracks:', error);
      throw error;
    }
  }

  // Get processors on a specific track
  async getProcessorsOnTrack(trackId: number): Promise<ProcessorsResponse> {
    try {
      const trackIdentifier: TrackIdentifier = { id: trackId };
      const response = await this.audioGraphController.GetTrackProcessors(trackIdentifier);
      return {
        processors: response.processors
      };
    } catch (error) {
      console.error(`Failed to get processors on track ${trackId}:`, error);
      throw error;
    }
  }

  // Get parameters for a specific processor
  async getProcessorParameters(processorId: number): Promise<ParametersResponse> {
    try {
      const processorIdentifier: ProcessorIdentifier = { id: processorId };
      const response = await this.parameterController.GetProcessorParameters(processorIdentifier);
      return {
        parameters: response.parameters
      };
    } catch (error) {
      console.error(`Failed to get parameters for processor ${processorId}:`, error);
      throw error;
    }
  }

  // Set parameter value
  async setParameterValue(processorId: number, parameterId: number, value: number): Promise<void> {
    try {
      const parameterIdentifier: ParameterIdentifier = { 
        processorId, 
        parameterId 
      };
      const parameterValue: ParameterValue = {
        parameter: parameterIdentifier,
        value
      };
      
      await this.parameterController.SetParameterValue(parameterValue);
      console.log(`Set parameter ${parameterId} on processor ${processorId} to ${value}`);
    } catch (error) {
      console.error(`Failed to set parameter ${parameterId} on processor ${processorId}:`, error);
      throw error;
    }
  }

  // Get parameter value
  async getParameterValue(processorId: number, parameterId: number): Promise<number> {
    try {
      const parameterIdentifier: ParameterIdentifier = { 
        processorId, 
        parameterId 
      };
      
      const response = await this.parameterController.GetParameterValue(parameterIdentifier);
      return response.value;
    } catch (error) {
      console.error(`Failed to get parameter ${parameterId} on processor ${processorId}:`, error);
      throw error;
    }
  }

  // Transport controls
  async play(): Promise<void> {
    try {
      await this.transportController.SetPlayingMode({ mode: 2 }); // PLAYING = 2
      console.log('Started playback');
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.transportController.SetPlayingMode({ mode: 1 }); // STOPPED = 1
      console.log('Stopped playback');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  async getPlayingMode(): Promise<number> {
    try {
      const response = await this.transportController.GetPlayingMode({});
      return response.mode;
    } catch (error) {
      console.error('Failed to get playing mode:', error);
      throw error;
    }
  }

  // Cleanup method
  disconnect(): void {
    console.log('Disconnecting from Sushi gRPC service');
    // Add any cleanup logic here if needed
  }
}

// Export a singleton instance
export const sushiGrpcService = new SushiGrpcService();
