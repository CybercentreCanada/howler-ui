import PageCenter from 'commons/components/pages/PageCenter';
import Markdown from 'components/elements/display/Markdown';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import AUTH_EN from './markdown/en/authentication.md';
import AUTH_FR from './markdown/fr/authentication.md';

const AuthDocumentation: FC = () => {
  const { i18n } = useTranslation();

  const md = useMemo(
    () => (i18n.language === 'en' ? AUTH_EN : AUTH_FR).replace(/\$CURRENT_URL/g, window.location.origin),
    [i18n.language]
  );

  return (
    <PageCenter margin={4} width="100%" textAlign="left">
      <Markdown md={md} />
    </PageCenter>
  );
};
export default AuthDocumentation;
