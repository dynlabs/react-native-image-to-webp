import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'react-native-image-to-webp',
  tagline:
    'Performant. Type-safe. Zero-effort WebP conversion for React Native.',
  favicon: 'img/favicon.ico',

  url: 'https://dynlabs.github.io',
  baseUrl: '/react-native-image-to-webp/',

  organizationName: 'dynlabs',
  projectName: 'react-native-image-to-webp',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl:
            'https://github.com/dynlabs/react-native-image-to-webp/tree/main/website/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: 'react-native-image-to-webp',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/@dynlabs/react-native-image-to-webp',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/dynlabs/react-native-image-to-webp',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Quick Start', to: '/' },
            { label: 'API Reference', to: '/api' },
            { label: 'Architecture', to: '/architecture' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/dynlabs/react-native-image-to-webp',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@dynlabs/react-native-image-to-webp',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} dynlabs. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
