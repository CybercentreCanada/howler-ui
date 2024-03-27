import { Skeleton, useTheme } from '@mui/material';
import api from 'api';
import { HowlerGroupedSearchResponse } from 'api/search/grouped';
import 'chartjs-adapter-moment';
import useMyChart from 'components/hooks/useMyChart';
import { Analytic } from 'models/entities/generated/Analytic';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ESCALATION_COLORS } from 'utils/constants';

const Escalation: FC<{ analytic: Analytic; maxWidth?: string }> = ({ analytic, maxWidth = '45%' }) => {
  const theme = useTheme();
  const { doughnut } = useMyChart();

  const [loading, setLoading] = useState(false);
  const [escalationData, setEscalationData] = useState<HowlerGroupedSearchResponse<Hit>['items']>([]);

  const escalationColors = useMemo(
    () =>
      escalationData.map(e =>
        ESCALATION_COLORS[e.value] ? theme.palette[ESCALATION_COLORS[e.value]].main : 'rgba(255, 255, 255, 0.16)'
      ),
    [escalationData, theme.palette]
  );

  useEffect(() => {
    if (!analytic) {
      return;
    }

    setLoading(true);

    api.search.grouped.hit
      .post('howler.escalation', {
        query: `howler.analytic:("${analytic.name}")`,
        limit: 0
      })
      .then(data => setEscalationData(data.items))
      .finally(() => setLoading(false));
  }, [analytic]);

  return analytic && !loading ? (
    <div style={{ maxWidth }}>
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
  );
};

export default Escalation;
