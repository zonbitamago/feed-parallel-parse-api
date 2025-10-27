/**
 * localStorage service for subscription persistence
 */

import type { Subscription } from '../types/models';

const STORAGE_KEY = 'rss_reader_subscriptions';

interface StorageData {
  subscriptions: Subscription[];
}

export function loadSubscriptions(): Subscription[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed: StorageData = JSON.parse(data);
    return parsed.subscriptions || [];
  } catch (error) {
    console.error('Failed to load subscriptions from localStorage:', error);
    return [];
  }
}

export function saveSubscriptions(subscriptions: Subscription[]): void {
  try {
    const data: StorageData = { subscriptions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save subscriptions to localStorage:', error);
  }
}
