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
import api from 'api';
import { HitTransitionBody } from 'api/hit';
import Throttler from 'commons/addons/utils/Throttler';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import AssignUserDrawer from 'components/app/drawers/AssignUserDrawer';
import useAppDrawer from 'components/app/hooks/useAppDrawer';
import useMyApi from 'components/hooks/useMyApi';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { useMyLocalStorageProvider } from 'components/hooks/useMyLocalStorage';
import useMyModal from 'components/hooks/useMyModal';
import useMySnackbar from 'components/hooks/useMySnackbar';
import json2mq from 'json2mq';
import { Howler } from 'models/entities/generated/Howler';
import { HowlerUser } from 'models/entities/HowlerUser';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Trans, useTranslation } from 'react-i18next';
import { StorageKey } from 'utils/constants';
import RationaleModal from '../display/modals/RationaleModal';
import ButtonActions from './actions/ButtonActions';
import DropdownActions from './actions/DropdownActions';
import { ASSESSMENT_KEYBINDS, Keybinds, MANAGE_OPTIONS, TOP_ROW, VOTE_OPTIONS } from './actions/SharedComponents';
import { HitShortcuts } from './HitShortcuts';

type TransitionStates = 'in-progress' | 'on-hold' | 'open' | 'resolved';
const THROTTLER = new Throttler(250);
const HitActions: FC<{
  howler: Howler;
  setHowler: (h: Howler) => void;
  orientation?: 'horizontal' | 'vertical';
}> = ({ howler, setHowler, orientation = 'horizontal' }) => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { user } = useAppUser<HowlerUser>();
  const config = useMyApiConfig();
  const { values, set } = useMyLocalStorageProvider();
  const drawer = useAppDrawer();
  const { showModal } = useMyModal();
  const { showWarningMessage } = useMySnackbar();

  const [openSetting, setOpenSetting] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const canVote = useMemo(
    () => howler.assignment !== user.username || howler.status === 'in-progress',
    [howler.assignment, howler.status, user.username]
  );
  const canAssess = useMemo(
    () => !(['on-hold', 'resolved'].includes(howler.status) && howler.assignment === user.username),
    [howler.assignment, howler.status, user.username]
  );

  const shortcuts = useMemo(
    () =>
      isMobile
        ? HitShortcuts.NO_SHORTCUTS
        : (values[StorageKey.HIT_SHORTCUTS] as HitShortcuts) ?? HitShortcuts.SHORTCUTS_HINT,
    [values]
  );
  const forceDropdown = useMemo(() => (values[StorageKey.FORCE_DROPDOWN] as boolean) ?? false, [values]);

  const selectedVote = useMemo(
    () =>
      howler.votes.benign.includes(user.email)
        ? 'benign'
        : howler.votes.malicious.includes(user.email)
        ? 'malicious'
        : howler.votes.obscure.includes(user.email)
        ? 'obscure'
        : '',
    [howler.votes.benign, howler.votes.malicious, howler.votes.obscure, user.email]
  );

  const onAssign = useCallback(
    () =>
      new Promise<Howler>((res, rej) => {
        let done = false;

        drawer.open({
          titleKey: 'hit.details.actions.assign',
          children: (
            <AssignUserDrawer
              skipSubmit
              howler={howler}
              onAssigned={h => {
                done = true;
                drawer.close();
                res(h);
              }}
            />
          ),
          onClosed: () => {
            if (!done) {
              rej('unassigned');
            }
          }
        });
      }),
    [drawer, howler]
  );

  const vote = useCallback(
    async (v: string) => {
      if (v !== selectedVote) {
        setLoading(true);

        try {
          const _vote = () =>
            api.hit.transition.post(howler.id, { transition: 'vote', data: { vote: v, email: user.email } });

          const updatedHit = await dispatchApi(_vote(), {
            onConflict: async () => {
              await api.hit.get(howler.id);
              setHowler((await _vote()).howler);
            }
          });

          if (updatedHit) {
            setHowler({ ...howler, ...updatedHit.howler });
          }
        } finally {
          setLoading(false);
        }
      }
    },
    [dispatchApi, howler, selectedVote, setHowler, user.email]
  );

  const assess = useCallback(
    async (assessment: string) => {
      if (assessment !== howler.assessment) {
        const rationale = await new Promise<string>((res, rej) => {
          showModal(
            <RationaleModal
              onSubmit={_rationale => {
                res(_rationale);
              }}
            />
          );
        });

        setLoading(true);

        try {
          const update = () =>
            api.hit.transition.post(howler.id, { transition: 'assess', data: { assessment, rationale } });

          const updatedHit = await dispatchApi(update(), {
            onConflict: async () => {
              const updatedData = await api.hit.get(howler.id);

              if (!updatedData.howler.assessment) {
                setHowler((await update()).howler);
              } else {
                setHowler(updatedData.howler);
                showWarningMessage(t('hit.actions.conflict.assess'));
              }
            }
          });

          if (updatedHit) {
            setHowler({ ...howler, ...updatedHit.howler });
          }
        } finally {
          setLoading(false);
        }
      }
    },
    [dispatchApi, howler, setHowler, showModal, showWarningMessage, t]
  );

  const manage = useCallback(
    async (transition: string) => {
      setLoading(true);
      try {
        const data: HitTransitionBody['data'] = {};

        if (transition === 'assign_to_other') {
          data.assignee = (await onAssign()).assignment;
        }

        const update = () => api.hit.transition.post(howler.id, { transition, data });
        const updatedHit = await dispatchApi(update(), {
          onConflict: async () => {
            const updatedData = await api.hit.get(howler.id);
            setHowler(updatedData.howler);
            showWarningMessage(t('hit.actions.conflict.manage'));
          }
        });

        if (updatedHit) {
          setHowler({ ...howler, ...updatedHit.howler });
        }
      } catch (e) {
        if (e !== 'unassigned') {
          throw e;
        }
      } finally {
        setLoading(false);
      }
    },
    [dispatchApi, howler, onAssign, setHowler, showWarningMessage, t]
  );

  const availableTransitions = useMemo(
    () =>
      MANAGE_OPTIONS.filter(option => {
        const name = option.name.toLowerCase();

        // Is this option one that is valid for the current state?
        return (
          config.config.lookups?.transitions[howler.status as TransitionStates].includes(name) &&
          // If we are assigning or voting, the hit can't be assigned to the current user
          ((name !== 'assign_to_me' && name !== 'vote') || howler.assignment !== user.username) &&
          // If we are running any of these actions, the current user must be assigned the hit
          ((name !== 'release' && name !== 'start' && name !== 'resume' && name !== 'pause') ||
            howler.assignment === user.username) &&
          // If we're promoting, it has to be a hit
          (name !== 'promote' || howler.escalation === 'hit') &&
          // If we're demoting, it has to be an alert
          (name !== 'demote' || howler.escalation === 'alert')
        );
      }),
    [config.config.lookups?.transitions, howler.assignment, howler.escalation, howler.status, user.username]
  );

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
          config.config.lookups.transitions[howler.status as 'in-progress' | 'on-hold' | 'open' | 'resolved'].includes(
            option.name.toLowerCase()
          )
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
    [assess, availableTransitions, canAssess, canVote, config.config.lookups, howler.status, loading, manage, vote]
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
  const onShortcutChange = useCallback((e, s: HitShortcuts) => set(StorageKey.HIT_SHORTCUTS, s), [set]);
  const onDropdownChange = useCallback((e, checked: boolean) => set(StorageKey.FORCE_DROPDOWN, checked), [set]);

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
        currentAssessment={howler.assessment}
        currentStatus={howler.status}
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
