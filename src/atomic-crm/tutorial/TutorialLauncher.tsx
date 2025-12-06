import { BookOpen, CheckCircle } from 'lucide-react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTutorial } from './TutorialProvider';
import type { TutorialChapter } from './types';

const CHAPTERS: { key: TutorialChapter; label: string }[] = [
  { key: 'organizations', label: 'Organizations' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'activities', label: 'Activities' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'products', label: 'Products' },
  { key: 'notes', label: 'Notes' },
  { key: 'users', label: 'Team Members' },
];

export function TutorialLauncher() {
  const { startTutorial, progress } = useTutorial();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="h-11">
        <BookOpen className="mr-2 h-4 w-4" />
        <span>Tutorial</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {/* Full tour option */}
        <DropdownMenuItem
          onClick={() => startTutorial()}
          className="h-11 font-medium"
        >
          ▶ Start Full Tour
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Individual chapters */}
        {CHAPTERS.map(({ key, label }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => startTutorial(key)}
            className="h-11 flex justify-between"
          >
            <span>{label}</span>
            {progress.completedChapters.includes(key) && (
              <CheckCircle className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
