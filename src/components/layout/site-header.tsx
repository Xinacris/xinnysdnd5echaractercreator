import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>D&D Karakter Oluşturucu</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/karakter/yeni">Yeni Karakter</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
