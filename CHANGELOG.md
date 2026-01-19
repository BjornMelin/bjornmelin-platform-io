# Changelog

All notable changes to this project are documented in this file.

## [3.3.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v3.2.0...v3.3.0) (2026-01-19)


### Features

* tailwindcss v4 upgrade ([9b31f3d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/9b31f3dbaabafb4b950d9b030b3b30509f896f62))


### Bug Fixes

* **pr-review:** address tailwind v4 feedback ([0df13cd](https://github.com/BjornMelin/bjornmelin-platform-io/commit/0df13cdd969e6c04d069526027231fc39beb3e80))
* **tailwind:** finish v4 migration cleanup ([84b87a6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/84b87a6ed7616f463df8c454d1b8f1852d373d8f))

## [3.2.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v3.1.0...v3.2.0) (2026-01-18)


### Features

* Add markdown linting to CI pipeline and configure rules for documentation files. ([b87b323](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b87b32348067307cb8bfcfa8bfcd82d0d1d1bd16))


### Bug Fixes

* **ci:** exclude GitHub compare URLs from link checking ([cfedebc](https://github.com/BjornMelin/bjornmelin-platform-io/commit/cfedebc892ec9e0cd9bbcea9b8ed792922d8ee06))
* resolve PR review comments on workflows documentation and CI config ([3e38047](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3e38047d4cc3bfb3cb41092b26fcade3b2c1d641))

## [3.1.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v3.0.0...v3.1.0) (2026-01-18)


### Features

* add script and preflight checks for static deploy permissions for S3, CloudFront KVS, and invalidations ([b3d1ac4](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b3d1ac479ff52fd576768841b2218f1b1c3e0894))
* Add script and preflight checks for static deploy permissions for S3, CloudFront KVS, and invalidations. ([a01a0c3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/a01a0c31ae2572b1362365addb8b74adc0ef0f66))
* refine projects UI and contact fallback ([#231](https://github.com/BjornMelin/bjornmelin-platform-io/issues/231)) ([fd5e308](https://github.com/BjornMelin/bjornmelin-platform-io/commit/fd5e308110411cc9198b178e4c00d3af745cd4c1))


### Bug Fixes

* **csp:** move CSP to response function ([#233](https://github.com/BjornMelin/bjornmelin-platform-io/issues/233)) ([30d3e75](https://github.com/BjornMelin/bjornmelin-platform-io/commit/30d3e7520f48ac5ff58f47561070d86c0c9d0db5))
* **deploy:** address PR review comments ([c4ec7b6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c4ec7b6dd8d370b29602284ecc8f232b524418b3))

## [3.0.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v2.1.0...v3.0.0) (2026-01-17)


### ⚠ BREAKING CHANGES

* The application has been fully migrated from Next.js 14 to Next.js 16 and React 18 to React 19. This includes a complete refactor of the routing architecture and core component logic.

### Features

* architecture overhaul and upgrade to Next.js 16 ([4473510](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4473510fbaef7ee31c0e017a91f00a356ae6d0d3))
* external contact boundary and UI refresh ([#229](https://github.com/BjornMelin/bjornmelin-platform-io/issues/229)) ([fa89a3d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/fa89a3dbe6e16ffe0f276ebe584f3845a34d0711))

## [2.1.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v2.0.0...v2.1.0) (2026-01-16)


### Features

* major version deps upgrades ([#227](https://github.com/BjornMelin/bjornmelin-platform-io/issues/227)) ([0eb0460](https://github.com/BjornMelin/bjornmelin-platform-io/commit/0eb046007f678f1be7df0a83feef2faa8d443db4))

## [2.0.0](https://github.com/BjornMelin/bjornmelin-platform-io/compare/v1.0.5...v2.0.0) (2026-01-16)


### ⚠ BREAKING CHANGES

* Workflows now properly fail when tests fail, preventing broken code from being deployed
* All workflows now require pnpm instead of yarn

### Features

* **about:** Add About page and enhance skills section ([94b9a8f](https://github.com/BjornMelin/bjornmelin-platform-io/commit/94b9a8f0376249085aa1e0e586ff9e948da4a132))
* **about:** Add comprehensive skills section with dynamic skill categories ([15b93f8](https://github.com/BjornMelin/bjornmelin-platform-io/commit/15b93f83c85db75d3e8ca43a275f26b2104db824))
* **about:** Implement About Page; Enhance About Visual Design and Readability ([43e75ad](https://github.com/BjornMelin/bjornmelin-platform-io/commit/43e75ad4541f88bc3017b1a45f34843c43656bc7))
* **about:** Refine professional summary and experience section ([f59f0ca](https://github.com/BjornMelin/bjornmelin-platform-io/commit/f59f0ca663cb51669d60ce3a45ef6bff42e5beab))
* **about:** Replace About section with AboutDetail component ([f171518](https://github.com/BjornMelin/bjornmelin-platform-io/commit/f1715183b2bfc25141ce0caae4777ba84cfa7057))
* **about:** Simplify About section styling and improve responsiveness ([c086cb5](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c086cb5b4c96210eb91a110bfb44cf702819461c))
* **about:** Update personal information and projects ([c893c94](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c893c940898041db01e15a06b110be603a164871))
* add comprehensive GitHub workflows and automation ([3180146](https://github.com/BjornMelin/bjornmelin-platform-io/commit/31801469777eefb78655b96041ed2544aa1dd122))
* add comprehensive GitHub workflows and automation ([1692e66](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1692e66659add8b06de8106dc81615af6b86f27a))
* **api:** Add contact router and update TRPC context for improved API structure ([29ea1ac](https://github.com/BjornMelin/bjornmelin-platform-io/commit/29ea1ac0cdf2c0c97b765bc71cea1baa96fdd0bc))
* **api:** Add TRPC handler and client setup for API communication ([a6b552b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/a6b552b68599a482d866d83b9f3a77bb9660cde2))
* **api:** Add TRPC setup and app router for portfolio management ([ade7da8](https://github.com/BjornMelin/bjornmelin-platform-io/commit/ade7da8958254d0e1444f12f3307986ff06ed463))
* **api:** Enhance TRPC context and client configuration for improved API interactions ([aee8ed8](https://github.com/BjornMelin/bjornmelin-platform-io/commit/aee8ed822b2d5105ba6a70069fe65e5d60dc268a))
* **api:** Implement portfolio router with CRUD operations and schema validation ([04b297d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/04b297d7a0346778e05fc39d2c1249a04f3d3f71))
* **api:** Refactor portfolio router input schema for improved clarity and type safety ([851ec52](https://github.com/BjornMelin/bjornmelin-platform-io/commit/851ec5268e1acb3ad00614dbae40822d01c9c8ee))
* **api:** Refactor Providers component and TRPC context for improved data handling ([0d8b36b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/0d8b36bd568378f6c10c24e1633c13155151c6ff))
* **api:** Refactor TRPC client setup to use createTRPCReact ([57bed6d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/57bed6d3b64f41716e52ae3996a048675c99dae9))
* **api:** Update project configuration and dependencies for monorepo setup ([5f7aea0](https://github.com/BjornMelin/bjornmelin-platform-io/commit/5f7aea027a99d4e4945000b22f8d4a95bcb96153))
* **api:** Update project configuration and dependencies for monorepo setup ([53f500a](https://github.com/BjornMelin/bjornmelin-platform-io/commit/53f500a1124bc0dad0064da54d0aa0df3a1f8ccc))
* **api:** Update TRPC dependencies and introduce Providers component ([e3d0a37](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e3d0a375837f0e38a281b491d6d812c8bf567633))
* **app:** Integrate Providers component into RootLayout for enhanced context management ([99c8a10](https://github.com/BjornMelin/bjornmelin-platform-io/commit/99c8a1085adb2ac7e48044022dc824cd3fff7a24))
* **app:** Introduce environment configuration and enhance layout metadata ([6e9bbff](https://github.com/BjornMelin/bjornmelin-platform-io/commit/6e9bbffb9db0d943e6db9bab601a7867e448b791))
* **app:** Revamp About and Contact pages, add ProjectGrid and Hero components ([b82bee3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b82bee3dfdb18ddd4df24084996eeca7820f8b44))
* **app:** Update configuration and dependencies for improved styling and functionality ([379ebd4](https://github.com/BjornMelin/bjornmelin-platform-io/commit/379ebd4888244231d131959761e774e5f07600f1))
* **app:** Update configuration, dependencies, and layout for improved styling and functionality ([4da3fb6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4da3fb6e05471e14fc1bdbbb43b592cd87a2c0a3))
* **app:** Update project configuration for monorepo setup ([2c9980b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/2c9980b81e6b9ada21d8e70f2e995a3fbdb5289d))
* **assets:** Add new certification images ([3662f84](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3662f841d579b2caa9aa4f2b4155d4789bacde2a))
* **blog:** Add BlogPage and BlogPostCard components for blog section ([b8fa279](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b8fa2795995d8895b03b1cf81d8338fcff7e62ec))
* **certifications:** Add new AWS certification images ([50b1adf](https://github.com/BjornMelin/bjornmelin-platform-io/commit/50b1adf0c2a6afd076ab51e1c83397badd8d2e75))
* **certifications:** Add new machine learning and AI certifications ([c94bfbe](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c94bfbe916ca1de8ef461f3365cc12bc48ffddbe))
* **ci:** implement release-please and consolidate CI/CD workflows ([#191](https://github.com/BjornMelin/bjornmelin-platform-io/issues/191)) ([c3ac2e1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c3ac2e131117fdbe724296919d72145337cdb148))
* **components:** Add AboutHero component and update About section for enhanced presentation ([0fd9c87](https://github.com/BjornMelin/bjornmelin-platform-io/commit/0fd9c87f1d20e91cfc38964d1560fc17c6c91b9f))
* **components:** Add FeaturedProjects and SocialLinks components, update Hero and ProjectsSection imports ([93a8723](https://github.com/BjornMelin/bjornmelin-platform-io/commit/93a87230808ed66e4d7199c5ec166fb4371b8d74))
* **components:** Add footer components for enhanced layout ([c6aeb73](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c6aeb735cd24bd0fae3645e1de5ff98176a728ca))
* **components:** Add MarketingFooter and MarketingNavbar for enhanced marketing layout ([a54cec3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/a54cec3071074b3881372ebcbee40ee34a877dca))
* **components:** Add new shadcn/ui UI components for enhanced user experience ([eb18056](https://github.com/BjornMelin/bjornmelin-platform-io/commit/eb18056f6019eadad4c45df7ec80a4ad1258728e))
* **components:** Add ProjectCard and ProjectGrid components for project display ([83e2828](https://github.com/BjornMelin/bjornmelin-platform-io/commit/83e2828776a98cfdfdb80d13b37ed75cc99e9d5d))
* **components:** Add ProjectIllustration and TechIcons components for enhanced visual representation ([1419c82](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1419c8262a2feeb56f821bf90a21658ddaa564a9))
* **components:** Refactor Button component for enhanced styling and functionality ([33fe6a1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/33fe6a19cdfd281d3c9c6995ef5a7e2ed5cbe4d3))
* **components:** Refactor Header and Hero components for improved layout and functionality ([5e694f1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/5e694f18c98f11f46b9a637f4b1790d156a6e742))
* **components:** Refactor ProjectCard, ProjectGrid, About, FeaturedProjects, and Hero components for improved structure and functionality ([1dbab3b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1dbab3bf07f831623253816f74620cc98b413245))
* **components:** Refactor social links integration and enhance icon support ([e440510](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e440510a10e799ac37f8494c4b090d68e3b8f833))
* **components:** Refactor social links integration and enhance icon support ([31d1ba7](https://github.com/BjornMelin/bjornmelin-platform-io/commit/31d1ba726b874aa7074f10a7cb6713497c6970d9))
* **components:** Remove layout components for a streamlined design ([a44b6f6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/a44b6f6a1b1b43b93d07a6c106482b1d540c8bf5))
* **config:** Add initial ESLint and configuration packages for monorepo ([39d7530](https://github.com/BjornMelin/bjornmelin-platform-io/commit/39d75301ec049b9d6f9e34ccd826741c0f8fe4c0))
* **config:** Enable static export in Next.js configuration ([86d4873](https://github.com/BjornMelin/bjornmelin-platform-io/commit/86d4873136e91e385f125e21d8ad3b935579812c))
* **config:** Enhance Next.js configuration with strict mode and environment variables ([1568b29](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1568b296630a2b4cd492899511d1142912a83a82))
* **config:** Update Next.js configuration for image optimization and trailing slashes ([b82ef6b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b82ef6bf1bcb3c033516eb7705ed253b47408c1f))
* **config:** Update Next.js configuration for static export and improve image handling ([00ec296](https://github.com/BjornMelin/bjornmelin-platform-io/commit/00ec2965d733d30ddc82dce045bedeae46a68ea7))
* **contact:** Implement contact form API and enhance form validation ([225b024](https://github.com/BjornMelin/bjornmelin-platform-io/commit/225b02449714873a14ecf8bdb13c2a222446ede1))
* **contact:** Implement contact form with validation and submission handling ([4f245e7](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4f245e746b4ab09b9f0ca8a85f9ca561594aac19))
* **contact:** Implement CORS support for contact form API ([afb725c](https://github.com/BjornMelin/bjornmelin-platform-io/commit/afb725c2aa1a35116291b135a32f16dd43080fd4))
* **contact:** Integrate AWS SES for contact form submissions and enhance user feedback ([0e1d947](https://github.com/BjornMelin/bjornmelin-platform-io/commit/0e1d947a6170f3d9ab1777826238c268e0c762cc))
* **contact:** Refactor contact form handling and enhance API integration ([d6a3a45](https://github.com/BjornMelin/bjornmelin-platform-io/commit/d6a3a45267b7f908fe86977dacac2854e312d895))
* **contact:** Revamp contact page with new layout and integrated contact form ([6e79fa4](https://github.com/BjornMelin/bjornmelin-platform-io/commit/6e79fa411d6b8b43a2c785121332426d717a066b))
* **data:** Add certifications, education, experience, hobbies, and skills data structures ([76489db](https://github.com/BjornMelin/bjornmelin-platform-io/commit/76489dbbd4e061b6ce2d4fd98390a912b919229b))
* **deploy:** Added GHA Workflow to deploy infrastructure and UI ([9d25bcc](https://github.com/BjornMelin/bjornmelin-platform-io/commit/9d25bcc7d046ecedd4293afcf666b469f2543ef6))
* **deploy:** Revamp deployment workflows for frontend and infrastructure ([e5aa030](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e5aa03055976a4528d794fd6326c447d10a37f16))
* **deps:** Upgrade TRPC packages and adjust TypeScript configuration ([3e02036](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3e02036afd4c9ed4adcb2f1641e485400b793226))
* **docs:** Add README.md for Bjorn Melin's portfolio website ([4dd61f0](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4dd61f06169c43770ca4db5f7583743239177399))
* **education:** Update academic details and leadership roles ([87a76f3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/87a76f3548c9726285c7cee13302bccbdd7433ba))
* **email:** Implement Email Service and Error Boundary components ([102a9f9](https://github.com/BjornMelin/bjornmelin-platform-io/commit/102a9f988aafc144c87fa290dc4ea20d954f2375))
* **experience:** Comprehensively update professional experience details ([b4f0a25](https://github.com/BjornMelin/bjornmelin-platform-io/commit/b4f0a25631baf50cfd8d01dbed2ac3c82c1f62e4))
* **favicon, metadata, docs:** Add custom favicon.ico, update SEO metadata, update docs ([9a0791d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/9a0791d84ff4cc1de21121de07addde9f918e7bc))
* **icons:** Add GitHub and LinkedIn SVG icons for social integration ([8e5f26c](https://github.com/BjornMelin/bjornmelin-platform-io/commit/8e5f26cf7093e7f3072b1c98896eb75295dfc8ee))
* implement comprehensive task-master project structure and enhanced PRD ([#47](https://github.com/BjornMelin/bjornmelin-platform-io/issues/47)) ([1ce5924](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1ce5924b56f5eec61b925acde5e94de6ecf90a59))
* **infra:** Add CDK context for hosted zone and update dependencies ([240ecd2](https://github.com/BjornMelin/bjornmelin-platform-io/commit/240ecd2cefe50797960920820340f341de94c432))
* **infra:** Add CORS support and allow unauthenticated access to contact API ([32576f6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/32576f69a03860d0340c6f252aa27391d3b18f88))
* **infra:** add cross-stack monitoring, security hardening, and comprehensive tests ([#210](https://github.com/BjornMelin/bjornmelin-platform-io/issues/210)) ([ba097bf](https://github.com/BjornMelin/bjornmelin-platform-io/commit/ba097bfe45837cf0787072ff53a843e42eeda23f))
* **infra:** Add Email Stack and Contact Form Functionality ([59147fb](https://github.com/BjornMelin/bjornmelin-platform-io/commit/59147fb453db66a917b5efd2285cf48a14cb5c4c))
* **infra:** Add initial AWS CDK infrastructure setup ([ef768c3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/ef768c34ed04d4a9418fc023d8cb3480a5defe2a))
* **infra:** Add production environment variables and enhance storage stack logging ([25c798b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/25c798bfa9af55cb653de1dff338b73c888ce2c3))
* **infra:** Enhance deployment scripts and update dependencies ([6b372a3](https://github.com/BjornMelin/bjornmelin-platform-io/commit/6b372a3f5f18d7aac39c164dc82a07e8beed25ac))
* **infra:** Enhance deployment, DNS, and storage stacks with improved IAM policies and resource tagging ([119484a](https://github.com/BjornMelin/bjornmelin-platform-io/commit/119484ad3783514b2918453782480ff2a8bfe89a))
* **infra:** Enhance Email and Monitoring stacks with new features and metrics ([e0a2824](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e0a282400569187cf190fc2347a17d6f891ee5ff))
* **infra:** Enhance EmailStack with API Gateway logging and monitoring ([69bf8a5](https://github.com/BjornMelin/bjornmelin-platform-io/commit/69bf8a54e858c51d0634fecb8cb59f021b8a56c7))
* **infra:** Finalized Initial AWS Infrastructure S3 Static Site Deployment ([7671b36](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7671b365e24e0a70dc6c9ed6c6a64fcef7c080c6))
* **infra:** read contact recipient from SSM; grant IAM and plumb param\n\n- Pass SSM_RECIPIENT_EMAIL_PARAM to Lambda and grant ssm:GetParameter\n- Remove recipient from stack config; rely on SSM runtime resolution\n- Fix Biome lint (no non-null assertion)\n- Align infra build; types clean ([5fec72b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/5fec72bf8171ec2419a9b14a9cacbd39fc905569))
* **infra:** Refactor infrastructure stacks and update deployment process ([7651434](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7651434a6776fcb8afa53fa2ba0ecf181f208264))
* **infrastructure:** Add email deployment command to README ([4b3db1c](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4b3db1c5d5c15f0483b67246cdc686a750a6cdf7))
* **infra:** Update configuration constants and add getStackName function ([74b8ae1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/74b8ae19a8b1dd8ae5e3113e8fbec19ba42b9549))
* **infra:** Update deployment workflow and package dependencies ([4de9631](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4de9631a11acddd628735f2a7124513138e951e5))
* **infra:** Update DeploymentStack with additional CloudFormation resource ARNs ([908be38](https://github.com/BjornMelin/bjornmelin-platform-io/commit/908be38b10eca19669ca1b6831cb72d1d0553aa6))
* **infra:** Update infrastructure code and enhance deployment process ([701022c](https://github.com/BjornMelin/bjornmelin-platform-io/commit/701022c6b6d6ee48e5fba20b95ed3c5f20013838))
* **layout, navbar:** Enhance layout metadata and improve navbar structure ([36c03cd](https://github.com/BjornMelin/bjornmelin-platform-io/commit/36c03cd06b83a6ff19ae89a9291076a3fc60b937))
* **layout:** Add Open Graph and Twitter metadata for improved SEO and sharing ([4e6d618](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4e6d6182c35c1d0daf8286f335fb9a05812ef780))
* **layout:** Add Open Graph and Twitter metadata for improved SEO and sharing ([3e427f7](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3e427f75479b52c8f2edd6fb5c840c4d47387e55))
* **layout:** Refactor layout and metadata for improved structure and styling ([3a8f8f1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3a8f8f1fe4fa789d6364c28510a3bf49417cc2e8))
* **loading, error-handler:** Add loading component and centralized API error handling ([f465071](https://github.com/BjornMelin/bjornmelin-platform-io/commit/f465071cae426fa6cd5b6160da13541aa11d6140))
* **marketing, portfolio:** Add layout and page components for marketing and portfolio sections ([237eb73](https://github.com/BjornMelin/bjornmelin-platform-io/commit/237eb7392256142f65726c5221daa0f8d4e1d2ed))
* **metadata:** Enhance Open Graph and Twitter metadata for improved SEO and sharing ([95b0f5e](https://github.com/BjornMelin/bjornmelin-platform-io/commit/95b0f5e62855892b8120018dbf7c295b87e5be05))
* **metadata:** Enhance Open Graph and Twitter metadata for improved SEO and sharing on home page ([2891c15](https://github.com/BjornMelin/bjornmelin-platform-io/commit/2891c155de183a2fe6dc25ba15648051675d0ca4))
* **metadata:** Update keywords and descriptions to reflect expertise in neuro-symbolic AI and MLOps ([e691254](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e691254597396b914a05967a4a89e87bb3c9b4e3))
* **navbar:** Add BaseNavbar and marketing/portfolio navigation components ([e7aed05](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e7aed05b3146c1ede712bd8d55e79b4051cd248e))
* **navbar:** Remove Blog link from the navigation bar ([c35165d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c35165d4898cc17863a40afc8b103e4d0ee45a1a))
* **pages:** Add main sections for portfolio website ([43d3f4a](https://github.com/BjornMelin/bjornmelin-platform-io/commit/43d3f4abc315d90c886e779d3d0dd20eef19eb1c))
* **projects:** Update project portfolio with new AI and web development projects ([afb805b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/afb805b0f5c89aeace6e9503f9af7df99ce2b10b))
* replace AWS SES with Resend and add contact form security ([#190](https://github.com/BjornMelin/bjornmelin-platform-io/issues/190)) ([1358244](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1358244ec8e8a79d26ab213c9d535bdea144b173))
* **sections:** Add new sections for contact, experience, projects, and skills ([af531d4](https://github.com/BjornMelin/bjornmelin-platform-io/commit/af531d45414715e3947a39a8e73aeb0088bab835))
* **seo, docs:** v1.0.1 release including SEO optimization and updated/improved documentation ([08b75e4](https://github.com/BjornMelin/bjornmelin-platform-io/commit/08b75e4db6b19c6cb70e344c7b6849355ed75b3c))
* **seo:** v1.0.2 release - add OpenGraph and Twitter metadata to home page to avoid overwriting ([00a4183](https://github.com/BjornMelin/bjornmelin-platform-io/commit/00a4183c101175d2876103f2733163f5961c3af8))
* **skills:** Enhance and expand skill categories with more technical depth ([cf0dacd](https://github.com/BjornMelin/bjornmelin-platform-io/commit/cf0dacd7da11aa3da21387eaa39e387dbd3a26d2))
* **ssm:** implement getParameter function for AWS SSM; includes caching mechanism for improved performance ([635d6cf](https://github.com/BjornMelin/bjornmelin-platform-io/commit/635d6cf700f9c16fbaab415da9a54bf08e776eb0))
* **styles:** Add global CSS styles with Tailwind CSS configuration ([ef19430](https://github.com/BjornMelin/bjornmelin-platform-io/commit/ef19430347b79ec9ae29d3684e7bc7dd501410d0))
* **tailwind-config:** Update Tailwind CSS configuration and package metadata ([d4563e9](https://github.com/BjornMelin/bjornmelin-platform-io/commit/d4563e9bf1cf10f666f803fe644787e3c3ad80f4))
* **tsconfig:** Refactor TypeScript configuration for monorepo ([bef51cf](https://github.com/BjornMelin/bjornmelin-platform-io/commit/bef51cf44e8e224b3672ebbc58a9be0c4ea8d8b7))
* **ui:** Add Input, Textarea, Toast, Toaster, and useToast for enhanced user interaction ([971d9c8](https://github.com/BjornMelin/bjornmelin-platform-io/commit/971d9c84c01e7eb51ae3554c23736ff39db50f31))
* **ui:** Update index exports to include layout and shared components ([411b8d6](https://github.com/BjornMelin/bjornmelin-platform-io/commit/411b8d6c51672ebc7e0ea59e55a33506b647f8f2))
* **utils:** Add formatDate utility function for improved date formatting ([7475eb1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7475eb19737e985848d9eb434f4fce4e848bee74))
* **workflow:** Add static build command and enhance deployment process ([fc2710f](https://github.com/BjornMelin/bjornmelin-platform-io/commit/fc2710f6980a3ffa5db0c46c0fe2d80352744cfc))
* **workflow:** Enhance deployment process by refining dependency installation ([a6fbc99](https://github.com/BjornMelin/bjornmelin-platform-io/commit/a6fbc99cd9980f584cfd17f8e39b180d1309dda9))
* **workflow:** Enhance deployment workflow with stack output retrieval and error handling ([7413e28](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7413e2830fc35cb347a7a1746d99f286d324e1ba))


### Bug Fixes

* add minimal dependencies to make workflows pass ([5261d59](https://github.com/BjornMelin/bjornmelin-platform-io/commit/5261d59192199c0bff18feca42877dcb32065b6f))
* address security and code review issues in workflows ([2afc4fc](https://github.com/BjornMelin/bjornmelin-platform-io/commit/2afc4fc28c22d113d1c75d3c9503fc2ea8e41337))
* **api:** Enhance error handling in TRPC route ([1494368](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1494368a0fbd8fdd8751ba3f8fb7c55518adc061))
* **blog-menu:** remove unused blog option from menu dropdown, bump v1.0.1 ([5148211](https://github.com/BjornMelin/bjornmelin-platform-io/commit/5148211783b004001c2170fd1d52d02cb8b3cb7e))
* CI workflow environment validation and coverage thresholds, Pin CI versions ([7ccfd6d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7ccfd6d7840c4776c659738816808ab8819c75a7))
* **cloudfront:** support Next.js static export routing ([#212](https://github.com/BjornMelin/bjornmelin-platform-io/issues/212)) ([bf30b85](https://github.com/BjornMelin/bjornmelin-platform-io/commit/bf30b8545c1bfecd68f57e37b300534b9c6e4676))
* **csp:** sync Next inline script hashes ([#219](https://github.com/BjornMelin/bjornmelin-platform-io/issues/219)) ([1c0f56d](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1c0f56d158af8756df3ec7a72411935ac15da523))
* **deps:** resolve security advisories GHSA-93m4-6634-74q7 and GHSA-67mh-4wv8-2f99 ([#214](https://github.com/BjornMelin/bjornmelin-platform-io/issues/214)) ([831c8d9](https://github.com/BjornMelin/bjornmelin-platform-io/commit/831c8d9aff7c97719e1675a7e859290414c666ba))
* ensure pnpm is installed in deploy workflow ([c3db48a](https://github.com/BjornMelin/bjornmelin-platform-io/commit/c3db48a01c2533acb0028e754c8a60f7b3e135cd))
* harden cloudfront rewrite function ([#213](https://github.com/BjornMelin/bjornmelin-platform-io/issues/213)) ([028f313](https://github.com/BjornMelin/bjornmelin-platform-io/commit/028f313a20b7eb0daed471062d7623774386014e))
* harden contact workflow error handling ([ba898b2](https://github.com/BjornMelin/bjornmelin-platform-io/commit/ba898b2071cb067b348e9f7bd3fa61f7df3a6d60))
* **hero:** Update link hrefs for contact and projects sections ([1c1dcba](https://github.com/BjornMelin/bjornmelin-platform-io/commit/1c1dcbaa383d351d1a2de08fcfb98536f55a7961))
* **infra:** allow contact Lambda to decrypt SSM params ([#198](https://github.com/BjornMelin/bjornmelin-platform-io/issues/198)) ([cf640a1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/cf640a138cc1249c99425c5ebf247641810f90cf))
* **infra:** allow inline scripts for Next.js hydration ([#218](https://github.com/BjornMelin/bjornmelin-platform-io/issues/218)) ([7728ea9](https://github.com/BjornMelin/bjornmelin-platform-io/commit/7728ea9659b4db4686057ad3730629e5188d19dd))
* **infra:** unblock CDK deploy in CI ([df58417](https://github.com/BjornMelin/bjornmelin-platform-io/commit/df58417c94a4b160f80f48af9de97375c1051a77))
* SES typing issues causing lint failures, missing infra pnpm-lock.yml for GHA ([da39101](https://github.com/BjornMelin/bjornmelin-platform-io/commit/da39101034736d13aaed6245cf344a4698391dbc))
* **setup-node-pnpm:** enhance Corepack activation with fallback to npm global install ([3e46d40](https://github.com/BjornMelin/bjornmelin-platform-io/commit/3e46d40572ac9ec09293b2440728effde76d067e))
* **setup-node-pnpm:** enhance Corepack activation with fallback to npm global install ([4b4c146](https://github.com/BjornMelin/bjornmelin-platform-io/commit/4b4c146e59173f87a4c7f9c0996a85af9c010fe7))
* **theme-toggle:** prevent hydration mismatch in static export ([#216](https://github.com/BjornMelin/bjornmelin-platform-io/issues/216)) ([791a763](https://github.com/BjornMelin/bjornmelin-platform-io/commit/791a763d5cad4a4142f1232858cb0a28fe1577ac))
* **theme:** enable theme persistence in static export ([#217](https://github.com/BjornMelin/bjornmelin-platform-io/issues/217)) ([23c7ae1](https://github.com/BjornMelin/bjornmelin-platform-io/commit/23c7ae14af8ec210f25501427399ae3d0c986969))
* update auto-release workflow to correctly set NEXT_VERSION environment variable and use it in PR title and body ([e956f5b](https://github.com/BjornMelin/bjornmelin-platform-io/commit/e956f5b7b81e3bd8b7ce239fbd46c67abacc095c))

## [Unreleased]

### Removed

- Removed npm release workflow and semantic-release tooling; this site is not published to npm.
 - CI: Removed the forward-compat (Node 25) job from `ci.yml` to simplify the pipeline and avoid flaky pnpm/cache interactions.

### Added

- Codex-assisted auto-release (PR) workflow that computes a SemVer floor from code changes, uses Codex to decide the
  final bump from the full diff, and opens a Release PR with a package.json version bump.
- Finalize-release workflow that, upon merging the Release PR to `main`, tags the merge commit and publishes a GitHub
  Release with auto-generated notes.
- Release notes configuration via `.github/release.yml` and documentation under `docs/development/releasing.md`.
 - CI: Explicit pnpm installation via `pnpm/action-setup@v4` in all workflows using pnpm to guarantee availability on PATH before caching/usage.
 - Tests: Added missing suites for UI and API error paths
   - Components: Theme toggle (render), ErrorBoundary (fallback), Navbar/Footer (smoke), Projects grid/card (filtering + links)
   - API: `/api/contact` invalid JSON and validation errors (400 with codes)
 - JSDoc: Added `@fileoverview` and symbol docs for touched components (theme, layout, projects, contact form) to follow Google style.

### CI/Automation

- Auto-release loop guard to prevent re-triggering on release commits.
- Auto-release now uses the shared composite action for Node/pnpm setup and caching.
- Added actionlint to CI to validate workflow expressions and contexts.
- Fixed deploy workflow summary and notification steps to avoid invalid `||` expressions.
 - Standardized pnpm setup across all workflows: install pnpm via `pnpm/action-setup@v4` before any pnpm command or `cache: pnpm` usage; rely on `package.json:packageManager` for the version.
 - Shellcheck cleanup in workflows: quote `$GITHUB_OUTPUT`, prefer grouped redirects, and use `read -r` in loops.
 - Ensured composite action `.github/actions/setup-node-pnpm` remains for Node setup and caching; now strictly preceded by pnpm installation.
 - Deploy: Ensure `NEXT_PUBLIC_APP_URL` is exported in build environment so Next.js env validation passes; build reads repository `vars`.

### Changed

- Documentation updates across CI/CD docs to explain the new release process and controls.

- Infrastructure: Email contact Lambda now reads recipient from AWS SSM Parameter Store; stack passes
  `SSM_RECIPIENT_EMAIL_PARAM` and grants `ssm:GetParameter` on that path. Removes need for
  `RECIPIENT_EMAIL` in Lambda env.
  - Enforce SSM-only resolution (removed RECIPIENT_EMAIL fallback) and added infra tests
    (EmailStack IAM policy, SSM env plumbing, recipient resolver cache). Local infra tests run via Vitest.
  - Add comprehensive infra tests: DNS stack (ACM SANs + outputs), Storage stack (S3 security, OAC wiring,
    DNS aliases), cache and security headers policies, Email stack domain/base-path mapping and tracing,
    Monitoring dashboard and alarms, SSM helper caching, and basic constants coverage. Tests avoid AWS lookups by mocking
    HostedZone.fromLookup and NodejsFunction bundling.
 - Vitest config: broaden coverage to include new component targets while excluding library wrappers/sections; use v8 reporters (`text, html, lcov, json, json-summary`).
 - Coverage thresholds: keep 80% for lines/branches/statements; start functions at 65% (env-overridable via `COVERAGE_THRESHOLD_FUNCTIONS`), with intent to raise as targeted suites land.

## [1.2.0] - 2025-10-18

### Changed

- Runtime upgraded to Node 24 LTS; pin to `v24.10.0` via `.nvmrc` and `"engines": { "node": ">=24 <25" }` in `package.json`.
- Standardize pnpm activation through Corepack using the exact `packageManager` version (currently `pnpm@10.28.0`).
- Consolidate GitHub Actions to read Node version from `.nvmrc` and pnpm from `package.json`;
  remove per-workflow Node/pnpm env pins.
- Update all CI jobs to cache the pnpm store and run `pnpm install --frozen-lockfile` deterministically.
- Bump `@types/node` to `^24` in root and infrastructure workspaces; validate type-check and build.

### Added

- Dockerfile using Node `24-bookworm-slim` for build and a minimalist static server image for runtime (Next.js `output: 'export'`).

### Migration Notes

- Ensure you are on Node 24.x: `nvm use` (reads `.nvmrc`).
- Corepack is enabled automatically in CI; locally run
  `corepack enable && corepack use $(node -p "require('./package.json').packageManager")`
  if needed.
- No deprecated Node APIs were present; no code changes required beyond version pins.

### Added

- Introduce `.github/actions/setup-node-pnpm` to centralize Node.js/pnpm setup
  and caching across workflows.
- Implement `pnpm audit` severity gating with a JSON report evaluator and job
  summary output.
- Add CDK assertion tests for `DeploymentStack` tag propagation and
  `MonitoringStack` alert recipients.
- Create markdownlint automation and normalize documentation formatting across
  `/docs`.
- Provision the `prod-portfolio-deploy` GitHub OIDC IAM role and attach
  scoped S3/CloudFront policies.
- Add `.markdownlint.json` with a 120-character MD013 limit to keep prose
  formatting consistent while avoiding unnecessary wraps.

### Changed

- Upgraded Next.js to `14.2.33`, React to `18.3.1`, and aligned
  `eslint-config-next`, TypeScript, and Vite to patched releases.
- Standardized pnpm/Node versions (pnpm `10.28.0`, Node `>=20.11 <21`) in all
  workflows via the new composite action.
- Updated CodeQL workflow to use `github/codeql-action@v3` and documented the
  advanced-only configuration.
- Refactored the SES client utility with Google-style docstrings and strict
  optional environment handling.
- Parameterized monitoring alert emails via configuration and removed
  hard-coded addresses.
- Replaced all documentation references to Yarn with pnpm commands aligned to
  current project scripts.
- Updated `infrastructure.yml` to authenticate via GitHub OIDC, reuse the
  composite Node/pnpm action, and force Docker bundling to `linux/amd64`.
- Simplified `e2e-tests.yml` by adopting the composite action in both jobs and
  removing redundant caching logic.
- Refreshed `.github/workflows/README.md` to reflect the current workflow set
  and security posture.

### Removed

- Remove deprecated legacy IAM user outputs and supporting IAM/Secrets
  resources in favor of GitHub OIDC-only deployments.
- Removed `npm audit` from the security workflow, relying exclusively on pnpm
  for dependency scanning.
- Delete `codeartifact-backup.yml`, `workflow-status.yml`, and
  `test-matrix.yml` to reduce redundant or low-value automation.
