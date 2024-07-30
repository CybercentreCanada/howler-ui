import { useMediaQuery } from '@mui/material';
import { AppDrawerContext, type AppDrawerOpenProps } from 'commons/components/app/AppContexts';
import { useCallback, useMemo, useState, type FC, type PropsWithChildren } from 'react';

const INIT_STATE = {
  isFloatTreshold: false,
  width: '45vw',
  floatThreshold: 1200,
  element: null,
  maximized: false,
  open: false
};

export const AppDrawerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<{ open: boolean } & AppDrawerOpenProps>({ ...INIT_STATE });
  const [maximized, setMaximized] = useState<boolean>(INIT_STATE.maximized);
  const isFloatThreshold = useMediaQuery(`(max-width: ${state.floatThreshold}px)`);

  const open = useCallback((props: AppDrawerOpenProps) => {
    setState(_state => ({ ...{ ..._state, ...props }, open: true }));
  }, []);

  const close = useCallback(() => {
    setState(_state => {
      if (_state?.onClose) {
        _state?.onClose('close');
      }
      return { ..._state, open: false };
    });
  }, []);

  const value = useMemo(
    () => ({
      width: state.width,
      isOpen: state.open,
      element: state.element,
      maximized,
      isFloatThreshold,
      open,
      close,
      setWidth: (width: number | string) => setState(_state => ({ ..._state, width })),
      setMaximized
    }),
    [maximized, state.width, state.open, state.element, isFloatThreshold, open, close]
  );

  return <AppDrawerContext.Provider value={value}>{children}</AppDrawerContext.Provider>;
};
