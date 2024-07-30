import { Add, ArrowDownward, ArrowUpward, Cancel } from '@mui/icons-material';
import { Autocomplete, Chip, Grid, IconButton, MenuItem, Select, Stack, TextField } from '@mui/material';
import { FieldContext } from 'components/app/providers/FieldProvider';
import type { FC } from 'react';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CustomSort: FC<{ customSort: string; setCustomSort: (newSort: string) => void }> = ({
  customSort,
  setCustomSort
}) => {
  const { t } = useTranslation();
  const [field, setField] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const { hitFields, getHitFields } = useContext(FieldContext);

  const sortFields = useMemo(
    () =>
      customSort
        .trim()
        .split(',')
        .filter(entry => !!entry)
        .map(entry => entry.split(' ').slice(0, 2) as [string, string]),
    [customSort]
  );

  useEffect(() => {
    getHitFields();
  }, [getHitFields]);

  return (
    <Stack spacing={1} maxWidth="450px">
      <Stack direction="row" spacing={1}>
        <Autocomplete
          fullWidth
          sx={{ minWidth: '225px' }}
          size="small"
          value={field}
          options={hitFields.map(_field => _field.key)}
          getOptionDisabled={option => customSort.includes(option)}
          renderInput={_params => <TextField {..._params} label={t('hit.search.sort.fields')} />}
          onChange={(_, value) => setField(value)}
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
        <IconButton
          disabled={!field || !sort || customSort.includes(field)}
          onClick={() => setCustomSort(`${customSort}${customSort && ','}${field} ${sort}`)}
        >
          <Add />
        </IconButton>
      </Stack>
      <Grid container spacing={1} sx={theme => ({ marginLeft: `${theme.spacing(-1)} !important` })}>
        {sortFields.map(([key, direction]) => (
          <Grid item key={key}>
            <Chip
              variant="outlined"
              label={key}
              icon={direction === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
              deleteIcon={<Cancel />}
              onClick={() =>
                setCustomSort(
                  customSort.replace(`${key} ${direction}`, `${key} ${direction === 'asc' ? 'desc' : 'asc'}`)
                )
              }
              onDelete={() =>
                setCustomSort(
                  customSort
                    .replace(`${key} ${direction}`, '')
                    .trim()
                    .replace(/^,?(.+),?$/, '$1')
                )
              }
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default memo(CustomSort);
