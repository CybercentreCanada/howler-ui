import { OpenInNew } from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import api from 'api';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Assessment from '../analytics/widgets/Assessment';
import Created from '../analytics/widgets/Created';
import Escalation from '../analytics/widgets/Escalation';

export interface AnalyticSettings {
  analyticId: string;
  type: 'assessment' | 'created' | 'escalation';
}

const AnalyticCard: FC<AnalyticSettings> = ({ analyticId, type }) => {
  const [analytic, setAnalytic] = useState<Analytic>(null);

  useEffect(() => {
    api.search.analytic
      .post({
        query: `analytic_id:${analyticId}`,
        rows: 1
      })
      .then(result => setAnalytic(result.items[0]));
  }, [analyticId]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">
            {analytic?.name ?? <Skeleton variant="text" height="2em" width="100px" />}
          </Typography>
          <IconButton size="small" component={Link} to={`/analytics/${analytic?.analytic_id}`}>
            <OpenInNew fontSize="small" />
          </IconButton>
        </Stack>
        {{
          assessment: () => <Assessment analytic={analytic} />,
          created: () => <Created analytic={analytic} />,
          escalation: () => (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Escalation analytic={analytic} maxWidth="80%" />
            </Box>
          )
        }[type]()}
      </CardContent>
    </Card>
  );
};

export default AnalyticCard;
