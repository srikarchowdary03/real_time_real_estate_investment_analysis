import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/properties" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Properties
            </Link>
            <Link 
              to="/calculators" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Calculators
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center">
            <Link 
              to="/signin" 
              className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/properties"
                className="text-gray-700 hover:text-gray-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Properties
              </Link>
              <Link
                to="/calculators"
                className="text-gray-700 hover:text-gray-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Calculators
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-gray-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <hr className="border-gray-200" />
              <Link
  to="/signin"
  className="px-4 py-2 bg-red-600 text-white rounded-md font-medium text-center hover:bg-red-700"
  onClick={() => setIsMenuOpen(false)}
>
  Sign in
</Link> 
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;