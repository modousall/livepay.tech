import { Link } from "wouter";

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-4 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <span>LivePay &copy; {currentYear}</span>
          <span className="hidden md:inline">•</span>
          <a href="https://livepay.tech" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            livepay.tech
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <span className="text-muted-foreground/50">•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Conditions</Link>
          <span className="text-muted-foreground/50">•</span>
          <Link href="/data-deletion" className="hover:text-foreground transition-colors">Suppression</Link>
          <span className="text-muted-foreground/50">•</span>
          <a href="mailto:support@livepay.tech" className="hover:text-foreground transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
