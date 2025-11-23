
import { z } from "zod";

export const tradeFormSchema = z.object({
  trade_id: z.string().optional(),
  marketType: z.string().min(1, "Market type is required"),
  accountId: z.string().min(1, "Account is required"),
  instrument: z.string().min(1, "Instrument is required"),
  contract: z.string().optional(),
  // Accept any case input for action but transform to lowercase
  action: z.string().transform(val => val.toLowerCase()),
  quantity: z.coerce.number().positive("Quantity must be positive").min(0.0000001, "Quantity must be greater than 0"),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  entryDate: z.date(),
  entryTime: z.string().optional(),
  exitPrice: z.coerce.number().positive("Exit price must be positive").optional().nullable(),
  exitDate: z.date().optional().nullable(),
  exitTime: z.string().optional().nullable(),
  // Transform negative values to positive for commission and fees
  commission: z.coerce.number().transform(val => Math.abs(val)).default(0),
  fees: z.coerce.number().transform(val => Math.abs(val)).default(0),
  notes: z.string().optional(),
  strategyId: z.string().optional(),
  stopLoss: z.coerce.number().positive("Stop loss must be positive").optional(),
  target: z.coerce.number().positive("Target must be positive").optional(),
  contractMultiplier: z.coerce.number().positive("Contract multiplier must be positive").default(1),
});

export type TradeFormValues = z.infer<typeof tradeFormSchema>;
