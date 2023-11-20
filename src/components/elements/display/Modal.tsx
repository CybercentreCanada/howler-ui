import { Box, Modal as MuiModal } from '@mui/material';
import { ModalContext } from 'components/app/providers/ModalProvider';
import { FC, useCallback, useContext } from 'react';

const Modal: FC = () => {
  const { content, setContent, options, close } = useContext(ModalContext);

  const onClose = useCallback(() => {
    if (options && !options.disableClose) {
      setContent(null);
    }
  }, [options, setContent]);

  return (
    <MuiModal open={!!content} onClose={onClose} sx={{ zIndex: '2200' }}>
      <Box
        sx={theme => ({
          position: 'absolute',
          top: '50%',
          left: '50%',
          maxWidth: '1200px',
          maxHeight: '400px',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'background.paper',
          borderRadius: theme.shape.borderRadius,
          p: 2,
          outline: 0
        })}
        onKeyDown={e => {
          e.stopPropagation();

          if (e.key.toLowerCase() === 'escape') {
            onClose();
          }
        }}
      >
        {content}
      </Box>
    </MuiModal>
  );
};

export default Modal;
