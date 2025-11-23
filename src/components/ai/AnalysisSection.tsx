
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { LucideIcon } from 'lucide-react';

interface AnalysisSectionProps {
  title: string;
  content: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  title,
  content,
  icon: Icon,
  iconColor = "text-primary",
  className
}) => {
  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer content={content} />
      </CardContent>
    </Card>
  );
};
