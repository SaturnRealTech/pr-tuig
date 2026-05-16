'use client';

import { createContext, useContext } from 'react';

export const SettingsContext = createContext({
    siteName: '',
    siteLogo: '',
    contactPhone: '',
    whatsappNumber: '',
    cinNumber: '',
    copyrightText: '',
    footerTagline: '',
    footerDescription: '',
    footerTrustText: '',
    headerScrollBg: '#ffffff',
});

export function useSettings() {
    return useContext(SettingsContext);
}
