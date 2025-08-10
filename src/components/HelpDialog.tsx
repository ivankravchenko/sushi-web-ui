import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Refresh as RefreshIcon,
  Link as ConnectIcon,
  LinkOff as DisconnectIcon
} from '@mui/icons-material';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const shortcuts = [
    {
      keys: ['Ctrl', 'R'],
      macKeys: ['⌘', 'R'],
      description: 'Refresh data from Sushi',
      icon: <RefreshIcon fontSize="small" />
    },
    {
      keys: ['Ctrl', 'K'],
      macKeys: ['⌘', 'K'],
      description: 'Open connection dialog',
      icon: <ConnectIcon fontSize="small" />
    },
    {
      keys: ['Ctrl', 'D'],
      macKeys: ['⌘', 'D'],
      description: 'Disconnect from Sushi',
      icon: <DisconnectIcon fontSize="small" />
    },
    {
      keys: ['F5'],
      macKeys: ['F5'],
      description: 'Refresh data from Sushi',
      icon: <RefreshIcon fontSize="small" />
    }
  ];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardIcon />
        Keyboard Shortcuts
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use these keyboard shortcuts to quickly control the Sushi Web UI.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shortcuts.map((shortcut, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                  {(isMac ? shortcut.macKeys : shortcut.keys).map((key, keyIndex) => (
                    <Box key={keyIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={key}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          minWidth: 'auto',
                          height: 24,
                          fontSize: '0.75rem',
                          fontFamily: 'monospace'
                        }}
                      />
                      {keyIndex < (isMac ? shortcut.macKeys : shortcut.keys).length - 1 && (
                        <Typography variant="body2" sx={{ mx: 0.5 }}>+</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  {shortcut.icon}
                  <Typography variant="body2">{shortcut.description}</Typography>
                </Box>
              </Box>
              {index < shortcuts.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Tip:</strong> You can also use the toolbar buttons and menu items to access these features.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
