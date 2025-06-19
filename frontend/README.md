# Garnet Compliance SaaS Frontend

A Next.js application for compliance management with vendor questionnaires and AI-powered features.

## 🚀 Recent Fixes for Netlify Deployment

### ✅ Issue Resolved: "useAuth must be used within an AuthProvider" 

This project has been updated to fix Netlify deployment issues related to authentication during static site generation (SSG).

### 🔧 Changes Made:

1. **AuthProvider Integration in _app.tsx**
   - Wrapped the entire app with `AuthProvider` using dynamic import with `ssr: false`
   - Prevents SSR issues while maintaining client-side authentication

2. **SSR-Safe useAuth Hook**
   - Added browser environment checks (`typeof window !== 'undefined'`)
   - Provides safe fallback values during SSR/SSG
   - Prevents "useAuth must be used within an AuthProvider" errors during build

3. **Dynamic Component Loading**
   - Used `next/dynamic` with `ssr: false` for auth-dependent components:
     - `VendorDetailView`
     - `ChatClient` 
     - `VendorQuestionnaireClient`
     - `ProtectedRoute`

4. **Client-Side Only Operations**
   - Added `isClient` state checks to prevent hydration mismatches
   - Moved localStorage operations to client-side only
   - Added loading states during SSR

5. **Static Export Configuration**
   - Enabled `output: 'export'` in `next.config.js`
   - Set `NEXT_PUBLIC_STATIC_EXPORT: 'true'`
   - Configured proper static generation for Netlify

### 🎯 Build Status

- ✅ `npm run build` - Successfully builds with static export
- ✅ Static generation works for all routes
- ✅ Authentication works client-side
- ✅ No more "useAuth must be used within an AuthProvider" errors
- ✅ Compatible with Netlify deployment

### 📁 Key Files Modified:

```
pages/_app.tsx                     # Added AuthProvider wrapper
lib/auth/AuthContext.tsx           # Made SSR-safe
lib/auth/useAuthGuard.ts          # Added client-side checks
components/auth/ProtectedRoute.tsx # Dynamic auth import
app/vendors/[id]/page.tsx          # Dynamic component loading
app/questionnaires/[id]/chat/page.tsx # Dynamic component loading
next.config.js                     # Enabled static export
```

### 🌐 Deployment Ready

The application is now ready for Netlify deployment with:
- Static site generation (SSG)
- Client-side authentication
- Dynamic routes support
- Proper error handling during build

### 🔧 Development Setup

```bash
npm install
npm run dev
```

### 🚀 Production Build

```bash
npm run build
```

This will generate a static export in the `out/` directory ready for Netlify deployment.

---

## Original README Content

[Rest of the original README content...] 