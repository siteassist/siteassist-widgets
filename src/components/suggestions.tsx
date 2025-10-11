import { Button } from "@/components/ui/button";

export interface Suggestion {
  title: string;
  prompt: string;
}

export default function Suggestions({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: Suggestion[];
  onSuggestionClick?: (suggestion: Suggestion) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, i) => (
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground rounded-full"
          key={i}
          onClick={() => {
            onSuggestionClick?.(suggestion);
          }}
        >
          {suggestion.title}
        </Button>
      ))}
    </div>
  );
}
