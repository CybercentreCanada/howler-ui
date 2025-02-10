import { Autocomplete, TextField } from '@mui/material';
import { ParameterContext } from 'components/app/providers/ParameterProvider';
import { ViewContext } from 'components/app/providers/ViewProvider';
import type { FC } from 'react';
import { memo, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { convertLuceneToDate } from 'utils/utils';

const DATE_RANGES = [
  'date.range.1.day',
  'date.range.3.day',
  'date.range.1.week',
  'date.range.1.month',
  'date.range.all',
  'date.range.custom'
];

const SearchSpan: FC<{
  useDefault?: boolean;
}> = ({ useDefault = true }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const routeParams = useParams();
  const viewContext = useContext(ViewContext);

  const span = useContextSelector(ParameterContext, ctx => ctx.span);
  const setSpan = useContextSelector(ParameterContext, ctx => ctx.setSpan);

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  useEffect(() => {
    if (viewId) {
      const selectedView = viewContext.views.find(_view => _view.view_id === viewId);

      if (selectedView?.span && !location.search.includes('span')) {
        setSpan(convertLuceneToDate(selectedView.span));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewContext.views, viewId]);

  return (
    <Autocomplete
      freeSolo={!useDefault}
      fullWidth
      sx={{ minWidth: '150px' }}
      size="small"
      value={span}
      options={DATE_RANGES}
      renderInput={_params => <TextField {..._params} label={t('hit.search.span')} />}
      getOptionLabel={option => t(option)}
      onChange={(_, value) => setSpan(value)}
      disableClearable
    />
  );
};

export default memo(SearchSpan);
