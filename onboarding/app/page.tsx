// Middleware handles / routing: authenticated → /dashboard, unauthenticated → landing page
// This only renders if middleware is bypassed (e.g. direct server render with no cookie)
export default function Root() {
  return null;
}
