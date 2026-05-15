import 'react-i18next';
import en from '../public/locales/en/translations.json';
import zh from '../public/locales/zh/translations.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translations';
    resources: {
      en: typeof en;
      zh: typeof zh;
    };
  }
}
