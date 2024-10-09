import { ArrowDownward, ArrowUpward, Cancel } from '@mui/icons-material';
import { Autocomplete, Chip, Grid, MenuItem, Select, Stack, TextField } from '@mui/material';
import { FieldContext } from 'components/app/providers/FieldProvider';
import { uniqBy } from 'lodash';
import type { Dispatch, FC, SetStateAction } from 'react';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CustomSort: FC<{
  sortEntries: string[];
  setSortEntries: Dispatch<SetStateAction<string[]>>;
}> = ({ sortEntries, setSortEntries }) => {
  const { t } = useTranslation();
  const [field, setField] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc' | ''>('');
  const { hitFields, getHitFields } = useContext(FieldContext);

  const sortFields = useMemo(
    () => sortEntries.map(entry => entry.split(' ').slice(0, 2) as [string, string]),
    [sortEntries]
  );

  useEffect(() => {
    getHitFields();
  }, [getHitFields]);

  useEffect(() => {
    if (!sort) {
      setSort('desc');
    }
  }, [sort]);

  useEffect(() => {
    if (!field) {
      return;
    }

    setSortEntries(_sortEntries => uniqBy([..._sortEntries, `${field} ${sort}`], entry => entry.replace(/ .+/, '')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  return (
    <Stack spacing={1} maxWidth="450px">
      <Stack direction="row" spacing={1}>
        <Autocomplete
          fullWidth
          sx={{ minWidth: '225px' }}
          size="small"
          value={field}
          options={hitFields.map(_field => _field.key)}
          getOptionDisabled={option => sortEntries.map(entry => entry.replace(/ .+/, '')).includes(option)}
          renderInput={_params => <TextField {..._params} label={t('hit.search.sort.fields')} />}
          onChange={(_, value) => setField(value)}
          disableClearable
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
      <Grid container spacing={1} sx={theme => ({ marginLeft: `${theme.spacing(-1)} !important` })}>
        {sortFields.map(([key, direction]) => (
          <Grid item key={key}>
            <Chip
              variant="outlined"
              label={key}
              icon={direction === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
              deleteIcon={<Cancel />}
              onClick={() =>
                setSortEntries(_sortEntries =>
                  _sortEntries.map(entry =>
                    entry?.replace(`${key} ${direction}`, `${key} ${direction === 'asc' ? 'desc' : 'asc'}`)
                  )
                )
              }
              onDelete={() =>
                setSortEntries(_sortEntries => _sortEntries.filter(entry => entry && entry.split(' ')[0] != key))
              }
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default memo(CustomSort);
