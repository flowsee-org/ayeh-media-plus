import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inputCls } from "./shared";

/* Radix-based select: touch-friendly, opens as a scrollable popup (bottom-sheet
   feel on mobile). Drop-in replacement for native <select> elements. */
export default function SelectInput({ value, onChange, options, className = "" }) {
  return (
    <Select value={value} onValueChange={onChange} dir="rtl">
      <SelectTrigger className={className || inputCls}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72 z-50">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}