import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { SushiProvider, useSushi } from './contexts/SushiContext';
import { Toolbar } from './components/Toolbar';
import { ConnectionDialog } from './components/ConnectionDialog';
import { MixerView } from './components/MixerView';

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
  const { state } = useSushi();
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  useEffect(() => {
    // Auto-open connection dialog if not connected
    if (!state.connected && !state.connecting) {
      setConnectionDialogOpen(true);
    }
  }, [state.connected, state.connecting]);

  const handleOpenSettings = () => {
    // Settings dialog will be implemented later
    console.log('Settings clicked');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar onOpenSettings={handleOpenSettings} />
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <MixerView />
      </Box>

      <ConnectionDialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
      />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SushiProvider>
        <AppContent />
      </SushiProvider>
    </ThemeProvider>
  );
}

export default App;
