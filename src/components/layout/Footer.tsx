import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Facultad de Ingeniería Tampico, UAT. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
