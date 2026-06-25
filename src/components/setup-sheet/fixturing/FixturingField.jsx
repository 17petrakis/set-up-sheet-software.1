import { Label } from "@/components/ui/label";

export default function FixturingField({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}