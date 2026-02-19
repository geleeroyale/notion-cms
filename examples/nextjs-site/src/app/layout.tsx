import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion CMS Site",
  description: "Powered by Notion CMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <header className="border-b">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold">
              My Site
            </a>
            <div className="flex gap-6">
              <a href="/" className="hover:text-blue-600">
                Home
              </a>
              <a href="/blog" className="hover:text-blue-600">
                Blog
              </a>
              <a href="/videos" className="hover:text-blue-600">
                Videos
              </a>
              <a href="/projects" className="hover:text-blue-600">
                Projects
              </a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t mt-16">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-500">
            Powered by Notion CMS
          </div>
        </footer>
      </body>
    </html>
  );
}
