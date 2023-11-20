import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress, IconButton, Stack, TableCell, TableRow, TextField } from '@mui/material';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { ChangeEvent, FC, KeyboardEventHandler, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type EditRowTypes = {
  titleKey: string;
  value: string | number;
  onEdit?: (value: string | number) => Promise<void>;
  validate?: (value: string | number) => boolean;
  failOnValidate?: boolean;
  type?: 'password' | 'number' | 'text';
};

const EditRow: FC<EditRowTypes> = ({
  titleKey,
  value,
  onEdit,
  validate,
  failOnValidate = false,
  type = 'text'
}: EditRowTypes) => {
  const { t } = useTranslation();
  const { showErrorMessage } = useMySnackbar();

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editValue, setEditValue] = useState(type === 'password' ? '' : value);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if ((editValue === undefined || editValue === null) && value) {
      setEditValue(value);
    }
  }, [editValue, value]);

  const onChange = useCallback(
    (ev: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (validate && !validate(ev.target.value)) {
        if (failOnValidate) {
          return;
        } else {
          setError(true);
        }
      } else {
        setError(false);
      }

      setEditValue(ev.target.value);
    },
    [failOnValidate, validate]
  );

  const onSubmit = useCallback(async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }

    if (type === 'password' && editValue !== confirmPassword) {
      showErrorMessage(t('password.match'));
      setError(true);
      return;
    }

    setLoading(true);
    try {
      await onEdit(editValue);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }, [confirmPassword, editValue, onEdit, showErrorMessage, t, type, value]);

  const checkForActions: KeyboardEventHandler<HTMLDivElement> = useCallback(
    e => {
      if (e.ctrlKey && e.key === 'Enter' && !loading) {
        onSubmit();
      }

      if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [loading, onSubmit]
  );

  return (
    <TableRow>
      <TableCell style={{ whiteSpace: 'nowrap' }}>{t(titleKey)}</TableCell>
      {editing ? (
        <TableCell colSpan={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                flexDirection: { xs: 'column', md: 'row' },
                '& > .MuiTextField-root:nth-of-type(2)': {
                  ml: {
                    xs: 0,
                    md: 1
                  },
                  mt: {
                    xs: 1,
                    md: 0
                  }
                }
              }}
            >
              <TextField
                size="small"
                value={editValue}
                onChange={onChange}
                onKeyDown={checkForActions}
                fullWidth
                label={type === 'password' ? t('password') : null}
                type={type}
                error={error}
                sx={{ '& input': { fontSize: '13.5px !important' } }}
                InputProps={{
                  endAdornment: loading && <CircularProgress size={24} />
                }}
              />
              {type === 'password' && (
                <TextField
                  size="small"
                  value={confirmPassword}
                  onChange={ev => {
                    setConfirmPassword(ev.target.value);
                    setError(false);
                  }}
                  onKeyDown={checkForActions}
                  fullWidth
                  label={t('password.confirm')}
                  type="password"
                  error={error}
                  sx={{ '& input': { fontSize: '13.5px !important' } }}
                  InputProps={{
                    endAdornment: loading && <CircularProgress size={24} />
                  }}
                />
              )}
            </Box>
            <IconButton onClick={onSubmit} disabled={loading}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => setEditing(false)} disabled={loading}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </TableCell>
      ) : (
        <TableCell width="100%">{value}</TableCell>
      )}
      {onEdit && !editing && (
        <TableCell align="right">
          <IconButton onClick={() => setEditing(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </TableCell>
      )}
    </TableRow>
  );
};

export default EditRow;
