import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Card, CardContent, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import api from 'api';
import TuiListEmpty from 'commons/addons/lists/TuiListEmpty';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageCenter from 'commons/components/pages/PageCenter';
import HitHeader from 'components/elements/hit/HitHeader';
import { HitLayout } from 'components/elements/hit/HitLayout';
import useMyApi from 'components/hooks/useMyApi';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

const Home: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAppUser();
  const { dispatchApi } = useMyApi();

  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatchApi(
      api.search.hit.post({
        query: `howler.assignment:${user.username} AND howler.status:(-resolved)`,
        rows: 25
      })
    )
      .then(res => setHits(res.items))
      .finally(() => setLoading(false));
  }, [dispatchApi, user.username]);

  const onClick = useCallback((query: string) => navigate('/hits?query=' + query), [navigate]);

  return (
    <PageCenter width="75%" textAlign="left">
      <Stack spacing={2} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h3">{t('home.title')}</Typography>
          <IconButton size="medium" onClick={() => onClick('howler.assignment:' + user.username)}>
            <OpenInNewIcon fontSize="large" />
          </IconButton>
        </Stack>
        {loading ? (
          <>
            <Skeleton height={190} width="100%" variant="rounded" />
            <Skeleton height={290} width="100%" variant="rounded" />
            <Skeleton height={240} width="100%" variant="rounded" />
          </>
        ) : hits.length > 0 ? (
          hits.map(h => (
            <Card
              key={h.howler.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate((h.howler.is_bundle ? '/bundles/' : '/hits/') + h.howler.id)}
              elevation={4}
            >
              <CardContent>
                <HitHeader layout={HitLayout.DENSE} hit={h} />
              </CardContent>
            </Card>
          ))
        ) : (
          <TuiListEmpty />
        )}
      </Stack>
    </PageCenter>
  );
};

export default Home;
