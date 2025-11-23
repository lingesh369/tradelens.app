
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotesList } from "@/components/notes/NotesList";
import { useAccessControl } from "@/hooks/useAccessControl";
import { RestrictedPageGuard } from "@/components/subscription/RestrictedPageGuard";

const Notes = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshNotes, setRefreshNotes] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { access, isLoading } = useAccessControl();
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleCreateNew = () => {
    // Set date to today for a new note
    setSelectedDate(new Date());
  };
  
  const handleNoteChange = () => {
    setRefreshNotes(prev => prev + 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  if (isLoading) {
    return (
      <Layout title="Notes">
        <div className="flex items-center justify-center h-[calc(100vh-96px)]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }
  
  // Block access for Starter plan users
  if (!access?.notes && !access?.isAdmin) {
    return <RestrictedPageGuard featureName="Notes" featureKey="notes" />;
  }
  
  return (
    <Layout title="Notes">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left column - Notes List */}
        <div className="lg:col-span-1 flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-96px)]">
          <NotesList 
            key={`notes-list-${refreshNotes}`}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onCreateNew={handleCreateNew}
            searchQuery={searchQuery}
            onSearch={handleSearch}
          />
        </div>
        
        {/* Right column - Note Editor */}
        <div className="lg:col-span-2">
          <NoteEditor 
            selectedDate={selectedDate}
            onNoteChange={handleNoteChange}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
