import { Card, ScrollArea, type CardProps, type ScrollAreaProps } from '@mantine/core';
import type { ReactNode } from 'react';

/** Card wrapping dashboard data tables — matches My Jobs / recruiter tables */
export const DASHBOARD_TABLE_CARD_PROPS = {
  shadow: 'sm' as const,
  padding: 'lg' as const,
  withBorder: true as const,
  radius: 'md' as const,
};

/** Default `Table` props for dashboard list views (spacing like My Job Postings) */
export const DASHBOARD_TABLE_PROPS = {
  striped: true as const,
  highlightOnHover: true as const,
  verticalSpacing: 'md' as const,
  horizontalSpacing: 'md' as const,
  fz: 'sm' as const,
};

export const DASHBOARD_TABLE_STYLES = {
  th: { fontWeight: 700 as const },
};

interface DashboardTableCardProps {
  children: ReactNode;
  cardProps?: Omit<CardProps, 'children'>;
  /** Set false to render children only inside the card (no ScrollArea) */
  withScrollArea?: boolean;
  scrollAreaProps?: ScrollAreaProps;
}

/**
 * White card + optional horizontal scroll — use with `<Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES} />`
 */
export function DashboardTableCard({
  children,
  cardProps,
  withScrollArea = true,
  scrollAreaProps,
}: DashboardTableCardProps) {
  return (
    <Card {...DASHBOARD_TABLE_CARD_PROPS} {...cardProps}>
      {withScrollArea ? (
        <ScrollArea type="auto" offsetScrollbars {...scrollAreaProps}>
          {children}
        </ScrollArea>
      ) : (
        children
      )}
    </Card>
  );
}
