import Link from "next/link";

const steps = [
  { number: "01", eyebrow: "ANTES DE COMEÇAR", title: "Tudo começa com um e-mail.", text: "Cadastre um e-mail válido para criar seu acesso. Depois, confirme a mensagem recebida para liberar a conta.", icon: "✉", tone: "blue", mock: "email" },
  { number: "02", eyebrow: "ORGANIZE A FAMÍLIA", title: "Monte o espaço da sua família.", text: "Defina quem participa, quem acompanha as tarefas e deixe cada responsabilidade no lugar certo.", icon: "⌂", tone: "purple", mock: "family" },
  { number: "03", eyebrow: "A ROTINA ACONTECE", title: "Delegue, execute e verifique.", text: "As tarefas saem da lista de pendências para uma jornada clara de execução e aprovação.", icon: "⚔", tone: "pink", mock: "task" },
  { number: "04", eyebrow: "RECOMPENSAS", title: "Acompanhe o que foi conquistado.", text: "Veja saldo, histórico e progresso. Cada entrega aprovada pode virar uma recompensa.", icon: "◎", tone: "yellow", mock: "wallet" },
];

const marqueeItems = ["✦ Presentes em pontos", "🧑‍🎤 Monte seu avatar", "⚔ Aceite missões", "✨ Ganhe recompensas", "🎯 Evolua sua jornada"];

export default function HomePage() {
  return (
    <main className="landing-page">
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
        <Link href="/signup" className="landing-header-cta">Criar conta <span>↗</span></Link>
      </header>

      <section className="landing-hero">
        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />
        <div className="hero-copy">
          <span className="hero-kicker">Tarefas domésticas com recompensa em R$ e gamificação</span>
          <h1>Transforme<br />responsabilidades<br />em uma <em>jornada</em> de<br />conquistas.</h1>
          <p>Uma experiência simples para organizar a rotina da família, transformar tarefas em desafios e tornar cada conquista visível.</p>
          <div className="hero-actions">
            <Link href="/signup" className="hero-primary">Criar minha conta <span>→</span></Link>
            <Link href="/login" className="hero-secondary">Já tenho uma conta</Link>
          </div>
          <div className="hero-trust"><span>✓</span> Seguro e feito para famílias</div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-sun" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-photo-frame">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1504150558240-0b4fdc2ee3f4?auto=format&fit=crop&w=1000&q=88" alt="" />
            </div>
            <div className="hero-photo-badge"><span className="status-dot">✓</span><div><strong>Missão concluída!</strong><small>Aguardando aprovação</small></div></div>
          </div>
          <div className="hero-game-shape shape-controller">✕</div><div className="hero-game-shape shape-coin">✦</div><div className="hero-game-shape shape-star">★</div>
        </div>
      </section>

      <div className="landing-marquee" aria-label="Funcionalidades">
        <div className="marquee-track">{[...marqueeItems, ...marqueeItems].map((item, index) => <span key={index}>{item}</span>)}</div>
      </div>

      <section id="como-funciona" className="landing-section steps-section">
        <div className="section-intro">
          <span className="section-kicker">COMO FUNCIONA</span>
          <h2>Uma jornada pensada para a família.</h2>
          <p>Do primeiro acesso à recompensa, cada etapa foi desenhada para ficar clara, leve e fácil de acompanhar.</p>
        </div>

        <div className="steps-list">
          {steps.map((step) => (
            <article key={step.number} className={"landing-step step-" + step.tone}>
              <div className="step-visual">
                <div className={"mock-device mock-" + step.mock}>
                  {step.mock === "email" && <><div className="mock-top">Passo 01 de 04 <span>•••</span></div><div className="mock-window"><small>E-MAIL DO RESPONSÁVEL</small><strong>familia@email.com</strong><button>Criar conta</button><i>✓ E-mail de confirmação enviado</i></div></>}
                  {step.mock === "family" && <><div className="mock-top">Minha família <span>+</span></div><div className="family-avatars"><b>👩</b><b>👨</b><b>🧒</b></div><div className="mock-lines"><i /><i /><i /></div></>}
                  {step.mock === "task" && <><div className="mock-top">Tarefa do dia <span>✓</span></div><div className="task-card"><strong>Arrumar o quarto</strong><small>+ R$ 5,00 · 20 pts</small><div><span /></div></div><div className="task-card muted"><strong>Lavar a louça</strong><small>Em andamento</small></div></>}
                  {step.mock === "wallet" && <><div className="mock-top">Saldo da família <span>◎</span></div><div className="wallet-value">R$ 42,00</div><div className="wallet-lines"><span>João — Arrumar o quarto <b>+ R$ 5,00</b></span><span>Pedro — Guardar brinquedos <b>+ R$ 8,00</b></span></div></>}
                </div>
              </div>
              <div className="step-copy">
                <div className="step-number">{step.number}</div>
                <div><span className="section-kicker">{step.eyebrow}</span><h3>{step.title}</h3><p>{step.text}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="jornada" className="landing-section player-section">
        <div className="player-panel">
          <span className="player-spark">✦</span><span className="section-kicker">PARA QUEM JOGA</span>
          <h2>Pronto para começar?</h2>
          <p>Cadastre seu e-mail, confirme a conta e entre na jornada. Complete tarefas, acompanhe seu progresso e transforme cada conquista em algo que vale a pena.</p>
          <Link href="/signup" className="hero-primary">Criar conta <span>→</span></Link>
          <Link href="/politica" className="player-policy">Política de uso</Link><span className="player-target">◎</span>
        </div>
      </section>
    </main>
  );
}
