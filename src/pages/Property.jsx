import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPropertyDetails } from '../services/realtyAPI';

function normalizeDetail(res) {
    return (
        res?.data?.property ||
        res?.property ||
        res?.data ||
        res ||
        null
    );
}

export default function Property() {
    const { id } = useParams();
    const { state } = useLocation();
    const [property, setProperty] = useState(state?.property || null);
    const [loading, setLoading] = useState(!state?.property);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only fetch if you didn't receive a property via navigate state
        if (!state?.property) {
            (async () => {
                try {
                    setLoading(true);
                    const res = await getPropertyDetails(id);
                    const detail = normalizeDetail(res);
                    setProperty(detail || null);
                } catch (err) {
                    setError(err?.response?.data?.message || err.message || 'Failed to load property.');
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [id, state?.property]);

    if (loading) return <div className="p-6">Loading…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!property) return <div className="p-6">No details found.</div>;

    // Safely read common fields
    const addr = property?.location?.address || property?.address || {};
    const price = property?.list_price || property?.price;
    const beds = property?.description?.beds ?? property?.beds;
    const baths = property?.description?.baths ?? property?.baths;
    const sqft = property?.description?.sqft ?? property?.sqft;

    const photos =
        property?.photos ||
        property?.media?.photos ||
        property?.images ||
        [];

    const mainPhoto =
        photos?.[0]?.href ||
        photos?.[0]?.url ||
        property?.primary_photo?.href ||
        property?.primary_photo?.url ||
        '';

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="w-full">
                    {mainPhoto ? (
                        <img src={mainPhoto} alt="Property" className="w-full h-auto rounded-xl" />
                    ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                            No Image
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold">
                        {addr?.line ? `${addr.line}, ` : ''}
                        {addr?.city}
                        {addr?.state_code ? `, ${addr.state_code}` : ''}
                        {addr?.postal_code ? ` ${addr.postal_code}` : ''}
                    </h1>

                    <p className="text-xl mt-2">
                        {typeof price === 'number'
                            ? `$${price.toLocaleString()}`
                            : (price ?? '—')}
                    </p>

                    <div className="mt-2 text-gray-700">
                        <span>{beds ?? '—'} bd</span> · <span>{baths ?? '—'} ba</span> ·{' '}
                        <span>{sqft ? `${Number(sqft).toLocaleString()} sqft` : '—'}</span>
                    </div>

                    {property?.description?.text && (
                        <p className="mt-4 text-gray-700">{property.description.text}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
