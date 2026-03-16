"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-[var(--text-secondary)]">
        <p>
          © {currentYear} All rights reserved. Made by{" "}
          <a
            href="https://github.com/Dhia-zorai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline transition-colors"
          >
            Dhia Zorai
          </a>
        </p>
      </div>
    </footer>
  );
}
