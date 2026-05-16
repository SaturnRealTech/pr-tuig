'use client';

import { createContext, useContext } from 'react';

export const EnquireNowContext = createContext(null);

export function useEnquireNow() {
    return useContext(EnquireNowContext);
}
