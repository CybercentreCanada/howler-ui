import { Close, DoubleArrow } from '@mui/icons-material';
import { Box, IconButton, Paper, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useAppDrawer } from 'commons/components/app/hooks';

export const AppDrawer = () => {
  const theme = useTheme();
  const drawer = useAppDrawer();
  const isSm = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'fixed',
        zIndex: 5000,
        top: 0,
        right: 0,
        bottom: 0,
        overflowX: 'hidden',
        width: drawer.isOpen ? drawer.width : 0,
        borderLeft: '1px solid',
        borderColor: theme.palette.divider,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen
        }),
        ...(!drawer.isOpen && {
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          })
        }),
        ...((drawer.isFloatThreshold || drawer.maximized) && {
          width: drawer.isOpen ? (isSm ? '100vw' : '90vw') : 0
        })
      }}
    >
      <Paper sx={{ height: '100%' }}>
        <Stack
          component="div"
          direction="row"
          sx={{
            height: '100%',
            '.anchor': {
              '&:hover': {
                border: '2px solid',
                borderColor: theme.palette.divider,
                cursor: 'ew-resize',
                transition: 'border 300ms'
              }
            }
          }}
        >
          <Box className="anchor" />
          <Stack direction="column" flex={1}>
            <Stack direction="row" alignItems="center" spacing={1} m={1}>
              <IconButton
                onClick={() => {
                  if (drawer.maximized) {
                    drawer.setMaximized(false);
                  } else {
                    drawer.close();
                  }
                }}
              >
                <Close />
              </IconButton>
              <IconButton onClick={() => drawer.setMaximized(true)}>
                <DoubleArrow sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
            </Stack>
            <Box flex={1} m={1}>
              {drawer.element}
            </Box>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
