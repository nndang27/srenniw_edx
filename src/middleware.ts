import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isParentRoute = createRouteMatcher(['/parent(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect teacher and parent routes — redirect to sign-in if not logged in
  if (isTeacherRoute(req) || isParentRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
