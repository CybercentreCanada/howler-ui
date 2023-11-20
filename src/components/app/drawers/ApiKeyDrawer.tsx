import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import api from 'api';
import { Privileges } from 'api/auth/apikey';
import useMyApi from 'components/hooks/useMyApi';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

type ApiKeyDrawerProps = {
  onCreated: (newKeyName: string, privs: string[], expiryDate: string, newKey: string) => void;
};

const ApiKeyDrawer: FC<ApiKeyDrawerProps> = ({ onCreated }) => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { showInfoMessage } = useMySnackbar();

  const [keyName, setKeyName] = useState('');
  const [privs, setPrivs] = useState<Privileges[]>([]);
  const [createdKey, setCreatedKey] = useState('');
  const [expiryDate, setExpiryDate] = useState(moment().add(6, 'months'));

  const updatePrivs = useCallback(
    (priv: Privileges) => (ev: ChangeEvent<HTMLInputElement>) => {
      if (ev.target.checked) {
        setPrivs([...privs, priv]);
      } else {
        setPrivs(privs.filter(p => p !== priv));
      }
    },
    [privs]
  );

  const onChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    // Ensure the key doesn't contain any special characters
    if (!/^[a-z][a-z0-9_]*$/.test(ev.target.value) && ev.target.value !== '') {
      return;
    }
    setKeyName(ev.target.value);
  }, []);

  const onSubmit = useCallback(async () => {
    const result = await dispatchApi(api.auth.apikey.post(keyName, privs, expiryDate.toISOString()), { throwError: true, showError: true });

    setCreatedKey(result.apikey);
    onCreated(result.apikey.split(':')[0], privs, expiryDate.toISOString(), result.apikey);
  }, [dispatchApi, expiryDate, keyName, onCreated, privs]);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(createdKey);
    showInfoMessage(t('drawer.apikey.copied'));
  }, [createdKey, showInfoMessage, t]);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
        <Typography sx={{ maxWidth: '500px' }}>
          <Trans i18nKey="app.drawer.user.apikey.description" />
        </Typography>
        <TextField label={t('app.drawer.user.apikey.field.name')} fullWidth value={keyName} onChange={onChange} />
        <FormControl>
          <FormLabel component="legend">
            <Trans i18nKey="app.drawer.user.apikey.permissions" />
          </FormLabel>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <FormControlLabel control={<Checkbox onChange={updatePrivs('R')} />} label={t('apikey.read')} />
            <FormControlLabel control={<Checkbox onChange={updatePrivs('W')} />} label={t('apikey.write')} />
            <FormControlLabel
              disabled={privs.includes('E')}
              control={<Checkbox onChange={updatePrivs('I')} />}
              label={t('apikey.impersonate')}
            />
            <FormControlLabel
              disabled={privs.includes('I')}
              control={<Checkbox onChange={updatePrivs('E')} />}
              label={t('apikey.extended')}
            />
          </FormGroup>
        </FormControl>
        <Typography sx={{ maxWidth: '500px' }}>
            <Trans i18nKey="app.drawer.user.apikey.expiry.date" />
            <DateCalendar value={expiryDate} onChange={newValue => setExpiryDate(newValue)} disablePast/>
        </Typography>
        <Button
          onClick={onSubmit}
          disabled={!keyName || (!privs.includes('R') && !privs.includes('W'))}
          variant="outlined"
        >
          <Trans i18nKey="button.create" />
        </Button>
        {createdKey && (
          <>
            <Divider orientation="horizontal" />
            <Stack direction="row" spacing={1} alignItems="stretch">
              <TextField size="small" value={createdKey} inputProps={{ readOnly: true }} fullWidth />
              <Button variant="outlined" onClick={onCopy} disabled={!createdKey}>
                <Trans i18nKey="button.copy" />
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default ApiKeyDrawer;
