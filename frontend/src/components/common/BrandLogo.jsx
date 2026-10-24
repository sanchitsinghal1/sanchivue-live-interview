import { Link } from 'react-router-dom';
import sanchivueLogo from '../../assets/branding/sanchivue-logo.svg';
import sanchivueMark from '../../assets/branding/sanchivue-mark.svg';

// BrandLogo renders the full horizontal lockup by default; pass `markOnly`
// to render just the symbol (for favicons, mobile sidebar, etc.).
// Size: pass a tailwind `h-*` class — default `h-8`.
export default function BrandLogo({ markOnly = false, className = 'h-8', to = '/' }) {
  const src = markOnly ? sanchivueMark : sanchivueLogo;
  return (
    <Link to={to} className="inline-flex items-center gap-2" aria-label="Sanchivue home">
      <img src={src} alt="Sanchivue" className={className} />
    </Link>
  );
}
