import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import PropertyCalculator from '../components/features/PropertyCalculator';

export default function PropertyAnalysisPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if property data was passed via navigation state
    if (location.state?.propertyData) {
      setProperty(location.state.propertyData);
      setLoading(false);
    } else {
      // Otherwise try to fetch from Firebase
      fetchProperty();
    }
  }, [propertyId, location.state]);

  const fetchProperty = async () => {
    try {
      const docRef = doc(db, 'savedProperties', propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProperty({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analysis...</div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/properties')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Properties
        </button>
        
        <h1 className="text-3xl font-bold mb-2">Investment Analysis</h1>
        <p className="text-gray-600 mb-8">{property.address}</p>
        
        <PropertyCalculator property={property} />
      </div>
    </div>
  );
}