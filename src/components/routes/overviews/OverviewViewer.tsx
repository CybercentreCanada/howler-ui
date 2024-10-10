import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  LinearProgress,
  Stack,
  TextField,
  Tooltip
} from '@mui/material';
import api from 'api';
import PageCenter from 'commons/components/pages/PageCenter';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Check, Delete, SsidChart } from '@mui/icons-material';
import hitsData from 'api/hit/:id/data/index.json';
import AppInfoPanel from 'commons/components/display/AppInfoPanel';
import { OverviewContext } from 'components/app/providers/OverviewProvider';
import HitOverview from 'components/elements/hit/HitOverview';
import useMyApi from 'components/hooks/useMyApi';
import type { Analytic } from 'models/entities/generated/Analytic';
import type { Hit } from 'models/entities/generated/Hit';
import type { Overview } from 'models/entities/generated/Overview';
import { useSearchParams } from 'react-router-dom';
import { sanitizeLuceneQuery } from 'utils/stringUtils';
import OverviewEditor from './OverviewEditor';

const STARTING_TEMPLATE = `
# Creating an Overview

Overviews can be used to modify the way data is presented on alerts that match the overview's settings. Overviews are, by design, easy to create and quite flexible.

## Getting Started

The basic building blocks of overviews are:

1. Markdown
2. Handlebars

We will quickly explain these.

### Markdown

Quoting from the excellent [markdownguide.org](https://www.markdownguide.org/getting-started/):

> Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by [John Gruber](https://daringfireball.net/projects/markdown/) in 2004, Markdown is now one of the world's most popular markup languages.
>
> Using Markdown is different than using a [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG) editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn't like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.
>
> For example, to denote a heading, you add a number sign before it (e.g., \`# Heading One\`). Or to make a phrase bold, you add two asterisks before and after it (e.g., \`**this text is bold**\`). It may take a while to get used to seeing Markdown syntax in your text, especially if you're accustomed to WYSIWYG applications.

---

### Handlebars

Quoting from [handlebarsjs.com](https://handlebarsjs.com/guide/):

> Handlebars is a simple templating language.
>
> It uses a template and an input object to generate HTML or other text formats. Handlebars templates look like regular text with embedded Handlebars expressions.
>
>\`\`\`html
> <p>{{curly "firstname"}} {{curly "lastname"}}</p>
>\`\`\`
>
> A handlebars expression is a double curly bracket, some contents, followed by a set of closing double curly brackets. When the template is executed, these expressions are replaced with values from an input object.

---

For our cases, we use handlebars to replace specific parts of markdown with the values included in a given howler hit. For example:

\`\`\`markdown
This analytic is **{{curly "howler.analytic"}}**
\`\`\`

becomes:

> This analytic is **{{howler.analytic}}**.

For more information on handlebars, check out:

- [What is Handlebars?](https://handlebarsjs.com/guide/#what-is-handlebars)
- [Handlebars Expressions](https://handlebarsjs.com/guide/expressions.html)

## Combining Markdown the Handlebars

You can use handlebars for template replacement throughout your markdown. Below is an example table using handlebars and markdown:

\`\`\`markdown
| Source IP | Destination IP |
| --- | --- |
| {{curly "source.ip"}} |{{curly "destination.ip"}} |
\`\`\`

renders as:

| Source IP | Destination IP |
| --- | --- |
| {{source.ip}} |{{destination.ip}} |

## Advanced Handlebars

Howler integrates a number of helper functions for you to work with.

### Control Expressions

For use as subexpressions, we expose a number of conditional checks:

**Equality:**

Given \`howler.status\` is {{howler.status}}:

\`\`\`markdown
{{curly '#if (equals howler.status "open")'}}
Hit is open!
{{curly "/if"}}
{{curly '#if (equals howler.status "resolved")'}}
Hit is resolved!
{{curly "/if"}}
\`\`\`

{{#if (equals howler.status "open")}}
Hit is open!
{{/if}}
{{#if (equals howler.status "resolved")}}
Hit is resolved!
{{/if}}

**AND/OR/NOT:**

Given \`howler.status\` is {{howler.status}}, and \`howler.escalation\` is {{howler.escalation}}:

\`\`\`markdown
{{curly '#if (and (equals howler.status "open") (equals howler.escalation "alert"))'}}
This is correct!
{{curly "/if"}}
{{curly '#if (and (equals howler.status "resolved") (equals howler.escalation "hit"))'}}
This is wrong!
{{curly "/if"}}
\`\`\`

{{#if (and (equals howler.status "open") (equals howler.escalation "alert"))}}
This is correct!
{{/if}}
{{#if (and (equals howler.status "resolved") (equals howler.escalation "hit"))}}
This is wrong!
{{/if}}

\`\`\`markdown
{{curly '#if (or howler.is_bundle (not howler.is_bundle))'}}
Always shows!
{{curly "/if"}}
\`\`\`

{{#if (or howler.is_bundle (not howler.is_bundle))}}
Always shows!
{{/if}}

---

### String Operations

**String Concatenation:**
\`\`\`markdown
{{curly 'join "string one " "string two"'}}
\`\`\`

{{join "string one " "string two"}}

**Uppercase/Lowercase:**

\`\`\`markdown
{{curly 'upper "make this uppercase"'}}
{{curly 'lower "MAKE THIS LOWERCASE"'}}
\`\`\`

{{upper "make this uppercase"}}

{{lower "MAKE THIS LOWERCASE"}}

---

### Fetching Data

You can also make basic fetch requests for, and parse, JSON data from external sources:

\`\`\`markdown
{{curly 'fetch "/api/v1/configs" "api_response.c12nDef.UNRESTRICTED"'}}
\`\`\`

{{fetch "/api/v1/configs" "api_response.c12nDef.UNRESTRICTED"}}
`;
const OverviewViewer = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { getOverviews } = useContext(OverviewContext);
  const { dispatchApi } = useMyApi();

  const [overviewList, setOverviewList] = useState<Overview[]>([]);
  const [selectedOverview, setSelectedOverview] = useState<Overview>(null);
  const [content, setContent] = useState<string>('');

  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [detections, setDetections] = useState<string[]>([]);

  const [analytic, setAnalytic] = useState<string>(params.get('analytic') ?? '');
  const [detection, setDetection] = useState<string>(params.get('detection') ?? 'ANY');
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [exampleHit, setExampleHit] = useState<Hit>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        setOverviewList(await getOverviews(true));

        const analyticsResult = await dispatchApi(api.search.analytic.post({ query: 'analytic_id:*', rows: 1000 }), {
          logError: false,
          showError: true,
          throwError: true
        });

        const _analytics = analyticsResult.items;

        if (!_analytics.some(_analytic => _analytic.name.toLowerCase() === analytic.toLowerCase())) {
          setAnalytic('');
        }

        setAnalytics(_analytics);
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytic, dispatchApi]);

  useEffect(() => {
    if (analytic) {
      setLoading(true);

      dispatchApi(
        api.search.grouped.hit.post('howler.detection', {
          limit: 0,
          query: `howler.analytic:"${sanitizeLuceneQuery(analytic)}"`
        }),
        {
          logError: false,
          showError: true,
          throwError: true
        }
      )
        .finally(() => setLoading(false))
        .then(result => result.items.map(i => i.value))
        .then(_detections => {
          if (detection && !_detections.includes(detection)) {
            setDetection('ANY');
          }

          setDetections(_detections);
        });
    }
  }, [analytic, detection, dispatchApi, params, setParams]);

  useEffect(() => {
    (async () => {
      const result = await dispatchApi(
        api.search.hit.post({
          query:
            `howler.analytic:"${sanitizeLuceneQuery(analytic)}"` +
            (!!detection && detection !== 'ANY' ? ` AND howler.detection:"${sanitizeLuceneQuery(detection)}"` : ''),
          rows: 1
        }),
        { throwError: false, showError: false, logError: false }
      );

      if (result?.items[0]) {
        setExampleHit(result.items[0]);
        return;
      }

      const _hit = hitsData.GET[Object.keys(hitsData.GET)[0]];

      if (analytic) {
        _hit.howler.analytic = analytic;
      }

      if (detection) {
        _hit.howler.detection = detection;
      }

      setExampleHit(_hit);
    })();
  }, [analytic, detection, dispatchApi]);

  useEffect(() => {
    if (analytic && detection) {
      const overview = overviewList.find(
        _overview =>
          _overview.analytic === analytic &&
          ((detection === 'ANY' && !_overview.detection) || _overview.detection === detection)
      );

      if (overview) {
        setSelectedOverview(overview);
        setContent(overview.content);
      } else {
        setSelectedOverview(null);
        setContent('');
      }
    }
  }, [analytic, detection, overviewList]);

  useEffect(() => {
    if (analytic) {
      params.set('analytic', analytic);
    } else {
      params.delete('analytic');
    }

    if (detection && detection !== 'ANY') {
      params.set('detection', detection);
    } else {
      params.delete('detection');
    }

    params.sort();

    setParams(params, {
      replace: true
    });
  }, [analytic, detection, params, setParams]);

  const onDelete = useCallback(async () => {
    await dispatchApi(api.overview.del(selectedOverview.overview_id), {
      logError: false,
      showError: true,
      throwError: false
    });
    setSelectedOverview(null);
    setContent('');
  }, [dispatchApi, selectedOverview?.overview_id]);

  const onSave = useCallback(async () => {
    if (analytic && detection) {
      try {
        setOverviewLoading(true);
        const result = await dispatchApi(
          selectedOverview
            ? api.overview.put(selectedOverview.overview_id, content)
            : api.overview.post({
                analytic,
                detection: detection !== 'ANY' ? detection : null,
                content
              } as any),
          {
            logError: false,
            showError: true,
            throwError: true
          }
        );

        setSelectedOverview(result);
        const newList = [result, ...overviewList];
        setOverviewList(newList.filter((v1, i) => newList.findIndex(v2 => v1.overview_id === v2.overview_id) === i));
      } finally {
        setOverviewLoading(false);
      }
    }
  }, [analytic, detection, dispatchApi, selectedOverview, content, overviewList]);

  const analyticOrDetectionMissing = useMemo(() => !analytic || !detection, [analytic, detection]);
  const noChange = useMemo(() => selectedOverview?.content === content, [content, selectedOverview?.content]);

  return (
    <PageCenter maxWidth="1800px" textAlign="left" height="100%">
      <LinearProgress sx={{ mb: 1, opacity: +loading }} />
      <Stack direction="column" spacing={2} divider={<Divider orientation="horizontal" flexItem />} height="100%">
        <Stack direction="row" spacing={2} mb={2} alignItems="stretch">
          <FormControl sx={{ minWidth: { sm: '200px' } }}>
            <Autocomplete
              id="analytic"
              options={analytics.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))}
              getOptionLabel={option => option.name}
              value={analytics.find(a => a.name === analytic) || null}
              onChange={(_event, newValue) => setAnalytic(newValue ? newValue.name : '')}
              renderInput={autocompleteAnalyticParams => (
                <TextField {...autocompleteAnalyticParams} label={t('route.overviews.analytic')} size="small" />
              )}
            />
          </FormControl>
          {!analytics.find(_analytic => _analytic.name === analytic)?.rule ? (
            <FormControl sx={{ minWidth: { sm: '200px' } }} disabled={!analytic}>
              <Autocomplete
                id="detection"
                options={['ANY', ...detections.sort()]}
                getOptionLabel={option => option}
                value={detection ?? ''}
                onChange={(_event, newValue) => setDetection(newValue)}
                renderInput={autocompleteDetectionParams => (
                  <TextField {...autocompleteDetectionParams} label={t('route.overviews.detection')} size="small" />
                )}
              />
            </FormControl>
          ) : (
            <Tooltip title={t('route.overviews.rule.explanation')}>
              <SsidChart color="info" sx={{ alignSelf: 'center' }} />
            </Tooltip>
          )}
          {selectedOverview && (
            <Button variant="outlined" startIcon={<Delete />} onClick={onDelete}>
              {t('button.delete')}
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={analyticOrDetectionMissing || noChange}
            startIcon={overviewLoading ? <CircularProgress size={16} /> : <Check />}
            onClick={onSave}
          >
            {t(!analyticOrDetectionMissing && !noChange ? 'button.save' : 'button.saved')}
          </Button>
        </Stack>
        {analyticOrDetectionMissing ? (
          <AppInfoPanel i18nKey="route.overviews.select" sx={{ width: '100%', alignSelf: 'start' }} />
        ) : (
          <Stack
            direction="row"
            divider={<Divider flexItem orientation="vertical" />}
            spacing={1}
            height="100%"
            onKeyDown={e => {
              if (e.ctrlKey && e.key === 's') {
                if (!noChange) {
                  onSave();
                }
                e.preventDefault();
              }
            }}
          >
            <Box flex={1} position="relative" height="100%">
              <Box flex={1} sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                <OverviewEditor height="100%" content={content} setContent={setContent} />
              </Box>
            </Box>
            <Box flex={1} px={2} sx={{ '& > div > :first-child': { mt: 0 } }}>
              <HitOverview content={content || STARTING_TEMPLATE} hit={exampleHit} />
            </Box>
          </Stack>
        )}
      </Stack>
    </PageCenter>
  );
};

export default OverviewViewer;
