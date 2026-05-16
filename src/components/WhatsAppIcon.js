'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '@/lib/SettingsContext';

export default function WhatsAppIcon({ projectName }) {
    const { whatsappNumber } = useSettings();
    const phone = (whatsappNumber || '').replace(/\D/g, '');
    if (!phone) return null;
    const message = projectName
        ? `Hi! I would like to know more about ${projectName}.`
        : 'Hi! I would like to know more about your services.';
    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse hover:animate-none"
            title="Chat with us on WhatsApp"
        >
            <FaWhatsapp />
        </a>
    );
}
