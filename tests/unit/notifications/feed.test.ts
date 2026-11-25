import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_GROUP_LABELS,
  groupNotificationsByDay,
  notificationGroup,
} from '../../../apps/web/lib/notifications/feed';

const NOW = new Date('2026-06-15T12:00:00Z');

describe('notification feed helpers', () => {
  it('clasifica los tipos por grupo', () => {
    expect(notificationGroup('application')).toBe('offers');
    expect(notificationGroup('booking')).toBe('offers');
    expect(notificationGroup('session')).toBe('coach');
    expect(notificationGroup('document')).toBe('documents');
    expect(notificationGroup('post_like')).toBe('social');
    expect(notificationGroup('unknown')).toBe('system');
    expect(NOTIFICATION_GROUP_LABELS.documents).toBe('Documents');
  });

  it('separa Today y Earlier por día UTC', () => {
    const { today, earlier } = groupNotificationsByDay(
      [
        { id: 'a', createdAt: new Date('2026-06-15T01:00:00Z') },
        { id: 'b', createdAt: new Date('2026-06-14T23:59:00Z') },
        { id: 'c', createdAt: new Date('2026-06-10T10:00:00Z') },
      ],
      NOW
    );
    expect(today.map((item) => item.id)).toEqual(['a']);
    expect(earlier.map((item) => item.id)).toEqual(['b', 'c']);
  });
});
