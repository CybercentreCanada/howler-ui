import { Autocomplete, Stack, TextField, UseAutocompleteProps } from '@mui/material';
import api from 'api';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

const ACCEPTED_LOOKUPS = [
  'howler.assessment',
  'howler.escalation',
  'howler.analytic',
  'howler.detection',
  'event.provider',
  'organization.name'
];

const HitFilter: FC<{ onChange: (filter: string) => void }> = ({ onChange }) => {
  const { t } = useTranslation();
  const { config } = useMyApiConfig();
  const [params, setParams] = useSearchParams();

  const [category, setCategory] = useState(ACCEPTED_LOOKUPS[0]);
  const [filter, setFilter] = useState('');

  const [customLookups, setCustomLookups] = useState<string[]>([]);

  useEffect(() => {
    const _params = new URLSearchParams(window.location.search);

    if (_params.get('filter')) {
      const [_category, _filter] = (_params.get('filter') || ':').split(':');

      if (_category) {
        setCategory(_category);
      }

      if (_filter) {
        setFilter(_filter);
      }

      if (_category && _filter) {
        onChange(`${_category}:${_filter}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  const onCategoryChange: UseAutocompleteProps<string, false, false, false>['onChange'] = useCallback(
    async (_, _category) => {
      setCategory(_category);
      setFilter('');
      onChange('');

      params.delete('filter');
      setParams(params);

      if (!config.lookups[_category]) {
        const facets = await api.search.facet.hit.post(_category, { query: 'howler.id:*' });

        setCustomLookups(Object.keys(facets));
      } else {
        setCustomLookups([]);
      }
    },
    [config.lookups, onChange, params, setParams]
  );

  const onValueChange: UseAutocompleteProps<string, false, false, false>['onChange'] = useCallback(
    (_, value) => {
      setFilter(value);
      if (value) {
        const newFilter = `${category}:"${sanitizeLuceneQuery(value)}"`;

        onChange(newFilter);
        params.set('filter', newFilter);
      } else {
        onChange('');
        params.delete('filter');
      }

      setParams(params);
    },
    [category, onChange, params, setParams]
  );

  return (
    <Stack direction="row" spacing={1}>
      <Autocomplete
        fullWidth
        sx={{ minWidth: '200px' }}
        size="small"
        value={category}
        options={ACCEPTED_LOOKUPS}
        renderInput={_params => <TextField {..._params} label={t('hit.search.filter.fields')} />}
        onChange={onCategoryChange}
      />
      <Autocomplete
        fullWidth
        freeSolo
        sx={{ minWidth: '150px' }}
        disabled={!category}
        size="small"
        value={filter?.replaceAll('"', '') || ''}
        options={config.lookups[category] ? config.lookups[category] : customLookups}
        renderInput={_params => <TextField {..._params} label={t('hit.search.filter.values')} />}
        getOptionLabel={option => t(option)}
        onChange={onValueChange}
      />
    </Stack>
  );
};

export default memo(HitFilter);
