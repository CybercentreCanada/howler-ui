import { FormControl, formControlClasses, Grid, InputLabel, MenuItem, Select, Skeleton } from '@mui/material';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActionButton } from './SharedComponents';
import { ASSESSMENT_KEYBINDS, TOP_ROW, VOTE_OPTIONS } from './SharedComponents';

interface DropdownActionProps {
  availableTransitions: ActionButton[];
  canAssess: boolean;
  canVote: boolean;
  currentAssessment: string;
  currentStatus: string;
  customActions: { [index: string]: () => void };
  loading: boolean;
  orientation: 'horizontal' | 'vertical';
  selectedVote: ActionButton['name'];
  vote: (v: string) => void;
}

const DropdownActions: FC<DropdownActionProps> = ({
  availableTransitions,
  canAssess,
  canVote,
  currentAssessment,
  currentStatus,
  customActions,
  loading,
  orientation,
  selectedVote,
  vote
}) => {
  const { t } = useTranslation();
  const config = useMyApiConfig();
  const isHorizontal = useMemo(() => orientation === 'horizontal', [orientation]);

  if (!config.config.lookups) {
    return (
      <Grid container justifyContent="end" spacing={4} p={2}>
        <Grid item sm="auto" xs={12}>
          <Skeleton variant="rounded" width="200px" height={orientation === 'horizontal' ? '40px' : '56px'}></Skeleton>
        </Grid>
        <Grid item sm="auto" xs={12}>
          <Skeleton variant="rounded" width="200px" height={orientation === 'horizontal' ? '40px' : '56px'}></Skeleton>
        </Grid>
        <Grid item sm="auto" xs={12}>
          <Skeleton variant="rounded" width="200px" height={orientation === 'horizontal' ? '40px' : '56px'}></Skeleton>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid
      container
      justifyContent="end"
      spacing={2}
      p={2}
      sx={[isHorizontal && { [`& .${formControlClasses.root}`]: { minWidth: '140px' } }]}
    >
      <Grid item sm={!isHorizontal ? true : 'auto'} xs={12}>
        <FormControl disabled={loading} fullWidth>
          <InputLabel id="transition-label" htmlFor="transition">
            {t('hit.details.actions.transition')}
          </InputLabel>
          <Select
            labelId="transition-label"
            id="transition"
            size={isHorizontal ? 'small' : 'medium'}
            label={t('hit.details.actions.transition')}
            value={currentStatus}
          >
            <MenuItem value={currentStatus} sx={{ display: 'none' }}>
              {currentStatus.replace(/-/g, ' ').replace(/^[a-z]/, val => val.toUpperCase())}
            </MenuItem>
            {availableTransitions.map(option => (
              <MenuItem key={option.name} value={option.name} onClick={customActions[option.key]}>
                {t(`hit.details.actions.transition.${option.name}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item sm={!isHorizontal ? true : 'auto'} xs={12}>
        <FormControl disabled={loading || !canAssess} fullWidth>
          <InputLabel id="assess-label" htmlFor="assess">
            {t('hit.details.actions.assess')}
          </InputLabel>
          <Select
            labelId="assess-label"
            id="assess"
            size={isHorizontal ? 'small' : 'medium'}
            label={t('hit.details.actions.assess')}
            value={currentAssessment ?? 'no-assessment'}
          >
            <MenuItem value="no-assessment" sx={{ display: 'none' }}>
              {t('hit.details.actions.assess.noassessment')}
            </MenuItem>
            {config.config.lookups['howler.assessment']
              .sort((a, b) => +TOP_ROW.includes(b) - +TOP_ROW.includes(a))
              .map((a, index) => (
                <MenuItem value={a} onClick={customActions[ASSESSMENT_KEYBINDS[index]]} key={a}>
                  {a.replace(/^[a-z]/, val => val.toUpperCase())}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item sm={!isHorizontal ? true : 'auto'} xs={12}>
        <FormControl disabled={loading || !canVote} fullWidth>
          <InputLabel id="vote-label" htmlFor="vote">
            {t('hit.details.actions.vote')}
          </InputLabel>
          <Select
            labelId="vote-label"
            id="vote"
            size={isHorizontal ? 'small' : 'medium'}
            label={t('hit.details.actions.vote')}
            value={selectedVote || 'no-vote'}
            onChange={e => vote(e.target.value)}
          >
            <MenuItem value="no-vote" sx={{ display: 'none' }}>
              {t('hit.details.actions.vote.novote')}
            </MenuItem>
            {VOTE_OPTIONS.map(action => (
              <MenuItem key={action.key} value={action.name.toLowerCase()}>
                {action.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default DropdownActions;
