"use client";

import "../styles/logout.css";

type LogoutBarProps = {
  onLogout: () => void;
};

export default function LogoutBar({ onLogout }: LogoutBarProps) {
  return (
    <div className="logout-bar">
      <button type="button" onClick={onLogout} className="logout-button">
        Wyloguj
      </button>
    </div>
  );
}
