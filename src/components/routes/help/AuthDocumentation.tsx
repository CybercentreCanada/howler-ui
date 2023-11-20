import PageCenter from 'commons/components/pages/PageCenter';
import Markdown from 'components/elements/display/Markdown';
import raw from 'raw.macro';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const AuthDocumentation: FC = () => {
  const { i18n } = useTranslation();

  const md = useMemo(
    () =>
      (i18n.language === 'en'
        ? raw(`./markdown/en/authentication.md`)
        : raw(`./markdown/fr/authentication.md`)
      ).replace(/\$CURRENT_URL/g, window.location.origin),
    [i18n.language]
  );

  return (
    <PageCenter margin={4} width="100%" textAlign="left">
      <Markdown md={md} />
    </PageCenter>
  );
};
export default AuthDocumentation;
