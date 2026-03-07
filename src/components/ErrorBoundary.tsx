import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <h2 style={{ color: "#C8102E" }}>Etwas ist schiefgelaufen</h2>
          <p style={{ margin: "12px 0", color: "#666" }}>
            {this.state.error?.message || "Unbekannter Fehler"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#C8102E",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
