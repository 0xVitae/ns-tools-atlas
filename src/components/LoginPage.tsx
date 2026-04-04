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
    <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xs w-full bg-white/90 border border-white/30 rounded-2xl shadow-lg px-8 py-10 text-center space-y-10">
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
    <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
    </div>
  );
}
