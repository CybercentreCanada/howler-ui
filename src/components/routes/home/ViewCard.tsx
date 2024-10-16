import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Card, CardContent, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import api from 'api';
import TuiListEmpty from 'commons/addons/lists/TuiListEmpty';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HitBanner from 'components/elements/hit/HitBanner';
import { HitLayout } from 'components/elements/hit/HitLayout';
import useMyApi from 'components/hooks/useMyApi';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC } from 'react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export interface ViewSettings {
  viewId: string;
  limit: number;
}

const ViewCard: FC<ViewSettings> = ({ viewId, limit }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { views } = useContext(ViewContext);

  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const view = useMemo(() => views.find(_view => _view.view_id === viewId), [viewId, views]);

  useEffect(() => {
    if (!view?.query) {
      return;
    }

    const timeout = setTimeout(() => setLoading(true), 200);

    dispatchApi(
      api.search.hit.post({
        query: view.query,
        rows: limit
      })
    )
      .then(res => setHits(res.items))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, [dispatchApi, limit, view?.query]);

  const onClick = useCallback((query: string) => navigate('/hits?query=' + query), [navigate]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <Stack spacing={1} sx={{ p: 1, minHeight: 100 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">
            {t(view?.title) || <Skeleton variant="text" height="2em" width="100px" />}
          </Typography>
          <IconButton size="small" onClick={() => onClick(view.query)}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Stack>
        {loading ? (
          <>
            <Skeleton height={150} width="100%" variant="rounded" />
            <Skeleton height={160} width="100%" variant="rounded" />
            <Skeleton height={140} width="100%" variant="rounded" />
          </>
        ) : hits.length > 0 ? (
          hits.map(h => (
            <Card
              variant="outlined"
              key={h.howler.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate((h.howler.is_bundle ? '/bundles/' : '/hits/') + h.howler.id)}
            >
              <CardContent>
                <HitBanner layout={HitLayout.DENSE} hit={h} />
              </CardContent>
            </Card>
          ))
        ) : (
          <TuiListEmpty />
        )}
      </Stack>
    </Card>
  );
};

export default ViewCard;
