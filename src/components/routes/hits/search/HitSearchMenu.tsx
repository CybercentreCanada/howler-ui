import { ArrowDropDown, AutoGraph, ErrorOutline, FilterList, Sort, Terminal } from '@mui/icons-material';
import { Badge, Divider, ListItemIcon, ListItemText, Stack, Theme, Tooltip, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';
import { HowlerSearchResponse } from 'api/search';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';

import { TuiIconButtonMenu } from 'commons/addons/display/buttons/TuiIconButtonMenu';
import useAppColor from 'commons/components/display/hooks/useAppColor';
import { HowlerHitSearchRequest } from 'components/routes/hits/search/HitSearch';
import { Hit } from 'models/entities/generated/Hit';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

type HitSearchMenuProps = {
  hasError: boolean;
  dropdownView: 'sort' | 'aggregate' | 'filter';
  request: HowlerHitSearchRequest;
  response: HowlerSearchResponse<Hit>;
  onSort: () => void;
  onAggregate: () => void;
  onFilter: () => void;
};

export const HitSearchMenu: FC<HitSearchMenuProps> = ({
  hasError,
  dropdownView,
  request,
  response,
  onSort,
  onAggregate,
  onFilter
}) => {
  const greyColor = useAppColor('grey', 200, 800);
  const medium = useMediaQuery((theme: Theme) => theme.breakpoints.down('xl'));
  const { t } = useTranslation();
  const navigate = useNavigate();

  return medium ? (
    <TuiIconButtonMenu
      items={[
        {
          key: 'hit.search.sort',
          sx: {
            backgroundColor: dropdownView === 'sort' && greyColor
          },
          onClick: onSort,
          children: [
            <ListItemIcon key="item.icon">
              <Sort />
            </ListItemIcon>,
            <ListItemText key="item.text">{t('hit.search.sort.button')}</ListItemText>
          ]
        },
        {
          key: 'hit.search.aggregate',
          sx: {
            backgroundColor: dropdownView === 'aggregate' && greyColor
          },
          onClick: onAggregate,
          children: [
            <ListItemIcon key="item.icon">
              <AutoGraph />
            </ListItemIcon>,
            <ListItemText key="item.text">{t('hit.search.aggregate.button')}</ListItemText>
          ]
        },
        {
          key: 'hit.search.filter',
          sx: {
            backgroundColor: dropdownView === 'filter' && greyColor
          },
          onClick: onFilter,
          children: (
            <Tooltip title={t('hit.search.filter.button')}>
              <Stack direction="row">
                <ListItemIcon>
                  <FilterList />
                </ListItemIcon>
                <ListItemText>{t('hit.search.filter.label')}</ListItemText>
              </Stack>
            </Tooltip>
          )
        }
      ]}
    >
      <ArrowDropDown />
    </TuiIconButtonMenu>
  ) : (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Badge
        color="primary"
        invisible={request.sort === 'event.created desc'}
        variant="dot"
        sx={theme => ({
          '& .MuiBadge-badge': { right: theme.spacing(1), top: theme.spacing(1) },
          cursor: 'pointer'
        })}
        onClick={onSort}
      >
        <TuiIconButton
          tooltip={t('hit.search.sort.button')}
          disabled={hasError}
          transparent={dropdownView !== 'sort'}
          color={grey[500]}
          onClick={onSort}
        >
          <Sort />
        </TuiIconButton>
      </Badge>
      <TuiIconButton
        tooltip={t('hit.search.aggregate.button')}
        disabled={hasError || response?.total < 2}
        transparent={dropdownView !== 'aggregate'}
        color={grey[500]}
        onClick={onAggregate}
      >
        <AutoGraph />
      </TuiIconButton>
      <Badge
        color="primary"
        invisible={!(request.filters?.length > 0)}
        variant="dot"
        sx={theme => ({
          '& .MuiBadge-badge': { right: theme.spacing(1), top: theme.spacing(1) },
          cursor: 'pointer'
        })}
        onClick={onFilter}
      >
        <TuiIconButton
          tooltip={t('hit.search.filter.button')}
          transparent={dropdownView !== 'filter'}
          color={grey[500]}
        >
          <FilterList />
        </TuiIconButton>
      </Badge>
      <TuiIconButton
        tooltip={t('hit.search.action.button')}
        transparent
        color={grey[500]}
        disabled={!request?.query}
        onClick={() => navigate(`/action/execute?query=${encodeURIComponent(request.query)}`)}
      >
        <Terminal />
      </TuiIconButton>
      {hasError && (
        <>
          <Divider orientation="vertical" flexItem />
          <Tooltip title={t('hit.search.invalid')} sx={{ ml: 2 }}>
            <ErrorOutline color="error" />
          </Tooltip>
        </>
      )}
    </Stack>
  );
};
