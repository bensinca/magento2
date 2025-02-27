const GTM_TAG = 'GTM-WMDC3CP';

module.exports = {
  title: 'Vue Storefront 2 for Magento',
  base: '/',
  description: 'Documentation for the Magento connector for Vue Storefront 2',
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    // Google Tag Manager
    ['script', {}, [`
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_TAG}');
    `]],
  ],

  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#configurewebpack
   */
   configureWebpack: (config) => {
    // Add support for webp images
    config.module.rules.push({
      test: /\.(webp)(\?.*)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'assets/img/[name].[hash:8].[ext]'
         }
        }
      ]
    });

    // Fix image loading. Ref: https://github.com/vuejs/vue-loader/issues/1612#issuecomment-559366730
    config.module.rules = config.module.rules.map((rule) => {
      rule.use = rule.use && rule.use.map((useRule) => {
        if (useRule.loader === 'url-loader') {
          useRule.options.esModule = false;
        }

        return useRule;
      });

      return rule;
    });
  },

  /**
   * Ref：https://v1.vuepress.vuejs.org/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    [
      '@vuepress/plugin-medium-zoom',
      {
        // This selector excludes images from the "Integrations" page
        selector: 'main :not(.tile-image) > img',
      },
    ],
    '@vuepress/active-header-links',
    '@vuepress/search',
  ],
  
  /**
   * Ref: https://v1.vuepress.vuejs.org/config/#markdown
   */
   markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-video'), {
        youtube: { width: 740, height: 416.25 }, // 16:9 ratio, where 740px is the width of the page content
      });
    }
  },

  themeConfig: {
    GTM_TAG,
    sidebarDepth: 0,
    repo: 'https://github.com/vuestorefront/magento2/',
    editLinks: true,
    docsDir: 'docs',
    docsBranch: 'develop',
    editLinkText: 'Edit this page',
    logo: 'https://user-images.githubusercontent.com/1626923/137092657-fb398d20-b592-4661-a1f9-4135db0b61d5.png',
    nav: [
      { text: 'Vue Storefront', link: 'https://vuestorefront.io/' },
      { text: 'Core Documentation', link: 'https://docs.vuestorefront.io/v2/' },
      { text: 'Demo', link: 'https://demo-magento2.europe-west1.gcp.storefrontcloud.io/' },
      { text: 'GitHub', link: 'https://github.com/vuestorefront/magento2' },
      { text: 'Environments', link: 'https://docs.vuestorefront.io/magento/guide/environments.html' },
    ],
    sidebar: [
      {
        title: 'Essentials',
        collapsable: false,
        children: [
          ['/', 'Introduction'],
          ['/guide/environments', 'Demo environments'],
          ['/guide/supported-features', 'Supported features'],
          ['/guide/about', 'About'],
        ],
      },
      {
        title: 'Installation & Setup',
        collapsable: false,
        children: [
          ['/installation-setup/installation', 'Installation'],
          ['/installation-setup/configure-magento', 'Configuring Magento'],
          ['/installation-setup/configure-integration', 'Configuring Vue Storefront'],
        ],
      },
      {
        title: 'Getting started',
        collapsable: false,
        children: [
          ['/getting-started/introduction', 'Introduction'],
          ['/getting-started/project-structure', 'Project structure'],
          ['/getting-started/configuration', 'Configuration'],
          ['/getting-started/layouts-and-routing', 'Layouts and Routing'],
          ['/getting-started/theme', 'Theme'],
          ['/getting-started/internationalization', 'Internationalization']
        ]
      },
      {
        title: 'Composition',
        collapsable: false,
        children: [
          ['/composition/composables', 'Composables'],
          ['/composition/list-of-composables', 'List of composables'],
        ],
      },
      {
        title: 'Modules',
        collapsable: false,
        sidebarDepth: 2,
        children: [
          {
            title: 'Catalog',
            collapsable: true,
            children: [
              ['/modules/catalog/filters', 'Filters'],
              ['/modules/catalog/product-types', 'Product Types'],
            ],
          },
        ],
      },
      {
        title: 'Guides',
        collapsable: false,
        children: [
          ['/guide/global-state-management', 'Global state management'],
          ['/guide/image-optimization', 'Image optimization'],
          ['/guide/override-queries', 'Override queries'],
          ['/guide/testing', 'Testing'],
          ['/guide/recaptcha', 'ReCaptcha'],
        ],
      },
      {
        title: 'Performance',
        collapsable: false,
        children: [
          ['/guide/graphql-get', 'Varnish & GET for GraphQL Queries'],
          ['/guide/ssr', 'Server Side Rendering Cache'],
        ],
      },
      {
        title: 'Reference',
        children: [
          ['/plugins/', 'Plugins'],
          ['/api-reference/', 'API Reference'],
          ['/migration-guides/', 'Migration Guides'],
        ],
      },
      {
        title: 'Nuxt Tips  & Tricks',
        children: [
          ['/improvements/optimization/', 'Optimization'],
          ['/improvements/security/', 'Security'],
          ['/improvements/logging/', 'Logging'],
          ['/improvements/analytics/', 'Analytics'],
        ],
      },
    ],
  },
};
