import { Add, ArrowUpward, Remove } from '@mui/icons-material';
import { Chip, Grid, MenuItem, Select, Stack } from '@mui/material';
import { TuiPhrase } from 'commons/addons/controls';
import Throttler from 'commons/addons/utils/Throttler';
import { TuiKeyboardParsedEvent } from 'commons/components/utils/keyboard';
import { isEqual } from 'lodash';
import { FC, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const THROTTLER = new Throttler(50);

export interface SortData {
  [key: string]: { direction: 'asc' | 'desc'; priority: number };
}

const HitSort: FC<{
  sort: SortData;
  onChange?: (data: SortData) => void;
  suggestions: string[];
}> = ({ sort, onChange, suggestions }) => {
  const { t } = useTranslation();

  const [draggedKey, setDraggedKey] = useState<string>(null);
  const [order, setOrder] = useState(Object.keys(sort).sort((keyA, keyB) => sort[keyA].priority - sort[keyB].priority));
  const [adding, setAdding] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleKeyDown = useCallback(
    ({ isEnter }: TuiKeyboardParsedEvent) => {
      if (isEnter && suggestions.includes(phrase)) {
        onChange({
          ...sort,
          [phrase]: {
            direction: sortDirection,
            priority: order.length
          }
        });
        setOrder([...order, phrase]);
        setAdding(false);
        setPhrase('');
      }
    },
    [onChange, order, phrase, sort, sortDirection, suggestions]
  );

  const onDragStart = useCallback(
    key => e => {
      setDraggedKey(key);
    },
    []
  );

  const onDragEnd = useCallback(
    e => {
      setDraggedKey(null);

      const newSortData = Object.keys(sort).reduce((acc, key) => {
        acc[key] = {
          direction: sort[key].direction,
          priority: order.findIndex(o => o === key)
        };

        return acc;
      }, {} as SortData);

      onChange(newSortData);
    },
    [onChange, order, sort]
  );

  const onDragEnter = useCallback(
    key => e => {
      THROTTLER.throttle(() => {
        const currentIndex = order.findIndex(o => o === draggedKey);
        const newIndex = order.findIndex(o => o === key);

        const newOrder = [...order];
        newOrder.splice(currentIndex, 1, key);
        newOrder.splice(newIndex, 1, draggedKey);

        if (isEqual(order, newOrder)) {
          return;
        }

        setOrder(newOrder);
      });
    },
    [draggedKey, order]
  );

  return (
    <Stack spacing={1}>
      <Grid container spacing={1}>
        {Object.keys(sort)
          .sort((a, b) => order.findIndex(o => o === a) - order.findIndex(o => o === b))
          .map(key => (
            <Grid key={key} item xs="auto" onDragEnter={onDragEnter(key)}>
              <Chip
                draggable={order.length > 1}
                sx={[key === draggedKey && { opacity: 0.5 }]}
                onDragStart={onDragStart(key)}
                onDragEnd={onDragEnd}
                variant="outlined"
                icon={
                  <ArrowUpward
                    sx={{ transition: 'rotate 250ms', rotate: sort[key].direction === 'desc' ? '180deg' : '0deg' }}
                  />
                }
                label={key}
                onClick={() =>
                  onChange({
                    ...sort,
                    [key]: { ...sort[key], direction: sort[key].direction === 'asc' ? 'desc' : 'asc' }
                  })
                }
                onDelete={() => {
                  let newSort = { ...sort };
                  delete newSort[key];
                  onChange(newSort);
                }}
              />
            </Grid>
          ))}
        <Grid item xs="auto">
          <Chip
            icon={adding ? <Remove /> : <Add />}
            label={adding ? t('close') : t('add')}
            onClick={() => setAdding(!adding)}
          />
        </Grid>
      </Grid>
      {adding && (
        <Stack direction="row" spacing={1} alignSelf="stretch" sx={{ '& > :first-of-type': { flex: 1 } }}>
          <TuiPhrase
            sx={{ flex: 1 }}
            suggestions={suggestions}
            value={phrase}
            onChange={newPhrase => setPhrase(newPhrase || '')}
            onKeyDown={handleKeyDown}
          />
          <Select
            sx={{ minWidth: '200px' }}
            value={sortDirection}
            onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}
          >
            <MenuItem value="asc">{t('asc')}</MenuItem>
            <MenuItem value="desc">{t('desc')}</MenuItem>
          </Select>
        </Stack>
      )}
    </Stack>
  );
};

export default memo(HitSort);
