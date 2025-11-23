
export interface JournalEntry {
  journal_id: string;
  user_id: string;
  journal_date: string;
  notes: string | null;
  net_pl: number | null;
  num_trades: number | null;
  win_rate: number | null;
  profit_factor: number | null;
  total_profitable_pl: number | null;
  total_losing_pl: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  total_fees: number | null;
  image_captions: Record<string, string> | null;
  all_trades_notes: string | null;
  all_journal_images_notes: string | null;
  // Additional compatibility fields
  note_id?: string;
  title?: string;
  content?: string;
  date?: Date | string;
  created_at?: string;
  updated_at?: string;
  entry_content?: string;
  // Legacy fields
  entry_id?: string;
}

export interface JournalUpsertData {
  journal_id?: string;
  entry_id?: string;
  note_id?: string;
  title?: string;
  content?: string;
  notes?: string;
  entry_content?: string;
  date?: Date | string;
  journal_date?: string;
  net_pl?: number;
  win_rate?: number;
  num_trades?: number;
  profit_factor?: number;
  winning_trades?: number;
  losing_trades?: number;
  total_profitable_pl?: number;
  total_losing_pl?: number;
  total_fees?: number;
  image_captions?: Record<string, string>;
  all_trades_notes?: string;
  all_journal_images_notes?: string;
}
