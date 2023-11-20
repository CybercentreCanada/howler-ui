import { Chip, Fade, Grid, Tooltip } from '@mui/material';
import { SearchField } from 'api/search/fields';
import { FC } from 'react';
import { getTimeRange } from 'utils/utils';

const Compact: FC<{
  setSearch: (key, value) => void;
  aggregateResults: {
    [key: string]: {
      [value: string]: number;
    };
  };
  hitFields: SearchField[];
}> = ({ aggregateResults, hitFields, setSearch }) => {
  // This is a bit complex, so we'll break it down
  const entries = Object.keys(aggregateResults)
    .flatMap<[string, string | string[], number]>(key =>
      hitFields.find(f => f.key === key)?.type !== 'date' // We'll special case date ranges, as they are handled slightly differently
        ? Object.keys(aggregateResults[key]).map(
            // Map to the key (howler.id), the value (abc1234), and how many times it shows up (13)
            _key => [key, _key, aggregateResults[key][_key]] as [string, string, number]
          )
        : [
            // Map to the key, the tuple representing the range (March 26th, May 4th), and a very large number
            // to push it to the top when sorted
            [key, getTimeRange(Object.keys(aggregateResults[key])), Number.MAX_SAFE_INTEGER] as [
              string,
              string[],
              number
            ]
          ]
    )
    // Sort by the number of times it shows up, pushing timestamps to the top
    .sort((a, b) => b[2] - a[2]);

  return (
    <Grid container style={{ marginTop: 0 }} spacing={1}>
      {entries.map(([key, value, instances]) =>
        // This is how we discriminate between normal values, and date ranges.
        // Date range will be an array
        !Array.isArray(value) ? (
          <Grid key={key + value} item xs="auto">
            <Fade in>
              <Tooltip title={key}>
                <Chip size="small" label={`${value} (${instances})`} onClick={() => setSearch(key, `"${value}"`)} />
              </Tooltip>
            </Fade>
          </Grid>
        ) : (
          <Grid key={key + value.join()} item xs="auto">
            <Fade in>
              <Tooltip title={key}>
                <Chip
                  size="small"
                  label={value.map(d => new Date(d).toLocaleString()).join(' - ')}
                  onClick={() => setSearch(key, `[${value.join(' TO ')}]`)}
                />
              </Tooltip>
            </Fade>
          </Grid>
        )
      )}
    </Grid>
  );
};

export default Compact;
