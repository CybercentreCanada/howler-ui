import {
  avatarClasses,
  AvatarGroup,
  Box,
  Chip,
  Divider,
  iconButtonClasses,
  Stack,
  styled,
  Tooltip,
  Typography
} from '@mui/material';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import { AnalyticContext } from 'components/app/providers/AnalyticProvider';
import { ApiConfigContext } from 'components/app/providers/ApiConfigProvider';
import { RecievedDataType, SocketContext } from 'components/app/providers/SocketProvider';
import { uniqueId } from 'lodash';
import { Hit } from 'models/entities/generated/Hit';
import { HowlerUser } from 'models/entities/HowlerUser';
import { HitUpdate } from 'models/socket/HitUpdate';
import { FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ReactElement } from 'react-markdown/lib/react-markdown';
import { Link } from 'react-router-dom';
import { ESCALATION_COLORS, PROVIDER_COLORS } from 'utils/constants';
import { stringToColor } from 'utils/utils';
import HowlerAvatar from '../display/HowlerAvatar';
import HitHeaderTooltip from './HitHeaderTooltip';
import { HitLayout } from './HitLayout';
import HitTimestamp from './HitTimestamp';

const CustomStack = styled(Stack)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(1)
}));

type HitHeaderProps = {
  hit: Hit;
  layout?: HitLayout;
  showAssigned?: boolean;
  useListener?: boolean;
};

const HitHeader: FC<HitHeaderProps> = ({
  hit: hitData,
  layout = HitLayout.NORMAL,
  showAssigned = true,
  useListener = false
}) => {
  const { t } = useTranslation();
  const { user } = useAppUser<HowlerUser>();
  const { config } = useContext(ApiConfigContext);
  const { addListener, removeListener } = useContext(SocketContext);
  const { getIdFromName } = useContext(AnalyticContext);

  const [analyticId, setAnalyticId] = useState<string>();

  const compressed = useMemo(() => layout === HitLayout.DENSE, [layout]);
  const textVariant = useMemo(() => (layout === HitLayout.COMFY ? 'body1' : 'caption'), [layout]);

  const [hit, setHit] = useState(hitData);
  useEffect(() => {
    setHit(hitData);
    getIdFromName(hitData.howler?.analytic).then(setAnalyticId);
  }, [getIdFromName, hitData]);

  const handler = useCallback(
    (data: RecievedDataType<HitUpdate>) => {
      // We compare against the ID we're getting from where this is rendered.
      // This circumvents a bug where switching between bundles wouldn't actually change the hit header
      if (data.hit?.howler.id === hitData?.howler.id) {
        setHit(data.hit);
      }
    },
    [hitData?.howler.id]
  );

  useEffect(() => {
    if (!hit || !useListener) {
      return;
    }

    const _id = uniqueId();
    addListener<HitUpdate>(_id, handler);

    return () => removeListener(_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, hit?.howler?.id]);

  const providerColor = useMemo(
    () => PROVIDER_COLORS[hit.event?.provider ?? 'unknown'] ?? stringToColor(hit.event.provider),
    [hit.event?.provider]
  );

  const mitreId = useMemo(() => {
    if (hit.threat?.framework?.toLowerCase().startsWith('mitre')) {
      return;
    }

    let _id = hit.threat?.tactic?.id;
    if (_id && config.lookups.icons.includes(_id)) {
      return _id;
    }

    _id = hit.threat?.technique?.id;
    if (_id && config.lookups.icons.includes(_id)) {
      return _id;
    }
  }, [config.lookups.icons, hit.threat?.framework, hit.threat?.tactic?.id, hit.threat?.technique?.id]);

  const iconUrl = useMemo(() => {
    if (!mitreId) {
      return;
    }

    return `/api/static/mitre/${mitreId}.svg`;
  }, [mitreId]);

  const leftBox = useMemo(() => {
    if (hit.howler.is_bundle) {
      return (
        <Box
          sx={theme => ({
            alignSelf: 'stretch',
            backgroundColor: providerColor,
            borderRadius: theme.shape.borderRadius,
            minWidth: '15px'
          })}
        />
      );
    } else {
      return (
        <HitHeaderTooltip hit={hit}>
          <Box
            sx={theme => ({
              gridColumn: { xs: 'span 3', sm: 'span 1' },
              minWidth: '90px',
              backgroundColor: providerColor,
              color: theme.palette.getContrastText(providerColor),
              alignSelf: 'start',
              borderRadius: theme.shape.borderRadius,
              p: compressed ? 0.5 : 1,
              pt: 2,
              pl: 1
            })}
            display="flex"
            flexDirection="column"
          >
            <Typography variant={compressed ? 'caption' : 'body1'} style={{ wordBreak: 'break-all' }}>
              {hit.organization?.name ?? <Trans i18nKey="unknown" />}
            </Typography>
            {iconUrl && (
              <Box
                sx={theme => ({
                  width: '40px',
                  height: '40px',
                  mask: `url("${iconUrl}")`,
                  maskSize: 'cover',
                  background: theme.palette.getContrastText(providerColor)
                })}
              />
            )}
          </Box>
        </HitHeaderTooltip>
      );
    }
  }, [compressed, hit, iconUrl, providerColor]);

  /**
   * The tooltips are necessary only when in the most compressed format
   */
  const Wrapper: FC<{ title: ReactNode; children: ReactElement }> = useCallback(
    ({ title, children }) => (compressed ? <Tooltip title={title}>{children}</Tooltip> : children),
    [compressed]
  );

  return (
    <Box
      display="grid"
      gridTemplateColumns="minmax(0, auto) minmax(0, 1fr) minmax(0, auto)"
      alignItems="stretch"
      sx={{ width: '100%', ml: 0, overflow: 'hidden' }}
    >
      {leftBox}
      <CustomStack
        sx={{ gridColumn: { xs: 'span 3', sm: 'span 1', md: 'span 1' } }}
        spacing={layout !== HitLayout.COMFY ? 1 : 2}
        divider={
          <Divider
            orientation="horizontal"
            sx={[
              layout !== HitLayout.COMFY && { marginTop: '4px !important' },
              theme => ({ mr: `${theme.spacing(-1)} !important` })
            ]}
          />
        }
      >
        <Typography
          variant={compressed ? 'body1' : 'h6'}
          fontWeight={compressed && 'bold'}
          sx={{ '& a': { color: 'text.primary' } }}
        >
          {analyticId ? (
            <Link to={`/analytics/${analyticId}`} onClick={e => e.stopPropagation()}>
              {hit.howler.analytic}
            </Link>
          ) : (
            hit.howler.analytic
          )}
          {hit.howler.detection && ': '}
          {hit.howler.detection}
        </Typography>
        {hit.howler?.rationale && (
          <Typography
            flex={1}
            variant={textVariant}
            noWrap={compressed}
            textOverflow={compressed ? 'ellipsis' : 'wrap'}
            color={ESCALATION_COLORS[hit.howler.escalation] + '.main'}
            sx={{ wordBreak: 'break-all', fontWeight: 'bold' }}
          >
            {t('hit.header.rationale')}: {hit.howler.rationale}
          </Typography>
        )}
        {hit.howler?.outline && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={layout !== HitLayout.COMFY ? 1 : 2}>
              <Wrapper title={hit.howler.outline.threat}>
                <Typography
                  flex={1}
                  variant={textVariant}
                  noWrap={compressed}
                  textOverflow={compressed ? 'ellipsis' : 'wrap'}
                  sx={{ wordBreak: 'break-all' }}
                >
                  {t('hit.header.threat')}: {hit.howler.outline.threat}
                </Typography>
              </Wrapper>
              <Wrapper title={hit.howler.outline.target}>
                <Typography
                  flex={1}
                  variant={textVariant}
                  noWrap={compressed}
                  textOverflow={compressed ? 'ellipsis' : 'wrap'}
                  sx={{ wordBreak: 'break-all' }}
                >
                  <Trans i18nKey="hit.header.target" />: {hit.howler.outline.target}
                </Typography>
              </Wrapper>
            </Stack>
            <Wrapper
              title={
                <div>
                  {hit.howler.outline.indicators.map(i => (
                    <p key={i} style={{ margin: 0, padding: 0 }}>
                      {i}
                    </p>
                  ))}
                </div>
              }
            >
              <Typography
                paragraph
                variant={textVariant}
                noWrap={compressed}
                textOverflow={compressed ? 'ellipsis' : 'wrap'}
                sx={[compressed && { marginTop: `0 !important` }]}
              >
                {t('hit.header.indicators')}: {hit.howler.outline.indicators.map(i => i).join(', ')}
              </Typography>
            </Wrapper>
            <Wrapper title={hit.howler.outline.summary}>
              <Typography
                paragraph
                variant={textVariant}
                noWrap={compressed}
                textOverflow="wrap"
                sx={[compressed && { marginTop: `0 !important` }]}
              >
                <Trans i18nKey="hit.header.summary" />
                {hit.howler.outline.summary}
              </Typography>
            </Wrapper>
          </>
        )}
      </CustomStack>
      <Stack
        direction="column"
        spacing={layout !== HitLayout.COMFY ? 0.5 : 1}
        alignSelf="stretch"
        sx={[
          { minWidth: 0, alignItems: { sm: 'end', md: 'start' }, flex: 1, pl: 1 },
          compressed &&
            (theme => ({
              [`& .${avatarClasses.root}`]: {
                height: theme.spacing(3),
                width: theme.spacing(3)
              },
              [`& .${iconButtonClasses.root}`]: {
                height: theme.spacing(3),
                width: theme.spacing(3)
              }
            }))
        ]}
      >
        <HitTimestamp hit={hit} layout={layout} />
        {showAssigned && (
          <Stack direction="row" spacing={0.5}>
            <Chip
              sx={{
                width: 'fit-content',
                '& .MuiChip-icon': {
                  marginLeft: 0
                }
              }}
              icon={
                <HowlerAvatar
                  userId={hit.howler.assignment}
                  sx={{ height: layout !== HitLayout.COMFY ? 24 : 32, width: layout !== HitLayout.COMFY ? 24 : 32 }}
                />
              }
              label={
                hit?.howler.assignment !== 'unassigned'
                  ? hit?.howler.assignment
                  : t('app.drawer.hit.assignment.unassigned.name')
              }
              size={layout !== HitLayout.COMFY ? 'small' : 'medium'}
            />
            <AvatarGroup
              max={3}
              sx={{ [`.${avatarClasses.root}`]: { border: 0, marginLeft: 0.5 } }}
              componentsProps={{
                additionalAvatar: {
                  sx: {
                    height: layout !== HitLayout.COMFY ? 24 : 32,
                    width: layout !== HitLayout.COMFY ? 24 : 32,
                    fontSize: '12px'
                  }
                }
              }}
            >
              {[...new Set(hit?.howler.viewers)]
                .filter(viewer => viewer !== user.username)
                .map(viewer => (
                  <HowlerAvatar
                    key={viewer}
                    userId={viewer}
                    sx={{ height: layout !== HitLayout.COMFY ? 24 : 32, width: layout !== HitLayout.COMFY ? 24 : 32 }}
                  />
                ))}
            </AvatarGroup>
          </Stack>
        )}
        <Stack direction="row" spacing={layout !== HitLayout.COMFY ? 0.5 : 1}>
          <Chip
            sx={{ width: 'fit-content', display: 'inline-flex' }}
            label={['evidence', 'miss'].includes(hit.howler.escalation) ? hit.howler.assessment : hit.howler.escalation}
            size={layout !== HitLayout.COMFY ? 'small' : 'medium'}
            color={ESCALATION_COLORS[hit.howler.escalation]}
          />
          {['in-progress', 'on-hold'].includes(hit.howler.status) && (
            <Chip
              sx={{ width: 'fit-content', display: 'inline-flex' }}
              label={hit.howler.status}
              size={layout !== HitLayout.COMFY ? 'small' : 'medium'}
              color="primary"
            />
          )}
          {hit.howler.is_bundle && (
            <Chip
              size={layout !== HitLayout.COMFY ? 'small' : 'medium'}
              label={t('hit.header.bundlesize', { hits: hit.howler.hits.length })}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default HitHeader;
