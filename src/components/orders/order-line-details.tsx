import { orderLineDetails, type OrderLineView } from "@/lib/order-line";
import { cn } from "@/lib/utils";

/** The variant and modifiers of an order line, under its name. Renders nothing when there are none. */
export function OrderLineDetails({
  line,
  className,
}: {
  line: Pick<OrderLineView, "variantLabel" | "modifiers">;
  className?: string;
}) {
  const text = orderLineDetails(line);
  if (!text) return null;
  return <p className={cn("break-words text-xs text-muted-foreground", className)}>{text}</p>;
}
