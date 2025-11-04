import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ListingCard({ item }) {
    const navigate = useNavigate();
    const id = item?.property_id || item?.listing_id || item?.id;

    return (
        <div
      className= "cursor-pointer rounded-lg shadow p-4"
    onClick = {() => id && navigate(`/property/${id}`)
}
    >
    <h3 className="text-lg font-semibold" >
        { item?.branding?.listing_office?.name || 'Property'}
</h3>
    <p>
{ item?.location?.address?.line }, { item?.location?.address?.city }
</p>

    < button
className = "mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-white text-sm font-semibold hover:bg-red-700"
onClick = {(e) => {
    e.stopPropagation();
    id && navigate(`/property/${id}`);
}}
      >
    View details
        </button>
        </div>
  );
}
