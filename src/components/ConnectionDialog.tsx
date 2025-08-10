import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSushi } from '../contexts/SushiContext';

interface ConnectionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectionDialog({ open, onClose }: ConnectionDialogProps) {
  const { state, connect } = useSushi();
  const [url, setUrl] = useState('http://localhost:8081');

  // Clear any cached URL and set default
  useEffect(() => {
    localStorage.removeItem('sushi-server-url');
    setUrl('http://localhost:8081');
  }, []);

  // Auto-close dialog when connection is established
  useEffect(() => {
    if (state.connected && open) {
      onClose();
    }
  }, [state.connected, open, onClose]);

  const handleConnect = async () => {
    if (!url.trim()) return;
    

    try {
      await connect(url.trim());
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect to Sushi</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the URL of the gRPC-Web proxy that connects to your Sushi backend.
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            label="gRPC-Web Proxy URL"
            placeholder="http://localhost:8081"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={state.connecting}
            sx={{ mb: 2 }}
          />
          
          {state.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          )}
          
          <Typography variant="caption" color="text.secondary">
            Make sure your gRPC-Web proxy is running and accessible at this URL.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={state.connecting}>
          Cancel
        </Button>
        <Button 
          onClick={handleConnect} 
          variant="contained" 
          disabled={state.connecting || !url.trim()}
          startIcon={state.connecting ? <CircularProgress size={16} /> : null}
        >
          {state.connecting ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
