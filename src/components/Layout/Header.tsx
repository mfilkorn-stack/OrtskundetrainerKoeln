import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Logo size={44} />
      </div>
      <div className="header-text">
        <h1>FW1 Ortskundetrainer</h1>
        <div className="subtitle">Köln Innenstadt — Rettungsdienst & Feuerwehr</div>
      </div>
    </header>
  );
}
