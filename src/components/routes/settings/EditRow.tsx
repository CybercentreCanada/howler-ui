import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { ChangeEvent, KeyboardEventHandler } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type EditRowTypes<T extends string | number | boolean> = {
  titleKey: string;
  descriptionKey?: string;
  value: T;
  onEdit?: (value: string) => Promise<void>;
  validate?: (value: T) => boolean;
  failOnValidate?: boolean;
  type?: 'password' | 'number' | 'text' | 'checkbox';
};

const EditRow = <T extends string | number | boolean>({
  titleKey,
  descriptionKey,
  value,
  onEdit,
  validate,
  failOnValidate = false,
  type = 'text'
}: EditRowTypes<T>) => {
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
      if (validate && !validate(ev.target.value as T)) {
        if (failOnValidate) {
          return;
        } else {
          setError(true);
        }
      } else {
        setError(false);
      }

      if (type !== 'checkbox') {
        setEditValue(ev.target.value);
      } else {
        onEdit((ev.target as any).checked);
      }
    },
    [failOnValidate, onEdit, type, validate]
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
      await onEdit(editValue.toString());
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

  const cellSx = useMemo(
    () => [!!descriptionKey && { borderBottom: 0, paddingBottom: '0 !important' }],
    [descriptionKey]
  );

  return (
    <>
      <TableRow>
        <TableCell sx={cellSx} style={{ whiteSpace: 'nowrap' }}>
          {t(titleKey)}
        </TableCell>
        {editing ? (
          <TableCell sx={cellSx} colSpan={2}>
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
                {type !== 'checkbox' ? (
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
                ) : (
                  <Checkbox sx={{ marginRight: 'auto' }} value={editValue} onChange={onChange} />
                )}
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
          <TableCell sx={cellSx} width="100%">
            {type === 'checkbox' ? <Checkbox onChange={onChange} checked={value.toString() === 'true'} /> : value}
          </TableCell>
        )}
        {onEdit && !editing && type !== 'checkbox' && (
          <TableCell sx={cellSx} align="right">
            <IconButton onClick={() => setEditing(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      {descriptionKey && (
        <TableRow>
          <TableCell colSpan={3} sx={{ paddingTop: '0 !important' }}>
            <Typography variant="caption" color="text.secondary">
              {t(descriptionKey)}
            </Typography>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default EditRow;
