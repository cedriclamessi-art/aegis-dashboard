import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
export function useDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await dashboardService.getStats();
                setStats(data);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
            finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);
    return { stats, loading, error };
}
