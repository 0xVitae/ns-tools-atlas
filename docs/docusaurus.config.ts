import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const isDev = process.env.NODE_ENV === "development";
const siteUrl = isDev ? "http://localhost:3000" : "https://nstools.xyz";

const config: Config = {
  title: "NS Tools Docs",
  tagline: "Documentation for the Network School tool Atlas",
  favicon: "img/favicon.png",

  future: {
    v4: true,
  },

  url: siteUrl,
  baseUrl: "/docs/",

  customFields: {
    siteUrl,
  },

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
      defaultMode: "light",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    announcementBar: {
      id: "atlas_link",
      content: `Explore the live Atlas🌐🔨 &rarr; <a href="${siteUrl}">Open Atlas</a>`,
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
          href: siteUrl,
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
              label: "Claude Code Plugin",
              to: "/claude-code-plugin",
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
              href: siteUrl,
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
              href: `${siteUrl}/requests`,
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
