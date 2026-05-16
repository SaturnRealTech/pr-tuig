'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/admin/projects/list');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🔄</div>
                <p className="text-xl text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}
