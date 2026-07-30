import {
  Search,
  ShoppingBag,
  Star,
  ArrowUpRight,
  Play,
  ArrowRight,
  Plus,
  Heart,
} from 'lucide-react'

/* ------------------------------------------------------------------ *
 *  Shared brand primitives
 * ------------------------------------------------------------------ */

function Stars({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[2px] ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={0} className="fill-gold text-gold" />
      ))}
    </span>
  )
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex select-none flex-col leading-none">
      <Stars size={compact ? 8 : 10} className="mb-[5px] ml-[2px]" />
      <span
        className={`font-display tracking-[0.06em] text-ink ${
          compact ? 'text-[15px]' : 'text-lg sm:text-xl'
        }`}
      >
        MINI&nbsp;POLTRONAS
      </span>
      <span className="mt-[3px] ml-[2px] text-[8px] font-medium tracking-[0.58em] text-stone">
        ORIGINAL
      </span>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-espresso text-[10px] font-semibold text-cream ring-2 ring-bone">
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 *  Header
 * ------------------------------------------------------------------ */

const NAV = ['Início', 'Coleção', 'Personalização', 'Barbearias', 'Contato']

function Header() {
  return (
    <header className="relative z-30 flex shrink-0 items-center gap-4 px-5 py-4 sm:px-8 lg:px-12">
      <div className="animate-fade-up delay-200 shrink-0">
        <BrandLogo />
      </div>

      <nav className="animate-fade-up delay-200 hidden flex-1 items-center justify-center gap-7 lg:flex xl:gap-9">
        {NAV.map((item, i) => (
          <a
            key={item}
            href="#"
            className={`text-sm font-medium tracking-wide transition-colors ${
              i === 0 ? 'text-ink' : 'text-stone hover:text-ink'
            }`}
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="animate-fade-up delay-300 ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          aria-label="Buscar"
          className="hidden h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-ink/40 hover:bg-ink/[0.03] sm:flex"
        >
          <Search size={17} />
        </button>
        <button
          aria-label="Favoritos"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white shadow-soft transition hover:brightness-105"
        >
          <Heart size={16} className="fill-white" />
          <Badge>3</Badge>
        </button>
        <button
          aria-label="Sacola"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-ink/40 hover:bg-ink/[0.03]"
        >
          <ShoppingBag size={17} />
          <Badge>2</Badge>
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-espresso to-ink font-display text-sm text-gold-glow ring-1 ring-gold/40">
          MP
        </div>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ *
 *  Headline
 * ------------------------------------------------------------------ */

function Headline({ className = '' }: { className?: string }) {
  const line1 = ['Cada', 'corte,']
  const line2 = ['uma', 'obra', 'de', 'arte.']
  const delays = ['delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600', 'delay-700']
  let idx = 0
  return (
    <h1
      className={`font-display tracking-[-0.02em] text-ink leading-[0.92] ${className}`}
    >
      <span className="block">
        {line1.map((w) => (
          <span key={w} className={`inline-block animate-word-pop ${delays[idx++]}`}>
            {w}&nbsp;
          </span>
        ))}
      </span>
      <span className="block italic text-espresso">
        {line2.map((w) => (
          <span key={w} className={`inline-block animate-word-pop ${delays[idx++]}`}>
            {w}&nbsp;
          </span>
        ))}
      </span>
    </h1>
  )
}

/* ------------------------------------------------------------------ *
 *  Floating cards
 * ------------------------------------------------------------------ */

function ProductCard({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="ring-hairline shadow-frame relative overflow-hidden rounded-[20px] bg-cream">
        <img
          src="/img/card-colete.jpg"
          alt="Colete Barber Correia Preta"
          className="aspect-[490/340] w-full object-cover"
        />
        <button
          aria-label="Ver produto"
          className="shadow-soft absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-gold-glow transition hover:bg-ink"
        >
          <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="mt-3 px-1">
        <p className="text-[13px] text-coffee">Colete Barber · Correia Preta</p>
        <p className="text-[15px] font-semibold text-ink">R$ 149,90</p>
      </div>
    </div>
  )
}

function FeatureCard({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="ring-hairline shadow-frame relative aspect-[298/440] overflow-hidden rounded-[20px]">
        <img
          src="/img/card-vaibrasil.jpg"
          alt="Edição comemorativa Vai Brasil"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/5" />
        <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-espresso">
          Comemorativa
        </span>
        <span className="shadow-soft absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream/95 text-espresso">
          <Play size={16} className="ml-0.5 fill-espresso" />
        </span>
        <p className="absolute inset-x-3 bottom-3 text-[11px] font-medium leading-snug text-white">
          Assista ao Tour da Copa no Instagram e TikTok
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Bottom showcase overlays
 * ------------------------------------------------------------------ */

function AvatarStat() {
  return (
    <div className="ring-hairline shadow-soft flex items-center gap-3 rounded-full bg-cream/85 py-2 pl-2 pr-4 backdrop-blur-md">
      <div className="flex -space-x-2">
        {['R', 'A', 'J'].map((c) => (
          <div
            key={c}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-espresso to-coffee text-[10px] font-semibold text-gold-glow ring-2 ring-cream"
          >
            {c}
          </div>
        ))}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-white ring-2 ring-cream">
          <Plus size={12} />
        </div>
      </div>
      <div className="leading-none">
        <p className="font-display text-lg text-ink">+2.500</p>
        <p className="text-[10px] tracking-wide text-coffee">barbearias equipadas</p>
      </div>
    </div>
  )
}

function RatingStat() {
  return (
    <div className="shadow-soft flex items-center gap-2.5 rounded-full bg-espresso/90 py-2 pl-3 pr-4 backdrop-blur-md">
      <Star size={18} strokeWidth={0} className="fill-gold-glow text-gold-glow" />
      <div className="leading-none">
        <p className="font-display text-lg text-cream">5,0</p>
        <p className="text-[10px] tracking-wide text-gold-glow/80">+1.200 avaliações</p>
      </div>
    </div>
  )
}

function CollectionCTA({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-col ${center ? 'items-center text-center' : 'items-start'}`}>
      <p className="animate-fade-up delay-1000 mb-3 font-display text-[clamp(18px,2vw,28px)] text-cream drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        Coleção Assinatura
      </p>
      <button className="animate-fade-up delay-1100 group flex items-center gap-2 rounded-full bg-gold py-3 pl-6 pr-5 text-sm font-semibold text-white shadow-soft transition hover:bg-gold-deep">
        Explorar Coleção
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Desktop hero (lg and up)
 * ------------------------------------------------------------------ */

function HeroDesktop() {
  return (
    <section className="relative hidden flex-1 overflow-hidden lg:block">
      {/* Text layer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex flex-col items-center px-12 pt-[4.6rem] text-center">
        <div className="animate-fade-up delay-200 flex items-center gap-3 text-gold-deep">
          <Stars size={12} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.34em]">
            Feitas à mão no Brasil
          </span>
        </div>
        <Headline className="mt-4 text-[clamp(52px,6.6vw,98px)]" />
        <p className="animate-fade-up delay-500 mt-5 whitespace-nowrap text-[clamp(13px,1.02vw,16px)] leading-relaxed text-coffee">
          Mini poltronas de barbearia, artesanais em capitonê premium.
        </p>
      </div>

      {/* Left product card */}
      <ProductCard className="animate-slide-in-left delay-600 absolute left-12 top-[56px] z-20 w-[clamp(186px,15vw,254px)]" />

      {/* Right feature card */}
      <FeatureCard className="animate-slide-in-right delay-700 absolute right-12 top-[56px] z-20 w-[clamp(140px,10.5vw,182px)]" />

      {/* Bottom showcase trio */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end">
        <div className="animate-photo-reveal delay-700 relative h-[min(46vh,40vw)] flex-1 overflow-hidden">
          <img
            src="/img/chair-marron-croco.jpg"
            alt="Mini Poltrona Clássica Marron Croco"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="animate-photo-reveal delay-600 relative h-[min(52vh,46vw)] flex-[1.28] overflow-hidden">
          <img
            src="/img/chair-black-seville.jpg"
            alt="Mini Poltrona Clássica Black Seville"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="animate-photo-reveal delay-900 relative h-[min(46vh,40vw)] flex-1 overflow-hidden">
          <img
            src="/img/chair-baby.jpg"
            alt="Mini Poltrona Baby com suporte para celular"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
      </div>

      {/* Overlays */}
      <div
        className="animate-fade-up delay-1000 absolute z-20 left-[clamp(16px,2.4vw,44px)]"
        style={{ bottom: 'clamp(18px,3.6vh,44px)' }}
      >
        <AvatarStat />
      </div>
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ bottom: 'clamp(20px,4vh,50px)' }}
      >
        <CollectionCTA center />
      </div>
      <div
        className="animate-fade-up delay-1200 absolute z-20 right-[clamp(16px,2.4vw,44px)]"
        style={{ bottom: 'clamp(18px,3.6vh,44px)' }}
      >
        <RatingStat />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 *  Compact hero (below lg — tablet + mobile)
 * ------------------------------------------------------------------ */

function HeroCompact() {
  return (
    <section className="flex flex-1 flex-col overflow-hidden lg:hidden">
      <div className="flex flex-col items-center px-5 pt-3 text-center sm:px-8 sm:pt-5">
        <div className="animate-fade-up delay-200 flex items-center gap-2.5 text-gold-deep">
          <Stars size={11} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
            Feitas à mão no Brasil
          </span>
        </div>
        <Headline className="mt-3 text-[clamp(34px,7.5vw,62px)]" />
        <p className="animate-fade-up delay-500 mt-3 hidden max-w-[42ch] text-[15px] leading-relaxed text-coffee sm:block">
          Mini poltronas artesanais em capitonê para uma experiência de
          atendimento premium.
        </p>
        <div className="animate-fade-up delay-600 mt-4 flex items-center gap-3">
          <button className="group flex items-center gap-2 rounded-full bg-gold py-2.5 pl-5 pr-4 text-sm font-semibold text-white shadow-soft transition hover:bg-gold-deep">
            Explorar Coleção
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
          <button className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/45">
            WhatsApp
          </button>
        </div>
      </div>

      {/* Side-by-side cards (hidden on the shortest screens) */}
      <div className="mt-4 hidden gap-3 px-5 sm:flex sm:px-8">
        <ProductCard className="animate-slide-in-left delay-700 flex-1" />
        <FeatureCard className="animate-slide-in-right delay-800 w-[38%] max-w-[200px]" />
      </div>

      {/* Stat row */}
      <div className="animate-fade-up delay-900 mt-4 flex items-center justify-center gap-4 px-5 sm:gap-6">
        <AvatarStat />
        <RatingStat />
      </div>

      {/* Bottom trio */}
      <div className="relative mt-4 flex min-h-0 flex-1 items-end">
        <div className="animate-photo-reveal delay-700 h-full flex-1 overflow-hidden">
          <img
            src="/img/chair-marron-croco.jpg"
            alt="Mini Poltrona Clássica Marron Croco"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="animate-photo-reveal delay-600 h-full flex-[1.28] overflow-hidden">
          <img
            src="/img/chair-black-seville.jpg"
            alt="Mini Poltrona Clássica Black Seville"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="animate-photo-reveal delay-900 h-full flex-1 overflow-hidden">
          <img
            src="/img/chair-baby.jpg"
            alt="Mini Poltrona Baby com suporte para celular"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 *  App
 * ------------------------------------------------------------------ */

export default function App() {
  return (
    <div className="bg-atelier flex h-screen flex-col overflow-hidden">
      <Header />
      <HeroDesktop />
      <HeroCompact />
    </div>
  )
}
