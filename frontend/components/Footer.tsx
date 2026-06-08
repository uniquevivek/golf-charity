import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="glass border-t border-border mt-auto w-full py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="p-1.5 rounded bg-primary/20 text-primary">🏆</span>
            <span>GolfCharity Platform</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            A premium full-stack subscription platform bridging passion for golf with philanthropic impact. Log scores, win rewards, and fuel non-profit growth.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            </li>
            <li>
              <Link href="/charities" className="hover:text-primary transition-colors">Charities</Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-primary transition-colors">Pricing & Plans</Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-primary transition-colors">Draw Rules</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Licensing Info</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto h-[1px] bg-border my-8"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>
          &copy; {new Date().getFullYear()} Golf Charity Subscription Platform. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
