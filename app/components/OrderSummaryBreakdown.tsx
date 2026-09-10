import { formatPrice } from "@/app/lib/utils";

interface OrderSummaryBreakdownProps {
  subtotal: number;
  shippingCost: number;
  total: number;
  labels: {
    subtotal: string;
    shipping: string;
    freeShipping: string;
    total: string;
  };
}

export default function OrderSummaryBreakdown({
  subtotal,
  shippingCost,
  total,
  labels,
}: OrderSummaryBreakdownProps) {
  return (
    <div className="pt-4 border-t border-border space-y-2">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{labels.subtotal}</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{labels.shipping}</span>
        <span>{shippingCost === 0 ? labels.freeShipping : formatPrice(shippingCost)}</span>
      </div>
      <div className="flex justify-between text-sm font-black text-text-primary pt-2 border-t border-border border-dashed">
        <span>{labels.total}</span>
        <span className="text-base text-primary">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
