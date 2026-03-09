import { DesktopAdRails } from "@/components/app/DesktopAdRails";
import { SiteFooter } from "@/components/app/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1880px] lg:grid lg:grid-cols-[170px_minmax(0,1fr)_170px] lg:gap-4 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:gap-8">
          <DesktopAdRails side="left" />
          <div className="min-w-0">{children}</div>
          <DesktopAdRails side="right" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
