import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-1.5">
            <Link href="/" className="inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <span className="text-[15px] font-semibold text-[#111827]">ShowsUp</span>
            </Link>
            <p className="text-[13px] text-[#6B7280]">Get your brand to show up in AI.</p>
            <p className="text-[12px] text-[#9CA3AF]">Open Source · MIT Licensed · Made in Singapore 🇸🇬</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Product</p>
              {[
                { label: "Cloud",       href: "/signup"      },
                { label: "CLI",         href: "/cli"         },
                { label: "Chrome",      href: "/chrome-extension" },
                { label: "Methodology", href: "/methodology" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-[13px] text-[#4B5563] hover:text-[#111827] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Company</p>
              {[
                { label: "About",     href: "/about"     },
                { label: "Blog",      href: "/blog"      },
                { label: "Changelog", href: "/changelog" },
                { label: "GitHub",    href: "https://github.com/rahulnambiar/showsup" },
              ].map(l => (
                <a key={l.href} href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block text-[13px] text-[#4B5563] hover:text-[#111827] transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Legal</p>
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms",   href: "/terms"   },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-[13px] text-[#4B5563] hover:text-[#111827] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6">
          <p className="text-[12px] text-[#9CA3AF]">
            © {new Date().getFullYear()} FVG Capital Pte. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
