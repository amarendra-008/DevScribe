import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LandingView() {
  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/app`,
        scopes: 'read:user repo',
      },
    });

    if (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center justify-center px-6 py-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="DevScribe" className="w-7 h-7 rounded-md" />
              <span className="text-lg font-semibold">DevScribe</span>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs text-gray-400 border border-white/10 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Now in public beta
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
                Documentation that
                <br />
                <span className="text-gray-500">writes itself</span>
              </h1>

              <button
                onClick={handleGitHubLogin}
                className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded font-medium hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            {/* Visual demo */}
            <div className="relative">
              {/* Input side */}
              <div className="bg-[#111] border border-white/10 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">your-repo</span>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Commits */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Commits</div>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex items-start gap-3">
                        <span className="text-gray-600">a3f2c1</span>
                        <span className="text-gray-400">fix: resolve auth token refresh</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-600">b7d4e2</span>
                        <span className="text-gray-400">feat: add dark mode support</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-600">c9a1f3</span>
                        <span className="text-gray-400">feat: webhook integration</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-600">d2b5e4</span>
                        <span className="text-gray-400">docs: update API reference</span>
                      </div>
                    </div>
                  </div>

                  {/* Output */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Generated</div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-white font-medium mb-1">## What's New</div>
                        <div className="text-gray-500 pl-4 border-l border-white/10 space-y-1">
                          <div>• Dark mode support</div>
                          <div>• Webhook integration for Slack</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-white font-medium mb-1">## Bug Fixes</div>
                        <div className="text-gray-500 pl-4 border-l border-white/10">
                          <div>• Fixed auth token refresh issue</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 bg-[#0a0a0a] border border-white/10 rounded-full">
                <ArrowRight size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* How it works */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-12 text-center">
              How it works
            </h2>

            <div className="space-y-16">
              <div className="flex gap-8">
                <div className="text-4xl font-semibold text-white/10">01</div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Connect your repository</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Sign in with GitHub and select the repositories you want to document.
                    Grant write access so we can sync documentation directly to your repo.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-4xl font-semibold text-white/10">02</div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Generate documentation</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Create changelogs from your commit history or generate READMEs
                    based on your project structure. Review and edit if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-4xl font-semibold text-white/10">03</div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Auto-sync to your repo</h3>
                  <p className="text-gray-500 leading-relaxed">
                    One click and your documentation is committed directly to your repository.
                    No copy-pasting, no context switching. Just push and done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Features list */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-12 text-center">
              What you get
            </h2>

            <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
              {[
                'Changelog generation from commits',
                'README generation from code',
                'Auto-sync to your repository',
                'Private repository support',
                'Keep a Changelog format',
                'Review before pushing',
                'Works with any language',
                'No code stored on our servers',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-gray-600 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/5">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <span>DevScribe</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-400 transition-colors">About</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            </div>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
