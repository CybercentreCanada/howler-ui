import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Add, Check, Close, Edit, OpenInNew } from '@mui/icons-material';
import { Alert, AlertTitle, CircularProgress, Grid, IconButton, Stack, Typography } from '@mui/material';
import api from 'api';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageCenter from 'commons/components/pages/PageCenter';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HowlerLogo from 'components/elements/display/icons/HowlerLogo';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import useMyUserFunctions from 'components/hooks/useMyUserFunctions';
import { HowlerUser } from 'models/entities/HowlerUser';
import moment from 'moment';
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import AddNewCard from './AddNewCard';
import AnalyticCard, { AnalyticSettings } from './AnalyticCard';
import EntryWrapper from './EntryWrapper';
import ViewCard, { ViewSettings } from './ViewCard';

const LUCENE_DATE_FMT = 'YYYY-MM-DD[T]HH:mm:ss';

const Home: FC = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAppUser<HowlerUser>();
  const { fetchViews } = useContext(ViewContext);
  const { setDashboard } = useMyUserFunctions();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [lastViewed, setLastViewed] = useMyLocalStorageItem(
    StorageKey.LAST_VIEW,
    moment().utc().format(LUCENE_DATE_FMT)
  );

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [updatedHitTotal, setUpdatedHitTotal] = useState(0);

  const updateQuery = useMemo(
    () =>
      `(howler.log.user:${user.username} OR howler.assignment:${user.username}) AND howler.log.timestamp:{${lastViewed} TO now} AND -howler.status:resolved`,
    [lastViewed, user.username]
  );

  const getIdFromEntry = useCallback((entry: HowlerUser['dashboard'][0]) => {
    const settings = JSON.parse(entry.config);

    if (entry.type === 'analytic') {
      return `${settings.analyticId}-${settings.type}`;
    } else if (entry.type === 'view') {
      return settings.viewId;
    } else {
      return 'unknown';
    }
  }, []);

  const setLocalDashboard = useCallback(
    (dashboard: HowlerUser['dashboard']) => {
      setUser({
        ...user,
        dashboard
      });
    },
    [setUser, user]
  );

  const saveChanges = useCallback(async () => {
    setLoading(true);

    try {
      await setDashboard(user.dashboard ?? []);

      setIsAdding(false);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  }, [setDashboard, user.dashboard]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over.id) {
        const oldIndex = (user.dashboard ?? []).findIndex(entry => getIdFromEntry(entry) === active.id);
        const newIndex = (user.dashboard ?? []).findIndex(entry => getIdFromEntry(entry) === over.id);

        setLocalDashboard(arrayMove(user.dashboard, oldIndex, newIndex));
      }
    },
    [getIdFromEntry, setLocalDashboard, user.dashboard]
  );

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  useEffect(() => {
    api.search.hit
      .post({
        query: updateQuery,
        rows: 5
      })
      .then(result => setUpdatedHitTotal(result.total));
  }, [updateQuery]);

  return (
    <PageCenter maxWidth="1800px" textAlign="left" height="100%">
      <Stack direction="column" spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="end" spacing={1}>
          <TuiButton
            variant="outlined"
            size="small"
            disabled={((user.dashboard?.length ?? 0) < 1 && !isEditing) || isAdding}
            color={isEditing ? 'success' : 'primary'}
            startIcon={isEditing ? loading ? <CircularProgress size={20} /> : <Check /> : <Edit />}
            onClick={() => (!isEditing ? setIsEditing(true) : saveChanges())}
          >
            {t(isEditing ? 'save' : 'edit')}
          </TuiButton>
          <TuiButton
            variant="outlined"
            size="small"
            disabled={isEditing}
            startIcon={isAdding ? loading ? <CircularProgress size={20} /> : <Check /> : <Add />}
            color={isAdding ? 'success' : 'primary'}
            onClick={() => (!isAdding ? setIsAdding(true) : saveChanges())}
          >
            {t(isAdding ? 'save' : 'add')}
          </TuiButton>
        </Stack>
        {updatedHitTotal > 0 && (
          <Alert
            severity="info"
            variant="outlined"
            action={
              <Stack spacing={1} direction="row">
                <IconButton
                  color="info"
                  component={Link}
                  to={`/hits?query=${encodeURIComponent(updateQuery)}`}
                  onClick={() => setLastViewed(moment().utc().format(LUCENE_DATE_FMT))}
                >
                  <OpenInNew />
                </IconButton>
                <IconButton
                  color="info"
                  onClick={() => {
                    setLastViewed(moment().utc().format(LUCENE_DATE_FMT));
                    setUpdatedHitTotal(0);
                  }}
                >
                  <Close />
                </IconButton>
              </Stack>
            }
          >
            <AlertTitle>{t('route.home.alert.updated.title')}</AlertTitle>
            {t('route.home.alert.updated.description', { count: updatedHitTotal })}
          </Alert>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(user.dashboard ?? []).map(entry => getIdFromEntry(entry))}>
            <Grid
              container
              spacing={1}
              alignItems="stretch"
              sx={[
                theme => ({
                  marginLeft: `${theme.spacing(-1)} !important`
                }),
                !user.dashboard?.length &&
                  !(isAdding || isEditing) && {
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center'
                  }
              ]}
            >
              {(user.dashboard ?? []).map(entry => {
                if (entry.type === 'view') {
                  const settings: ViewSettings = JSON.parse(entry.config);

                  return (
                    <EntryWrapper
                      editing={isEditing}
                      id={settings.viewId}
                      onDelete={() =>
                        setLocalDashboard(user.dashboard.filter(_entry => _entry.entry_id !== getIdFromEntry(entry)))
                      }
                    >
                      <ViewCard key={entry.config} {...settings} />
                    </EntryWrapper>
                  );
                } else if (entry.type === 'analytic') {
                  const settings: AnalyticSettings = JSON.parse(entry.config);

                  return (
                    <EntryWrapper
                      editing={isEditing}
                      id={getIdFromEntry(entry)}
                      onDelete={() =>
                        setLocalDashboard(user.dashboard.filter(_entry => _entry.entry_id !== getIdFromEntry(entry)))
                      }
                    >
                      <AnalyticCard key={entry.config} {...settings} />
                    </EntryWrapper>
                  );
                } else {
                  return null;
                }
              })}
              {isAdding && <AddNewCard />}
              {!user.dashboard?.length && !(isAdding || isEditing) && (
                <Grid item xs={12}>
                  <Stack
                    direction="column"
                    spacing={2}
                    sx={theme => ({
                      height: '60vh',
                      borderStyle: 'dashed',
                      borderColor: theme.palette.text.secondary,
                      borderWidth: '1rem',
                      borderRadius: '1rem',
                      opacity: 0.3,
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 3
                    })}
                  >
                    <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <HowlerLogo fontSize="inherit" sx={{ pr: 2 }} /> <span>{t('route.home.title')}</span>
                    </Typography>
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>
                      {t('route.home.description')}
                    </Typography>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </SortableContext>
        </DndContext>
      </Stack>
    </PageCenter>
  );
};

export default Home;
