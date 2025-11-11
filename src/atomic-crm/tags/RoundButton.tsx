import { getTagColorClass, normalizeColorToSemantic } from "./tag-colors";

interface RoundButtonProps {
  color: string;
  handleClick: () => void;
  selected: boolean;
}

export const RoundButton = ({ color, handleClick, selected }: RoundButtonProps) => {
  // Convert hex color to semantic color name and get the CSS class
  const semanticColorName = normalizeColorToSemantic(color);
  const colorClass = getTagColorClass(color);

  return (
    <button
      type="button"
      className={`
        w-8 h-8 rounded-full inline-block m-1 transition-all
        ${colorClass}
        ${
          selected
            ? "ring-2 ring-offset-2 ring-primary shadow-md scale-110"
            : "hover:scale-105 hover:shadow-sm"
        }
      `}
      onClick={handleClick}
      aria-label={`Select ${semanticColorName} color`}
      aria-pressed={selected}
    />
  );
};
