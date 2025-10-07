import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">RE</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              Real Estate Analyzer
            </span>
          </Link>

          {/* Right side */}
          <div className="text-gray-600 text-sm font-medium">
            Coming soon
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;