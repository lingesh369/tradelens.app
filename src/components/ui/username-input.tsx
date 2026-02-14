import React from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2, User } from 'lucide-react';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { cn } from '@/lib/utils';

interface UsernameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  currentUsername?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export const UsernameInput = React.forwardRef<HTMLInputElement, UsernameInputProps>(
  ({ value, currentUsername, onValidityChange, className, ...props }, ref) => {
    const { isChecking, isAvailable, message, isValid } = useUsernameAvailability(value, currentUsername);

    React.useEffect(() => {
      onValidityChange?.(isValid);
    }, [isValid, onValidityChange]);

    const getStatusIcon = () => {
      if (isChecking) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      }
      
      if (value.length >= 3) {
        if (isAvailable === true) {
          return <Check className="h-4 w-4 text-green-600" />;
        } else if (isAvailable === false) {
          return <X className="h-4 w-4 text-red-600" />;
        }
      }
      
      return null;
    };

    const getStatusColor = () => {
      if (value.length < 3) return '';
      if (isAvailable === true) return 'border-green-500';
      if (isAvailable === false) return 'border-red-500';
      return '';
    };

    const getMessageColor = () => {
      if (isAvailable === true) return 'text-green-600';
      if (isAvailable === false) return 'text-red-600';
      return 'text-muted-foreground';
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            value={value}
            className={cn(
              "pl-10 pr-10",
              getStatusColor(),
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-3">
            {getStatusIcon()}
          </div>
        </div>
        {value.length >= 3 && message && (
          <p className={cn("text-xs", getMessageColor())}>
            {message}
          </p>
        )}
      </div>
    );
  }
);

UsernameInput.displayName = "UsernameInput";
