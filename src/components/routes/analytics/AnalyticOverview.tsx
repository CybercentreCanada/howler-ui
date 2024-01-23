import { Check, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import api from 'api';
import 'chartjs-adapter-moment';
import Markdown from 'components/elements/display/Markdown';
import useMyApi from 'components/hooks/useMyApi';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Assessment from './widgets/Assessment';
import Created from './widgets/Created';
import Escalation from './widgets/Escalation';

const AnalyticOverview: FC<{ analytic: Analytic; setAnalytic: (a: Analytic) => void }> = ({
  analytic,
  setAnalytic
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dispatchApi } = useMyApi();
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccessMessage } = useMySnackbar();

  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const onEdit = useCallback(async () => {
    try {
      if (editing) {
        setMarkdownLoading(true);
        const result = await dispatchApi(api.analytic.put(analytic.analytic_id, { description: editValue }), {
          showError: true,
          throwError: true
        });

        setAnalytic(result);

        showSuccessMessage(t('route.analytics.updated'));
      } else {
        setEditValue(analytic.description);
      }
    } finally {
      setEditing(!editing);
      setMarkdownLoading(false);
    }
  }, [analytic, dispatchApi, editValue, editing, setAnalytic, showSuccessMessage, t]);

  return (
    <>
      <Divider flexItem sx={{ mt: 1 }} />
      <Stack
        spacing={2}
        direction={isMd ? 'column' : 'row'}
        divider={<Divider orientation={isMd ? 'horizontal' : 'vertical'} flexItem />}
        sx={{ flex: 1, '& > div': { flex: 1 } }}
      >
        <Box sx={{ maxWidth: '50%', overflow: 'auto' }}>
          <Typography variant="h5" sx={{ mt: 2, mb: 1, display: 'flex', flexDirection: 'row' }}>
            {t('route.analytics.overview.description')}
            <IconButton sx={{ marginLeft: 'auto' }} disabled={markdownLoading} onClick={onEdit}>
              {markdownLoading ? (
                <CircularProgress size={20} />
              ) : editing ? (
                <Check fontSize="small" />
              ) : (
                <Edit fontSize="small" />
              )}
            </IconButton>
          </Typography>
          {editing ? (
            <TextField
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              fullWidth
              multiline
              minRows={30}
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
            />
          ) : (
            <Markdown md={analytic?.description} />
          )}
        </Box>
        <Stack direction="column" spacing={2}>
          <Typography variant="h5" sx={{ mt: `${theme.spacing(2)} !important` }}>
            {t('route.analytics.overview.statistics')}
          </Typography>
          <Card>
            <CardContent>
              <Created analytic={analytic} />
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
              <Escalation analytic={analytic} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Assessment analytic={analytic} />
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </>
  );
};

export default AnalyticOverview;
