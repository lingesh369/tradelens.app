
import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options = [], // Default to empty array
  selected = [], // Default to empty array
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [isReady, setIsReady] = React.useState(false)

  // Ensure we have valid arrays before rendering
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) {
      console.warn('MultiSelect: options prop must be an array, received:', typeof options)
      return []
    }
    return options.filter(option => 
      option && 
      typeof option === 'object' && 
      typeof option.label === 'string' && 
      typeof option.value === 'string'
    )
  }, [options])

  const safeSelected = React.useMemo(() => {
    if (!Array.isArray(selected)) {
      console.warn('MultiSelect: selected prop must be an array, received:', typeof selected)
      return []
    }
    return selected.filter(item => typeof item === 'string')
  }, [selected])

  // Wait for props to be properly initialized before rendering the Command component
  React.useEffect(() => {
    if (Array.isArray(options) && Array.isArray(selected) && typeof onChange === 'function') {
      setIsReady(true)
    }
  }, [options, selected, onChange])

  // Debug logging
  React.useEffect(() => {
    console.log('MultiSelect props:', { 
      options: safeOptions?.length, 
      selected: safeSelected?.length, 
      hasOnChange: typeof onChange === 'function',
      placeholder,
      isReady
    });
  }, [safeOptions, safeSelected, onChange, placeholder, isReady]);

  const handleUnselect = React.useCallback((item: string) => {
    console.log('handleUnselect called with:', item);
    if (typeof onChange === 'function' && Array.isArray(safeSelected)) {
      onChange(safeSelected.filter((i) => i !== item))
    }
  }, [onChange, safeSelected])

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    console.log('Popover open change:', newOpen);
    setOpen(newOpen);
  }, [])

  // Early validation checks
  if (!Array.isArray(options)) {
    return (
      <div className={cn("w-[200px] text-sm text-muted-foreground", className)}>
        Invalid options data
      </div>
    )
  }

  if (!Array.isArray(selected)) {
    return (
      <div className={cn("w-[200px] text-sm text-muted-foreground", className)}>
        Invalid selected data
      </div>
    )
  }

  if (typeof onChange !== 'function') {
    return (
      <div className={cn("w-[200px] text-sm text-muted-foreground", className)}>
        Invalid onChange handler
      </div>
    )
  }

  // Don't render the Command component until we're sure everything is ready
  if (!isReady) {
    return (
      <Button
        variant="outline"
        role="combobox"
        className={cn("w-full justify-between", className)}
        disabled
      >
        {placeholder}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => console.log('Button clicked')}
        >
          {safeSelected.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {safeSelected.slice(0, 2).map((item) => (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {item}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
              {safeSelected.length > 2 && (
                <Badge variant="secondary" className="mr-1 mb-1">
                  +{safeSelected.length - 2} more
                </Badge>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.map((option) => {
              try {
                const isSelected = safeSelected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      console.log('CommandItem selected:', option.value);
                      if (typeof onChange === 'function') {
                        if (isSelected) {
                          onChange(safeSelected.filter((item) => item !== option.value))
                        } else {
                          onChange([...safeSelected, option.value])
                        }
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              } catch (error) {
                console.error('Error rendering option:', option, error);
                return null;
              }
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
