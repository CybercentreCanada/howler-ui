import { Alert, Box, Paper, Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import DynamicTabs from './DynamicTabs';
import { codeTabs } from './markdownPlugins/tabs';
import { Notebook } from './Notebook';

const customComponents = (type: string, children: any) => {
  const child = children instanceof Array ? children[0] : children;
  if (type === 'alert') {
    return (
      <Alert severity="info" variant="outlined" sx={{ '.MuiAlert-message': { whiteSpace: 'normal' } }}>
        {child}
      </Alert>
    );
  } else if (type === 'notebook') {
    return <Notebook ipynb={child} />;
  } else if (type === 'tabs') {
    return (
      <DynamicTabs
        tabs={JSON.parse(child).map(t => ({ title: t.title, children: customComponents(t.lang, t.value) }))}
      />
    );
  } else {
    return <code>{child}</code>;
  }
};

const Markdown: FC<{ md: string; components?: { [index: string]: ReactElement } }> = ({ md, components = {} }) => {
  const { isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, codeTabs]}
      components={{
        code({ node, inline, className, children, ...props }) {
          if (node.children?.length === 1 && node.children[0].type === 'text') {
            if (node.children[0].value.startsWith('t(')) {
              return <span>{t(node.children[0].value.replace(/t\((.+)\)/, '$1'))}</span>;
            } else if (components[node.children[0].value]) {
              return components[node.children[0].value];
            }
          }

          const match = /language-(\w+)/.exec(className || '');

          if (match && ['alert', 'notebook', 'tabs'].includes(match[1])) {
            return customComponents(match[1], children);
          }

          return !inline && match ? (
            <SyntaxHighlighter
              children={String(children).replace(/\n$/, '')}
              style={isDark ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              {...props}
            />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        blockquote({ children }) {
          return <Box sx={theme => ({ pl: 1, borderLeft: `2px solid ${theme.palette.divider}` })}>{children}</Box>;
        },
        img({ node, ...props }) {
          // eslint-disable-next-line jsx-a11y/alt-text
          return <img {...props} style={{ ...props.style, maxWidth: '75%' }} />;
        },
        table({ children }) {
          return (
            <TableContainer component={Paper}>
              <Table>{children}</Table>
            </TableContainer>
          );
        },
        thead({ children }) {
          return <TableHead>{children}</TableHead>;
        },
        tr({ children }) {
          return <TableRow>{children}</TableRow>;
        },
        th({ node, className, children, ...props }) {
          return <TableCell style={props.style}>{children}</TableCell>;
        },
        td({ node, className, children, ...props }) {
          return <TableCell style={props.style}>{children}</TableCell>;
        },
        a({ node, children, ...props }) {
          if (props.href?.startsWith('/')) {
            return (
              <Link to={props.href} {...props}>
                {children}
              </Link>
            );
          } else {
            return <a {...props}>{children}</a>;
          }
        }
      }}
    >
      {md}
    </ReactMarkdown>
  );
};

export default Markdown;
