import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="header">
      <Logo size={36} className="header-logo" />
      <div className="header-text">
        <h1>Ortskundetrainer Köln Innenstadt</h1>
        <div className="subtitle">Feuerwache 1 — Rettungsdienst & Feuerwehr</div>
      </div>
    </header>
  );
}
