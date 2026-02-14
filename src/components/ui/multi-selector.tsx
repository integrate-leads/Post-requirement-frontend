'use client';

import * as React from 'react';
import { Check, ChevronDown, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

export interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  disable?: boolean;
}

export interface MultiSelectorProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  options: MultiSelectOption[];
  onValueChange: (value: string[]) => void;
  value?: string[];
  defaultValue?: string[];
  placeholder?: string;
  maxCount?: number;
  showall?: boolean;
  modalPopover?: boolean;
  className?: string;
  popoverClass?: string;
}

export const MultiSelector = React.forwardRef<HTMLButtonElement, MultiSelectorProps>(
  (
    {
      options,
      onValueChange,
      value: controlledValue,
      defaultValue = [],
      placeholder = 'Select options',
      maxCount = 3,
      showall = false,
      modalPopover = false,
      className,
      popoverClass,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue);
    const [open, setOpen] = React.useState(false);

    const isControlled = controlledValue !== undefined;
    const selectedValues = isControlled ? controlledValue : internalValue;

    const updateValue = React.useCallback(
      (next: string[]) => {
        if (!isControlled) setInternalValue(next);
        onValueChange(next);
      },
      [isControlled, onValueChange]
    );

    const toggleOption = (optionValue: string) => {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      updateValue(next);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateValue([]);
    };

    const handleClearExtra = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateValue(selectedValues.slice(0, maxCount));
    };

    const filteredOptions = options.filter((o) => !o.disable);
    const toggleAll = () => {
      if (selectedValues.length === filteredOptions.length) {
        updateValue([]);
      } else {
        updateValue(filteredOptions.map((o) => o.value));
      }
    };

    const displayValues = showall ? selectedValues : selectedValues.slice(0, maxCount);
    const extraCount = selectedValues.length - maxCount;

    return (
      <Popover open={open} onOpenChange={setOpen} modal={modalPopover}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal min-h-10 h-auto py-2',
              !selectedValues.length && 'text-muted-foreground',
              className
            )}
            {...props}
          >
            {selectedValues.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 flex-1">
                {displayValues.map((val) => {
                  const option = options.find((o) => o.value === val);
                  const Icon = option?.icon;
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-sm"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {option?.label ?? val}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOption(val);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {!showall && extraCount > 0 && (
                  <span className="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-sm">
                    +{extraCount} more
                    <button
                      type="button"
                      className="ml-0.5 rounded-full outline-none focus:ring-2 focus:ring-ring"
                      onClick={handleClearExtra}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="rounded-full p-0.5 outline-none ring-offset-background hover:bg-muted focus:ring-2 focus:ring-ring"
                  onClick={handleClear}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('z-[10000] w-[var(--radix-popover-trigger-width)] p-0', popoverClass)}
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={toggleAll}
                  className="cursor-pointer"
                >
                  {selectedValues.length === filteredOptions.length ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <span className="mr-2 h-4 w-4 w-4" />
                  )}
                  (Select All)
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isDisabled = option.disable;
                  const Icon = option.icon;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => !isDisabled && toggleOption(option.value)}
                      className={cn(
                        'cursor-pointer',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={isDisabled}
                    >
                      {isSelected && !isDisabled ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <span className="mr-2 h-4 w-4 w-4" />
                      )}
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedValues.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setOpen(false)}
                      className="flex-1 justify-center cursor-pointer"
                    >
                      Close
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelector.displayName = 'MultiSelector';
