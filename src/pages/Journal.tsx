import { useState, useEffect, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { DateRange } from "@/components/filters/DateRangeSelector";
import { useJournal } from "@/hooks/useJournal";
import { useTrades } from "@/hooks/useTrades";
import { useJournalImages } from "@/hooks/useJournalImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format, addDays, subDays, isEqual, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, Image, ArrowLeft, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalNotesEditor } from "@/components/journal/JournalNotesEditor";
import { EnhancedJournalImages } from "@/components/journal/EnhancedJournalImages";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalFilters } from "@/context/FilterContext";
import { useNavigation } from "@/context/NavigationContext";
import { useEnhancedNavigation } from "@/hooks/useEnhancedNavigation";

const Journal = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2000, 0, 1), // Far past date for "All Time"
    to: new Date(2099, 11, 31), // Far future date for "All Time"
    preset: "allTime",
  });
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("notes");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  const { journals, isLoading, upsertJournal, refetch } = useJournal();
  const { trades } = useTrades();
  const { settings } = useGlobalSettings();
  const { filters } = useGlobalFilters();
  const navigate = useNavigate();
  const params = useParams();
  const { setBreadcrumbs } = useNavigation();
  const { navigateToTrade } = useEnhancedNavigation();
  const { 
    images: journalImages, 
    isLoading: imagesLoading, 
    fetchImagesForDate, 
    uploadImage, 
    updateImageNotes, 
    linkImageToTrade, 
    deleteImage 
  } = useJournalImages();

  // Handle URL date parameter
  useEffect(() => {
    const { date } = params;
    if (date) {
      try {
        const parsedDate = parseISO(date);
        if (!isNaN(parsedDate.getTime())) {
          // Only update if the date is actually different to prevent loops
          const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
          if (date !== currentDateStr) {
            setSelectedDate(parsedDate);
          }
        }
      } catch (error) {
        console.warn('Invalid date parameter:', date);
      }
    }
  }, [params.date]); // Only depend on params.date, not selectedDate

  // Synchronize URL with selected date (only when date changes programmatically)
  useEffect(() => {
    const { date } = params;
    const dateParam = format(selectedDate, 'yyyy-MM-dd');
    
    // Only update URL if there's no date parameter in URL or if we're on base journal path
    if (!date || window.location.pathname === '/journal') {
      const expectedPath = `/journal/${dateParam}`;
      navigate(expectedPath, { replace: true });
    }
  }, [selectedDate, navigate, params.date]);
  
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const handlePreviousDay = useCallback(() => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  }, []);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Memoize calendar calculations
  const calendarData = useMemo(() => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const prevMonthDays = [];
    for (let i = 0; i < startDay; i++) {
      const day = new Date(firstDayOfMonth);
      day.setDate(day.getDate() - (startDay - i));
      prevMonthDays.push(day);
    }
    
    const currentMonthDays = [];
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      currentMonthDays.push(new Date(currentYear, currentMonth, i));
    }
    
    const nextMonthDays = [];
    const remainingDays = (6 - lastDayOfMonth.getDay());
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(lastDayOfMonth);
      day.setDate(day.getDate() + i);
      nextMonthDays.push(day);
    }
    
    const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return { weeks, currentMonth };
  }, [selectedDate]);

  // Memoize formatted date
  const formattedDate = useMemo(() => format(selectedDate, "EEEE, MMMM d, yyyy"), [selectedDate]);

  // Memoize journal entry lookup
  const journalEntry = useMemo(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return journals.find(entry => {
      if (!entry.journal_date) return false;
      return format(new Date(entry.journal_date), "yyyy-MM-dd") === selectedDateStr;
    });
  }, [journals, selectedDate]);

  // Memoize trades for selected date - use global filters for better filtering
  const selectedDateTrades = useMemo(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    
    // First filter trades for the selected date
    let dayTrades = trades.filter(trade => {
      if (!trade.entry_time) return false;
      return format(new Date(trade.entry_time), "yyyy-MM-dd") === selectedDateStr;
    });

    // Then apply global account filter if not "all accounts"
    if (!filters.selectedAccounts.allAccounts) {
      dayTrades = dayTrades.filter(trade => 
        trade.account_id ? filters.selectedAccounts.accountIds.includes(trade.account_id) : false
      );
    }

    console.log("Journal page - Selected date trades with global account filter:", dayTrades);
    return dayTrades;
  }, [trades, selectedDate, filters.selectedAccounts]);

  // Calculate correct metrics for the selected date
  const dayMetrics = useMemo(() => {
    if (selectedDateTrades.length === 0) {
      return {
        netPnL: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    const totalTrades = selectedDateTrades.length;
    const netPnL = selectedDateTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    
    // Calculate win rate: (Number of Winning Trades / Total Trades) * 100
    const winningTrades = selectedDateTrades.filter(trade => (trade.net_pl || 0) > 0);
    const losingTrades = selectedDateTrades.filter(trade => (trade.net_pl || 0) < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    // Calculate profit factor: Total Gross Profit / Total Gross Loss
    const totalGrossProfit = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const totalGrossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
    const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : 0;

    // Calculate average win and loss
    const avgWin = winningTrades.length > 0 ? totalGrossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0;

    return {
      netPnL,
      winRate,
      profitFactor,
      totalTrades,
      avgWin,
      avgLoss
    };
  }, [selectedDateTrades]);

  // Update notes when journal entry changes
  useEffect(() => {
    if (journalEntry?.notes) {
      setNotes(journalEntry.notes);
    } else {
      setNotes("");
    }
  }, [journalEntry]);

  // Fetch images when date changes
  useEffect(() => {
    fetchImagesForDate(selectedDate);
  }, [selectedDate, fetchImagesForDate]);

  const handleCreateEntry = useCallback(async () => {
    setIsCreatingEntry(true);
    try {
      const result = await upsertJournal({
        entry_content: "",
        notes: "",
        journal_date: format(selectedDate, 'yyyy-MM-dd'),
        image_captions: {}
      });

      if (result && result.success) {
        await refetch();
      }
    } catch (error) {
      console.error("Failed to create journal entry:", error);
    } finally {
      setIsCreatingEntry(false);
    }
  }, [upsertJournal, selectedDate, refetch]);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploadingImage(true);
    try {
      await uploadImage(file, selectedDate);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsUploadingImage(false);
    }
  }, [uploadImage, selectedDate]);

  const handleTradeClick = useCallback((tradeId: string) => {
    // Use enhanced navigation with journal context
    navigateToTrade(tradeId, 'journal', format(selectedDate, 'yyyy-MM-dd'));
  }, [navigateToTrade, selectedDate]);

  // Handle notes change from rich text editor
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
  }, []);

  // Sidebar content for calendar and recent entries
  const SidebarContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold">Trading Calendar</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="text-md font-medium">
              {format(selectedDate, "MMMM yyyy")}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            <div className="text-xs font-medium text-muted-foreground">Su</div>
            <div className="text-xs font-medium text-muted-foreground">Mo</div>
            <div className="text-xs font-medium text-muted-foreground">Tu</div>
            <div className="text-xs font-medium text-muted-foreground">We</div>
            <div className="text-xs font-medium text-muted-foreground">Th</div>
            <div className="text-xs font-medium text-muted-foreground">Fr</div>
            <div className="text-xs font-medium text-muted-foreground">Sa</div>
          </div>
          
          {calendarData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day) => {
                const isCurrentMonth = day.getMonth() === calendarData.currentMonth;
                const isSelected = isEqual(
                  new Date(day.getFullYear(), day.getMonth(), day.getDate()),
                  new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
                );
                
                const dayDateStr = format(day, "yyyy-MM-dd");
                
                // Check for journal entry for this date
                const dayJournalEntry = journals.find(entry => {
                  if (!entry.journal_date) return false;
                  return format(new Date(entry.journal_date), "yyyy-MM-dd") === dayDateStr;
                });
                
                // Calculate P&L from trades for this date
                let dayTradesFiltered = trades.filter(trade => {
                  if (!trade.entry_time) return false;
                  return format(new Date(trade.entry_time), "yyyy-MM-dd") === dayDateStr;
                });

                const hasEntry = !!dayJournalEntry;
                
                let entryClass = "";
                
                // Simple highlighting: Only consider journal P&L
                if (dayJournalEntry && dayJournalEntry.net_pl !== null && dayJournalEntry.net_pl !== 0) {
                  // Journal entry with P&L data
                  entryClass = dayJournalEntry.net_pl > 0 
                    ? "bg-green-200 dark:bg-green-400/20" 
                    : "bg-red-200 dark:bg-red-400/20";
                } else if (hasEntry) {
                  // Journal entry exists but no P&L
                  entryClass = "bg-purple-100 dark:bg-purple-400/20";
                }
                
                return (
                  <Button
                    key={dayDateStr}
                    variant="ghost"
                    size="sm"
                    className={`
                      h-8 w-full rounded-md p-0 text-center 
                      ${!isCurrentMonth ? "text-muted-foreground opacity-50" : ""}
                      ${isSelected ? "bg-primary text-primary-foreground" : ""}
                      ${hasEntry && !isSelected ? entryClass : ""}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    {format(day, "d")}
                  </Button>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold">Recent Entries</h3>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : journals.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">No journal entries yet.</p>
          ) : (
            <div className="space-y-3">
              {journals.slice(0, 5).map((entry) => (
                <Card 
                  key={entry.id} 
                  className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                    entry.journal_date && format(new Date(entry.journal_date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                      ? "border-primary" 
                      : ""
                  }`} 
                  onClick={() => {
                    if (entry.journal_date) {
                      setSelectedDate(new Date(entry.journal_date));
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <h4 className="text-base font-medium mb-2">
                      {entry.journal_date ? format(new Date(entry.journal_date), "EEE, MMM d, yyyy") : "No date"}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Net P&L</p>
                        <p className={`text-sm font-medium ${entry.net_pl && entry.net_pl > 0 ? "text-green-500" : entry.net_pl && entry.net_pl < 0 ? "text-red-500" : ""}`}>
                          {entry.net_pl ? `${entry.net_pl > 0 ? '+' : ''}${formatCurrencyValue(Math.abs(entry.net_pl), settings?.base_currency || "USD")}` : "--"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Trades</p>
                        <p className="text-sm font-medium">
                          {entry.num_trades || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-sm font-medium">
                          {entry.win_rate ? `${(entry.win_rate * 100).toFixed(1)}%` : "0.0%"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const handleDeleteImage = useCallback(async (imageId: string) => {
    // Find the image to get its name
    const imageToDelete = journalImages.find(img => img.id === imageId);
    if (imageToDelete) {
      try {
        await deleteImage(imageId, imageToDelete.image_name);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }, [deleteImage, journalImages]);

  return (
    <Layout title="Journal" showAccountSelector={true}>
      <div className="p-3 sm:p-6 overflow-auto h-[calc(100vh-64px)]">
        {/* Desktop Layout - Side by side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SidebarContent />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousDay}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl sm:text-2xl font-bold">{formattedDate}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {!journalEntry && (
                <Button 
                  className="gap-1 bg-purple-500 hover:bg-purple-600 text-xs sm:text-sm"
                  onClick={handleCreateEntry}
                  disabled={isCreatingEntry}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isCreatingEntry ? "Creating..." : "New Entry"}
                </Button>
              )}
            </div>
            
            {/* Journal Content */}
            {!journalEntry && !isLoading && selectedDateTrades.length === 0 && (
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center py-10">
                  <div className="bg-muted rounded-full p-6 mb-4">
                    <Image className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Journal Entry for This Day</h3>
                  <p className="text-center text-muted-foreground mb-6 max-w-md text-sm sm:text-base">
                    Click "New Entry" to create a journal entry for {format(selectedDate, "MMM d, yyyy")}.
                    You can add notes and images after creating the entry.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {(journalEntry || selectedDateTrades.length > 0) && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Net P&L</p>
                      <p className={`text-lg sm:text-2xl font-bold ${dayMetrics.netPnL > 0 ? "text-green-500" : dayMetrics.netPnL < 0 ? "text-red-500" : ""}`}>
                        {dayMetrics.netPnL !== 0 ? (dayMetrics.netPnL > 0 ? "+" : "") + formatCurrencyValue(Math.abs(dayMetrics.netPnL), settings?.base_currency || "USD") : "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Win Rate</p>
                      <p className="text-lg sm:text-2xl font-bold">
                        {dayMetrics.winRate.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Profit Factor</p>
                      <p className="text-lg sm:text-2xl font-bold">
                        {dayMetrics.profitFactor > 0 ? `${dayMetrics.profitFactor.toFixed(2)}x` : "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Avg Win/Loss</p>
                      <p className="text-lg sm:text-2xl font-bold">
                        {dayMetrics.avgWin > 0 && dayMetrics.avgLoss > 0 ? 
                          `${(dayMetrics.avgWin / dayMetrics.avgLoss).toFixed(2)}` : "--"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tabs Section */}
                <Card>
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="notes" className="flex-1 text-xs sm:text-sm">Notes</TabsTrigger>
                        <TabsTrigger value="trades" className="flex-1 text-xs sm:text-sm">Trades ({selectedDateTrades.length})</TabsTrigger>
                        <TabsTrigger value="images" className="flex-1 text-xs sm:text-sm">Charts & Images ({journalImages.length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="notes" className="p-3 sm:p-4">
                        <JournalNotesEditor
                          selectedDate={selectedDate}
                          journalEntry={journalEntry}
                          onNotesChange={handleNotesChange}
                        />
                      </TabsContent>
                      
                      <TabsContent value="trades" className="p-3 sm:p-4">
                        {selectedDateTrades.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No trades recorded for this day.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedDateTrades.map((trade) => (
                              <Card 
                                key={trade.id} 
                                className="border border-muted cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleTradeClick(trade.id)}
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="font-medium text-sm sm:text-base">{trade.instrument}</span>
                                      <span className="text-xs bg-muted px-2 py-1 rounded ml-2">
                                        {trade.action === "BUY" ? "LONG" : "SHORT"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className={`font-medium text-sm sm:text-base ${trade.net_pl && trade.net_pl > 0 ? "text-green-500" : trade.net_pl && trade.net_pl < 0 ? "text-red-500" : ""}`}>
                                        {trade.net_pl ? `${trade.net_pl > 0 ? '+' : ''}${formatCurrencyValue(Math.abs(trade.net_pl), settings?.base_currency || "USD")}` : "--"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {trade.entry_time && trade.exit_time ? 
                                      `${format(new Date(trade.entry_time), "HH:mm")} - ${format(new Date(trade.exit_time), "HH:mm")}` : 
                                      trade.entry_time ? `Entered at ${format(new Date(trade.entry_time), "HH:mm")}` : ""}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="images" className="p-3 sm:p-4">
                        <EnhancedJournalImages
                          images={journalImages}
                          trades={selectedDateTrades}
                          onUpload={handleImageUpload}
                          onUpdateNotes={updateImageNotes}
                          onLinkToTrade={linkImageToTrade}
                          onDelete={handleDeleteImage}
                          isUploading={isUploadingImage}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Mobile and Tablet Layout - Vertical stacking */}
        <div className="lg:hidden space-y-6">
          {/* Main Journal Section First */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousDay}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg sm:text-xl font-bold text-center">{formattedDate}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {!journalEntry && (
                <Button 
                  className="gap-1 bg-purple-500 hover:bg-purple-600 text-xs sm:text-sm self-center"
                  onClick={handleCreateEntry}
                  disabled={isCreatingEntry}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isCreatingEntry ? "Creating..." : "New Entry"}
                </Button>
              )}
            </div>
            
            {/* Journal Content */}
            {!journalEntry && !isLoading && selectedDateTrades.length === 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center py-8 sm:py-10">
                  <div className="bg-muted rounded-full p-4 sm:p-6 mb-4">
                    <Image className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">No Journal Entry for This Day</h3>
                  <p className="text-center text-muted-foreground mb-6 max-w-md text-sm sm:text-base">
                    Click "New Entry" to create a journal entry for {format(selectedDate, "MMM d, yyyy")}.
                    You can add notes and images after creating the entry.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {(journalEntry || selectedDateTrades.length > 0) && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Net P&L</p>
                      <p className={`text-base sm:text-xl font-bold ${dayMetrics.netPnL > 0 ? "text-green-500" : dayMetrics.netPnL < 0 ? "text-red-500" : ""}`}>
                        {dayMetrics.netPnL !== 0 ? (dayMetrics.netPnL > 0 ? "+" : "") + formatCurrencyValue(Math.abs(dayMetrics.netPnL), settings?.base_currency || "USD") : "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Win Rate</p>
                      <p className="text-base sm:text-xl font-bold">
                        {dayMetrics.winRate.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Profit Factor</p>
                      <p className="text-base sm:text-xl font-bold">
                        {dayMetrics.profitFactor > 0 ? `${dayMetrics.profitFactor.toFixed(2)}x` : "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <p className="text-muted-foreground text-xs sm:text-sm">Avg Win/Loss</p>
                      <p className="text-base sm:text-xl font-bold">
                        {dayMetrics.avgWin > 0 && dayMetrics.avgLoss > 0 ? 
                          `${(dayMetrics.avgWin / dayMetrics.avgLoss).toFixed(2)}` : "--"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tabs Section */}
                <Card>
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="notes" className="flex-1 text-xs sm:text-sm">Notes</TabsTrigger>
                        <TabsTrigger value="trades" className="flex-1 text-xs sm:text-sm">Trades ({selectedDateTrades.length})</TabsTrigger>
                        <TabsTrigger value="images" className="flex-1 text-xs sm:text-sm">Charts & Images ({journalImages.length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="notes" className="p-3 sm:p-4">
                        <JournalNotesEditor
                          selectedDate={selectedDate}
                          journalEntry={journalEntry}
                          onNotesChange={handleNotesChange}
                        />
                      </TabsContent>
                      
                      <TabsContent value="trades" className="p-3 sm:p-4">
                        {selectedDateTrades.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No trades recorded for this day.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedDateTrades.map((trade) => (
                              <Card 
                                key={trade.id} 
                                className="border border-muted cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleTradeClick(trade.id)}
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="font-medium text-sm sm:text-base">{trade.instrument}</span>
                                      <span className="text-xs bg-muted px-2 py-1 rounded ml-2">
                                        {trade.action === "BUY" ? "LONG" : "SHORT"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className={`font-medium text-sm sm:text-base ${trade.net_pl && trade.net_pl > 0 ? "text-green-500" : trade.net_pl && trade.net_pl < 0 ? "text-red-500" : ""}`}>
                                        {trade.net_pl ? `${trade.net_pl > 0 ? '+' : ''}${formatCurrencyValue(Math.abs(trade.net_pl), settings?.base_currency || "USD")}` : "--"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {trade.entry_time && trade.exit_time ? 
                                      `${format(new Date(trade.entry_time), "HH:mm")} - ${format(new Date(trade.exit_time), "HH:mm")}` : 
                                      trade.entry_time ? `Entered at ${format(new Date(trade.entry_time), "HH:mm")}` : ""}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="images" className="p-3 sm:p-4">
                        <EnhancedJournalImages
                          images={journalImages}
                          trades={selectedDateTrades}
                          onUpload={handleImageUpload}
                          onUpdateNotes={updateImageNotes}
                          onLinkToTrade={linkImageToTrade}
                          onDelete={handleDeleteImage}
                          isUploading={isUploadingImage}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Calendar and Recent Entries Below on Mobile/Tablet */}
          <SidebarContent />
        </div>
      </div>
    </Layout>
  );
};

export default Journal;


