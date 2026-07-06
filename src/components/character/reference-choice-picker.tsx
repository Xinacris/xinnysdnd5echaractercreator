"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/info-tooltip";

export interface ChoiceOption {
  index: string;
  label: string;
  description?: string;
}

export function ReferenceChoicePicker({
  options,
  choose,
  value,
  onChange,
}: {
  options: ChoiceOption[];
  choose: number;
  value: string[];
  onChange: (indices: string[]) => void;
}) {
  if (choose === 1) {
    return (
      <RadioGroup value={value[0] ?? ""} onValueChange={(v) => onChange([v])} className="gap-2">
        {options.map((opt) => (
          <div key={opt.index} className="flex items-center gap-2">
            <RadioGroupItem value={opt.index} id={`ref-${opt.index}`} />
            <Label htmlFor={`ref-${opt.index}`} className="font-normal">
              {opt.description ? <InfoTooltip description={opt.description}>{opt.label}</InfoTooltip> : opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  function toggle(index: string, checked: boolean) {
    if (checked) {
      if (value.length >= choose) return;
      onChange([...value, index]);
    } else {
      onChange(value.filter((v) => v !== index));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {value.length} / {choose} seçildi
      </p>
      {options.map((opt) => {
        const checked = value.includes(opt.index);
        const disabled = !checked && value.length >= choose;
        return (
          <div key={opt.index} className="flex items-center gap-2">
            <Checkbox
              id={`ref-${opt.index}`}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(c) => toggle(opt.index, c === true)}
            />
            <Label htmlFor={`ref-${opt.index}`} className={`font-normal ${disabled ? "text-muted-foreground" : ""}`}>
              {opt.description ? <InfoTooltip description={opt.description}>{opt.label}</InfoTooltip> : opt.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
