import type { Metadata } from 'next';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Health agent · Settings' };

export default function HealthAgentSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Account and practice settings for your health-agent portal."
        icon="settings"
      />

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Practice profile, verification (registration, insurance and background check),
            notification preferences and billing will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
