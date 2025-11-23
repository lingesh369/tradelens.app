
import React from "react";
import { cn } from "@/lib/utils";

export interface StepProps {
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

export interface StepsProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export const Step = ({ title, description, isCompleted, isActive }: StepProps) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
          isActive && "border-primary bg-primary text-primary-foreground",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted-foreground bg-background text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span>{isActive ? "" : ""}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
};

export const Steps = ({ currentStep, children, className }: StepsProps) => {
  const steps = React.Children.toArray(children);
  
  return (
    <div className={cn("flex w-full", className)}>
      {steps.map((step, index) => {
        const isCompletedStep = index < currentStep - 1;
        const isActiveStep = index === currentStep - 1;
        
        return (
          <React.Fragment key={index}>
            <div className="flex-1">
              {React.isValidElement(step) &&
                React.cloneElement(step as React.ReactElement<StepProps>, {
                  isActive: isActiveStep,
                  isCompleted: isCompletedStep,
                })}
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 flex flex-1 items-center">
                <div
                  className={cn(
                    "h-[2px] w-full",
                    index < currentStep - 1 ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
