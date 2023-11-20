import { OptionsObject, SnackbarMessage, useSnackbar } from 'notistack';
import { useCallback, useMemo } from 'react';

export default function useMySnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const snackBarOptions: OptionsObject = useMemo(
    () => ({
      preventDuplicate: true,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center'
      },
      SnackbarProps: {
        onClick: _snack => {
          closeSnackbar();
        }
      }
    }),
    [closeSnackbar]
  );

  const showErrorMessage = useCallback(
    (message: SnackbarMessage, timeout = 5000) => {
      enqueueSnackbar(message, { variant: 'error', autoHideDuration: timeout, ...snackBarOptions });
    },
    [snackBarOptions, enqueueSnackbar]
  );

  const showWarningMessage = useCallback(
    (message: SnackbarMessage, timeout = 5000) => {
      enqueueSnackbar(message, { variant: 'warning', autoHideDuration: timeout, ...snackBarOptions });
    },
    [snackBarOptions, enqueueSnackbar]
  );

  const showSuccessMessage = useCallback(
    (message: SnackbarMessage, timeout = 5000) => {
      enqueueSnackbar(message, { variant: 'success', autoHideDuration: timeout, ...snackBarOptions });
    },
    [snackBarOptions, enqueueSnackbar]
  );

  const showInfoMessage = useCallback(
    (message: SnackbarMessage, timeout = 5000) => {
      enqueueSnackbar(message, { variant: 'info', autoHideDuration: timeout, ...snackBarOptions });
    },
    [snackBarOptions, enqueueSnackbar]
  );

  return useMemo(
    () => ({
      showErrorMessage,
      showWarningMessage,
      showSuccessMessage,
      showInfoMessage
    }),
    [showErrorMessage, showInfoMessage, showSuccessMessage, showWarningMessage]
  );
}
