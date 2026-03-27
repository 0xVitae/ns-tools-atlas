import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "NS Tools Docs",
  tagline: "Documentation for the Network School tool Atlas",
  favicon: "img/favicon.png",

  future: {
    v4: true,
  },

  url: "https://nstools.xyz",
  baseUrl: "/docs/",

  onBrokenLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: "atlas_link",
      content: 'Explore the live Atlas🌐🔨 &rarr; <a href="https://nstools.xyz">Open Atlas</a>',
      backgroundColor: "var(--ifm-color-primary)",
      textColor: "#fff",
      isCloseable: true,
    },
    navbar: {
      title: "NS Tools",
      logo: {
        alt: "NS Tools",
        src: "img/favicon.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/0xVitae/ns-tools-atlas",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://nstools.xyz",
          label: "Atlas",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/",
            },
            {
              label: "Contributing",
              to: "/contributing",
            },
            {
              label: "Claude Plugin",
              to: "/claude-plugin",
            },
          ],
        },
        {
          title: "Network School",
          items: [
            {
              label: "NS Platform",
              href: "https://ns.com",
            },
            {
              label: "Tool Atlas",
              href: "https://nstools.xyz",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/0xVitae/ns-tools-atlas",
            },
            {
              label: "Request a Tool",
              href: "https://nstools.xyz/requests",
            },
          ],
        },
      ],
      copyright: `Built by the Network School community`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: [],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
