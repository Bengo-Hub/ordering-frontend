"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, Home, Trash2 } from "lucide-react";
import Link from "next/link";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  outletId?: string;
  outletName?: string;
};

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  onOpenChange,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = 150;
  const tax = Math.round(subtotal * 0.16); // 16% tax
  const total = subtotal + deliveryFee + tax;

  // Group items by outlet
  const itemsByOutlet = items.reduce(
    (acc, item) => {
      const outletId = item.outletId || "unknown";
      if (!acc[outletId]) {
        acc[outletId] = [];
      }
      acc[outletId].push(item);
      return acc;
    },
    {} as Record<string, CartItem[]>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="space-y-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-lg">Shopping Cart</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <Home className="size-12 text-muted-foreground opacity-50" />
              <div>
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start adding items from the menu
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-6 py-4">
              {Object.entries(itemsByOutlet).map(([outletId, outletItems]) => (
                <div key={outletId} className="space-y-2">
                  {outletItems[0]?.outletName && (
                    <div className="flex items-center justify-between rounded-md bg-muted/30 p-2">
                      <p className="text-xs font-semibold">{outletItems[0].outletName}</p>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2">
                    {outletItems.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onRemove={() => onRemoveItem(item.id)}
                        onQuantityChange={(qty) => onUpdateQuantity(item.id, qty)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-border px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">KES {deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax (16%)</span>
              <span className="font-medium">KES {tax.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="space-y-2 border-t border-border px-6 py-4">
            <Button onClick={onCheckout} className="w-full" size="lg" asChild>
              <Link href="/checkout">
                Proceed to Checkout
                <ChevronRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Continue Shopping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}

function CartItemRow({ item, onRemove, onQuantityChange }: CartItemRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">KES {item.price.toLocaleString()}</p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
            className="inline-flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="inline-flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm font-semibold">KES {item.total.toLocaleString()}</p>
        <button
          onClick={onRemove}
          className="rounded p-1 text-xs text-destructive transition hover:bg-destructive/10"
          aria-label="Remove item"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
