import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, FileText } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import CreatorCredit from './CreatorCredit.jsx';
import { BRAND } from '../../constants/index.js';

// Public Footer — sticky to the bottom via the PublicLayout's min-h-screen
// flex column wrapper. Contains product + legal nav + creator credit.
const PRODUCT_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/questions', label: 'Question Bank' },
];
const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];
const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo className="h-8" />
            <p className="mt-3 text-xs text-slate-500">{BRAND.tagline}</p>
            <CreatorCredit className="mt-2" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product
            </h4>
            <ul className="mt-3 space-y-2">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-slate-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Company
            </h4>
            <ul className="mt-3 space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-slate-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Legal
            </h4>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-slate-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3 text-slate-500">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub"
                className="hover:text-slate-200"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="LinkedIn"
                className="hover:text-slate-200"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Twitter"
                className="hover:text-slate-200"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <Link to="/contact" aria-label="Contact" className="hover:text-slate-200">
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-6 text-center">
          <p className="text-xs text-slate-500">
            © {BRAND.year} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
