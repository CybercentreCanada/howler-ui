import { Editor } from '@monaco-editor/react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import api from 'api';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import { parseEvent } from 'commons/components/utils/keyboard';
import Markdown from 'components/elements/display/Markdown';
import useMyApi from 'components/hooks/useMyApi';
import useMyModal from 'components/hooks/useMyModal';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { Analytic } from 'models/entities/generated/Analytic';
import moment from 'moment';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

const CURRENT_TIME = moment();

const minutes = [CURRENT_TIME.get('minute'), CURRENT_TIME.add(30, 'minute').get('minute')].sort();
const hours = [
  CURRENT_TIME.get('hour'),
  CURRENT_TIME.add(3, 'hour').get('hour'),
  CURRENT_TIME.add(6, 'hour').get('hour'),
  CURRENT_TIME.add(9, 'hour').get('hour'),
  CURRENT_TIME.add(12, 'hour').get('hour'),
  CURRENT_TIME.add(15, 'hour').get('hour'),
  CURRENT_TIME.add(18, 'hour').get('hour'),
  CURRENT_TIME.add(21, 'hour').get('hour')
].sort((a, b) => a - b);

/**
 * Precomputed crontabs for the intervals. This will introduce some natural load-balancing as jobs run at completely different minutes/hours.
 */
const INTERVALS = [
  { key: 'correlation.interval.thirty.minutes', crontab: `${minutes.join(',')} * * * *` },
  { key: 'correlation.interval.one.hour', crontab: `${CURRENT_TIME.get('minute')} * * * *` },
  { key: 'correlation.interval.three.hours', crontab: `${CURRENT_TIME.get('minute')} ${hours.join(',')} * * *` },
  {
    key: 'correlation.interval.six.hours',
    crontab: `${CURRENT_TIME.get('minute')} ${hours
      .filter((_, index) => index % 2 === hours.indexOf(CURRENT_TIME.get('hour')) % 2)
      .join(',')} * * *`
  },
  { key: 'correlation.interval.one.day', crontab: `${CURRENT_TIME.get('minute')} ${CURRENT_TIME.get('hour')} * * *` }
];

const CorrelationModal: FC<{ onSubmit: () => void; fileData: string; type: 'eql' | 'lucene' | 'yaml' }> = ({
  onSubmit,
  fileData,
  type
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { close } = useMyModal();
  const { dispatchApi } = useMyApi();
  const { showSuccessMessage } = useMySnackbar();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [crontab, setCrontab] = useState<string>(INTERVALS[3].crontab);
  const [loading, setLoading] = useState(false);

  const badAnalyticName = useMemo(() => !/^([A-Z][a-z]* ?)*$/.test(name), [name]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);

      const newAnalytic = await dispatchApi(
        api.analytic.correlations.post({
          name,
          description,
          // Converting the language name to the query type - they all match except sigma
          correlation_type: type.replace('yaml', 'sigma') as Analytic['correlation_type'],
          correlation: fileData,
          correlation_crontab: crontab
        })
      );

      showSuccessMessage(t('modal.correlation.success'), 5000, {
        action: () => (
          <Button color="inherit" onClick={() => navigate(`/analytics/${newAnalytic.analytic_id}`)}>
            {t('open')}
          </Button>
        )
      });

      onSubmit();
      close();
    } finally {
      setLoading(false);
    }
  }, [dispatchApi, name, description, type, fileData, crontab, showSuccessMessage, t, onSubmit, close, navigate]);

  const handleKeydown = useCallback(
    e => {
      const parsedEvent = parseEvent(e);

      if (parsedEvent.isCtrl && parsedEvent.isEnter) {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
      } else if (parsedEvent.isEscape) {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    },
    [close, handleSubmit]
  );

  return (
    <Stack spacing={2} p={2} alignItems="start" sx={{ minWidth: '80vw', height: '80vh', overflow: 'hidden' }}>
      <Typography variant="h4">{t('modal.correlation.title')}</Typography>
      <Typography>{t('modal.correlation.description')}</Typography>
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        <TextField
          label={t('modal.correlation.name') + (badAnalyticName ? ` - ${t('modal.correlation.name.warn')}` : '')}
          value={name}
          fullWidth
          color={badAnalyticName ? 'warning' : null}
          multiline
          maxRows={6}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeydown}
        />
        {/* TODO: allow custom crontabs ala spellbook */}
        <FormControl sx={{ minWidth: '250px' }}>
          <InputLabel>{t('correlation.interval')}</InputLabel>
          <Select label={t('correlation.interval')} onChange={event => setCrontab(event.target.value)} value={crontab}>
            {INTERVALS.map(interval => (
              <MenuItem key={interval.key} value={interval.crontab}>
                {t(interval.key)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Box
        display="grid"
        alignSelf="stretch"
        sx={{ pt: 1, flex: 1, overflow: 'hidden', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing(1) }}
        justifyContent="stretch"
      >
        <Card variant="outlined" sx={{ p: 1, overflow: 'auto' }}>
          <CardHeader sx={{ py: 1, px: 0 }} title={t('modal.correlation.file.title')} />
          <Divider />
          <Editor
            height="90%"
            width="100%"
            theme="howler"
            language={type}
            value={fileData}
            options={{
              minimap: { enabled: false },
              readOnly: true,
              overviewRulerBorder: false,
              renderLineHighlight: 'gutter',
              fontSize: 16,
              autoClosingBrackets: 'always'
            }}
          />
        </Card>
        <Card variant="outlined" sx={{ p: 1 }}>
          <CardHeader sx={{ py: 1, px: 0 }} title={t('modal.correlation.description.title')} />
          <Divider />
          <Editor
            height="90%"
            width="100%"
            theme="howler"
            language="markdown"
            value={description}
            onChange={value => setDescription(value)}
            options={{
              minimap: { enabled: false },
              overviewRulerBorder: false,
              renderLineHighlight: 'gutter',
              fontSize: 16,
              autoClosingBrackets: 'always'
            }}
          />
        </Card>
        <Card variant="outlined" sx={{ p: 1 }}>
          <CardHeader sx={{ py: 1, px: 0 }} title={t('modal.correlation.markdown.title')} />
          <Divider />
          <Markdown md={description || t('modal.correlation.markdown.placeholder')} />
        </Card>
      </Box>
      <Stack direction="row" spacing={1} alignSelf="end">
        <Button color="error" variant="outlined" onClick={close}>
          {t('cancel')}
        </Button>
        <TuiButton
          startIcon={loading && <CircularProgress color="success" size={18} />}
          color="success"
          variant="outlined"
          onClick={handleSubmit}
          disabled={!name || !description || !crontab}
          tooltip={(!name || !description) && t(`modal.correlation.disabled.${!name ? 'analytic' : 'description'}`)}
        >
          {t('submit')}
        </TuiButton>
      </Stack>
    </Stack>
  );
};

export default CorrelationModal;
