"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Coins,
  Swords,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Cadastre a conta",
    description: "Crie a conta do responsável e confirme o e-mail para manter tudo protegido e vinculado.",
    tone: "blue",
  },
  {
    number: "02",
    title: "Organize a família",
    description: "Adicione responsáveis e jogadores para deixar cada papel claro desde o começo.",
    tone: "purple",
  },
  {
    number: "03",
    title: "Delegue e verifique",
    description: "Crie missões, acompanhe as entregas e aprove o que realmente foi concluído.",
    tone: "pink",
  },
  {
    number: "04",
    title: "Acompanhe recompensas",
    description: "Veja saldo e histórico para transformar pequenas responsabilidades em progresso.",
    tone: "orange",
  },
] as const;

function StepperMock({ step }: { step: number }) {
  const current = steps[step];
  return (
    <div className={`stepper-device stepper-${current.tone}`} key={current.number}>
      <div className="stepper-top">
        <div>
          <span>FAMILY ISSUES</span>
          <strong>Passo {current.number} de 04</strong>
        </div>
        <div className="stepper-dots">{steps.map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
      </div>
      <div className="stepper-body">
        {step === 0 && (
          <div className="mock-form">
            <span className="mock-label">E-MAIL DO RESPONSÁVEL</span>
            <div className="mock-input">familia@email.com</div>
            <button type="button">Criar conta <ArrowRight size={14} /></button>
            <div className="mock-check"><Check size={15} /> E-mail de confirmação enviado</div>
          </div>
        )}
        {step === 1 && (
          <div className="members-mock">
            <div className="mock-title">Membros da família <Users size={17} /></div>
            {[
              ["P", "Pai", "Responsável", "purple"],
              ["M", "Mãe", "Responsável", "pink"],
              ["A", "Ana", "Jogadora", "blue"],
              ["P", "Pedro", "Jogador", "yellow"],
            ].map(([letter, name, role, color]) => (
              <div className="member-row" key={name}>
                <i className={`avatar-${color}`}>{letter}</i>
                <span><strong>{name}</strong><small>{role}</small></span>
                <Check size={15} />
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="tasks-mock">
            <div className="mock-title">Missões da família <ClipboardCheck size={17} /></div>
            <div className="task-card task-card-hot">
              <div><strong>Lavar a louça</strong><small>✓ Verificar entrega</small></div>
              <b>R$ 5,00</b>
            </div>
            <div className="task-card">
              <div><strong>Arrumar o quarto</strong><small>✓ Aprovada</small></div>
              <b>R$ 8,00</b>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="wallet-mock">
            <div className="mock-title">Recompensas <PiggyBank size={18} /></div>
            <div className="balance-card"><small>Saldo disponível</small><strong>R$ 42,00</strong><span>+ R$ 13,00 nesta semana</span></div>
            <div className="wallet-history"><span>Lavar a louça</span><b>+ R$ 5,00</b></div>
            <div className="wallet-history"><span>Arrumar o quarto</span><b>+ R$ 8,00</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((value) => (value + 1) % steps.length);
    }, 4800);

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-step-index]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveStep(Number((visible.target as HTMLElement).dataset.stepIndex ?? 0));
      },
      { threshold: [0.35, 0.6], rootMargin: "-35% 0px -35% 0px" }
    );
    nodes.forEach((node) => observer.observe(node));

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="landing-page">
      <div className="landing-noise" aria-hidden="true" />

      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="Family Issues">
          <span className="landing-brand-mark"><Sparkles size={15} fill="currentColor" /></span>
          <span className="brand-family">Family</span><span className="brand-issues">Issues</span>
        </Link>

        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem-joga">Para quem joga</a>
          <Link href="/login">Entrar</Link>
        </nav>

        <Link href="/signup" className="landing-header-cta">Criar conta</Link>
      </header>

      <section className="landing-hero">
        <div className="hero-dots" aria-hidden="true" />
        <div className="hero-glow hero-glow-blue" aria-hidden="true" />
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={13} /> Tarefas domésticas com recompensa em R$ e gamificação</span>
          <h1>Transforme responsabilidades em uma <em>jornada</em> de <strong>conquistas.</strong></h1>
          <p>Organize tarefas, acompanhe responsabilidades e transforme cada resultado em uma pequena conquista — com clareza para quem administra e diversão para quem joga.</p>
          <div className="hero-actions">
            <Link href="/signup" className="hero-primary">Criar minha conta <ArrowRight size={18} /></Link>
            <Link href="/login" className="hero-secondary">Já tenho uma conta</Link>
          </div>
        </div>

        <div className="hero-art" aria-label="Exemplo de uma missão concluída">
          <div className="hero-blob" />
          <Swords className="hero-swords" size={48} />
          <div className="hero-photo-frame">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1758874960466-fb0a3e0007bc?auto=format&fit=crop&fm=jpg&q=82&w=1200" alt="Família cozinhando e se divertindo na cozinha" />
            </div>
            <div className="hero-photo-badge"><span>✓</span><div><strong>Missão concluída!</strong><small>Aguardando aprovação</small></div></div>
            <div className="hero-reward"><Coins size={17} fill="currentColor" /><div><strong>+ R$ 10,00</strong><small>Recompensa aprovada</small></div></div>
          </div>
          <div className="hero-sparkle hero-sparkle-one">✦</div>
          <div className="hero-sparkle hero-sparkle-two">✦</div>
        </div>
      </section>

      <section className="landing-marquee" aria-label="Destaques">
        <div className="marquee-track">
          {[...Array(2)].flatMap(() => ["🎁 Presentes em pontos", "🤴 Monte seu avatar", "⚔️ Aceite missões", "✨ Ganhe recompensas"]).map((item, i) => (
            <span key={i}>{item}<b>✦</b></span>
          ))}
        </div>
      </section>

      <section className="landing-section email-section">
        <div className="section-copy">
          <span className="section-eyebrow purple"><Mail size={14} /> ANTES DE COMEÇAR</span>
          <h2>Tudo começa com <span>um e-mail.</span></h2>
          <p>O acesso começa com o cadastro de um e-mail válido. Depois, basta confirmar a mensagem recebida para manter a conta protegida e vinculada ao endereço que você controla.</p>
        </div>
        <div className="email-mock-wrap">
          <div className="email-mock">
            <div className="email-window-head"><strong>📥 Caixa de entrada</strong><span>1 nova mensagem</span></div>
            <div className="email-message">
              <div className="email-logo">✦</div>
              <div><strong>Family Issues — Confirme seu e-mail</strong><small>Confirme seu endereço para liberar o acesso.</small><button type="button">Confirmar e-mail</button></div>
            </div>
            <div className="email-safe"><ShieldCheck size={17} /><span>Conta protegida e vinculada ao seu e-mail</span></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="landing-section responsible-section">
        <div className="responsible-copy">
          <span className="section-eyebrow blue"><UserPlus size={14} /> PARA RESPONSÁVEIS</span>
          <h2>Organização clara, do início à <span>recompensa.</span></h2>
          <p>Um fluxo simples para montar a família, distribuir missões e acompanhar tudo sem perder o fio da rotina.</p>
        </div>

        <div className="responsible-stage">
          <div className="stage-glow" />
          <StepperMock step={activeStep} />
        </div>

        <div className="responsible-steps">
          {steps.map((step, index) => (
            <article
              key={step.number}
              data-step-index={index}
              className={`responsible-step ${activeStep === index ? "active" : ""}`}
              onClick={() => setActiveStep(index)}
            >
              <strong className={`step-number ${step.tone}`}>{step.number}</strong>
              <span className={`step-icon ${step.tone}`}>
                {index === 0 ? <UserPlus size={18} /> : index === 1 ? <Users size={18} /> : index === 2 ? <ClipboardCheck size={18} /> : <PiggyBank size={18} />}
              </span>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="para-quem-joga" className="landing-section player-section">
        <div className="player-heading">
          <span className="section-eyebrow orange"><Swords size={14} /> PARA QUEM JOGA</span>
          <h2>Sua rotina. Seus objetivos. Sua próxima <span>conquista.</span></h2>
          <p>Para quem executa, cada tarefa vira uma missão clara e cada aprovação vira progresso.</p>
        </div>

        <div className="player-feature-grid">
          <article className="player-feature purple-card">
            <Swords size={32} />
            <h3>Aceite missões</h3>
            <p>Receba tarefas, conclua os objetivos e envie cada conquista para verificação.</p>
          </article>
          <article className="player-feature yellow-card">
            <Sparkles size={32} />
            <h3>Ganhe recompensas</h3>
            <p>Cada tarefa aprovada pode gerar recompensa. Seu progresso fica registrado no seu saldo.</p>
          </article>
        </div>

        <div className="coming-grid">
          {[
            ["🎯", "Suba o nível da jornada", "Transforme consistência em novos níveis e objetivos.", "lilac"],
            ["🛍️", "Use seus pontos", "Troque pontos por recompensas que façam sentido para você.", "green"],
            ["🎁", "Compartilhe pontos", "Envie parte do seu progresso para quem está na família.", "pink"],
            ["🤴", "Monte seu avatar", "Crie uma identidade para acompanhar sua jornada.", "blue"],
          ].map(([emoji, title, description, color]) => (
            <article className={`coming-card ${color}`} key={title}>
              <span className="coming-badge">Em breve</span>
              <strong>{emoji}</strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section cta-section">
        <div className="cta-panel">
          <Swords className="cta-swords" size={52} />
          <Target className="cta-target" size={45} />
          <Sparkles className="cta-stars cta-stars-one" size={28} />
          <Sparkles className="cta-stars cta-stars-two" size={20} />
          <h2>Pronto para começar?</h2>
          <p>Cadastre seu e-mail, confirme a conta e entre na jornada.</p>
          <Link href="/signup" className="cta-button">Criar conta <ArrowRight size={18} /></Link>
          <Link href="/politica" className="cta-policy">Política de uso</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="footer-brand"><span>✦</span> Family <b>Issues</b></Link>
        <p>Tarefas viram conquistas. Recompensas viram hábito.</p>
        <div><Link href="/politica">Política de uso</Link><Link href="/login">Entrar</Link></div>
      </footer>
    </main>
  );
}
