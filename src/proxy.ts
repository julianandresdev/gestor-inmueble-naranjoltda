import { auth } from "@/auth";

export default auth;

export const config = {
  // El matcher excluye /api a propósito:
  // - La única ruta /api es /api/auth/[...nextauth] (el handler de Auth.js,
  //   exporta GET/POST desde @/auth). Auth.js gestiona su propia
  //   autorización por endpoint (csrf, session, providers, signin, signout,
  //   callback) y responder con un redirect a /login desde el middleware
  //   rompería su contrato (espera 4xx/5xx, no 302).
  // - Los handlers API en general esperan 401 JSON ante falta de sesión,
  //   no un redirect. Por eso el `authorized` callback está pensado sólo
  //   para páginas.
  // Si en el futuro se añade otra ruta /api sensible, hay que sacarla
  // explícitamente del matcher y protegerla dentro del propio handler.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};