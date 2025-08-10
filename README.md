# Sushi Web UI

A modern web-based user interface for controlling Sushi (Elk Audio OS) via gRPC-Web. Built with React, TypeScript, Vite, and Material-UI.

## Features

- **Real-time Connection**: Connect to Sushi via gRPC-Web proxy
- **System Monitoring**: Display Sushi version, CPU load, track count, and processor count
- **Mixer Interface**: Classic DAW-style mixer with vertical track channels
- **Live Updates**: Real-time parameter updates via gRPC notifications
- **Responsive Design**: Modern dark theme with Material-UI components

## Prerequisites

- Node.js 18+ and npm
- A running Sushi instance
- A gRPC-Web proxy (e.g., Envoy) configured to proxy requests to Sushi's gRPC port

## Installation

1. Clone the repository with submodules:
```bash
git clone --recursive <your-repo-url>
cd sushi-web-ui
```

2. Install dependencies:
```bash
npm install
```

3. The TypeScript bindings for the gRPC API will be automatically generated during installation.

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── ConnectionDialog.tsx    # Connection setup dialog
│   ├── Toolbar.tsx            # Top toolbar with system info
│   ├── TrackChannel.tsx       # Individual track mixer channel
│   └── MixerView.tsx          # Main mixer interface
├── contexts/           # React contexts
│   └── SushiContext.tsx       # Main Sushi gRPC state management
├── generated/          # Auto-generated TypeScript bindings
│   ├── sushi_rpc.ts           # Generated from sushi_rpc.proto
│   └── api_version.ts         # Generated from api_version.proto
└── App.tsx            # Main application component
```

## Usage

1. Start your Sushi instance
2. Start the gRPC-Web proxy (e.g., Envoy)
3. Open the web UI and enter the proxy URL (e.g., `http://localhost:8080`)
4. Click "Connect" to establish the connection
5. The mixer interface will display all available tracks with their processors and parameters

## API Integration

The application uses the official Sushi gRPC API via the `sushi-grpc-api` submodule. Key controllers used:

- **AudioGraphController**: Track and processor management
- **ParameterController**: Parameter querying and control
- **SystemController**: System information
- **NotificationController**: Real-time updates
    },
  },
])
```
