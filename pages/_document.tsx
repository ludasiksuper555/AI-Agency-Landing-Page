import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="uk">
      <Head>
        {/* Мета-теги для SEO */}
        <meta name="description" content="Trae AI Agency - професійні послуги штучного інтелекту" />
        <meta name="keywords" content="AI, штучний інтелект, автоматизація, машинне навчання" />
        <meta name="author" content="Trae AI Agency" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Trae AI Agency" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Trae AI Agency" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        {/* Viewport for PWA */}
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />

        {/* Open Graph мета-теги */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Trae AI Agency" />
        <meta property="og:description" content="Професійні послуги штучного інтелекту" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:site_name" content="Trae AI Agency" />

        {/* Twitter Card мета-теги */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trae AI Agency" />
        <meta name="twitter:description" content="Професійні послуги штучного інтелекту" />
        <meta name="twitter:image" content="/twitter-image.jpg" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />

        {/* Android Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-icon-192x192.png" />

        {/* Microsoft Icons */}
        <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />

        {/* Preconnect для швидшого завантаження */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  }).then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Trae AI Agency',
              description: 'Професійні послуги штучного інтелекту',
              url: 'https://trae-ai-agency.com',
              logo: 'https://trae-ai-agency.com/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+380-XX-XXX-XXXX',
                contactType: 'customer service',
              },
              sameAs: [
                'https://www.facebook.com/traeaiagency',
                'https://www.linkedin.com/company/traeaiagency',
                'https://twitter.com/traeaiagency',
              ],
            }),
          }}
        />

        {/* CSP Nonce for inline scripts */}
        <meta name="csp-nonce" content="" />
      </Head>
      <body>
        <Main />
        <NextScript />

        {/* No-JS fallback */}
        <noscript>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              fontSize: '18px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            <div>
              <h2>JavaScript Required</h2>
              <p>This application requires JavaScript to function properly.</p>
              <p>Please enable JavaScript in your browser settings.</p>
            </div>
          </div>
        </noscript>
      </body>
    </Html>
  );
}
