import { Skeleton } from '@mui/material';
import api from 'api';
import { HowlerGroupedSearchResponse } from 'api/search/grouped';
import 'chartjs-adapter-moment';
import useMyChart from 'components/hooks/useMyChart';
import { Analytic } from 'models/entities/generated/Analytic';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { stringToColor } from 'utils/utils';

const Assessment: FC<{ analytic: Analytic }> = ({ analytic }) => {
  const { bar } = useMyChart();

  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<HowlerGroupedSearchResponse<Hit>['items']>([]);

  useEffect(() => {
    if (!analytic) {
      return;
    }

    setLoading(true);

    api.search.grouped.hit
      .post('howler.assessment', {
        query: `howler.analytic:("${analytic.name}")`,
        limit: 0
      })
      .then(data => setAssessmentData(data.items))
      .finally(() => setLoading(false));
  }, [analytic]);

  if (!loading && assessmentData.length < 1) {
    return null;
  }

  return analytic && !loading ? (
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
  );
};

export default Assessment;
