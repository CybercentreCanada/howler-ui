import { Check, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import api from 'api';
import { HowlerGroupedSearchResponse } from 'api/search/grouped';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  SubTitle,
  TimeScale,
  Title,
  Tooltip
} from 'chart.js';
import 'chartjs-adapter-moment';
import Markdown from 'components/elements/display/Markdown';
import useMyApi from 'components/hooks/useMyApi';
import useMyChart from 'components/hooks/useMyChart';
import { Analytic } from 'models/entities/generated/Analytic';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ESCALATION_COLORS } from 'utils/constants';
import { stringToColor } from 'utils/utils';

ChartJS.defaults.font.family = `'Roboto', 'Helvetica', 'Arial', sans-serif`;

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  CategoryScale,
  BarElement
);

const AnalyticOverview: FC<{ analytic: Analytic; setAnalytic: (a: Analytic) => void }> = ({
  analytic,
  setAnalytic
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dispatchApi } = useMyApi();
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  const { line, doughnut, bar } = useMyChart();

  const [loading, setLoading] = useState(false);
  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [ingestionData, setIngestionData] = useState<{ [timestamp: string]: number }>({});
  const [escalationData, setEscalationData] = useState<HowlerGroupedSearchResponse<Hit>['items']>([]);
  const [assessmentData, setAssessmentData] = useState<HowlerGroupedSearchResponse<Hit>['items']>([]);

  useEffect(() => {
    if (!analytic) {
      return;
    }

    setLoading(true);

    // Three graphs, three sets of data to retrieve
    Promise.all([
      // Histogram of created hits over the last three months
      api.search.histogram.hit
        .post('timestamp', {
          query: `howler.analytic:("${analytic.name}")`,
          start: 'now-3M',
          gap: '1d',
          mincount: 0
        })
        .then(setIngestionData),

      // Escalation of generated hits
      api.search.grouped.hit
        .post('howler.escalation', {
          query: `howler.analytic:("${analytic.name}")`,
          limit: 0
        })
        .then(data => setEscalationData(data.items)),

      // Assessed results of generated hits
      api.search.grouped.hit
        .post('howler.assessment', {
          query: `howler.analytic:("${analytic.name}")`,
          limit: 0
        })
        .then(data => setAssessmentData(data.items))
    ]).finally(() => setLoading(false));
  }, [analytic]);

  const onEdit = useCallback(async () => {
    try {
      if (editing) {
        setMarkdownLoading(true);
        const result = await dispatchApi(api.analytic.put(analytic.analytic_id, editValue), {
          showError: true,
          throwError: true
        });

        setAnalytic(result);
      } else {
        setEditValue(analytic.description);
      }
    } finally {
      setEditing(!editing);
      setMarkdownLoading(false);
    }
  }, [analytic?.analytic_id, analytic?.description, dispatchApi, editValue, editing, setAnalytic]);

  const escalationColors = useMemo(
    () =>
      escalationData.map(e =>
        ESCALATION_COLORS[e.value] ? theme.palette[ESCALATION_COLORS[e.value]].main : 'rgba(255, 255, 255, 0.16)'
      ),
    [escalationData, theme.palette]
  );

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
            <IconButton sx={{ marginLeft: 'auto' }} disabled={loading || markdownLoading} onClick={onEdit}>
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
          <Typography variant="h5" sx={{ mt: 2 }}>
            {t('route.analytics.overview.statistics')}
          </Typography>
          <Card>
            <CardContent>
              {analytic && !loading ? (
                <Line
                  options={line('route.analytics.ingestion.title')}
                  data={{
                    datasets: [
                      {
                        label: analytic?.name,
                        data: Object.keys(ingestionData).map(time => ({
                          x: new Date(time).getTime(),
                          y: ingestionData[time]
                        })),
                        borderColor: stringToColor(analytic?.name),
                        backgroundColor: 'transparent',
                        pointBackgroundColor: Object.keys(ingestionData).map(time =>
                          ingestionData[time] ? stringToColor(analytic?.name) : 'transparent'
                        ),
                        pointBorderWidth: Object.keys(ingestionData).map(time => (ingestionData[time] ? 2 : 0))
                      }
                    ]
                  }}
                />
              ) : (
                <Skeleton variant="rounded" height={200} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
              {analytic && !loading ? (
                <div style={{ maxWidth: '45%' }}>
                  <Doughnut
                    options={doughnut('route.analytics.escalation.title')}
                    data={{
                      labels: escalationData.map(e => e.value),
                      datasets: [
                        {
                          label: analytic?.name,
                          data: escalationData.map(e => e.total),
                          borderColor: escalationColors,
                          backgroundColor: escalationColors
                        }
                      ]
                    }}
                  />
                </div>
              ) : (
                <Skeleton variant="rounded" height={200} width="45%" />
              )}
            </CardContent>
          </Card>
          {assessmentData.length > 0 && (
            <Card>
              <CardContent>
                {analytic && !loading ? (
                  <Bar
                    options={bar('route.analytics.assessment.title')}
                    data={{
                      labels: assessmentData.map(e => e.value),
                      datasets: [
                        {
                          label: '',
                          data: assessmentData.map(a => a.total),
                          borderColor: assessmentData.map(a => stringToColor(a.value)),
                          backgroundColor: assessmentData.map(a => stringToColor(a.value))
                        }
                      ]
                    }}
                  />
                ) : (
                  <Skeleton variant="rounded" height={200} />
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default AnalyticOverview;
