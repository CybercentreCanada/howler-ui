import Markdown from 'components/elements/display/Markdown';
import raw from 'raw.macro';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const BundleDocumentation: FC = () => {
  const { i18n } = useTranslation();

  const md = useMemo(
    () => (i18n.language === 'en' ? raw(`./markdown/en/bundles.md`) : raw(`./markdown/fr/bundles.md`)),
    [i18n.language]
  );

  return <Markdown md={md} />;
};

export default BundleDocumentation;
