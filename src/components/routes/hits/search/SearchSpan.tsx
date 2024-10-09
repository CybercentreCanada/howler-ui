import { Autocomplete, TextField } from '@mui/material';
import { ViewContext } from 'components/app/providers/ViewProvider';
import type { FC } from 'react';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { convertDateToLucene, convertLucenceToDate } from 'utils/utils';

const DATE_RANGES = [
  'date.range.1.day',
  'date.range.3.day',
  'date.range.1.week',
  'date.range.1.month',
  'date.range.all',
  'date.range.custom'
];

const SearchSpan: FC<{
  onChange: (span: string) => void;
  useDefault?: boolean;
}> = ({ onChange, useDefault = true }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const routeParams = useParams();
  const [params, setParams] = useSearchParams();
  const viewContext = useContext(ViewContext);

  const [span, setSpan] = useState(params.get('span') || (useDefault ? DATE_RANGES[2] : ''));

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  useEffect(() => {
    if (!span || span.endsWith('all')) {
      onChange('');
    } else {
      onChange(`event.created:${convertDateToLucene(span)}`);
    }

    setParams(
      _currentParams => {
        if (!span && _currentParams.has(span)) {
          _currentParams.delete('span');
        } else if (_currentParams.get('span') !== span) {
          _currentParams.set('span', span);
        }

        if (!span?.endsWith('custom')) {
          _currentParams.delete('startDate');
          _currentParams.delete('endDate');
        }

        return _currentParams;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, span]);

  useEffect(() => {
    const _params = new URLSearchParams(location.search);

    if (_params.get('span') && span !== _params.get('span')) {
      setSpan(_params.get('span'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (viewId) {
      const selectedView = viewContext.views.find(_view => _view.view_id === viewId);

      if (selectedView?.span) {
        setSpan(convertLucenceToDate(selectedView.span));
        params.set('span', convertLucenceToDate(selectedView.span));
      }
      setParams(params, { replace: true });
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
      onChange={(_, value) => {
        setSpan(value);
      }}
      disableClearable
    />
  );
};

export default memo(SearchSpan);
