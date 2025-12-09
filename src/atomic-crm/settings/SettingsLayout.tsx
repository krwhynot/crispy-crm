import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface SettingsLayoutProps {
  sections: SettingsSection[];
}

export function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 min-h-[44px]",
                    activeSection === section.id && "bg-muted"
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  {section.label}
                  {activeSection === section.id && (
                    <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="md:col-span-3">{currentSection?.component}</div>
      </div>
    </div>
  );
}
