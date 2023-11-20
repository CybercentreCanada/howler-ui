import { Card, CardContent, Stack } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import Markdown from 'components/elements/display/Markdown';
import { HitLayout } from 'components/elements/hit/HitLayout';
import DefaultOutline from 'components/elements/hit/outlines/DefaultOutline';
import moment from 'moment';
import raw from 'raw.macro';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ALERTS = [
  {
    howler: { id: 'hit1', analytic: 'Cat Checker', detection: 'Listening for Meows' },
    event: {
      start: moment().subtract(4, 'hour').toString(),
      end: moment().subtract(3, 'hour').toString(),
      kind: 'Loud meow',
      outcome: 'Food provided'
    }
  },
  {
    howler: { id: 'hit2', analytic: 'Cat Checker', detection: 'Looking for paw prints' },
    event: {
      start: moment().subtract(6, 'hour').toString(),
      end: moment().subtract(5, 'hour').toString(),
      provider: "The neighbour's cat (probably)",
      reason: 'There was some fish we forgot to put away in the kitchen'
    }
  }
];

const TemplateDocumentation: FC = () => {
  const { i18n } = useTranslation();

  const [md1, md2] = useMemo(() => {
    let markdown = i18n.language === 'en' ? raw(`./markdown/en/templates.md`) : raw(`./markdown/fr/templates.md`);

    markdown = markdown.replace(/\$CURRENT_URL/g, window.location.origin);

    ALERTS.forEach((alert, index) => {
      markdown = markdown.replace(`$ALERT_${index + 1}`, JSON.stringify(alert, null, 2));
    });

    return markdown.split('\n===SPLIT===\n');
  }, [i18n.language]);

  return (
    <PageCenter margin={4} width="100%" textAlign="left">
      <Markdown md={md1} />
      <Stack spacing={1}>
        {ALERTS.map(alert => (
          <Card variant="outlined">
            <CardContent>
              <DefaultOutline
                key={alert.howler.id}
                hit={alert as any}
                fields={Object.keys(alert).flatMap(key => Object.keys(alert[key]).map(key2 => [key, key2].join('.')))}
                layout={HitLayout.NORMAL}
                readonly
              />
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Markdown md={md2} />
    </PageCenter>
  );
};
export default TemplateDocumentation;
