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
        <div className="fixed bottom-6 left-6 z-40 w-14 h-14">
            {/* Swimming / sonar rings — three offset pings emanating outward
                from behind the button for a soft attention-grabbing pulse. */}
            <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-green-400/40 animate-ping"
                style={{ animationDuration: '2.4s' }}
            />
            <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-green-400/30 animate-ping"
                style={{ animationDuration: '2.4s', animationDelay: '0.8s' }}
            />
            <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"
                style={{ animationDuration: '2.4s', animationDelay: '1.6s' }}
            />

            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 ring-2 ring-white/50"
                title="Chat with us on WhatsApp"
            >
                <FaWhatsapp />
            </a>
        </div>
    );
}
