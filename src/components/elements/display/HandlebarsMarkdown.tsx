import Throttler from 'commons/addons/utils/Throttler';
import { flatten } from 'flat';
import Handlebars from 'handlebars';
import asyncHelpers from 'handlebars-async-helpers';
import { isObject } from 'lodash-es';
import type { FC } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown, { type MarkdownProps } from '../display/Markdown';

interface HowlerHelper {
  keyword: string;
  documentation?: string;
  callback: (...args: any) => any;
}

export const HELPERS: HowlerHelper[] = [
  {
    keyword: 'equals',
    documentation: 'Checks the equality of the string representation of the two arguments.',
    callback: (arg1, arg2) => arg1?.toString() === arg2.toString()
  },
  {
    keyword: 'and',
    documentation: 'Runs the comparison `arg1 && arg2`, and returns the result.',
    callback: (arg1, arg2) => arg1 && arg2
  },
  {
    keyword: 'or',
    documentation: 'Runs the comparison `arg1 || arg2`, and returns the result.',
    callback: (arg1, arg2) => arg1 || arg2
  },
  { keyword: 'not', documentation: 'Runs the comparison `!arg`, and returns the result.', callback: arg => !arg },
  {
    keyword: 'curly',
    documentation: 'Wraps the given argument in curly braces.',
    callback: arg1 => new Handlebars.SafeString(`{{${arg1}}}`)
  },
  {
    keyword: 'join',
    documentation: 'Joins two string arguments with a given string `sep`, or the empty string as a default.',
    callback: (arg1: string, arg2: string, context) =>
      [arg1?.toString() ?? '', arg2?.toString() ?? ''].join(context.hash?.sep ?? '')
  },
  {
    keyword: 'upper',
    documentation: 'Returns the uppercase representation of a string argment.',
    callback: (val: string) => val.toLocaleUpperCase()
  },
  {
    keyword: 'lower',
    documentation: 'Returns the lowercase representation of a string argment.',
    callback: (val: string) => val.toLocaleLowerCase()
  },
  {
    keyword: 'fetch',
    documentation:
      'Fetches the url provided and returns the given (flattened) key from the returned JSON object. Note that the result must be JSON!',
    callback: async (url, key) => {
      try {
        const response = await fetch(url);
        const json = await response.json();

        return flatten(json)[key];
      } catch (e) {
        return '';
      }
    }
  },
  {
    keyword: 'howler',
    documentation: 'Given a howler hit ID, this helper renders a hit card for that ID.',
    callback: id => {
      return new Handlebars.SafeString(`![$howler](${id})`);
    }
  },
  {
    keyword: 'entries',
    documentation: 'Given a dict, return an array of {key, value} objects.',
    callback: obj => {
      if (!isObject(obj)) {
        return new Handlebars.SafeString('Invalid Object.');
      }

      return Object.entries(obj).map(([key, value]) => ({ key, value }));
    }
  },
  {
    keyword: 'json',
    documentation: 'Convert any object into a JSON string..',
    callback: obj => {
      return new Handlebars.SafeString(JSON.stringify(obj));
    }
  },
  {
    keyword: 'includes',
    documentation: 'Checks if field is in string',
    callback: (arg1, arg2) => {
      return !!arg2 && !!arg1?.includes(arg2);
    }
  }
];

interface HandlebarsMarkdownProps extends MarkdownProps {
  object?: { [index: string]: any };
  disableLinks?: boolean;
}

const THROTTLER = new Throttler(500);

const HandlebarsMarkdown: FC<HandlebarsMarkdownProps> = ({ md, object = {}, disableLinks = false }) => {
  const { t } = useTranslation();

  const [rendered, setRendered] = useState('');

  const handlebars = useMemo(() => {
    const instance = asyncHelpers(Handlebars);

    HELPERS.forEach(helper => instance.registerHelper(helper.keyword, helper.callback));

    instance.registerHelper('img', async context => {
      const hash = Object.fromEntries(
        await Promise.all(Object.entries(context.hash).map(async ([key, val]) => [key, await val]))
      );

      if (!hash.src) {
        return '';
      }

      const props = Object.entries(hash)
        .map(([key, val]) => `${key}="${val}"`)
        .join(' ');

      return new Handlebars.SafeString(`<img ${props} >`);
    });

    return instance;
  }, []);

  useEffect(() => {
    THROTTLER.debounce(async () => {
      try {
        const compiled = handlebars.compile(md || '');

        setRendered(await compiled(object));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);

        setRendered(`
<h2 style="color: red">${t('markdown.error')}</h2>

**\`${err.toString()}\`**

<code style="font-size: 0.8rem"><pre>
${err.stack}
</pre></code>
        `);
      }
    });
  }, [md, handlebars, object, t]);

  return <Markdown md={rendered} disableLinks={disableLinks} />;
};

export default memo(HandlebarsMarkdown);
