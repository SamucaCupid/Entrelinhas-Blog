import { AdSlot } from "@/components/app/AdSlot";

type DesktopAdRailsProps = {
  side: "left" | "right";
};

export function DesktopAdRails({ side }: DesktopAdRailsProps) {
  const slot = side === "left" ? "rail-left-desktop" : "rail-right-desktop";

  return (
    <aside className="hidden lg:block pt-6">
      <div className="sticky top-6">
        <AdSlot slot={slot} />
      </div>
    </aside>
  );
}
