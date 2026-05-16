import { FaXTwitter, FaWhatsapp, FaPinterest, FaLinkedinIn, FaFacebookF } from 'react-icons/fa6';

const shareUrls = ({ url, title }) => ({
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
});

export default function ShareButtons({ url, title }) {
    const links = shareUrls({ url, title });
    const icons = [
        { href: links.twitter, icon: <FaXTwitter />, color: 'bg-black', label: 'Share on Twitter' },
        { href: links.linkedin, icon: <FaLinkedinIn />, color: 'bg-[#0077b5]', label: 'Share on LinkedIn' },
        { href: links.pinterest, icon: <FaPinterest />, color: 'bg-[#b27e02]', label: 'Share on Pinterest' },
        { href: links.facebook, icon: <FaFacebookF />, color: 'bg-blue-600', label: 'Share on Facebook' },
        { href: links.whatsapp, icon: <FaWhatsapp />, color: 'bg-green-500', label: 'Share on WhatsApp' },
    ];
    return (
        <div className="flex flex-row gap-2 items-center justify-start">
            {icons.map(({ href, icon, color, label }, i) => (
                <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-md hover:scale-110 transition-all ${color}`}
                >
                    {icon}
                </a>
            ))}
        </div>
    );
}
