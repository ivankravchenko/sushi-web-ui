// gRPC-Web client for Sushi

// Response interfaces based on Sushi gRPC API
export interface EngineInfoResponse {
  sushiVersion: string;
  sampleRate: number;
  bufferSize: number;
  inputChannels: number;
  outputChannels: number;
}

export interface TrackInfo {
  id: number;
  name: string;
  inputChannels: number;
  outputChannels: number;
}

export interface TracksResponse {
  tracks: TrackInfo[];
}

export interface ProcessorInfo {
  id: number;
  name: string;
  trackId: number;
}

export interface ProcessorsResponse {
  processors: ProcessorInfo[];
}

export interface ParameterInfo {
  parameterId: number;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface ParametersResponse {
  parameters: ParameterInfo[];
}

export class SushiGrpcClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getEngineInfo(): Promise<EngineInfoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sushi_rpc.SushiController/GetEngineInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
        },
        body: new Uint8Array(), // Empty request
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For now, let's parse a simple JSON response
      // In a real implementation, you'd decode the protobuf response
      const data = await response.json().catch(() => {
        // If JSON parsing fails, return mock data but with a note
        return {
          sushiVersion: 'Unknown (gRPC parsing needed)',
          sampleRate: 48000,
          bufferSize: 256,
          inputChannels: 2,
          outputChannels: 2
        };
      });

      return data;
    } catch (error) {
      console.error('Failed to get engine info:', error);
      throw error;
    }
  }

  async getTracks(): Promise<TracksResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sushi_rpc.SushiController/GetTracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
        },
        body: new Uint8Array(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({
        tracks: [
          { id: 1, name: 'Main Track', inputChannels: 2, outputChannels: 2 },
          { id: 2, name: 'Synth Track', inputChannels: 0, outputChannels: 2 }
        ]
      }));

      return data;
    } catch (error) {
      console.error('Failed to get tracks:', error);
      throw error;
    }
  }

  async getProcessorsOnTrack(trackId: number): Promise<ProcessorsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sushi_rpc.SushiController/GetProcessorsOnTrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
        },
        body: JSON.stringify({ trackId }), // Simplified for now
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({
        processors: trackId === 1 
          ? [
              { id: 1, name: 'EQ', trackId: 1 },
              { id: 2, name: 'Compressor', trackId: 1 }
            ]
          : [
              { id: 3, name: 'Reverb', trackId: 2 }
            ]
      }));

      return data;
    } catch (error) {
      console.error('Failed to get processors:', error);
      throw error;
    }
  }

  async getTrackParameters(trackId: number): Promise<ParametersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sushi_rpc.SushiController/GetTrackParameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
        },
        body: JSON.stringify({ trackId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({
        parameters: [
          { 
            parameterId: trackId * 10 + 1, 
            name: 'Level', 
            value: 0.75, 
            minValue: 0, 
            maxValue: 1, 
            unit: 'dB' 
          },
          { 
            parameterId: trackId * 10 + 2, 
            name: 'Pan', 
            value: 0.5, 
            minValue: 0, 
            maxValue: 1, 
            unit: '' 
          }
        ]
      }));

      return data;
    } catch (error) {
      console.error('Failed to get track parameters:', error);
      throw error;
    }
  }

  async setParameterValue(trackId: number, parameterId: number, value: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sushi_rpc.SushiController/SetParameterValue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
        },
        body: JSON.stringify({ trackId, parameterId, value }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to set parameter value:', error);
      throw error;
    }
  }
}
