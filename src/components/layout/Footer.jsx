import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">RE</span>
              </div>
              <span className="font-bold text-xl text-white">
                Real Estate Analyzer
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Make smarter investment decisions with powerful real estate analysis tools.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/calculators" className="text-sm hover:text-white transition-colors">
                  Calculators
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Real Estate Analyzer. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link to="#" className="hover:text-white transition-colors">
                Sitemap
              </Link>
              <span>•</span>
              <Link to="#" className="hover:text-white transition-colors">
                Accessibility
              </Link>
              <span>•</span>
              <a href="mailto:support@reanalyzer.com" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;