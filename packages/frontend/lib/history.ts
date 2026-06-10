import { get, set, update } from 'idb-keyval';

export type HistoryItem = {
  id: string;
  name: string;
  size: number;
  type: 'send' | 'receive';
  timestamp: number;
  status: 'done' | 'error' | 'canceled';
  thumbnail?: string;
};

const HISTORY_KEY = 'airdelivery_transfer_history';

export async function addToHistory(item: Omit<HistoryItem, 'timestamp'>) {
  const newItem: HistoryItem = {
    ...item,
    timestamp: Date.now(),
  };

  await update(HISTORY_KEY, (val: HistoryItem[] | undefined) => {
    const list = val || [];
    // Keep last 50 items
    return [newItem, ...list].slice(0, 50);
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  const history = await get<HistoryItem[]>(HISTORY_KEY);
  return history || [];
}

export async function clearHistory() {
  await set(HISTORY_KEY, []);
}
