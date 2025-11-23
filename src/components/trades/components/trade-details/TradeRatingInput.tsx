
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface TradeRatingInputProps {
  rating: number;
  isReadOnly?: boolean;
  onRatingChange: (value: number) => void;
}

export function TradeRatingInput({ rating, isReadOnly = false, onRatingChange }: TradeRatingInputProps) {
  const [localRating, setLocalRating] = useState(rating);

  const handleSliderChange = (value: number[]) => {
    const newRating = value[0];
    setLocalRating(newRating);
    onRatingChange(newRating);
  };

  const getRatingLabel = (value: number) => {
    if (value === 0) return "Not Rated";
    if (value <= 2) return "Poor";
    if (value <= 4) return "Below Average";
    if (value <= 6) return "Average";
    if (value <= 8) return "Good";
    return "Excellent";
  };

  return (
    <div className="space-y-2">
      <Label>Trade Rating: {localRating}/10</Label>
      {isReadOnly ? (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(localRating / 10) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor (1)</span>
            <span>Excellent (10)</span>
          </div>
        </div>
      ) : (
        <div className="px-2">
          <Slider
            value={[localRating]}
            onValueChange={handleSliderChange}
            max={10}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Poor (1)</span>
            <span>Excellent (10)</span>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {getRatingLabel(localRating)}
      </p>
    </div>
  );
}
