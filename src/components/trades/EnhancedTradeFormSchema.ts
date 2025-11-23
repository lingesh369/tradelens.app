
import { z } from "zod";

export const tradeRowSchema = z.object({
  id: z.string(),
  action: z.enum(["buy", "sell"]),
  date: z.date(),
  time: z.string(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  fee: z.coerce.number().min(0, "Fee cannot be negative").default(0),
});

export const enhancedTradeFormSchema = z.object({
  // Basic Info
  accountId: z.string().min(1, "Account is required"),
  strategy: z.string().optional(),
  marketType: z.string().min(1, "Market type is required"),
  symbol: z.string().min(1, "Symbol is required").transform(val => val.toUpperCase()),
  contractMultiplier: z.coerce.number().positive("Contract multiplier must be positive").default(1),
  target: z.coerce.number().positive("Target must be positive").optional(),
  stopLoss: z.coerce.number().positive("Stop loss must be positive").optional(),
  
  // Options-specific fields
  isLong: z.boolean().default(true),
  
  // Futures-specific fields
  tickSize: z.coerce.number().positive("Tick size must be positive").optional(),
  tickValue: z.coerce.number().positive("Tick value must be positive").optional(),
  
  // Trade rows
  tradeRows: z.array(tradeRowSchema).min(1, "At least one trade row is required")
    .refine((rows) => {
      // Validate partial exit logic
      if (rows.length <= 1) return true;
      
      const mainAction = rows[0].action;
      let totalMainQuantity = 0;
      let totalExitQuantity = 0;
      
      rows.forEach(row => {
        if (row.action === mainAction) {
          totalMainQuantity += row.quantity;
        } else {
          totalExitQuantity += row.quantity;
        }
      });
      
      return totalExitQuantity <= totalMainQuantity;
    }, "Exit quantity cannot exceed entry quantity"),
  
  // Notes tab
  notes: z.string().optional(),
  tradeRating: z.number().min(0).max(10).default(5),
  uploadedImages: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  
  // Trade analysis fields
  mainImage: z.string().optional(),
  additionalImages: z.array(z.string()).max(3, "Maximum 3 additional images allowed").default([]),
});

export type TradeRow = z.infer<typeof tradeRowSchema>;
export type EnhancedTradeFormValues = z.infer<typeof enhancedTradeFormSchema>;
