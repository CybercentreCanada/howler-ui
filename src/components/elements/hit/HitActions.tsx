import { MoreHoriz } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Menu,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  useMediaQuery
} from '@mui/material';
import Throttler from 'commons/addons/utils/Throttler';
import useHitActions from 'components/hooks/useHitActions';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { useMyLocalStorageProvider } from 'components/hooks/useMyLocalStorage';
import json2mq from 'json2mq';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Trans } from 'react-i18next';
import { StorageKey } from 'utils/constants';
import { HitShortcuts } from './HitShortcuts';
import ButtonActions from './actions/ButtonActions';
import DropdownActions from './actions/DropdownActions';
import type { Keybinds } from './actions/SharedComponents';
import { ASSESSMENT_KEYBINDS, TOP_ROW, VOTE_OPTIONS } from './actions/SharedComponents';

const THROTTLER = new Throttler(250);
const HitActions: FC<{
  hit: Hit;
  setHit: (h: Hit) => void;
  orientation?: 'horizontal' | 'vertical';
}> = ({ hit, setHit, orientation = 'horizontal' }) => {
  const config = useMyApiConfig();
  const { values, set } = useMyLocalStorageProvider();

  const { availableTransitions, canVote, canAssess, loading, manage, assess, vote, selectedVote } = useHitActions(
    hit,
    setHit
  );

  const [openSetting, setOpenSetting] = useState<null | HTMLElement>(null);

  const shortcuts = useMemo(
    () =>
      isMobile
        ? HitShortcuts.NO_SHORTCUTS
        : ((values[StorageKey.HIT_SHORTCUTS] as HitShortcuts) ?? HitShortcuts.SHORTCUTS_HINT),
    [values]
  );

  const forceDropdown = useMemo(() => (values[StorageKey.FORCE_DROPDOWN] as boolean) ?? false, [values]);

  const customActions = useMemo<Keybinds>(
    () => ({
      ...(canVote &&
        VOTE_OPTIONS.reduce(
          (obj, option) => ({ ...obj, [option.key]: () => vote(option.name.toLowerCase()) }),
          {} as Keybinds
        )),
      ...(canAssess &&
        config.config.lookups?.['howler.assessment']
          ?.sort((a, b) => +TOP_ROW.includes(b) - +TOP_ROW.includes(a))
          .reduce(
            (obj, assessment, index) => ({
              ...obj,
              [ASSESSMENT_KEYBINDS[index]]: () => {
                if (!loading) {
                  assess(assessment);
                }
              }
            }),
            {} as Keybinds
          )),
      ...availableTransitions.reduce((obj, option) => {
        if (
          config.config.lookups.transitions[
            hit?.howler.status as 'in-progress' | 'on-hold' | 'open' | 'resolved'
          ].includes(option.name.toLowerCase())
        ) {
          obj[option.key] = () => {
            if (!loading) {
              manage(option.name.toLowerCase());
            }
          };
        }
        return obj;
      }, {} as Keybinds)
    }),
    [assess, availableTransitions, canAssess, canVote, config.config.lookups, hit?.howler.status, loading, manage, vote]
  );

  const keyboardDownHandler = useCallback(
    (event: KeyboardEvent) => {
      THROTTLER.debounce(() => {
        const currentElement = document.activeElement.tagName;
        if (
          shortcuts !== HitShortcuts.NO_SHORTCUTS &&
          event.key.toUpperCase() in customActions &&
          !event.ctrlKey &&
          currentElement !== 'INPUT'
        ) {
          customActions[event.key.toUpperCase()]();
        }
      });
    },
    [customActions, shortcuts]
  );

  useEffect(() => {
    if (!isMobile) {
      window.addEventListener('keydown', keyboardDownHandler);

      return () => window.removeEventListener('keydown', keyboardDownHandler);
    }
  }, [keyboardDownHandler]);

  const handleOpenSetting = useCallback((e: React.MouseEvent<HTMLElement>) => setOpenSetting(e.currentTarget), []);
  const handleCloseSetting = useCallback(() => setOpenSetting(null), []);
  const onShortcutChange = useCallback((__: any, s: HitShortcuts) => set(StorageKey.HIT_SHORTCUTS, s), [set]);
  const onDropdownChange = useCallback((__: any, checked: boolean) => set(StorageKey.FORCE_DROPDOWN, checked), [set]);

  const showButton = useMediaQuery(
    // Only show the buttons when there's sufficient space
    // TODO: Could probably make this fancier and maybe remove the react device detect dependency, but this is fine for now
    json2mq([
      {
        minWidth: 1800
      }
    ])
  );

  const showDropdown = isMobile || !showButton;

  const actions =
    showDropdown || forceDropdown ? (
      <DropdownActions
        availableTransitions={availableTransitions}
        canAssess={canAssess}
        canVote={canVote}
        currentAssessment={hit?.howler.assessment}
        currentStatus={hit?.howler.status}
        customActions={customActions}
        loading={loading}
        orientation={orientation}
        selectedVote={selectedVote}
        vote={vote}
      />
    ) : (
      <ButtonActions
        availableTransitions={availableTransitions}
        canAssess={canAssess}
        canVote={canVote}
        customActions={customActions}
        loading={loading}
        orientation={orientation}
        selectedVote={selectedVote}
        shortcuts={shortcuts}
        vote={vote}
      />
    );

  return (
    <Stack direction="row" alignItems="stretch" sx={{ position: 'relative' }}>
      {actions}
      {(!showDropdown || !isMobile) && (
        <Box
          sx={[
            {
              flex: 1,
              alignSelf: 'start',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              p: 1
            },
            (showDropdown || forceDropdown) && { flexDirection: 'column-reverse', justifyContent: 'center' },
            !showDropdown &&
              !forceDropdown && {
                position: 'absolute',
                top: 0,
                right: 0
              }
          ]}
        >
          <CircularProgress
            size={24}
            sx={theme => ({
              // Sneaky trick: +true === 1, +false === 0. Love you, javascript <3
              opacity: +loading,
              transition: `${theme.transitions.duration.standard}ms`
            })}
          />
          {!showDropdown && (
            <IconButton size="small" onClick={handleOpenSetting}>
              <MoreHoriz />
            </IconButton>
          )}
          <Menu
            anchorEl={openSetting}
            open={!!openSetting}
            onClose={handleCloseSetting}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                '& ul': {
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }
              }
            }}
          >
            <Stack spacing={1} divider={<Divider orientation="horizontal" />}>
              <FormControl>
                <FormLabel>
                  <Trans i18nKey="hit.details.shortcuts" />
                </FormLabel>
                <RadioGroup value={shortcuts} name="radio-buttons-group" onChange={onShortcutChange}>
                  <FormControlLabel
                    value={HitShortcuts.SHORTCUTS_HINT}
                    control={<Radio />}
                    label={<Trans i18nKey="hit.search.keyboard.shortcuts_hints" />}
                  />
                  <FormControlLabel
                    value={HitShortcuts.SHORTCUTS}
                    control={<Radio />}
                    label={<Trans i18nKey="hit.search.keyboard.shortcuts" />}
                  />
                  <FormControlLabel
                    value={HitShortcuts.NO_SHORTCUTS}
                    control={<Radio />}
                    label={<Trans i18nKey="hit.search.keyboard.no_shortcuts" />}
                  />
                </RadioGroup>
              </FormControl>
              <FormControl sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <FormLabel sx={{ mr: 1 }}>
                  <Trans i18nKey="hit.details.forceDropdown" />
                </FormLabel>
                <Switch checked={forceDropdown} onChange={onDropdownChange} />
              </FormControl>
            </Stack>
          </Menu>
        </Box>
      )}
    </Stack>
  );
};

export default memo(HitActions);
