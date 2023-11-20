import { CardContent, Divider, Typography } from '@mui/material';
import HowlerCard from 'components/elements/display/HowlerCard';
import JSONViewer from 'components/elements/display/JSONViewer';
import HitHeader from 'components/elements/hit/HitHeader';
import { HitLayout } from 'components/elements/hit/HitLayout';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const HitHeaderDocumentation: FC = () => {
  const { t } = useTranslation();

  const dummyHit = useMemo<Hit>(
    () => ({
      timestamp: '2023-02-11T15:10:31.585826Z',
      howler: {
        id: 'howler.id',
        analytic: 'howler.analytic',
        detection: 'howler.detection',
        assignment: 'howler.assignment',
        hash: 'howler.hash',
        outline: {
          threat: 'howler.outline.threat',
          target: 'howler.outline.target',
          indicators: ['howler.outline.indicators'],
          summary: 'howler.outline.summary'
        },
        escalation: 'howler.escalation',
        status: 'howler.status'
      },
      event: {
        created: '2023-02-11T15:10:31.585826Z',
        provider: 'event.provider'
      },
      organization: {
        id: 'organization.id',
        name: 'organization.name'
      },
      threat: {
        tactic: {
          id: 'threat.tactic.id',
          name: 'threat.tactic.name'
        },
        technique: {
          id: 'threat.technique.id',
          name: 'threat.technique.name'
        }
      }
    }),
    []
  );

  return (
    <>
      <h1>{t('help.hit.header.title')}</h1>
      <Typography variant="body1">{t('help.hit.header.description')}</Typography>
      <Divider orientation="horizontal" sx={{ my: 2 }} />
      <HowlerCard sx={{ mb: 2 }}>
        <CardContent>
          <HitHeader hit={dummyHit} layout={HitLayout.COMFY} />
        </CardContent>
      </HowlerCard>
      <Typography variant="body1">{t('help.hit.header.json')}</Typography>
      <Divider orientation="horizontal" sx={{ my: 2 }} />
      <JSONViewer data={dummyHit} />
    </>
  );
};

export default HitHeaderDocumentation;
