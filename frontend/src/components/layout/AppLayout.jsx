// =============================================================
// components/layout/AppLayout.jsx
// Understand Deen — Shared Layout Wrapper for Protected Pages
// =============================================================
// This component wraps EVERY protected route (see App.jsx).
// Auth pages (/login, /signup) are NOT wrapped here — they
// have their own full-page layouts without nav/footer.
//
// Renders:
//   <TopNavbar>   — fixed 64px header
//   <MobileDrawer> — slide-out panel (mobile only)
//   <main>        — scrollable content area for the current page
//   <Footer>      — bottom branding strip
//
// State owned here:
//   drawerOpen : boolean — whether the mobile drawer is visible
//   The drawer open/close state lives HERE (not in the nav
//   components) to follow the "lift state up" principle. Both
//   TopNavbar and MobileDrawer are passed what they need as props.
//
// Layout model:
//   - TopNavbar is position:fixed, so <main> needs paddingTop: 64px
//     (pt-16 in Tailwind) to avoid content sliding under the nav
//   - The min-height on <main> ensures the footer always sits at
//     the bottom of the viewport even on short pages
//
// Usage in App.jsx:
//   <Route path="/home" element={
//     <ProtectedRoute>
//       <AppLayout>
//         <Home />
//       </AppLayout>
//     </ProtectedRoute>
//   } />
// =============================================================

import React, { useState } from 'react';
import TopNavbar    from './TopNavbar.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import Footer       from './Footer.jsx';

const NAVBAR_HEIGHT = 64; // px — must match TopNavbar's h-16

const AppLayout = ({ children }) => {
  // ── Mobile drawer state ──────────────────────────────────
  // Lifted here so both TopNavbar (needs onMenuOpen) and
  // MobileDrawer (needs isOpen + onClose) can share it.
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div
      style={{
        minHeight:       '100vh',
        display:         'flex',
        flexDirection:   'column',
        backgroundColor: 'var(--bg-primary)',
      }}
    >

      {/* ── Fixed top navigation bar ──────────────────────── */}
      {/* Passes openDrawer so hamburger in TopNavbar can     */}
      {/* trigger the drawer state that lives here.           */}
      <TopNavbar onMenuOpen={openDrawer} />

      {/* ── Mobile slide-out drawer ───────────────────────── */}
      {/* Conditionally rendered inside MobileDrawer itself   */}
      {/* (returns null when isOpen=false for performance)    */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />

      {/* ── Main content area ─────────────────────────────── */}
      {/* paddingTop offsets the fixed navbar so page content */}
      {/* starts below the 64px bar, not underneath it.       */}
      {/* flex:1 pushes the footer to the bottom of the page. */}
      <main
        style={{
          flex:           1,
          paddingTop:     `${NAVBAR_HEIGHT}px`,
          display:        'flex',
          flexDirection:  'column',
          // Minimum height ensures footer stays at bottom
          // even on content-sparse pages
          minHeight:      `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <Footer />

    </div>
  );
};

export default AppLayout;
