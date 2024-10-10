import {
  Assignment,
  Check,
  Edit,
  HowToVote,
  KeyboardArrowRight,
  OpenInNew,
  QueryStats,
  SettingsSuggest
} from '@mui/icons-material';
import { Box, Divider, Fade, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper } from '@mui/material';
import api from 'api';
import useTuiListItems from 'commons/addons/lists/hooks/useTuiListItems';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import { AnalyticContext } from 'components/app/providers/AnalyticProvider';
import { VOTE_OPTIONS } from 'components/elements/hit/actions/SharedComponents';
import useHitActions from 'components/hooks/useHitActions';
import useMyApi from 'components/hooks/useMyApi';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import useMyActionFunctions from 'components/routes/action/useMyActionFunctions';
import { t } from 'i18next';
import type { Action } from 'models/entities/generated/Action';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC, MouseEventHandler, PropsWithChildren } from 'react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: Eventually make this more generic

const HitContextMenu: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const analyticContext = useContext(AnalyticContext);
  const { dispatchApi } = useMyApi();
  const { executeAction } = useMyActionFunctions();
  const { replaceById } = useTuiListMethods<Hit>();
  const { items } = useTuiListItems<Hit>();
  const { config } = useMyApiConfig();

  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [clickLocation, setClickLocation] = useState<[number, number]>([-1, -1]);
  const [hitId, setHitId] = useState<string>(null);
  const [analyticId, setAnalyticId] = useState<string>(null);
  const [actions, setActions] = useState<Action[]>([]);

  const [showAction, setShowAction] = useState(false);
  const [showAssess, setShowAssess] = useState(false);
  const [showVote, setShowVote] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const hitItem = useMemo(() => items.find(item => item.id === hitId), [hitId, items]);

  const { availableTransitions, canVote, canAssess, manage, assess, vote, selectedVote } = useHitActions(
    hitItem?.item,
    newHit => replaceById(hitItem, { ...hitItem, item: newHit })
  );

  const onContextMenu: MouseEventHandler<HTMLDivElement> = useCallback(
    async event => {
      if (anchorEl) {
        event.preventDefault();
        setAnchorEl(null);
        return;
      }

      const target = event.target as HTMLElement;
      const selectedElement = target.closest('[data-tuilist-id]') as HTMLElement;

      if (!selectedElement) {
        return;
      }

      const _hitId = selectedElement.dataset?.tuilistId;

      if (!_hitId) {
        return;
      }

      const clientRect = target.getBoundingClientRect();
      setClickLocation([event.clientX - clientRect.x, event.clientY - clientRect.y]);

      setAnchorEl(target);

      event.preventDefault();
      // Set the If-Match header
      await dispatchApi(api.hit.get(_hitId));

      setHitId(_hitId);

      const analyticName = items.find(item => item.id === _hitId)?.item?.howler.analytic;
      if (analyticName) {
        const _analyticId = await analyticContext.getIdFromName(analyticName);
        setAnalyticId(_analyticId);
      }

      const _actions = (await dispatchApi(api.search.action.post({ query: 'action_id:*' }), { throwError: false }))
        ?.items;

      if (_actions) {
        setActions(_actions);
      }
    },
    [analyticContext, anchorEl, dispatchApi, items]
  );

  useEffect(() => {
    if (!anchorEl) {
      setHitId(null);
      setClickLocation([-1, -1]);
      setShowAction(false);
      setShowAssess(false);
      setShowVote(false);
      setShowManage(false);
      setAnalyticId(null);
    }
  }, [anchorEl]);

  return (
    <Box id="contextMenu" onContextMenu={onContextMenu}>
      {children}
      <Menu
        id="hit-menu"
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              transform: `translate(${clickLocation[0]}px, ${clickLocation[1]}px) !important`,
              overflow: 'visible !important'
            }
          }
        }}
        MenuListProps={{ dense: true, sx: { minWidth: '250px' } }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => navigate(`/hits/${hitId}`)}>
          <ListItemIcon>
            <OpenInNew />
          </ListItemIcon>
          <ListItemText>{t('hit.panel.open')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => navigate(`/analytics/${analyticId}`)} disabled={!analyticId}>
          <ListItemIcon>
            <QueryStats />
          </ListItemIcon>
          <ListItemText>{t('hit.panel.analytic.open')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowAssess(true)}
          onMouseLeave={() => setShowAssess(false)}
          disabled={!canAssess}
        >
          <ListItemIcon>
            <Assignment />
          </ListItemIcon>
          <ListItemText sx={{ flex: 1 }}>{t('hit.details.actions.assess')}</ListItemText>
          {canAssess && <KeyboardArrowRight fontSize="small" sx={{ color: 'text.secondary', mr: -1 }} />}
          <Fade in={showAssess} unmountOnExit>
            <Paper
              sx={{ position: 'absolute', top: 0, left: '100%', maxHeight: '300px', overflow: 'auto' }}
              elevation={8}
            >
              <MenuList sx={{ p: 0, borderTopLeftRadius: 0 }} dense>
                {config.lookups['howler.assessment'].map(a => (
                  <MenuItem
                    value={a}
                    onClick={() => {
                      setAnchorEl(null);
                      assess(a);
                    }}
                    key={a}
                  >
                    {a.replace(/^[a-z]/, val => val.toUpperCase())}
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Fade>
        </MenuItem>
        <MenuItem
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowVote(true)}
          onMouseLeave={() => setShowVote(false)}
          disabled={!canVote}
        >
          <ListItemIcon>
            <HowToVote />
          </ListItemIcon>
          <ListItemText sx={{ flex: 1 }}>{t('hit.details.actions.vote')}</ListItemText>
          {canVote && <KeyboardArrowRight fontSize="small" sx={{ color: 'text.secondary', mr: -1 }} />}
          <Fade in={showVote} unmountOnExit>
            <Paper
              sx={{ position: 'absolute', top: 0, left: '100%', maxHeight: '300px', overflow: 'auto' }}
              elevation={8}
            >
              <MenuList sx={{ p: 0, borderTopLeftRadius: 0, minWidth: '150px' }} dense>
                {VOTE_OPTIONS.map(v => (
                  <MenuItem
                    value={v.name}
                    onClick={() => {
                      setAnchorEl(null);
                      vote(v.name.toLowerCase());
                    }}
                    key={v.name}
                  >
                    <ListItemText>{v.name}</ListItemText>
                    {selectedVote === v.name.toLowerCase() && <Check fontSize="small" />}
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Fade>
        </MenuItem>
        <MenuItem
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowManage(true)}
          onMouseLeave={() => setShowManage(false)}
        >
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText sx={{ flex: 1 }}>{t('hit.details.actions.transition')}</ListItemText>
          <KeyboardArrowRight fontSize="small" sx={{ color: 'text.secondary', mr: -1 }} />
          <Fade in={showManage} unmountOnExit>
            <Paper
              sx={{ position: 'absolute', top: 0, left: '100%', maxHeight: '300px', overflow: 'auto' }}
              elevation={8}
            >
              <MenuList sx={{ p: 0, borderTopLeftRadius: 0, minWidth: '150px' }} dense>
                {availableTransitions.map(transition => (
                  <MenuItem
                    value={transition.name}
                    onClick={() => {
                      setAnchorEl(null);
                      manage(transition.name.toLowerCase());
                    }}
                    key={transition.name}
                  >
                    <ListItemText>{t(`hit.details.actions.transition.${transition.name}`)}</ListItemText>
                    {selectedVote === transition.name.toLowerCase() && <Check fontSize="small" />}
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Fade>
        </MenuItem>
        <MenuItem
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowAction(true)}
          onMouseLeave={() => setShowAction(false)}
          disabled={actions.length < 1}
        >
          <ListItemIcon>
            <SettingsSuggest />
          </ListItemIcon>
          <ListItemText sx={{ flex: 1 }}>{t('route.actions.change')}</ListItemText>
          {actions.length > 0 && <KeyboardArrowRight fontSize="small" sx={{ color: 'text.secondary', mr: -1 }} />}
          <Fade in={showAction} unmountOnExit>
            <Paper
              sx={{ position: 'absolute', top: 0, left: '100%', maxHeight: '300px', overflow: 'auto' }}
              elevation={8}
            >
              <MenuList sx={{ p: 0 }} dense>
                {actions.map(action => (
                  <MenuItem
                    key={action.action_id}
                    onClick={() => executeAction(action.action_id, `howler.id:${hitId}`)}
                  >
                    <ListItemText>{action.name}</ListItemText>
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Fade>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default HitContextMenu;
