import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import {
  Badge,
  Chip,
  Divider,
  Drawer,
  Icon,
  IconButton,
  Link,
  Skeleton,
  Stack,
  SxProps,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import * as DOMPurify from 'dompurify';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import Moment from 'react-moment';
import { DEFAULT_FEED, Feed, FeedAuthor, FeedItem, parseFeed } from '.';

/**
 * JSON Feed Version 1.1
 * https://www.jsonfeed.org/
 */

/***********************************************************************************
 * Notification
 **********************************************************************************/
type Props = {
  urls: string[];
};

type NotificationProps = {
  notifications: FeedItem[];
  drawer?: boolean;
  initialPageSize?: number;
  loadingPageDelta?: number;
  onDrawerOpen?: () => void;
  onDrawerClose?: () => void;
};

export const Notification = ({ urls = null }: Props) => {
  const [drawer, setDrawer] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [feeds, setFeeds] = useState<{ [k: string]: Feed }>(null);
  const [notifications, setNotifications] = useState<FeedItem[]>(null);

  const lastTimeOpen = useRef<Date>(new Date(0));
  const storageKey = useMemo<string>(() => 'notification.lastTimeOpen', []);

  const onDrawerOpen = useCallback(() => {
    setDrawer(true);
    lastTimeOpen.current = new Date();
  }, []);

  const onDrawerClose = useCallback(() => {
    setDrawer(false);
    localStorage.setItem(storageKey, JSON.stringify(lastTimeOpen.current.valueOf()));
    setNotifications(v =>
      v.map((n: FeedItem) => ({ ...n, _isNew: n.date_published.valueOf() > lastTimeOpen.current.valueOf() }))
    );
  }, [storageKey]);

  const loadLastTimeOpen = useCallback(() => {
    const data = localStorage.getItem(storageKey);
    if (!data) return;

    const value = JSON.parse(data);
    if (typeof value !== 'number') return;

    lastTimeOpen.current = new Date(value);
  }, [storageKey]);

  const fetchFeed = useCallback(
    (url: string = ''): Promise<any> =>
      new Promise(async (resolve, reject) => {
        const response: Response = (await fetch(url, { method: 'GET' }).catch(err =>
          // eslint-disable-next-line no-console
          console.error(`Notification Area: error caused by URL "${err}`)
        )) as Response;

        if (!response) {
          resolve({ ...DEFAULT_FEED });
          return;
        }

        const textResponse: string = await response.text();
        const jsonFeed = JSON.parse(textResponse);
        resolve(parseFeed(jsonFeed));
        return;
      }),
    []
  );

  const fetchFeeds = useCallback(
    (_urls: string[] = []): Promise<Feed[]> =>
      new Promise(async (resolve, reject) => {
        if (!_urls || _urls.length === 0) {
          resolve([]);
          return [];
        }
        const _feeds: Feed[] = await Promise.all(_urls.map(url => fetchFeed(url)));
        resolve(_feeds);
      }),
    [fetchFeed]
  );

  useEffect(() => {
    loadLastTimeOpen();
    if (!urls || !Array.isArray(urls) || urls.length === 0) return;

    fetchFeeds(urls).then(_feeds => {
      _feeds = _feeds.map(f => ({ ...f, items: f?.items?.map(i => ({ ...i, external_url: f.feed_url })) }));
      setFeeds(Object.fromEntries(_feeds.map(f => [f?.feed_url, { ...f, items: [] }])));
      setNotifications(
        _feeds
          .flatMap(f => f?.items)
          .filter(n => n.date_published > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
          .sort((a, b) => b.date_published.valueOf() - a.date_published.valueOf())
          .map(n => ({ ...n, _isNew: n.date_published.valueOf() > lastTimeOpen.current.valueOf() }))
      );
    });
  }, [fetchFeeds, loadLastTimeOpen, urls]);

  return useMemo(
    () =>
      !notifications || notifications.length === 0 ? null : (
        <>
          <NotificationTopNavButton
            drawer={drawer}
            newItems={notifications?.filter(n => n._isNew).length}
            onDrawerOpen={onDrawerOpen}
            onDrawerClose={onDrawerClose}
          />
          <NotificationDrawer
            notifications={notifications}
            drawer={drawer}
            onDrawerOpen={onDrawerOpen}
            onDrawerClose={onDrawerClose}
          />
        </>
      ),
    [drawer, notifications, onDrawerClose, onDrawerOpen]
  );
};

/***********************************************************************************
 * Notification Top Nav Button
 **********************************************************************************/
type TopNavButtonProps = {
  newItems?: number;
  drawer?: boolean;
  onDrawerOpen: () => void;
  onDrawerClose: () => void;
};

const NotificationTopNavButton = ({
  newItems = 0,
  drawer = false,
  onDrawerOpen = () => null,
  onDrawerClose = () => null
}: TopNavButtonProps) => {
  const { t } = useTranslation();

  return useMemo(
    () => (
      <Tooltip title={t('notification.title')}>
        <IconButton color="inherit" onClick={() => (drawer ? onDrawerClose() : onDrawerOpen())} size="large">
          <Badge badgeContent={newItems} color="info" max={99}>
            {newItems > 0 ? <NotificationsActiveOutlinedIcon /> : <NotificationsNoneOutlinedIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
    ),
    [drawer, newItems, onDrawerClose, onDrawerOpen, t]
  );
};

/***********************************************************************************
 * Notification Drawer
 **********************************************************************************/
const NotificationDrawer = (props: NotificationProps) => {
  const {
    notifications = [],
    drawer = true,
    onDrawerOpen = () => null,
    onDrawerClose = () => null,
    initialPageSize = 10,
    loadingPageDelta = 2
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const upSM = useMediaQuery(theme.breakpoints.up('sm'));

  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const handleLoading = useCallback(() => {
    setPageSize(v => v + loadingPageDelta);
  }, [loadingPageDelta]);

  return useMemo(
    () => (
      <Drawer
        anchor="right"
        open={drawer}
        onClick={() => (drawer ? onDrawerClose() : onDrawerOpen())}
        PaperProps={{ style: { width: upSM ? '80%' : '100%', maxWidth: '500px' } }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            overflowX: 'hidden',
            pageBreakBefore: 'avoid',
            pageBreakInside: 'avoid',
            padding: theme.spacing(2.5),
            paddingTop: 0
          }}
        >
          <NotificationCloseButton {...props} />
          <NotificationHeader icon={<FeedbackOutlinedIcon />} title={t('notification.title')} />
          <Stack
            direction="column"
            spacing={theme.spacing(1.25)}
            margin={theme.spacing(1.25)}
            divider={<Divider orientation="horizontal" flexItem style={{ width: '100%', alignSelf: 'center' }} />}
          >
            {!notifications || notifications.length === 0
              ? null
              : notifications.slice(0, pageSize).map(n => <NotificationItem key={n?.title} item={n} />)}
          </Stack>
          <NotificationEndofPage endOfPage={pageSize >= notifications.length} onLoading={() => handleLoading()} />
        </div>
      </Drawer>
    ),
    [drawer, handleLoading, notifications, onDrawerClose, onDrawerOpen, pageSize, props, t, theme, upSM]
  );
};

/***********************************************************************************
 * Notification Close Button
 **********************************************************************************/
const NotificationCloseButton = (props: NotificationProps) => {
  const theme = useTheme();
  const { drawer = false, onDrawerOpen = () => null, onDrawerClose = () => null } = props;
  return useMemo(
    () => (
      <div style={{ paddingTop: theme.spacing(1) }}>
        <IconButton
          onClick={() => (drawer ? onDrawerClose() : onDrawerOpen())}
          children={<CloseOutlinedIcon fontSize="medium" />}
          size="large"
        />
      </div>
    ),
    [drawer, onDrawerClose, onDrawerOpen, theme]
  );
};

/***********************************************************************************
 * Notification Header
 **********************************************************************************/
type NotificationHeaderProps = {
  title: string;
  icon: React.ReactElement;
};

const NotificationHeader = (props: NotificationHeaderProps) => {
  const theme = useTheme();
  const { title = '', icon = null } = props;
  return useMemo(
    () => (
      <>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: theme.spacing(2)
          }}
        >
          <Icon
            fontSize="medium"
            sx={{
              color: 'inherit',
              backgroundColor: 'inherit',
              marginLeft: theme.spacing(1.5),
              marginRight: theme.spacing(1.5)
            }}
          >
            {icon}
          </Icon>
          <Typography variant="h6" children={title} fontSize="large" fontWeight="bolder" flex={1} />
        </div>
        <Divider orientation="horizontal" flexItem style={{ width: '100%', marginTop: theme.spacing(0.5) }} />
      </>
    ),
    [icon, theme, title]
  );
};

/***********************************************************************************
 * Notification Item
 **********************************************************************************/
const NotificationItem = (props: { item?: FeedItem }) => {
  const { item = null } = props;
  const theme = useTheme();

  return useMemo(
    () =>
      !item ? null : (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}
        >
          <NotificationItemDate date={item.date_published} />
          <NotificationItemTitle title={item.title} url={item.url} isNew={item._isNew} />
          <NotificationItemContent md={item?.content_md} html={item?.content_html} text={item?.content_text} />
          <NotificationItemImage image={item?.image} />
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: theme.spacing(1)
            }}
          >
            {item?.tags && item?.tags.map(tag => <NotificationItemTag key={`${tag}`} tag={tag} />)}
            <div style={{ flex: 1 }} />
            {item?.authors &&
              item?.authors.map(author => <NotificationItemAuthor key={`${author?.name}`} author={author} />)}
          </div>
        </div>
      ),
    [item, theme]
  );
};

/***********************************************************************************
 * Notification Item Date
 **********************************************************************************/
const NotificationItemDate = (props: { date: Date }) => {
  const { date = null } = props;
  const { i18n } = useTranslation();

  return useMemo(
    () =>
      date && (
        <Typography variant="caption" color="secondary" lineHeight="revert">
          <Moment
            locale={i18n.language}
            format={i18n.language === 'en' ? 'MMMM Do YYYY' : i18n.language === 'fr' ? 'Do MMMM YYYY' : 'MMMM Do YYYY'}
            children={date}
          />
        </Typography>
      ),
    [date, i18n.language]
  );
};

/***********************************************************************************
 * Notification Item Title
 **********************************************************************************/
const NotificationItemTitle = (props: { title?: string; url?: string; isNew?: boolean }) => {
  const { title = null, url = null, isNew = false } = props;
  const theme = useTheme();

  return useMemo(
    () =>
      url ? (
        <Link
          children={title}
          title={url}
          href={url}
          variant="body1"
          color="primary"
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          textOverflow="ellipsis"
          fontWeight={isNew ? 700 : 500}
          fontSize="large"
          sx={{
            transition: 'color 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
            '&:hover': {
              color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
            }
          }}
        />
      ) : (
        <Typography
          variant="body1"
          color="primary"
          flex={1}
          fontWeight={isNew ? 700 : 500}
          overflow="hidden"
          textOverflow="ellipsis"
          fontSize="large"
          children={title}
        />
      ),
    [isNew, theme, title, url]
  );
};

/***********************************************************************************
 * Notification Item Content
 **********************************************************************************/
const NotificationItemContent = (props: { html?: string; text?: string; md?: string }) => {
  const { html = null, text = null, md = null } = props;
  const theme = useTheme();

  const sx = useMemo<SxProps<Theme>>(
    () => ({
      '& a': {
        textDecoration: 'none',
        color: theme.palette.primary.main,
        transition: 'color 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
        '&:hover': {
          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
        }
      },
      '&>*': {
        marginBlockStart: theme.spacing(0.5),
        marginBlockEnd: theme.spacing(0.5)
      }
    }),
    [theme]
  );

  return useMemo(
    () =>
      md ? (
        <Typography component="div" variant="body2" color="textPrimary" sx={sx}>
          <Markdown
            components={{
              a: p => <Link href={p.href}>{p.children}</Link>
            }}
            children={md}
          />
        </Typography>
      ) : html ? (
        <Typography
          component="div"
          variant="body2"
          color="textPrimary"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
          }}
          sx={sx}
        />
      ) : text ? (
        <Typography variant="body2" color="textPrimary" children={text} sx={sx} />
      ) : null,
    [html, md, sx, text]
  );
};

/***********************************************************************************
 * Notification Item Image
 **********************************************************************************/
const NotificationItemImage = (props: { image?: string }) => {
  const { image = null } = props;

  return useMemo(
    () =>
      image && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <img
            src={image}
            alt={image}
            style={{
              maxWidth: '256px',
              maxHeight: '256px',
              borderRadius: '5px',
              marginTop: '8px'
            }}
          />
        </div>
      ),
    [image]
  );
};

/***********************************************************************************
 * Notification Item Author
 **********************************************************************************/
const NotificationItemAuthor = (props: { author: FeedAuthor }) => {
  const { author = null } = props;
  const theme = useTheme();

  const avatar = useMemo<string>(() => {
    let url = new URLSearchParams(author?.avatar);
    url.append('s', '50');
    return decodeURIComponent(url.toString());
  }, [author]);

  return useMemo(
    () =>
      author && (
        <>
          {author?.url && author?.url !== '' ? (
            <Link
              title={author.url}
              href={author.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'contents' }}
            >
              {author?.avatar && (
                <img
                  src={avatar}
                  alt={avatar}
                  style={{
                    maxHeight: '25px',
                    borderRadius: '50%',
                    marginLeft: theme.spacing(0.25),
                    marginRight: theme.spacing(0.25),
                    color: theme.palette.text.secondary
                  }}
                />
              )}
              {author?.name && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  children={author.name}
                  sx={{
                    marginLeft: theme.spacing(0.25),
                    marginRight: theme.spacing(0.25),
                    color: theme.palette.text.secondary,
                    transition: 'color 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
                    '&:hover': {
                      color:
                        theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.dark
                    }
                  }}
                />
              )}
            </Link>
          ) : (
            <div style={{ display: 'contents' }}>
              {author?.avatar && (
                <img
                  src={avatar}
                  alt={avatar}
                  style={{
                    maxHeight: '25px',
                    borderRadius: '50%',
                    marginLeft: theme.spacing(0.25),
                    marginRight: theme.spacing(0.25),
                    color: theme.palette.text.secondary
                  }}
                />
              )}
              {author?.name && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  children={author.name}
                  sx={{
                    marginLeft: theme.spacing(0.25),
                    marginRight: theme.spacing(0.25),
                    color: theme.palette.text.secondary
                  }}
                />
              )}
            </div>
          )}
        </>
      ),
    [author, avatar, theme]
  );
};

/***********************************************************************************
 * Notification Item Tag
 **********************************************************************************/
const NotificationItemTag = (props: { tag: string }) => {
  const { tag = null } = props;

  return useMemo(
    () =>
      tag &&
      ['new', 'current', 'dev', 'service', 'blog'].includes(tag) && (
        <Chip
          size="small"
          variant="outlined"
          label={tag}
          color={
            tag === 'new'
              ? 'info'
              : tag === 'current'
              ? 'success'
              : tag === 'dev'
              ? 'warning'
              : tag === 'service'
              ? 'secondary'
              : 'default'
          }
        />
      ),
    [tag]
  );
};

/***********************************************************************************
 * Notification Skeleton
 **********************************************************************************/
const NotificationSkeleton = () => {
  const theme = useTheme();
  return useMemo(
    () => (
      <div style={{ width: '100%' }}>
        <Typography variant="caption" children={<Skeleton width="30%" />} />
        <Typography variant="h6" children={<Skeleton width="50%" />} />
        <div style={{ marginTop: theme.spacing(0.25), marginBottom: theme.spacing(1) }}>
          <Typography variant="body2" children={<Skeleton />} />
          <Typography variant="body2" children={<Skeleton />} />
          <Typography variant="body2" children={<Skeleton />} />
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Chip
            size="small"
            variant="outlined"
            label={<Skeleton width="30px" />}
            style={{ margin: theme.spacing(0.25) }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={<Skeleton width="30px" />}
            style={{ margin: theme.spacing(0.25) }}
          />
          <div style={{ flex: 1 }} />

          <Skeleton variant="circular" width={25} height={25} style={{ margin: theme.spacing(0.25) }} />
          <Typography variant="caption" children={<Skeleton width={50} />} style={{ margin: theme.spacing(0.25) }} />

          <Skeleton variant="circular" width={25} height={25} style={{ margin: theme.spacing(0.25) }} />
          <Typography variant="caption" children={<Skeleton width={50} />} style={{ margin: theme.spacing(0.25) }} />
        </div>
      </div>
    ),
    [theme]
  );
};

/***********************************************************************************
 * Notification End of Page
 **********************************************************************************/
// Hook
function useOnScreen(ref = null, rootMargin = '0px') {
  // State and setter for storing whether element is visible
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    let observerRef = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setIntersecting(entry.isIntersecting);
      },
      {
        rootMargin
      }
    );
    if (ref?.current) {
      observer.observe(ref?.current);
      observerRef = ref?.current;
    }
    return () => {
      observer.unobserve(observerRef);
    };
  }, [ref, rootMargin]); // Empty array ensures that effect is only run on mount and unmount
  return isIntersecting;
}

export const NotificationEndofPage = (props: { endOfPage?: boolean; onLoading?: () => void }) => {
  const { endOfPage = true, onLoading = () => null } = props;

  const ref = useRef();
  const onScreen = useOnScreen(ref, '0px');

  useEffect(() => {
    if (onScreen) onLoading();
  }, [onLoading, onScreen]);

  return useMemo(
    () =>
      endOfPage ? null : (
        <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }}>
          <NotificationSkeleton />
        </div>
      ),
    [endOfPage]
  );
};
