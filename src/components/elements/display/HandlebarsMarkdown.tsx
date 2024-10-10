import Throttler from 'commons/addons/utils/Throttler';
import { flatten } from 'flat';
import Handlebars from 'handlebars';
import asyncHelpers from 'handlebars-async-helpers';
import type { FC } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import Markdown, { type MarkdownProps } from '../display/Markdown';

interface HandlebarsMarkdownProps extends MarkdownProps {
  object: { [index: string]: any };
}

const THROTTLER = new Throttler(500);

const HandlebarsMarkdown: FC<HandlebarsMarkdownProps> = ({ md, object }) => {
  const [rendered, setRendered] = useState('');

  const handlebars = useMemo(() => {
    const instance = asyncHelpers(Handlebars);

    instance.registerHelper('equals', (arg1, arg2) => arg1?.toString() === arg2.toString());
    instance.registerHelper('and', (arg1, arg2) => arg1 && arg2);
    instance.registerHelper('or', (arg1, arg2) => arg1 || arg2);
    instance.registerHelper('not', arg1 => !arg1);
    instance.registerHelper('curly', arg1 => new Handlebars.SafeString(`{{${arg1}}}`));
    instance.registerHelper('join', (arg1: string, arg2: string) => [arg1 ?? '', arg2 ?? ''].join(''));
    instance.registerHelper('fetch', async (url, key) => {
      try {
        const response = await fetch(url);
        const json = await response.json();

        return flatten(json)[key];
      } catch (e) {
        return '';
      }
    });
    instance.registerHelper('upper', (val: string) => val.toLocaleUpperCase());
    instance.registerHelper('lower', (val: string) => val.toLocaleLowerCase());

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
        setRendered(await handlebars.compile(md || '')(object));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setRendered(err.toString());
      }
    });
  }, [md, handlebars, object]);

  return <Markdown md={rendered} />;
};

export default memo(HandlebarsMarkdown);
