
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Coupon } from '@/types/coupon';

const couponSchema = z.object({
  name: z.string().min(1, 'Coupon name is required'),
  code: z.string().min(1, 'Coupon code is required').regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0, 'Discount value must be positive'),
  usage_limit_total: z.number().min(1).optional(),
  usage_limit_per_user: z.number().min(1).optional(),
  applicable_plans: z.array(z.string()).optional(),
  validity_start_date: z.date().optional(),
  validity_end_date: z.date().optional(),
  currency_restriction: z.string().optional(),
  status: z.enum(['active', 'disabled']),
  notes: z.string().optional(),
});

type CouponFormData = z.infer<typeof couponSchema>;

interface CouponFormProps {
  coupon?: Coupon | null;
  onSubmit: (data: CouponFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CouponForm = ({ coupon, onSubmit, onCancel, isLoading }: CouponFormProps) => {
  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      name: coupon?.name || '',
      code: coupon?.code || '',
      discount_type: (coupon?.discount_type as "percentage" | "fixed") || 'percentage',
      discount_value: coupon?.discount_value || 0,
      usage_limit_total: coupon?.usage_limit_total || undefined,
      usage_limit_per_user: coupon?.usage_limit_per_user || undefined,
      applicable_plans: coupon?.applicable_plans as string[] || [],
      validity_start_date: coupon?.validity_start_date ? new Date(coupon.validity_start_date) : undefined,
      validity_end_date: coupon?.validity_end_date ? new Date(coupon.validity_end_date) : undefined,
      currency_restriction: coupon?.currency_restriction || 'all',
      status: (coupon?.status as "active" | "disabled") || 'active',
      notes: coupon?.notes || '',
    },
  });

  const discountType = form.watch('discount_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coupon Name</FormLabel>
                <FormControl>
                  <Input placeholder="Launch Promo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coupon Code</FormLabel>
                <FormControl>
                  <Input placeholder="LAUNCH50" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="discount_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Type</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-row space-x-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <label htmlFor="percentage">Percentage</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <label htmlFor="fixed">Flat Amount</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Value</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={discountType === 'percentage' ? '50' : '10'}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    {discountType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="usage_limit_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Usage Limit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usage_limit_per_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Per User Limit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="applicable_plans"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applicable Plans</FormLabel>
              <div className="flex flex-wrap gap-4">
                {['All Plans', 'Starter', 'Pro'].map((plan) => (
                  <div key={plan} className="flex items-center space-x-2">
                    <Checkbox
                      id={plan}
                      checked={field.value?.includes(plan) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value || []), plan]);
                        } else {
                          field.onChange(field.value?.filter((p) => p !== plan) || []);
                        }
                      }}
                    />
                    <label htmlFor={plan}>{plan}</label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="validity_start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validity_end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currency_restriction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Restriction</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD Only</SelectItem>
                  <SelectItem value="INR">INR Only</SelectItem>
                  <SelectItem value="EUR">EUR Only</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Coupon</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Coupon will be {field.value === 'active' ? 'active' : 'disabled'}
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === 'active'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'disabled')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notes (Private)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal notes about this coupon campaign..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
