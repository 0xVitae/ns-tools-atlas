import React from "react";

const BuiltByFooter: React.FC = () => (
  <div className="fixed bottom-6 right-6 z-20 text-xs text-muted-foreground bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border flex flex-col gap-1">
    <a
      href="https://x.com/byornoste"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground transition-colors"
    >
      🔨 Built by Byorn
    </a>
    <a
      href="https://github.com/0xVitae/ns-tools-atlas"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground transition-colors"
    >
      ⭐ Contribute on GitHub
    </a>
    <a
      href="https://cal.com/byorn/15min?user=byorn"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground transition-colors"
    >
      📅 Book Office Hours
    </a>
  </div>
);

export default BuiltByFooter;
