import Link from "next/link";
import {
  BarChart2,
  BedDouble,
  Building2,
  CheckCircle,
  Cpu,
  CreditCard,
  Download,
  Dumbbell,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Package,
  QrCode,
  ScanFace,
  Scissors,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Users,
  Utensils,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";

import { ScrollRevealInit } from "./_components/scroll-reveal-init";
import { ThemeToggle } from "./_components/theme-toggle";

export const metadata = {
  title: "Face Delivery — Sistema de PDV que transforma seu negócio",
  description:
    "Mais que um software de caixa, o Face Delivery é o parceiro estratégico que transforma seus dados em lucro.",
};

export default function HomeMarketingPage() {
  return (
    <div className="fd-landing">
      <ScrollRevealInit />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fd-header">
        <div className="fd-header__inner">
          <div className="fd-header__brand">
            <svg
              className="fd-header__logo"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
                fill="#2563eb"
                opacity="0.15"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <path
                d="M35 30H65V40H45V50H60V60H45V75"
                stroke="#2563eb"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75"
                stroke="#2563eb"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
            <span className="fd-header__brand-name">Face Delivery</span>
          </div>

          <nav className="fd-header__nav">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#quem-usa">Quem usa</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Planos</a>
          </nav>

          <ThemeToggle />
          <Link href="/pdv" className="fd-header__cta">
            Acessar sistema
          </Link>
        </div>
      </header>

      {/* ── Hero (acima da dobra — anima via CSS, sem scroll trigger) ── */}
      <section className="fd-hero">
        <div className="fd-container fd-hero__inner">
          <div className="fd-hero__text fd-anim-left">
            <h1 className="fd-hero__title">
              Sistema de gestão que gera resultados para o seu negócio, loja ou rede.
            </h1>
            <p className="fd-hero__subtitle">
              Mais que um software de caixa, somos o parceiro estratégico que transforma
              seus dados em lucro.
            </p>
            <a
              href="https://wa.me/5512988601020?text=Olá!%20Vi%20o%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Face%20Delivery"
              className="fd-btn fd-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com um especialista
            </a>
          </div>

          <div className="fd-hero__image fd-anim-right">
            <div className="fd-devices" aria-hidden="true">
              {/* Tela grande (desktop): PDV em tela cheia */}
              <div className="fd-device fd-device--desktop">
                <div className="fd-mockup-topbar">
                  <span className="fd-mockup-dot" />
                  <span className="fd-mockup-dot" />
                  <span className="fd-mockup-dot" />
                  <div className="fd-mockup-url-bar" />
                </div>
                <div className="fd-device__screen fd-device__screen--desktop">
                  <iframe
                    className="fd-device__frame fd-device__frame--desktop"
                    src="/demo"
                    title="PDV Face Delivery em tela cheia"
                    loading="lazy"
                    scrolling="no"
                    tabIndex={-1}
                  />
                </div>
              </div>

              {/* Celular: o mesmo PDV no layout responsivo */}
              <div className="fd-device fd-device--phone">
                <span className="fd-device__notch" />
                <div className="fd-device__screen fd-device__screen--phone">
                  <iframe
                    className="fd-device__frame fd-device__frame--phone"
                    src="/demo"
                    title="PDV Face Delivery responsivo no celular"
                    loading="lazy"
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tipos de negócio ───────────────────────────────── */}
      <section className="fd-section fd-business" id="quem-usa">
        <div className="fd-container fd-business__inner">
          <div className="fd-business__heading" data-reveal="left">
            <h2 className="fd-section-title">Soluções para todo tipo de negócio</h2>
            <p className="fd-section-sub">
              Do mercado ao restaurante, da padaria à farmácia: o Face Delivery se adapta
              ao seu modelo.
            </p>
          </div>

          <div className="fd-business__cols">
            <div className="fd-business__col">
              {(
                [
                  { icon: <Store size={42} />, label: "Mercados e Supermercados" },
                  { icon: <Utensils size={42} />, label: "Restaurantes e Delivery" },
                  { icon: <Package size={42} />, label: "Conveniências e Bares" },
                  { icon: <Dumbbell size={42} />, label: "Academias e CrossFit" },
                  { icon: <Wrench size={42} />, label: "Oficinas e Auto centers" },
                  { icon: <ShoppingCart size={42} />, label: "Delivery e Ecommerce" },
                  { icon: <GraduationCap size={42} />, label: "Escolas e Plataformas de ensino online" },
                ] as const
              ).map(({ icon, label }, i) => (
                <div
                  key={label}
                  className="fd-biz-card"
                  data-reveal="up"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="fd-biz-card__icon">{icon}</div>
                  <h3 className="fd-biz-card__label">{label}</h3>
                </div>
              ))}
            </div>

            <div className="fd-business__col">
              {(
                [
                  { icon: <Truck size={42} />, label: "Atacados e Distribuidoras" },
                  { icon: <Warehouse size={42} />, label: "Padarias e Confeitarias" },
                  { icon: <Users size={42} />, label: "Farmácias e Drogarias" },
                  { icon: <Building2 size={42} />, label: "Administradoras e Condomínios" },
                  { icon: <BedDouble size={42} />, label: "Hotéis e Pousadas" },
                  { icon: <Scissors size={42} />, label: "Salões e Barbearias" },
                  { icon: <Cpu size={42} />, label: "Automações e Dashboards (IoT)" },
                ] as const
              ).map(({ icon, label }, i) => (
                <div
                  key={label}
                  className="fd-biz-card"
                  data-reveal="up"
                  style={{ transitionDelay: `${(i + 7) * 100}ms` }}
                >
                  <div className="fd-biz-card__icon">{icon}</div>
                  <h3 className="fd-biz-card__label">{label}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ────────────────────────────────── */}
      <section className="fd-section fd-features" id="funcionalidades">
        <div className="fd-container">
          <div className="fd-features__heading" data-reveal="up">
            <h2 className="fd-section-title">
              Tudo o que você precisa para simplificar a gestão
              <br />e crescer com controle
            </h2>
          </div>

          <div className="fd-features__cols">
            <div className="fd-features__col">
              {(
                [
                  { icon: <Package size={30} />, label: "Gestão completa de produtos e estoque" },
                  { icon: <CreditCard size={30} />, label: "Cobrança via Pix, boleto e cartão" },
                  { icon: <BarChart2 size={30} />, label: "Indicadores de resultados" },
                  { icon: <QrCode size={30} />, label: "Check-in com QR Code ou biometria" },
                ] as const
              ).map(({ icon, label }, i) => (
                <div
                  key={label}
                  className="fd-feat-item"
                  data-reveal="left"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="fd-feat-item__icon">{icon}</div>
                  <h5 className="fd-feat-item__label">{label}</h5>
                </div>
              ))}
            </div>

            <div className="fd-features__col">
              {(
                [
                  { icon: <Smartphone size={30} />, label: "Acesso via celular e painel web" },
                  { icon: <FileText size={30} />, label: "Emissão de NF-e e NFC-e" },
                  { icon: <Headphones size={30} />, label: "Suporte especializado" },
                  { icon: <Download size={30} />, label: "Importação eficiente de dados" },
                ] as const
              ).map(({ icon, label }, i) => (
                <div
                  key={label}
                  className="fd-feat-item"
                  data-reveal="right"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="fd-feat-item__icon">{icon}</div>
                  <h5 className="fd-feat-item__label">{label}</h5>
                </div>
              ))}
            </div>
          </div>

          <div className="fd-features__cta" data-reveal="up">
            <a
              href="https://wa.me/5512988601020?text=Olá!%20Vi%20o%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Face%20Delivery"
              className="fd-btn fd-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com um especialista
            </a>
          </div>
        </div>
      </section>

      {/* ── Por que o Face Delivery ─────────────────────────── */}
      <section className="fd-section fd-why">
        <div className="fd-container fd-why__inner">
          <div className="fd-why__text" data-reveal="left">
            <h2 className="fd-section-title">
              O sistema que entende seu dia a dia e entrega resultado
            </h2>
            <ul className="fd-checklist">
              {[
                "Interface simples, rápida e intuitiva",
                "Atendimento com pessoas, não robôs",
                "Sem fidelidade, sem pegadinhas",
                "Adaptação fácil aos seus processos",
                "Evolui com você, não te limita",
              ].map((item, i) => (
                <li
                  key={item}
                  className="fd-checklist__item"
                  style={{ transitionDelay: `${i * 80 + 200}ms` }}
                >
                  <CheckCircle size={20} className="fd-checklist__icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="fd-why__image" data-reveal="right">
            <div className="fd-dashboard-mockup">
              <div className="fd-dm-header">
                <div className="fd-dm-title-bar" />
                <div className="fd-dm-actions">
                  <div className="fd-dm-action" />
                  <div className="fd-dm-action fd-dm-action--primary" />
                </div>
              </div>
              <div className="fd-dm-body">
                <div className="fd-dm-kpis">
                  <div className="fd-dm-kpi fd-dm-kpi--blue" />
                  <div className="fd-dm-kpi fd-dm-kpi--green" />
                  <div className="fd-dm-kpi fd-dm-kpi--amber" />
                  <div className="fd-dm-kpi fd-dm-kpi--rose" />
                </div>
                <div className="fd-dm-chart" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────── */}
      <section className="fd-section fd-how" id="como-funciona">
        <div className="fd-container">
          <div className="fd-how__heading" data-reveal="up">
            <h2 className="fd-section-title">Veja como o Face Delivery funciona na prática</h2>
            <p className="fd-section-sub">
              Do cadastro ao relatório financeiro, tudo em uma plataforma leve e acessível.
            </p>
          </div>

          <div className="fd-how__cols">
            <div className="fd-how__col">
              {(
                [
                  {
                    icon: <Store size={30} />,
                    title: "PDV com Identidade da Sua Loja",
                    desc: "Tenha um sistema exclusivo com a logo, cores e identidade visual do seu negócio, totalmente sincronizado.",
                  },
                  {
                    icon: <ScanFace size={30} />,
                    title: "Acesso com Reconhecimento Facial",
                    desc: "Controle de acesso com reconhecimento facial, biometria ou smartphone.",
                  },
                  {
                    icon: <Users size={30} />,
                    title: "Gestão de Relacionamento (CRM)",
                    desc: "Automatize a comunicação com seus clientes e aumente a fidelização com mensagens estratégicas.",
                  },
                  {
                    icon: <BarChart2 size={30} />,
                    title: "Ficha de Produtos e Estoque",
                    desc: "Monte, edite e acompanhe o estoque de forma prática, tudo em poucos cliques.",
                  },
                ] as const
              ).map(({ icon, title, desc }, i) => (
                <div
                  key={title}
                  className="fd-how-card"
                  data-reveal="up"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="fd-how-card__icon">{icon}</div>
                  <h5 className="fd-how-card__title">{title}</h5>
                  <p className="fd-how-card__desc">{desc}</p>
                </div>
              ))}
            </div>

            <div className="fd-how__col">
              {(
                [
                  {
                    icon: <Zap size={30} />,
                    title: "Grade de Pedidos e Delivery",
                    desc: "Agende e organize os pedidos diretamente pelo painel de controle online ou pelo aplicativo.",
                  },
                  {
                    icon: <FileText size={30} />,
                    title: "Emissão de NF-e / NFC-e",
                    desc: "Emissão fiscal integrada, conforme a legislação vigente, diretamente no caixa.",
                  },
                  {
                    icon: <LayoutDashboard size={30} />,
                    title: "Painel de Gestão Completo",
                    desc: "Visualize todos os dados importantes do seu negócio em um único painel prático e intuitivo.",
                  },
                  {
                    icon: <Package size={30} />,
                    title: "Avaliação e Controle de Estoque",
                    desc: "Realize inventários e controle de forma fácil e organizada, tudo digitalmente.",
                  },
                ] as const
              ).map(({ icon, title, desc }, i) => (
                <div
                  key={title}
                  className="fd-how-card"
                  data-reveal="up"
                  style={{ transitionDelay: `${i * 100 + 50}ms` }}
                >
                  <div className="fd-how-card__icon">{icon}</div>
                  <h5 className="fd-how-card__title">{title}</h5>
                  <p className="fd-how-card__desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fd-how__cta" data-reveal="up">
            <a
              href="https://wa.me/5512988601020?text=Olá!%20Vi%20o%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Face%20Delivery"
              className="fd-btn fd-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com um especialista
            </a>
          </div>
        </div>
      </section>

      {/* ── Depoimentos ────────────────────────────────────── */}
      <section className="fd-section fd-testi" id="depoimentos">
        <div className="fd-container">
          <div className="fd-testi__heading" data-reveal="up">
            <h2 className="fd-section-title fd-section-title--light">
              Quem usa,
              <br />
              Recomenda
            </h2>
          </div>

          <div className="fd-testi__grid">
            {(
              [
                {
                  text: "O Face Delivery transformou a gestão do nosso mercado. Passamos a ter controle total do estoque e das vendas em tempo real. Não troco por nada.",
                  name: "Marcos Oliveira",
                  role: "Sócio Proprietário — Mercado Bela Vista",
                },
                {
                  text: "Somos gestores há 15 anos e nunca tivemos tanta clareza nos dados. O suporte é rápido, o sistema é intuitivo e o preço realmente cabe no bolso.",
                  name: "Carla e Roberto",
                  role: "Sócios Proprietários — Rede de Padarias Pão de Ouro",
                },
                {
                  text: "A emissão de NF-e integrada ao PDV nos economizou horas por mês. A nossa rede de farmácias cresceu 30% desde que adotamos o Face Delivery.",
                  name: "Fernanda Lima",
                  role: "CEO — Rede Saúde+ Farmácias",
                },
              ] as const
            ).map(({ text, name, role }, i) => (
              <div
                key={name}
                className="fd-testi-card"
                data-reveal="up"
                style={{ transitionDelay: `${i * 130}ms` }}
              >
                <p className="fd-testi-card__text">&ldquo;{text}&rdquo;</p>
                <footer className="fd-testi-card__footer">
                  <strong className="fd-testi-card__name">{name}</strong>
                  <span className="fd-testi-card__role">{role}</span>
                </footer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA com abas ───────────────────────────────────── */}
      <section className="fd-section fd-cta" id="contato">
        <div className="fd-container">
          <div className="fd-tabs" data-reveal="up">
            <input
              type="radio"
              id="fd-tab-1"
              name="fd-tab"
              className="fd-tab-radio"
              defaultChecked
            />
            <input type="radio" id="fd-tab-2" name="fd-tab" className="fd-tab-radio" />
            <input type="radio" id="fd-tab-3" name="fd-tab" className="fd-tab-radio" />

            <div className="fd-tab-nav" role="tablist">
              <label htmlFor="fd-tab-1" className="fd-tab-label" role="tab">
                <Zap size={16} aria-hidden="true" />
                Vou inaugurar
              </label>
              <label htmlFor="fd-tab-2" className="fd-tab-label" role="tab">
                <Store size={16} aria-hidden="true" />
                Possuo 1 loja
              </label>
              <label htmlFor="fd-tab-3" className="fd-tab-label" role="tab">
                <Users size={16} aria-hidden="true" />
                Possuo uma rede
              </label>
            </div>

            <div className="fd-tab-panels">
              <div className="fd-tab-panel fd-tab-panel--1" role="tabpanel">
                <div className="fd-cta-card">
                  <h2>Quer começar no controle total?</h2>
                  <p>
                    Solicite sua demonstração gratuita. Nossa equipe vai te ajudar a
                    entender como o Face Delivery pode funcionar no seu negócio desde o
                    primeiro dia.
                  </p>
                  <a
                    href="https://wa.me/5521000000000?text=Olá!%20Vou%20inaugurar%20e%20gostaria%20de%20saber%20mais"
                    className="fd-btn fd-btn--primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Saiba mais
                  </a>
                </div>
              </div>

              <div className="fd-tab-panel fd-tab-panel--2" role="tabpanel">
                <div className="fd-cta-card">
                  <h2>Pronto para transformar a gestão da sua loja?</h2>
                  <p>
                    Solicite sua demonstração gratuita. Nossa equipe vai te ajudar a
                    entender como o Face Delivery pode funcionar no seu negócio.
                  </p>
                  <a
                    href="https://wa.me/5521000000000?text=Olá!%20Possuo%201%20loja%20e%20gostaria%20de%20saber%20mais"
                    className="fd-btn fd-btn--primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Saiba mais
                  </a>
                </div>
              </div>

              <div className="fd-tab-panel fd-tab-panel--3" role="tabpanel">
                <div className="fd-cta-card">
                  <h2>Pronto para transformar a gestão da sua rede?</h2>
                  <p>
                    Solicite sua demonstração gratuita. Nossa equipe vai te ajudar a
                    entender como o Face Delivery pode funcionar em todas as suas unidades.
                  </p>
                  <a
                    href="https://wa.me/5521000000000?text=Olá!%20Possuo%20uma%20rede%20e%20gostaria%20de%20saber%20mais"
                    className="fd-btn fd-btn--primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Saiba mais
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="fd-footer">
        <div className="fd-container fd-footer__inner">
          <div className="fd-footer__brand">
            <svg
              className="fd-footer__logo"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
                fill="white"
                opacity="0.15"
                stroke="white"
                strokeWidth="2.5"
              />
              <path
                d="M35 30H65V40H45V50H60V60H45V75"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
          </div>

          <div className="fd-footer__social">
            <a href="#" className="fd-social-btn" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="#" className="fd-social-btn" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" className="fd-social-btn" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
              </svg>
            </a>
          </div>

          <p className="fd-footer__email">contato@facedelivery.com.br</p>

          <ul className="fd-footer__links">
            <li>
              <a href="#">Política de Privacidade</a>
            </li>
            <li>
              <a href="#">Termos de Uso</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
