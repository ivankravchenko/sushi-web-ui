import { useEffect } from 'react';

interface KeyboardShortcuts {
  onRefresh?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useKeyboardShortcuts({ onRefresh, onConnect, onDisconnect }: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd key combinations
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'r':
            event.preventDefault();
            onRefresh?.();
            break;
          case 'k':
            event.preventDefault();
            onConnect?.();
            break;
          case 'd':
            event.preventDefault();
            onDisconnect?.();
            break;
        }
      }
      
      // Function keys
      switch (event.key) {
        case 'F5':
          event.preventDefault();
          onRefresh?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onRefresh, onConnect, onDisconnect]);
}
