import { Autocomplete, MenuItem, Select, Stack, TextField } from '@mui/material';
import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import CustomSort from './CustomSort';

const CUSTOM = '__custom__';

const ACCEPTED_SORTS = [
  'event.created',
  'howler.assessment',
  'howler.escalation',
  'howler.analytic',
  'howler.detection',
  'event.provider',
  'organization.name',
  CUSTOM
];

const HitSort: FC<{ onChange: (sort: string) => void; useDefault?: boolean }> = ({ onChange, useDefault = true }) => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const [field, setField] = useState(
    params.get('sort')?.split(',')[0]?.split(' ')[0] || (useDefault ? ACCEPTED_SORTS[0] : '')
  );
  const [sort, setSort] = useState<'asc' | 'desc'>(
    (params.get('sort')?.split(',')[0]?.split(' ')[1] as 'asc' | 'desc') || 'desc'
  );
  const [showCustomSort, setShowCustomSort] = useState(params.get('sort')?.includes(','));
  const [customSort, setCustomSort] = useState<string | null>(
    params.get('sort')?.includes(',') ? params.get('sort') : null
  );

  const handleChange = useCallback((value: string) => {
    if (value === CUSTOM) {
      setShowCustomSort(true);
      setCustomSort('');
    } else {
      setField(value);
    }
  }, []);

  useEffect(() => {
    if (customSort) {
      onChange(customSort);

      params.set('sort', customSort);

      setParams(params, { replace: true });
    } else if (field && sort) {
      onChange(`${field} ${sort}`);

      params.set('sort', `${field} ${sort}`);

      setParams(params, { replace: true });
    }
  }, [customSort, field, onChange, params, setParams, sort]);

  useEffect(() => {
    const _params = new URLSearchParams(window.location.search);

    if (_params.has('sort')) {
      const rawSort = _params.get('sort');

      if (!rawSort || !rawSort.includes(' ')) {
        return;
      }

      if (rawSort.includes(',')) {
        setCustomSort(rawSort);
        return;
      }

      const [_field, _sort] = rawSort.split(' ');

      if (!ACCEPTED_SORTS.includes(_field)) {
        setCustomSort(rawSort);
        return;
      }

      if (_field && field !== _field) {
        setField(_field);
      }

      if (['asc', 'desc'].includes(_sort) && _sort !== sort) {
        setSort(_sort as 'asc' | 'desc');

        if (_field) {
          onChange(`${_field} ${_sort}`);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  return !showCustomSort ? (
    <Stack direction="row" spacing={1}>
      <Autocomplete
        fullWidth
        sx={{ minWidth: '175px' }}
        size="small"
        value={field}
        options={ACCEPTED_SORTS}
        getOptionLabel={option => (option === CUSTOM ? t('hit.search.custom') : option)}
        renderInput={_params => <TextField {..._params} label={t('hit.search.sort.fields')} />}
        onChange={(_, value) => handleChange(value)}
      />
      <Select
        size="small"
        sx={{ minWidth: '150px' }}
        value={sort}
        onChange={e => setSort(e.target.value as 'asc' | 'desc')}
      >
        <MenuItem value="asc">{t('asc')}</MenuItem>
        <MenuItem value="desc">{t('desc')}</MenuItem>
      </Select>
    </Stack>
  ) : (
    <CustomSort customSort={customSort} setCustomSort={setCustomSort} />
  );
};

export default memo(HitSort);
