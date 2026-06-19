import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import "./globals.css";

const developerSupportWhatsappUrl = "https://wa.me/5512988601020";
const developerSupportPhone = "+55 (12) 98860-1020";

export const metadata: Metadata = {
  title: "PDV Face Delivery",
  description: "Ponto de venda com caixa, estoque, delivery e relatórios.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="flex flex-col flex-1 w-full">
          <main className="flex-1 flex flex-col">{children}</main>
          
          <div className="app-footer-shell mt-auto">
            <footer className="app-footer">
              <div className="app-footer-content container mx-auto flex flex-col gap-3 px-4 py-[0.5cm]">
                <h4 className="m-0 text-sm font-semibold text-white">PDV Face Delivery</h4>
                <div className="app-footer-scroll">
                  <div className="app-footer-row text-foreground">
                    <span className="app-footer-text text-xs">
                      Suporte do desenvolvedor, atualizações do sistema e atendimento técnico.
                    </span>
                    <a
                      href={developerSupportWhatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="app-footer-link app-footer-support-link group font-medium whitespace-nowrap"
                    >
                      <MessageCircle aria-hidden="true" className="app-footer-support-icon" size={15} />
                      <span className="app-footer-support-phone text-sm leading-none">
                        {developerSupportPhone}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
