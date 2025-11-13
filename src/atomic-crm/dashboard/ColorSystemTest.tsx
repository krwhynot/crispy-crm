/**
 * Temporary test component to verify Tailwind v4 opacity syntax
 * Tests semantic color tokens with opacity modifiers
 * DELETE THIS FILE after verification
 */

export const ColorSystemTest = () => {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Semantic Color System Test</h2>

      {/* Gray scale tokens */}
      <div className="space-y-2">
        <h3 className="font-semibold">Gray Scale (should work)</h3>
        <div className="text-foreground">text-foreground (primary text)</div>
        <div className="text-muted-foreground">text-muted-foreground (secondary text)</div>
        <div className="bg-muted p-2">bg-muted (subtle background)</div>
        <div className="bg-muted/50 p-2">bg-muted/50 (50% opacity - TEST)</div>
        <div className="border border p-2">border (standard border)</div>
      </div>

      {/* Status colors */}
      <div className="space-y-2">
        <h3 className="font-semibold">Status Colors (should work)</h3>
        <div className="text-success p-2">text-success (green text)</div>
        <div className="bg-success/10 p-2">bg-success/10 (10% opacity - TEST)</div>
        <div className="text-warning p-2">text-warning (yellow text)</div>
        <div className="bg-warning/10 p-2">bg-warning/10 (10% opacity - TEST)</div>
        <div className="text-destructive p-2">text-destructive (red text)</div>
        <div className="bg-destructive/10 p-2">bg-destructive/10 (10% opacity - TEST)</div>
      </div>

      {/* Primary/accent colors */}
      <div className="space-y-2">
        <h3 className="font-semibold">Brand Colors (should work)</h3>
        <div className="text-primary p-2">text-primary (brand forest green)</div>
        <div className="bg-primary/10 p-2">bg-primary/10 (10% opacity - TEST)</div>
        <div className="bg-primary/20 p-2">bg-primary/20 (20% opacity - TEST)</div>
      </div>

      {/* Hover states */}
      <div className="space-y-2">
        <h3 className="font-semibold">Interactive States (should work)</h3>
        <div className="hover:bg-muted p-2 cursor-pointer">hover:bg-muted</div>
        <button className="focus:ring-2 focus:ring-primary p-2 border">
          focus:ring-primary
        </button>
      </div>
    </div>
  );
};
