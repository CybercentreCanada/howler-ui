import api from 'api';
import type { Hit } from 'models/entities/generated/Hit';
import type { Template } from 'models/entities/generated/Template';
import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useState } from 'react';

interface TemplateContextType {
  templates: Template[];
  getTemplates: () => Promise<Template[]>;
  getMatchingTemplate: (h: Hit) => Template;
  refresh: () => void;
  loaded: boolean;
}

const CMT_AWS_DETAILS = [
  'cloud.service.name',
  'event.action',
  'cloud.account.id',
  'source.ip',
  'user.name',
  'user_agent.original',
  'user.email'
];

const SIX_TAIL_PHISH_DETAILS = [
  'event.start',
  'event.end',
  'destination.ip',
  'destination.domain',
  'cloud.service.name',
  'error.code',
  'error.message'
];

/**
 * TODO: Ask analysts to move these into the API
 */
const BUILTIN_TEMPLATES: Template[] = [
  {
    analytic: 'cmt.aws.sigma.rules',
    keys: CMT_AWS_DETAILS,
    owner: 'none',
    template_id: 'cmt.builtin',
    type: 'readonly'
  },
  {
    analytic: '6TailPhish',
    keys: SIX_TAIL_PHISH_DETAILS,
    owner: 'none',
    template_id: '6tailphish.builtin',
    type: 'readonly'
  }
];

export const TemplateContext = createContext<TemplateContextType>(null);

const TemplateProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(BUILTIN_TEMPLATES);

  const getTemplates = useCallback(
    async (force = false) => {
      if (loaded && !force) {
        return templates;
      } else {
        const result = await api.template.get();
        const fullList = [...BUILTIN_TEMPLATES, ...result];

        setTemplates(fullList);
        setLoaded(true);

        return fullList;
      }
    },
    [loaded, templates]
  );

  /**
   * Based on a given hit, retrieve the best match for a template
   */
  const getMatchingTemplate = useCallback(
    (hit: Hit) =>
      templates
        .filter(
          _template =>
            // The analytic must match, and the detection must either a) not exist or b) match the hit
            _template.analytic === hit.howler.analytic &&
            (!_template.detection || _template.detection === hit.howler.detection)
        )
        .sort((a, b) => {
          // Sort priority:
          // 1. personal > readonly > global
          // 2. detection > !detection

          if (a.type !== b.type) {
            const order = {
              personal: 2,
              readonly: 1,
              global: 0
            };

            return order[b.type] - order[a.type];
          } else {
            if (a.detection && !b.detection) {
              return -1;
            } else if (!a.detection && b.detection) {
              return 1;
            } else {
              return 0;
            }
          }
        })[0],
    [templates]
  );

  const refresh = useCallback(() => {
    setLoaded(false);
    getTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TemplateContext.Provider value={{ templates, getTemplates, getMatchingTemplate, refresh, loaded }}>
      {children}
    </TemplateContext.Provider>
  );
};

export default TemplateProvider;
