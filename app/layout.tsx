import type { Metadata } from "next";
import "devicon/devicon.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ingeniería en Sistemas | UNAN-Managua",
  description:
    "Experiencia interactiva para feria tecnológica basada en el perfil académico oficial de Ingeniería en Sistemas de UNAN-Managua.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
