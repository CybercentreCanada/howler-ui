import { Avatar, Stack } from '@mui/material';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import HowlerCard from 'components/elements/display/HowlerCard';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const RelatedLink: React.FC<{ icon?: string; title?: string; href?: string; compact?: boolean }> = ({
  icon,
  title,
  href,
  compact = false
}) => {
  const { config } = useMyApiConfig();
  const { isDark } = useAppTheme();

  const _icon = useMemo(() => {
    if (icon) {
      const app = config.configuration.ui.apps.find(a => a.name.toLowerCase() === icon?.toLowerCase());
      if (app) {
        return app[`img_${isDark ? 'd' : 'l'}`];
      }
    }

    return icon;
  }, [config.configuration.ui.apps, icon, isDark]);

  return (
    <HowlerCard
      variant={compact ? 'outlined' : 'elevation'}
      key={href}
      onClick={() => window.open(href)}
      sx={[
        theme => ({
          cursor: 'pointer',
          backgroundColor: 'transparent',
          transition: theme.transitions.create(['border-color']),
          '&:hover': { borderColor: 'primary.main' }
        }),
        !compact && { border: 'thin solid', borderColor: 'transparent' }
      ]}
    >
      <Stack direction="row" p={compact ? 0.5 : 1} spacing={1} alignItems="center">
        <Avatar
          variant="rounded"
          alt={title ?? href}
          src={_icon}
          sx={[
            theme => ({
              width: theme.spacing(compact ? 4 : 6),
              height: theme.spacing(compact ? 4 : 6),
              '& img': {
                objectFit: 'contain'
              }
            }),
            !_icon && { backgroundColor: 'transparent' }
          ]}
        >
          {_icon}
        </Avatar>
        <Link to={href} onClick={e => e.stopPropagation()}>
          {title ?? href}
        </Link>
      </Stack>
    </HowlerCard>
  );
};

export default RelatedLink;
