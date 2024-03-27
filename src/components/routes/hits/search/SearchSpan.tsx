import { Autocomplete, TextField } from '@mui/material';
import { FC, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { convertDateToLucene } from 'utils/utils';

const DATE_RANGES = [
  'date.range.1.day',
  'date.range.3.day',
  'date.range.1.week',
  'date.range.1.month',
  'date.range.all'
];

const SearchSpan: FC<{ onChange: (span: string) => void; useDefault?: boolean }> = ({
  onChange,
  useDefault = true
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const [span, setSpan] = useState(params.get('span') || (useDefault ? DATE_RANGES[2] : ''));

  useEffect(() => {
    if (!span || span.endsWith('all')) {
      onChange('');
    } else {
      onChange(`event.created:${convertDateToLucene(span)}`);
    }

    if (!span && params.has(span)) {
      params.delete('span');
    } else if (params.get('span') !== span) {
      params.set('span', span);
    }

    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, span]);

  useEffect(() => {
    const _params = new URLSearchParams(location.search);

    if (_params.get('span') && span !== _params.get('span')) {
      setSpan(_params.get('span'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <Autocomplete
      freeSolo={!useDefault}
      fullWidth
      sx={{ minWidth: '175px' }}
      size="small"
      value={span}
      options={DATE_RANGES}
      renderInput={_params => <TextField {..._params} label={t('hit.search.span')} />}
      getOptionLabel={option => t(option)}
      onChange={(_, value) => setSpan(value)}
    />
  );
};

export default memo(SearchSpan);
