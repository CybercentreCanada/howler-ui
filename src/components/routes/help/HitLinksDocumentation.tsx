import Markdown from 'components/elements/display/Markdown';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import raw from 'raw.macro';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const HitLinksDocumentation: FC = () => {
  const { i18n } = useTranslation();

  const { config } = useMyApiConfig();

  const md = useMemo(() => {
    const appList = config.configuration.ui.apps.map(a => `- \`${a.name.toLowerCase()}\``).join('\n');

    return (i18n.language === 'en' ? raw(`./markdown/en/links.md`) : raw(`./markdown/fr/links.md`)).replace(
      '$APP_LIST',
      appList
    );
  }, [config.configuration.ui.apps, i18n.language]);

  return <Markdown md={md} />;
};
export default HitLinksDocumentation;
