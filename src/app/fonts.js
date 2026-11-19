import localFont from 'next/font/local';

export const doran = localFont({
  src: [
    { path: '../../public/fonts/doran/Doran-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/doran/Doran-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/doran/Doran-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/doran/Doran-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/doran/Doran-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-doran',
  display: 'swap',
});

export const rokh = localFont({
  src: [
    { path: '../../public/fonts/rokh/Rokh-HairLine.woff2', weight: '100', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Thin.woff2', weight: '200', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-ExtraLight.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Light.woff2', weight: '350', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: '../../public/fonts/rokh/Rokh-Black.woff2', weight: '950', style: 'normal' },
  ],
  variable: '--font-rokh',
  display: 'swap',
});

export const tajrid = localFont({
  src: [
    { path: '../../public/fonts/tajrid/Tajrid-UltraLight.woff2', weight: '200', style: 'normal' },
    { path: '../../public/fonts/tajrid/Tajrid-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/tajrid/Tajrid-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/tajrid/Tajrid-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/tajrid/Tajrid-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/tajrid/Tajrid-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-tajrid',
  display: 'swap',
});

export const falsafeh = localFont({
  src: [
    { path: '../../public/fonts/falsafeh/Falsafeh-Light.woff', weight: '300', style: 'normal' },
    { path: '../../public/fonts/falsafeh/Falsafeh-Bold.woff', weight: '700', style: 'normal' },
  ],
  variable: '--font-falsafeh',
  display: 'swap',
});
