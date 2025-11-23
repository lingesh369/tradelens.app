
import { supabase } from "@/integrations/supabase/client";
import { ImageUploadService } from "./imageUploadService";

export class JournalTriggerService {
  /**
   * Process and migrate existing base64 images in journal fields
   */
  static async migrateJournalBase64Images(userId: string) {
    try {
      // Get all journal entries for the user
      const { data: journals, error } = await supabase
        .from('journal')
        .select('journal_id, user_id, all_journal_images_notes')
        .eq('user_id', userId);

      if (error || !journals) {
        console.error('Error fetching journals for migration:', error);
        return;
      }

      for (const journal of journals) {
        let needsUpdate = false;
        let updatedData: any = {};

        // Process all_journal_images_notes only (all_trades_notes is now handled by database triggers)
        if (journal.all_journal_images_notes && journal.all_journal_images_notes.includes('data:image')) {
          const processedNotes = await ImageUploadService.processContentForSaving(
            journal.all_journal_images_notes, 
            'journal'
          );
          updatedData.all_journal_images_notes = processedNotes;
          needsUpdate = true;
        }

        // Update if needed
        if (needsUpdate) {
          await supabase
            .from('journal')
            .update(updatedData)
            .eq('journal_id', journal.journal_id);
        }
      }

      console.log('Journal base64 migration completed for user:', userId);
    } catch (error) {
      console.error('Error migrating journal base64 images:', error);
    }
  }
}
