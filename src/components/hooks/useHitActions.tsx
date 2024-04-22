import api from 'api';
import { HitTransitionBody } from 'api/hit';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import AssignUserDrawer from 'components/app/drawers/AssignUserDrawer';
import useAppDrawer from 'components/app/hooks/useAppDrawer';
import RationaleModal from 'components/elements/display/modals/RationaleModal';
import { ActionButton } from 'components/elements/hit/actions/SharedComponents';
import { HowlerUser } from 'models/entities/HowlerUser';
import { Hit } from 'models/entities/generated/Hit';
import { Howler } from 'models/entities/generated/Howler';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageKey } from 'utils/constants';
import useMyApi from './useMyApi';
import useMyApiConfig from './useMyApiConfig';
import { useMyLocalStorageProvider } from './useMyLocalStorage';
import useMyModal from './useMyModal';
import useMySnackbar from './useMySnackbar';

export const MANAGE_OPTIONS: ActionButton[] = [
  { name: 'release', key: 'R' },
  { name: 'assign_to_other', key: 'T' },
  { name: 'start', key: 'Y' },
  { name: 'pause', key: 'U' },
  { name: 'resume', key: 'I' },
  { name: 'assign_to_me', key: 'O' },
  { name: 're_evaluate', key: 'P' },
  { name: 'demote', key: '-' },
  { name: 'promote', key: '+' }
];

type TransitionStates = 'in-progress' | 'on-hold' | 'open' | 'resolved';

export default function useHitActions(hit: Hit, setHit?: (newHit: Hit) => void) {
  const { t } = useTranslation();
  const config = useMyApiConfig();
  const { user } = useAppUser<HowlerUser>();
  const drawer = useAppDrawer();
  const { showModal } = useMyModal();
  const { showWarningMessage } = useMySnackbar();
  const { values } = useMyLocalStorageProvider();
  const { dispatchApi } = useMyApi();

  const [loading, setLoading] = useState(false);

  const availableTransitions = useMemo(
    () =>
      MANAGE_OPTIONS.filter(option => {
        const name = option.name.toLowerCase();

        // Is this option one that is valid for the current state?
        return (
          config.config.lookups?.transitions[hit?.howler.status as TransitionStates]?.includes(name) &&
          // If we are assigning or voting, the hit can't be assigned to the current user
          ((name !== 'assign_to_me' && name !== 'vote') || hit?.howler.assignment !== user.username) &&
          // If we are running any of these actions, the current user must be assigned the hit
          ((name !== 'release' && name !== 'start' && name !== 'resume' && name !== 'pause') ||
            hit?.howler.assignment === user.username) &&
          // If we're promoting, it has to be a hit
          (name !== 'promote' || hit?.howler.escalation === 'hit') &&
          // If we're demoting, it has to be an alert
          (name !== 'demote' || hit?.howler.escalation === 'alert')
        );
      }),
    [
      config.config.lookups?.transitions,
      hit?.howler.assignment,
      hit?.howler.escalation,
      hit?.howler.status,
      user.username
    ]
  );


  const canVote = useMemo(
    () => hit?.howler.assignment !== user.username || hit?.howler.status === 'in-progress',
    [hit?.howler.assignment, hit?.howler.status, user.username]
  );
  const canAssess = useMemo(
    () => !(['on-hold', 'resolved'].includes(hit?.howler.status) && hit?.howler.assignment === user.username),
    [hit?.howler.assignment, hit?.howler.status, user.username]
  );

  const selectedVote = useMemo(
    () =>
      hit?.howler.votes.benign.includes(user.email)
        ? 'benign'
        : hit?.howler.votes.malicious.includes(user.email)
        ? 'malicious'
        : hit?.howler.votes.obscure.includes(user.email)
        ? 'obscure'
        : '',
    [hit?.howler.votes.benign, hit?.howler.votes.malicious, hit?.howler.votes.obscure, user.email]
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
              howler={hit?.howler}
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
    [drawer, hit]
  );

  const vote = useCallback(
    async (v: string) => {
      if (v !== selectedVote) {
        setLoading(true);

        try {
          const _vote = () =>
            api.hit.transition.post(hit?.howler.id, { transition: 'vote', data: { vote: v, email: user.email } });

          const updatedHit: Hit = await dispatchApi(_vote(), {
            onConflict: async () => {
              await api.hit.get(hit?.howler.id);
              setHit?.(await _vote());
            }
          });

          if (updatedHit) {
            setHit?.(updatedHit);
          }
        } finally {
          setLoading(false);
        }
      }
    },
    [dispatchApi, hit, selectedVote, setHit, user.email]
  );


  const assess = useCallback(
    async (assessment: string) => {
      if (assessment !== hit?.howler.assessment) {
        const rationale = await new Promise<string>(res => {
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
            api.hit.transition.post(hit?.howler.id, { transition: 'assess', data: { assessment, rationale } });

          const updatedHit = await dispatchApi(update(), {
            onConflict: async () => {
              const updatedData = await api.hit.get(hit?.howler.id);

              if (!updatedData.howler.assessment) {
                setHit?.(await update());
              } else {
                setHit?.(updatedData);
                showWarningMessage(t('hit.actions.conflict.assess'));
              }
            }
          });

          if (updatedHit && setHit) {
            setHit(updatedHit);
          }
        } finally {
          setLoading(false);
        }
      }
    },
    [dispatchApi, hit, setHit, showModal, showWarningMessage, t]
  );

  const manage = useCallback(
    async (transition: string) => {
      setLoading(true);
      try {
        const data: HitTransitionBody['data'] = {};

        if (transition === 'assign_to_other') {
          data.assignee = (await onAssign()).assignment;
        }

        const update = () => api.hit.transition.post(hit?.howler.id, { transition, data });
        const updatedHit = await dispatchApi(update(), {
          onConflict: async () => {
            const updatedData = await api.hit.get(hit?.howler.id);
            setHit?.(updatedData);
            showWarningMessage(t('hit.actions.conflict.manage'));
          }
        });

        if (updatedHit && setHit) {
          setHit(updatedHit);
        }
      } catch (e) {
        if (e !== 'unassigned') {
          throw e;
        }
      } finally {
        setLoading(false);
      }
    },
    [dispatchApi, hit, onAssign, setHit, showWarningMessage, t]
  );

  return {
    availableTransitions,
    canVote,
    canAssess,
    loading,
    manage,
    assess,
    vote,
    selectedVote,
  };
}
