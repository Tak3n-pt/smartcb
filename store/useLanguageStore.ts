// Language Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { I18nManager } from 'react-native';

export type Language = 'en' | 'ar';

interface LanguageState {
  language: Language;
  isRTL: boolean;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      isRTL: false,
      setLanguage: (language: Language) => {
        // Change i18n language
        i18n.changeLanguage(language);

        // Determine if RTL
        const isRTL = language === 'ar';

        // Update RTL in React Native (requires app restart to fully apply)
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
          // Note: Full RTL support requires app restart
          // We'll show a message to user in the UI
        }

        set({ language, isRTL });
      },
    }),
    {
      name: 'smartcb-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
