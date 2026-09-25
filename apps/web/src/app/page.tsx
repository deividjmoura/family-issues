"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const steps = [
  {
    number: "01",
    eyebrow: "ANTES DE COMEÇAR",
    title: <>Tudo começa com <span className="accent-purple">um e-mail.</span></>,
    text: "O acesso começa com o cadastro de um e-mail válido. Depois do cadastro, é necessário confirmar esse e-mail para poder acessar a conta. Isso mantém a entrada no sistema vinculada a um endereço de e-mail que você controla.",
    tone: "purple",
    mock: "email",
  },
  {
    number: "02",
    eyebrow: "ORGANIZE A FAMÍLIA",
    title: <>Organize <span className="accent-purple">a família.</span></>,
    text: "Defina o espaço da família e os participantes. O responsável acompanha o que foi criado e realizado, deixando a rotina mais clara para todos.",
    tone: "purple",
    mock: "family",
  },
  {
    number: "03",
    eyebrow: "DELEGUE E VERIFIQUE",
    title: <>Delegue e <span className="accent-pink">verifique.</span></>,
    text: "Crie tarefas, acompanhe as execuções e confirme o que foi realmente concluído antes da recompensa ser liberada.",
    tone: "pink",
    mock: "task",
  },
  {
    number: "04",
    eyebrow: "RECOMPENSAS",
    title: <>Acompanhe <span className="accent-yellow">recompensas.</span></>,
    text: "O saldo e o histórico registram as recompensas recebidas, mantendo o processo claro para todos.",
    tone: "yellow",
    mock: "wallet",
  },
];

function StepMock({ type, tone }: { type: string; tone: string }) {
  if (type === "email") {
    return (
      <div className={`instruction-mock mock-card mock-card-${tone}`}>
        <div className="mock-bar">Caixa de entrada <span>●</span></div>
        <div className="mail-row">
          <div className="mock-icon purple">✉</div>
          <div>
            <strong>Family Issues — Confirme seu e-mail</strong>
            <small>Toque no link para liberar o acesso da sua conta.</small>
            <b>Confirmar e-mail</b>
          </div>
        </div>
        <div className="success-row">✓ &nbsp;Conta protegida e vinculada ao seu e-mail</div>
      </div>
    );
  }
  if (type === "family") {
    return (
      <div className={`instruction-mock mock-device mock-device-${tone}`}>
        <div className="mock-top">Passo 02 de 04 <span>• • ▬</span></div>
        <div className="family-list">
          {[["P","Pai","Responsável","purple"],["M","Mãe","Responsável","pink"],["A","Ana","Jogadora","blue"],["P","Pedro","Jogador","yellow"]].map(([letter,name,role,color]) => (
            <div className="family-row" key={name}><i className={color}>{letter}</i><span><strong>{name}</strong><small>{role}</small></span></div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "task") {
    return (
      <div className={`instruction-mock mock-device mock-device-${tone}`}>
        <div className="mock-top">Passo 03 de 04 <span>• • ▬</span></div>
        <div className="task-row"><div><strong>Lavar a louça</strong><small>✓ Verificar entrega</small></div><b>R$ 5,00</b></div>
        <div className="task-row"><div><strong>Arrumar o quarto</strong><small>✓ Aprovado</small></div><b>R$ 8,00</b></div>
      </div>
    );
  }
  return (
    <div className={`instruction-mock mock-device mock-device-${tone} mock-wallet`}>
      <div className="mock-top">Passo 04 de 04 <span>• • ▬</span></div>
      <div className="wallet-total"><small>Saldo disponível</small><strong>R$ 42,00</strong></div>
      <div className="wallet-row">Arrumar o quarto <b>+ R$ 8,00</b></div>
      <div className="wallet-row">Lavar a louça <b>+ R$ 5,00</b></div>
    </div>
  );
}

use client";

import Link from "next/link";
import { useEffect } from "react";

const steps = [
  {
    number: "01",
    eyebrow: "ANTES DE COMEÇAR",
    title: <>Tudo começa com <span className="accent-purple">um e-mail.</span></>,
    text: "O acesso começa com o cadastro de um e-mail válido. Depois do cadastro, é necessário confirmar esse e-mail para poder acessar a conta. Isso mantém a entrada no sistema vinculada a um endereço de e-mail que você controla.",
    tone: "purple",
    mock: "email",
  },
  {
    number: "02",
    eyebrow: "ORGANIZE A FAMÍLIA",
    title: <>Organize <span className="accent-purple">a família.</span></>,
    text: "Defina o espaço da família e os participantes. O responsável acompanha o que foi criado e realizado, deixando a rotina mais clara para todos.",
    tone: "purple",
    mock: "family",
  },
  {
    number: "03",
    eyebrow: "DELEGUE E VERIFIQUE",
    title: <>Delegue e <span className="accent-pink">verifique.</span></>,
    text: "Crie tarefas, acompanhe as execuções e confirme o que foi realmente concluído antes da recompensa ser liberada.",
    tone: "pink",
    mock: "task",
  },
  {
    number: "04",
    eyebrow: "RECOMPENSAS",
    title: <>Acompanhe <span className="accent-yellow">recompensas.</span></>,
    text: "O saldo e o histórico registram as recompensas recebidas, mantendo o processo claro para todos.",
    tone: "yellow",
    mock: "wallet",
  },
];

function StepMock({ type, tone }: { type: string; tone: string }) {
  if (type === "email") {
    return (
      <div className={`mock-card mock-card-${tone}`}>
        <div className="mock-bar">Caixa de entrada <span>●</span></div>
        <div className="mail-row">
          <div className="mock-icon purple">✉</div>
          <div>
            <strong>Family Issues — Confirme seu e-mail</strong>
            <small>Toque no link para liberar o acesso da sua conta.</small>
            <b>Confirmar e-mail</b>
          </div>
        </div>
        <div className="success-row">✓ &nbsp;Conta protegida e vinculada ao seu e-mail</div>
      </div>
    );
  }

  if (type === "family") {
    return (
      <div className={`mock-device mock-device-${tone}`}>
        <div className="mock-top">Passo 02 de 04 <span>• • ▬</span></div>
        <div className="family-list">
          {[
            ["P", "Pai", "Responsável", "purple"],
            ["M", "Mãe", "Responsável", "pink"],
            ["A", "Ana", "Jogadora", "blue"],
            ["P", "Pedro", "Jogador", "yellow"],
          ].map(([letter, name, role, color]) => (
            <div className="family-row" key={name}>
              <i className={color}>{letter}</i><span><strong>{name}</strong><small>{role}</small></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "task") {
    return (
      <div className={`mock-device mock-device-${tone}`}>
        <div className="mock-top">Passo 03 de 04 <span>• • ▬</span></div>
        <div className="task-row">
          <div><strong>Lavar a louça</strong><small>✓ Verificar entrega</small></div><b>R$ 5,00</b>
        </div>
        <div className="task-row">
          <div><strong>Arrumar o quarto</strong><small>✓ Aprovado</small></div><b>R$ 8,00</b>
        </div>
      </div>
    );
  }

  return (
    <div className={`mock-device mock-device-${tone} mock-wallet`}>
      <div className="mock-top">Passo 04 de 04 <span>• • ▬</span></div>
      <div className="wallet-total"><small>Saldo disponível</small><strong>R$ 42,00</strong></div>
      <div className="wallet-row">Arrumar o quarto <b>+ R$ 8,00</b></div>
      <div className="wallet-row">Lavar a louça <b>+ R$ 5,00</b></div>
    </div>
  );
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".fi-reveal"));
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((item) => revealObserver.observe(item));

    const stepNodes = Array.from(document.querySelectorAll<HTMLElement>(".instruction-copy"));
    const stepObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveStep(Number((visible.target as HTMLElement).dataset.step ?? 0));
      },
      { threshold: [0.2, 0.45, 0.7], rootMargin: "-32% 0px -42% 0px" }
    );
    stepNodes.forEach((node) => stepObserver.observe(node));

    return () => {
      revealObserver.disconnect();
      stepObserver.disconnect();
    };
  }, []);

  return (
    <main className="landing-page">
      <div className="landing-noise" />

      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="Family Issues">
          <span className="landing-brand-mark">✦</span>
          <span>Family<span>Issues</span></span>
        </Link>

        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#jornada">Para quem joga</a>
          <Link href="/login">Entrar</Link>
        </nav>

        <Link href="/signup" className="landing-header-cta">Criar conta</Link>
      </header>

      <section className="landing-hero">
        <div className="hero-glow hero-glow-blue" />
        <div className="hero-glow hero-glow-purple" />
        <div className="hero-dots" />

        <div className="hero-copy fi-reveal is-visible">
          <span className="hero-kicker">Tarefas domésticas com recompensa em R$ e gamificação</span>
          <h1>Transforme<br />responsabilidades<br />em uma <em>jornada</em> de<br /><strong>conquistas.</strong></h1>
          <p>Uma forma organizada de distribuir tarefas, acompanhar responsabilidades e transformar resultados em recompensas — com uma experiência séria para quem administra e mais envolvente para quem executa.</p>
          <div className="hero-actions">
            <Link href="/signup" className="hero-primary">Criar minha conta <span>→</span></Link>
            <Link href="/login" className="hero-secondary">Já tenho uma conta</Link>
          </div>
        </div>

        <div className="hero-art fi-reveal is-visible" aria-hidden="true">
          <div className="hero-orbit orbit-a" />
          <div className="hero-orbit orbit-b" />
          <div className="hero-sun" />
          <div className="hero-photo-frame">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1504150558240-0b4fdc2ee3f4?auto=format&fit=crop&w=1100&q=90" alt="" />
            </div>
            <div className="hero-photo-badge"><span>✓</span><div><strong>Missão concluída!</strong><small>Aguardando aprovação</small></div></div>
            <div className="hero-reward">◉ &nbsp; + R$ 10,00 <small>Recompensa aprovada</small></div>
          </div>
          <div className="floating-shape controller">⚔</div>
          <div className="floating-shape gift">✦</div>
          <div className="floating-shape sparkle">✦</div>
        </div>
      </section>

      <div className="landing-marquee">
        <div className="marquee-track">
          {[...["🎁 Presentes em pontos", "🧑‍🎤 Monte seu avatar", "⚔ Aceite missões", "✨ Ganhe recompensas"], ...["🎁 Presentes em pontos", "🧑‍🎤 Monte seu avatar", "⚔ Aceite missões", "✨ Ganhe recompensas"]].map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </div>

      <section id="como-funciona" className="landing-section instructions-section">
        <div className="instructions-sticky">
          <div className="instruction-stage">
            <div className={`instruction-halo halo-${steps[activeStep].tone}`} />
            <div key={steps[activeStep].number} className="instruction-card-enter">
              <StepMock type={steps[activeStep].mock} tone={steps[activeStep].tone} />
            </div>
          </div>
        </div>

        <div className="instruction-list">
          {steps.map((step, index) => (
            <article
              className={`instruction-copy fi-reveal ${activeStep === index ? "instruction-active" : ""}`}
              data-step={index}
              key={step.number}
            >
              <div className={`instruction-index instruction-index-${step.tone}`}>{step.number}</div>
              <div className="instruction-icon">{index === 0 ? "✉" : index === 1 ? "♙" : index === 2 ? "▣" : "✦"}</div>
              <div className="instruction-text">
                <span className="section-kicker">{step.eyebrow}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
