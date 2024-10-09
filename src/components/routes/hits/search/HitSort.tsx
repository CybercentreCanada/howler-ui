import { Autocomplete, MenuItem, Select, Stack, TextField } from '@mui/material';
import { ViewContext } from 'components/app/providers/ViewProvider';
import type { FC } from 'react';
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
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
  const location = useLocation();
  const routeParams = useParams();
  const viewContext = useContext(ViewContext);

  /**
   * This array contains an array of sort fields in the form "<key> <sort>". All edits to the sort string will go through this
   */
  const [sortEntries, setSortEntries] = useState(
    (params.get('sort') || useDefault ? `${ACCEPTED_SORTS[0]} desc` : '').split(',').filter(part => !!part)
  );

  /**
   * The currently selected field when not using custom sorting
   */
  const [field, setField] = useState(sortEntries[0]?.split(' ')[0] || (useDefault ? ACCEPTED_SORTS[0] : ''));

  /**
   * The currently selected sorter when not using custom sorting
   */
  const [sort, setSort] = useState<'asc' | 'desc'>((sortEntries[0]?.split(' ')[1] as 'asc' | 'desc') || 'desc');

  /**
   * Should the custom sorter be shown? Defaults to true if there's more than one sort field, or we're sorting on a field not supported by the default dropdown
   */
  const [showCustomSort, setShowCustomSort] = useState(
    sortEntries.length > 1 || (sortEntries.length > 0 && !ACCEPTED_SORTS.includes(sortEntries[0]?.split(' ')[0]))
  );

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  /**
   * This handles changing the sort if the basic sorter is used, OR enables the custom sorting.
   */
  const handleChange = useCallback(
    (value: string) => {
      if (value === CUSTOM) {
        setShowCustomSort(true);
      } else {
        setSortEntries([`${field} ${sort || 'desc'}`]);
      }
    },
    [field, sort]
  );

  /**
   * This effect handles propagating changes to the sortEntries upstream and to the query string
   */
  useEffect(() => {
    // Do we have any sorting to show?
    if (sortEntries.length > 0) {
      const sortString = sortEntries.join(',');
      onChange(sortString);

      // Does the search parameter match? If it doesn't, update it
      if (params.get('sort') !== sortString) {
        params.set('sort', sortString);
        setParams(params, { replace: true });
      }
    }
  }, [onChange, params, setParams, sortEntries]);

  // Handle changes to the search bar from external sources (i.e. the user manually editing the url)
  useEffect(() => {
    const _params = new URLSearchParams(window.location.search);

    if (_params.has('sort')) {
      const rawSort = _params.get('sort');

      if (!rawSort || !rawSort.includes(' ') || rawSort === sortEntries.join(',')) {
        return;
      }

      const rawSortEntries = rawSort.split(',');
      // Since we're using custom sorting when this is true, we don't need to set the field or sort states, as they're unused
      if (rawSortEntries.length > 1) {
        setShowCustomSort(true);
        return;
      } else if (sortEntries.length > 0 && !ACCEPTED_SORTS.includes(rawSortEntries[0]?.split(' ')[0])) {
        setShowCustomSort(true);
        return;
      }

      const [_field, _sort] = rawSortEntries[0].split(' ').slice(0, 2) as [string, string];
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

  useEffect(() => {
    if (viewId) {
      const selectedView = viewContext.views.find(_view => _view.view_id === viewId);

      if (selectedView?.sort) {
        onChange(selectedView.sort);
        params.set('sort', selectedView.sort);
      } else {
        params.delete('sort');
      }

      setParams(params, { replace: true });

      const firstEntry = selectedView?.sort?.split(',')?.[0]?.split(' ')?.[0];
      if (firstEntry && field !== firstEntry) {
        setField(firstEntry);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewContext.views, viewId]);

  return !showCustomSort ? (
    <Stack direction="row" spacing={1}>
      <Autocomplete
        fullWidth
        sx={{ minWidth: '175px' }}
        size="small"
        value={field}
        options={ACCEPTED_SORTS}
        getOptionLabel={option => (option === CUSTOM ? t('hit.search.custom') : option)}
        isOptionEqualToValue={(option, value) => option === value || (!value && option === ACCEPTED_SORTS[0])}
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
    <CustomSort sortEntries={sortEntries} setSortEntries={setSortEntries} />
  );
};

export default memo(HitSort);
