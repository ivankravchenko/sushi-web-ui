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
  PropertyInfo,
  TrackIdentifier,
  ProcessorIdentifier,
  ParameterIdentifier,
  PropertyIdentifier,
  ParameterValue,
  PropertyValue
} from '../../codegen-grpc/sushi_rpc';
import { grpc } from '@improbable-eng/grpc-web';
import { Observable } from 'rxjs';

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

export interface PropertiesResponse {
  properties: PropertyInfo[];
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
      await this.systemController.GetSushiVersion({});
      return true;
    } catch (error) {
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
      throw error;
    }
  }

  // Subscribe to CPU timing updates
  subscribeToCpuTimings(callback: (timings: CpuTimings) => void) {
    try {

      const stream = this.notificationController.SubscribeToEngineCpuTimingUpdates({});
      
      const subscription = stream.subscribe({
        next: (update: CpuTimings) => {
          callback(update);
        },
        error: (error: any) => {
        },
        complete: () => {

        }
      });
      
      return subscription;
    } catch (error) {
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
      throw error;
    }
  }

  // Get parameters for a specific track (track-level controls like level and pan)
  async getTrackParameters(trackId: number): Promise<ParametersResponse> {
    try {
      const trackIdentifier: TrackIdentifier = { id: trackId };
      const response = await this.parameterController.GetTrackParameters(trackIdentifier);
      return {
        parameters: response.parameters
      };
    } catch (error) {
      throw error;
    }
  }

  // Set parameter value (for processor parameters)
  async setParameterValue(processorId: number, parameterId: number, value: number): Promise<void> {
    try {
      const parameterIdentifier: ParameterIdentifier = { 
        processorId, 
        parameterId 
      };
      const parameterValue: ParameterValue = {
        parameter: parameterIdentifier,
        value: value
      };
      
      await this.parameterController.SetParameterValue(parameterValue);

    } catch (error) {
      throw error;
    }
  }

  // Set track-level parameter value (for track parameters like gain, pan, mute)
  async setTrackParameterValue(trackId: number, parameterId: number, value: number): Promise<void> {
    try {
      // For track-level parameters, use the track ID as the processorId
      const parameterIdentifier: ParameterIdentifier = { 
        processorId: trackId, // Use track ID to distinguish between tracks
        parameterId 
      };
      const parameterValue: ParameterValue = {
        parameter: parameterIdentifier,
        value: value
      };
      
      await this.parameterController.SetParameterValue(parameterValue);

    } catch (error) {
      throw error;
    }
  }



  // Get processor properties
  async getProcessorProperties(processorId: number): Promise<PropertiesResponse> {
    try {
      const processorIdentifier: ProcessorIdentifier = { id: processorId };
      const response = await this.parameterController.GetProcessorProperties(processorIdentifier);
      return {
        properties: response.properties
      };
    } catch (error) {
      throw error;
    }
  }

  // Get property value by name
  async getPropertyValue(processorId: number, propertyName: string): Promise<string | null> {
    try {
      // First get all properties to find the property ID
      const propertiesResponse = await this.getProcessorProperties(processorId);
      const property = propertiesResponse.properties?.find((p: PropertyInfo) => p.name === propertyName);
      
      if (!property) {
        return null;
      }

      // Get the property value
      const propertyIdentifier: PropertyIdentifier = { 
        processorId, 
        propertyId: property.id 
      };
      const response = await this.parameterController.GetPropertyValue(propertyIdentifier);
      return response.value || null;
    } catch (error) {
      return null;
    }
  }

  // Set property value by name
  async setPropertyValue(processorId: number, propertyName: string, value: string): Promise<void> {
    try {
      // First get all properties to find the property ID
      const propertiesResponse = await this.getProcessorProperties(processorId);
      const property = propertiesResponse.properties?.find((p: PropertyInfo) => p.name === propertyName);
      
      if (!property) {
        throw new Error(`Property ${propertyName} not found`);
      }

      // Set the property value
      const propertyValue: PropertyValue = {
        property: {
          processorId,
          propertyId: property.id
        },
        value: value
      };
      
      await this.parameterController.SetPropertyValue(propertyValue);
    } catch (error) {
      throw error;
    }
  }

  async getParameterValue(processorId: number, parameterId: number): Promise<number | null> {
    try {
      const response = await this.parameterController.GetParameterValue({
        processorId: processorId,
        parameterId: parameterId
      });
      return response.value ?? null;
    } catch (error) {
      return null;
    }
  }

  async getParameterValueInDomain(processorId: number, parameterId: number): Promise<number | null> {
    try {
      const response = await this.parameterController.GetParameterValueInDomain({
        processorId: processorId,
        parameterId: parameterId
      });
      return response.value ?? null;
    } catch (error) {
      return null;
    }
  }

  async subscribeToParameterUpdates(): Promise<Observable<any>> {
    const request = {}; // Empty request for all parameter updates
    return this.notificationController.SubscribeToParameterUpdates(request);
  }

  // Track management methods
  async createTrack(name: string, channels: number): Promise<void> {
    await this.audioGraphController.CreateTrack({ name, channels });
  }

  async createMultibusTrack(name: string, buses: number): Promise<void> {
    await this.audioGraphController.CreateMultibusTrack({ name, buses });
  }

  async createPreTrack(name: string): Promise<void> {
    await this.audioGraphController.CreatePreTrack({ name });
  }

  async createPostTrack(name: string): Promise<void> {
    await this.audioGraphController.CreatePostTrack({ name });
  }

  async deleteTrack(trackId: number): Promise<void> {
    await this.audioGraphController.DeleteTrack({ id: trackId });
  }

  async subscribeToTrackChanges(): Promise<Observable<any>> {
    const request = {}; // Empty request for all track changes
    return this.notificationController.SubscribeToTrackChanges(request);
  }

  async subscribeToProcessorChanges(): Promise<Observable<any>> {
    const request = {}; // Empty request for all processor changes
    return this.notificationController.SubscribeToProcessorChanges(request);
  }

  // Processor management methods
  async createProcessor(name: string, uid: string, path: string, type: number, trackId: number, addToBack: boolean = true): Promise<void> {
    await this.audioGraphController.CreateProcessorOnTrack({
      name,
      uid,
      path,
      type: { type },
      track: { id: trackId },
      position: { addToBack, beforeProcessor: undefined }
    });
  }

  async deleteProcessor(processorId: number, trackId: number): Promise<void> {
    await this.audioGraphController.DeleteProcessorFromTrack({
      processor: { id: processorId },
      track: { id: trackId }
    });
  }

  async moveProcessor(processorId: number, sourceTrackId: number, destTrackId: number, addToBack: boolean = true, beforeProcessorId?: number): Promise<void> {
    await this.audioGraphController.MoveProcessorOnTrack({
      processor: { id: processorId },
      sourceTrack: { id: sourceTrackId },
      destTrack: { id: destTrackId },
      position: { addToBack, beforeProcessor: beforeProcessorId ? { id: beforeProcessorId } : undefined }
    });
  }

  // Transport controls
  async play(): Promise<void> {
    try {
      await this.transportController.SetPlayingMode({ mode: 2 }); // PLAYING = 2
    } catch (error) {
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.transportController.SetPlayingMode({ mode: 1 }); // STOPPED = 1

    } catch (error) {
      throw error;
    }
  }

  async getPlayingMode(): Promise<number> {
    try {
      const response = await this.transportController.GetPlayingMode({});
      return response.mode;
    } catch (error) {
      throw error;
    }
  }

  // Cleanup method
  disconnect(): void {

    // Add any cleanup logic here if needed
  }
}

// Export a singleton instance
export const sushiGrpcService = new SushiGrpcService();
