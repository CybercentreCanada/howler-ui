import { Button, Stack, Typography } from '@mui/material';
import useMyModal from 'components/hooks/useMyModal';
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmNotebookModal: FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const { t } = useTranslation();
  const { close } = useMyModal();

  const handleConfirm = useCallback(() => {
    onConfirm();
    close();
  }, [close, onConfirm]);

  return (
    <Stack spacing={2} p={2} alignItems="start" sx={{ minWidth: '500px' }}>
      <Typography variant="h4">{'Overwrite existing notebook?'}</Typography>
      <Typography>{t('hit.notebook.confirm.dialog')}</Typography>
      <Stack direction="row" spacing={1} alignSelf="end">
        <Button variant="outlined" onClick={close}>
          {t('cancel')}
        </Button>
        <Button variant="outlined" onClick={handleConfirm}>
          {t('confirm')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default ConfirmNotebookModal;
