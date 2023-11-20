import { Autocomplete, Chip, Stack, TextField, UseAutocompleteProps } from '@mui/material';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { convertDateToLucene } from 'utils/utils';

const ACCEPTED_LOOKUPS = ['howler.assessment', 'howler.escalation', 'howler.scrutiny', 'howler.status'];
const DATE_RANGES = [
  'date.range.1.day',
  'date.range.3.day',
  'date.range.1.week',
  'date.range.1.month',
  'date.range.all'
];

const HitFilters: FC<{ onChange?: (filters: string[]) => void }> = ({ onChange }) => {
  const { t } = useTranslation();
  const { config } = useMyApiConfig();
  const searchParams = useSearchParams()[0];

  const [filters, setFilters] = useState(searchParams.getAll('filter').reduce((values, current) => {
    const [category, value] = (current+ ":").split(":");

    return [...values, [category, value]];
  }, [] as [string, string][]));
  const [category, setCategory] = useState<string>(null);

  const lookups = useMemo<{ [key: string]: string[] }>(
    () => {
      const options: { [key: string]: string[] } = {};

      if (config.lookups) {
        Object.keys(config.lookups)
            .filter(lookup => ACCEPTED_LOOKUPS.includes(lookup))
            .forEach(lookup => {
              options[lookup] = config.lookups[lookup];
            });
      }

      const dateIndexes = Object.entries(config.indexes.hit).filter(e => e[1].type === 'date').map(e => e[0]);

      dateIndexes.forEach(index => {
        options[index] = DATE_RANGES;
      });

      return options;
    },
    [config]
  );

  const onCategoryChange: UseAutocompleteProps<string, false, false, false>['onChange'] = useCallback(
    (_, _category) => {
      setCategory(_category);
    },
    []
  );

  const onValueChange: UseAutocompleteProps<string, false, false, false>['onChange'] = useCallback(
    (_, value) => {
      setCategory('');
      const newFilters = [...filters, [category, DATE_RANGES.includes(value) ? convertDateToLucene(value) : value]];
      setFilters(newFilters);
      if (onChange) {
        onChange(newFilters.map(filter => filter.join(':')));
      }
    },
    [filters, category, onChange]
  );

  const onRemove = useCallback(fIndex => {
    const newFilters = filters.filter((_, index) => index !== fIndex);
    setFilters(newFilters);
    onChange(newFilters.map(filter => filter.join(':')));
  }, [filters, onChange]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1}>
        {filters.map((filter, index) => (
          <Chip key={filter[0]} variant="outlined" label={filter.join(':')} onDelete={() => onRemove(index)} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Autocomplete
          fullWidth
          size="small"
          value={category}
          options={Object.keys(lookups).filter(l => !filters.find(f => f[0] === l))}
          renderInput={params => <TextField {...params} label={t('hit.search.filter.fields')} />}
          onChange={onCategoryChange}
        />
        <Autocomplete
          fullWidth
          disabled={!category}
          size="small"
          value={null}
          options={lookups[category] ? lookups[category] : []}
          renderInput={params => <TextField {...params} label={t('hit.search.filter.values')} />}
          getOptionLabel={option => t(option)}
          onChange={onValueChange}
        />
      </Stack>
    </Stack>
  );
};

export default memo(HitFilters);
