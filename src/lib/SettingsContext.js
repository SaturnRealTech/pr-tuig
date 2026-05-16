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
});

export function useSettings() {
    return useContext(SettingsContext);
}
