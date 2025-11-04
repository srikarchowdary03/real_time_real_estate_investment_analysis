import React, { useState } from 'react';
import { Map, List, LayoutGrid } from 'lucide-react';

const TestButtons = () => {
  const [viewMode, setViewMode] = useState('list');

  return (
    <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
        Button Test Page
      </h1>
      
      <p style={{ marginBottom: '20px', color: '#666' }}>
        If you can see the buttons below, then buttons work fine. The issue is with PropertySearch page.
      </p>

      {/* Test Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            backgroundColor: viewMode === 'list' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'list' ? 'white' : '#374151',
          }}
        >
          <List size={24} />
          <span>LIST</span>
        </button>
        
        <button
          onClick={() => setViewMode('split')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            backgroundColor: viewMode === 'split' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'split' ? 'white' : '#374151',
          }}
        >
          <LayoutGrid size={24} />
          <span>SPLIT</span>
        </button>
        
        <button
          onClick={() => setViewMode('map')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            backgroundColor: viewMode === 'map' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'map' ? 'white' : '#374151',
          }}
        >
          <Map size={24} />
          <span>MAP</span>
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#DBEAFE', borderRadius: '8px' }}>
        <strong>Current View Mode:</strong> <span style={{ color: '#EF4444', fontSize: '18px', fontWeight: 'bold' }}>{viewMode.toUpperCase()}</span>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ If you see the buttons above:</h3>
        <p style={{ marginBottom: '8px' }}>The buttons work! The issue is in your PropertySearch.jsx file.</p>
        <p><strong>Next step:</strong> Share your PropertySearchBar.jsx component so I can see what's preventing the buttons from showing.</p>
      </div>
    </div>
  );
};

export default TestButtons;