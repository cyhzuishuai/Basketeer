"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3 } from "lucide-react"
import { WalletConnect } from "./wallet-connect"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ETF Protocol</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={
                  pathname === "/" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Discover
              </Link>
              <Link
                href="/vaults"
                className={
                  pathname === "/vaults" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Vaults
              </Link>
              <Link
                href="/create"
                className={
                  pathname === "/create" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Create
              </Link>
            </nav>
          </div>

          <WalletConnect />
        </div>
      </div>
    </header>
  )
} 