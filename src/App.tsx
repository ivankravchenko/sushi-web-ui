import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { SushiProvider, useSushi } from './contexts/SushiContext';
import { ProcessorConfigProvider } from './contexts/ProcessorConfigContext';
import { Toolbar } from './components/Toolbar';
import { ConnectionDialog } from './components/ConnectionDialog';
import { MixerView } from './components/MixerView';
import { HelpDialog } from './components/HelpDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function AppContent() {
  const { state, disconnect, refreshData } = useSushi();
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(!state.connected);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Close connection dialog when successfully connected
  useEffect(() => {
    if (state.connected && connectionDialogOpen) {
      setConnectionDialogOpen(false);
    }
  }, [state.connected, connectionDialogOpen]);

  useEffect(() => {
    // Auto-open connection dialog if not connected
    if (!state.connected && !state.connecting) {
      setConnectionDialogOpen(true);
    }
  }, [state.connected, state.connecting]);



  const handleOpenConnection = () => {
    setConnectionDialogOpen(true);
  };

  const handleDisconnect = () => {
    if (state.connected) {
      disconnect();
    }
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onRefresh: refreshData,
    onConnect: handleOpenConnection,
    onDisconnect: handleDisconnect,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {state.connected ? (
          <MixerView />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            Connect to Sushi to view the mixer
          </Box>
        )}
      </Box>

      <ConnectionDialog 
        open={connectionDialogOpen} 
        onClose={() => setConnectionDialogOpen(false)} 
      />
      
      <HelpDialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)} 
      />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SushiProvider>
        <ProcessorConfigProvider>
          <AppContent />
        </ProcessorConfigProvider>
      </SushiProvider>
    </ThemeProvider>
  );
}

export default App;
