import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar.jsx';
import Footer from '../common/Footer.jsx';

// PublicLayout: marketing pages. min-h-screen + flex-col + footer.mt-auto
// ensures the footer is pinned to the bottom on short pages.
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
