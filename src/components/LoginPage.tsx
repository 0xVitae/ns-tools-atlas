import { Loader2 } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  not_member: 'You must be a Network School member to access the Atlas.',
  discord_auth_failed: 'Discord authentication failed. Please try again.',
  ns_verify_failed: `Could not verify membership (status: ${new URLSearchParams(window.location.search).get('status') ?? '?'}). Please try again.`,
  auth_failed: 'Authentication failed. Please try again.',
};

export function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Network constellation background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.04 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="net" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
            {/* Nodes */}
            <circle cx="50" cy="50" r="4" fill="black" />
            <circle cx="200" cy="30" r="6" fill="black" />
            <circle cx="340" cy="70" r="3" fill="black" />
            <circle cx="120" cy="150" r="5" fill="black" />
            <circle cx="280" cy="160" r="4" fill="black" />
            <circle cx="380" cy="180" r="3" fill="black" />
            <circle cx="30" cy="250" r="3" fill="black" />
            <circle cx="160" cy="270" r="6" fill="black" />
            <circle cx="310" cy="280" r="4" fill="black" />
            <circle cx="70" cy="350" r="4" fill="black" />
            <circle cx="240" cy="370" r="5" fill="black" />
            <circle cx="370" cy="340" r="3" fill="black" />
            {/* Connections */}
            <line x1="50" y1="50" x2="200" y2="30" stroke="black" strokeWidth="1" />
            <line x1="200" y1="30" x2="340" y2="70" stroke="black" strokeWidth="1" />
            <line x1="50" y1="50" x2="120" y2="150" stroke="black" strokeWidth="1" />
            <line x1="200" y1="30" x2="280" y2="160" stroke="black" strokeWidth="1" />
            <line x1="200" y1="30" x2="120" y2="150" stroke="black" strokeWidth="0.5" />
            <line x1="340" y1="70" x2="280" y2="160" stroke="black" strokeWidth="1" />
            <line x1="340" y1="70" x2="380" y2="180" stroke="black" strokeWidth="0.5" />
            <line x1="280" y1="160" x2="380" y2="180" stroke="black" strokeWidth="1" />
            <line x1="120" y1="150" x2="30" y2="250" stroke="black" strokeWidth="0.5" />
            <line x1="120" y1="150" x2="160" y2="270" stroke="black" strokeWidth="1" />
            <line x1="280" y1="160" x2="310" y2="280" stroke="black" strokeWidth="1" />
            <line x1="280" y1="160" x2="160" y2="270" stroke="black" strokeWidth="0.5" />
            <line x1="30" y1="250" x2="70" y2="350" stroke="black" strokeWidth="1" />
            <line x1="30" y1="250" x2="160" y2="270" stroke="black" strokeWidth="1" />
            <line x1="160" y1="270" x2="310" y2="280" stroke="black" strokeWidth="0.5" />
            <line x1="160" y1="270" x2="240" y2="370" stroke="black" strokeWidth="1" />
            <line x1="310" y1="280" x2="370" y2="340" stroke="black" strokeWidth="1" />
            <line x1="310" y1="280" x2="240" y2="370" stroke="black" strokeWidth="0.5" />
            <line x1="70" y1="350" x2="240" y2="370" stroke="black" strokeWidth="1" />
            <line x1="240" y1="370" x2="370" y2="340" stroke="black" strokeWidth="1" />
            <line x1="380" y1="180" x2="310" y2="280" stroke="black" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#net)" />
      </svg>

      <div className="relative max-w-xs w-full text-center space-y-10">
        {/* Logo mark */}
        <div className="space-y-5">
          <img src="/favicon.png" alt="NS Tools Atlas" className="w-12 h-12 rounded-xl mb-2 mx-auto" />

          <div>
            <h1
              className="text-2xl font-semibold tracking-tight text-black"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}
            >
              NS Tools Atlas
            </h1>
            <p className="text-black/40 text-sm mt-2 leading-relaxed">
              Network School member access only.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">
              {ERROR_MESSAGES[error] || 'Something went wrong. Please try again.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/api/auth/discord"
            className="group relative inline-flex items-center justify-center gap-2.5 w-full bg-black hover:bg-black/85 text-white font-medium rounded-lg px-6 py-3 text-sm transition-all duration-200"
          >
            <svg width="18" height="14" viewBox="0 0 71 55" fill="white" className="shrink-0">
              <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.7 58.7 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0017.7-9v-.1c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1zm23.3 0c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1z" />
            </svg>
            Continue with Discord
          </a>

          <p className="text-black/25 text-xs">
            Verify your membership to explore the ecosystem.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-black/30 animate-spin" />
    </div>
  );
}
