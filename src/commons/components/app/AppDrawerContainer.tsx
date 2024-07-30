import { Backdrop, useTheme } from '@mui/material';
import { AppDrawer } from 'commons/components/app/AppDrawer';
import { useAppDrawer } from 'commons/components/app/hooks';
import type { FC, PropsWithChildren } from 'react';

export const AppDrawerContainer: FC<PropsWithChildren> = ({ children }) => {
  const drawer = useAppDrawer();
  const theme = useTheme();
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', height: '100%' }}>
      <div style={{ flex: 1, overflowX: 'hidden' }}>{children}</div>
      <div
        style={{
          width: drawer.isOpen && !drawer.isFloatThreshold ? drawer.width : 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          })
        }}
      >
        {drawer.isOpen && (drawer.isFloatThreshold || drawer.maximized) && (
          <Backdrop open sx={{ zIndex: theme.zIndex.drawer + 1 }} />
        )}
        <AppDrawer />
      </div>
    </div>
  );
};
