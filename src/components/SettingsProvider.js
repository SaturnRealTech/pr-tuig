'use client';

import { SettingsContext } from '@/lib/SettingsContext';

export default function SettingsProvider({ settings, children }) {
    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
}
