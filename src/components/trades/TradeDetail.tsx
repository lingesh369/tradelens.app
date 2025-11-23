import { useState, useEffect, useRef } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { TradeDetailHeader } from "./components/TradeDetailHeader";
import { TradeDetailActions } from "./components/TradeDetailActions";
import { TradeDetailContent } from "./components/TradeDetailContent";
import { TradeEditModal } from "./TradeEditModal";
import { useTrades } from "@/hooks/useTrades";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { useTags, Tag } from "@/hooks/useTags";
import { useStrategies, Strategy } from "@/hooks/useStrategies";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";

interface TradeDetailProps {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number | null;
  action: string;
  pnl: number;
  pnlPercent: number;
  quantity: number;
  fees?: number;
  target?: number | null;
  stopLoss?: number | null;
  r2r?: number | null;
  strategy?: string;
  timeframe?: string;
  marketType?: string;
  notes?: string;
  accountId?: string | null;
  contractMultiplier?: number;
  strategiesList?: Strategy[];
  mistakeTags?: Tag[];
  otherTags?: Tag[];
  tradeRating?: number;
  isEditable?: boolean;
  onBack: () => void;
  onSave?: (updatedTrade: any) => void;
  partialExits?: Array<{
    action: string;
    datetime: string;
    quantity: number;
    price: number;
    fee: number;
  }>;
  sharedTradeOwnerData?: {
    accounts: Account[];
    strategies: Strategy[];
    tags: Tag[];
  };
  hideBackButton?: boolean;
  breadcrumbElement?: React.ReactNode;
}

export function TradeDetail({
  id,
  symbol,
  entryDate,
  exitDate,
  entryPrice,
  exitPrice,
  action,
  pnl,
  pnlPercent,
  quantity,
  fees = 0,
  target,
  stopLoss,
  r2r,
  strategy,
  timeframe = "15min",
  marketType = "Stock",
  notes = "",
  accountId,
  contractMultiplier = 1,
  strategiesList = [],
  mistakeTags: propMistakeTags = [],
  otherTags: propOtherTags = [],
  tradeRating: propTradeRating = 0,
  isEditable = false,
  isReadOnly = false,
  onBack,
  onSave,
  partialExits = [],
  sharedTradeOwnerData,
  hideBackButton = false,
  breadcrumbElement
}: TradeDetailProps & { marketType?: string; tradeRating?: number; isReadOnly?: boolean }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { updateTrade, deleteTrade, VALID_MARKET_TYPES } = useTrades();
  
  // Use shared trade owner data if available, otherwise use hooks
  const { accounts } = useAccounts();
  const { tags } = useTags();
  const { strategies: availableStrategies } = useStrategies();

  // Determine which data to use based on whether it's a shared trade
  const effectiveAccounts = sharedTradeOwnerData?.accounts || accounts;
  const effectiveStrategies = sharedTradeOwnerData?.strategies || strategiesList.length > 0 ? strategiesList : availableStrategies;
  const effectiveTags = sharedTradeOwnerData?.tags || tags;

  // Valid trade timeframes that match the database constraint
  const VALID_TRADE_TIMEFRAMES = [
    "1min", "2min", "3min", "5min", "10min", "15min", "30min", "45min",
    "1h", "2h", "3h", "4h", "1d", "1w", "1M"
  ];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [actualExitTime, setActualExitTime] = useState<string | null>(null);
  const [originalCommission, setOriginalCommission] = useState<number>(0);
  const [originalFees, setOriginalFees] = useState<number>(0);
  const [isShared, setIsShared] = useState(false);

  // Get proper exit date and time from database or partial exits
  const getExitDateTime = () => {
    // If we have partial exits, use the last one as the exit time
    if (partialExits && partialExits.length > 0) {
      const lastExit = partialExits[partialExits.length - 1];
      const exitDateTime = new Date(lastExit.datetime);
      return {
        exitDate: exitDateTime.toISOString().split('T')[0],
        exitTime: exitDateTime.toTimeString().slice(0, 5) // HH:MM format
      };
    }
    
    // Use actual exit time from database if available
    if (actualExitTime) {
      const exitDateTime = new Date(actualExitTime);
      return {
        exitDate: exitDateTime.toISOString().split('T')[0],
        exitTime: exitDateTime.toTimeString().slice(0, 5) // HH:MM format
      };
    }
    
    // No exit data available
    return { exitDate: null, exitTime: null };
  };

  const { exitDate: calculatedExitDate, exitTime: calculatedExitTime } = getExitDateTime();
  
  // Store original values for discard functionality - using safe fallbacks
  const originalValuesRef = useRef({
    instrument: symbol,
    action: action,
    marketType: marketType || "Stock",
    quantity: quantity,
    contractMultiplier: contractMultiplier,
    entryDate: entryDate.split('T')[0],
    entryTime: entryDate.split('T')[1]?.split('.')[0]?.slice(0, 5) || "09:00",
    exitDate: calculatedExitDate,
    exitTime: calculatedExitTime,
    entryPrice: entryPrice,
    exitPrice: exitPrice || null,
    stopLoss: stopLoss || null,
    target: target || null,
    commission: 0,
    fees: fees,
    timeframe: timeframe || "15min",
    accountId: accountId || "none",
    strategy: strategy || "none",
    notes: notes,
    tags: [] as string[],
    tradeRating: propTradeRating || 0
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe || "15min");
  const [selectedAccount, setSelectedAccount] = useState(accountId || "none");
  const [selectedStrategy, setSelectedStrategy] = useState(strategy || "none");
  const [tradeNotes, setTradeNotes] = useState(notes);
  const [tradeRating, setTradeRating] = useState(propTradeRating || 0);
  const [editValues, setEditValues] = useState({
    instrument: symbol,
    action: action,
    marketType: marketType || "Stock",
    quantity: quantity,
    contractMultiplier: contractMultiplier,
    entryDate: entryDate.split('T')[0],
    entryTime: entryDate.split('T')[1]?.split('.')[0]?.slice(0, 5) || "09:00",
    exitDate: calculatedExitDate,
    exitTime: calculatedExitTime,
    entryPrice: entryPrice,
    exitPrice: exitPrice || null,
    stopLoss: stopLoss || null,
    target: target || null,
    commission: 0,
    fees: fees
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const strategies = strategiesList.length > 0 ? strategiesList : availableStrategies;

  // All tags combined for the unified display
  const allTags = effectiveTags;

  // Update state when props change to ensure real-time updates
  useEffect(() => {
    const { exitDate: newExitDate, exitTime: newExitTime } = getExitDateTime();
    
    setEditValues(prev => ({
      ...prev,
      instrument: symbol,
      action: action,
      marketType: marketType || "Stock",
      quantity: quantity,
      contractMultiplier: contractMultiplier,
      entryDate: entryDate.split('T')[0],
      entryTime: entryDate.split('T')[1]?.split('.')[0]?.slice(0, 5) || "09:00",
      exitDate: newExitDate,
      exitTime: newExitTime,
      entryPrice: entryPrice,
      exitPrice: exitPrice || null,
      stopLoss: stopLoss || null,
      target: target || null,
      fees: fees
    }));
    
    setSelectedTimeframe(timeframe || "15min");
    setSelectedAccount(accountId || "none");
    setSelectedStrategy(strategy || "none");
    setTradeNotes(notes);
    setTradeRating(propTradeRating || 0);
    
    // Update original values reference
    originalValuesRef.current = {
      ...originalValuesRef.current,
      instrument: symbol,
      action: action,
      marketType: marketType || "Stock",
      quantity: quantity,
      contractMultiplier: contractMultiplier,
      entryDate: entryDate.split('T')[0],
      entryTime: entryDate.split('T')[1]?.split('.')[0]?.slice(0, 5) || "09:00",
      exitDate: newExitDate,
      exitTime: newExitTime,
      entryPrice: entryPrice,
      exitPrice: exitPrice || null,
      stopLoss: stopLoss || null,
      target: target || null,
      fees: fees,
      timeframe: timeframe || "15min",
      accountId: accountId || "none",
      strategy: strategy || "none",
      notes: notes,
      tradeRating: propTradeRating || 0
    };
  }, [symbol, action, marketType, quantity, contractMultiplier, entryDate, entryPrice, exitPrice, stopLoss, target, fees, timeframe, accountId, strategy, notes, propTradeRating, partialExits, actualExitTime]);

  // Load actual exit time, fee data, timeframe, and rating from database
  useEffect(() => {
    const loadTradeData = async () => {
      if (!id) return;
      
      try {
        const { data: tradeData, error } = await supabase
          .from('trades')
          .select('exit_time, commission, fees, trade_time_frame, trade_rating, market_type, tags, main_image, additional_images')
          .eq('trade_id', id)
          .single();
          
        if (error) {
          console.error('Error loading trade data:', error);
          return;
        }
        
        if (tradeData) {
          if (tradeData.exit_time) {
            setActualExitTime(tradeData.exit_time);
          }
          
          // Set the original commission and fees from database
          const dbCommission = Math.abs(tradeData.commission || 0);
          const dbFees = Math.abs(tradeData.fees || 0);
          
          setOriginalCommission(dbCommission);
          setOriginalFees(dbFees);
          
          // Set the timeframe from database
          const dbTimeframe = tradeData.trade_time_frame || timeframe || "15min";
          setSelectedTimeframe(dbTimeframe);
          
          // Set the trade rating from database
          const dbRating = tradeData.trade_rating || 0;
          setTradeRating(dbRating);
          
          // Update edit values with actual database values
          setEditValues(prev => ({
            ...prev,
            commission: dbCommission,
            fees: dbFees,
            marketType: tradeData.market_type || "Stock"
          }));
          
          // Update original values reference
          originalValuesRef.current.commission = dbCommission;
          originalValuesRef.current.fees = dbFees;
          originalValuesRef.current.timeframe = dbTimeframe;
          originalValuesRef.current.tradeRating = dbRating;
          originalValuesRef.current.marketType = tradeData.market_type || "Stock";

          // Parse and set tags
          if (tradeData.tags) {
            let parsedTags = [];
            try {
              if (typeof tradeData.tags === 'string') {
                parsedTags = JSON.parse(tradeData.tags);
              } else if (Array.isArray(tradeData.tags)) {
                parsedTags = tradeData.tags;
              }
            } catch (e) {
              console.error('Error parsing tags:', e);
              parsedTags = [];
            }
            
            console.log('Loaded trade tags:', parsedTags);
            setSelectedTags(parsedTags);
            originalValuesRef.current.tags = [...parsedTags];
          }
          
          // Set main image
          if (tradeData.main_image) {
            setMainImage(String(tradeData.main_image));
          }
          
          // Parse and set additional images
          if (tradeData.additional_images) {
            let parsedImages = [];
            try {
              if (typeof tradeData.additional_images === 'string') {
                parsedImages = JSON.parse(tradeData.additional_images);
              } else if (Array.isArray(tradeData.additional_images)) {
                parsedImages = tradeData.additional_images;
              }
            } catch (e) {
              console.error('Error parsing additional images:', e);
              parsedImages = [];
            }
            
            setAdditionalImages(parsedImages.map(String));
          }
        }
        
        // Mark as initialized after loading data - this prevents the glitch
        setIsInitialized(true);
        
        // Set fully loaded after a small delay to ensure all state updates are complete
        setTimeout(() => {
          setIsFullyLoaded(true);
        }, 100);
      } catch (error) {
        console.error("Error loading trade data:", error);
        setIsInitialized(true);
        setTimeout(() => {
          setIsFullyLoaded(true);
        }, 100);
      }
    };
    
    loadTradeData();
  }, [id, timeframe]);

  // Load share status
  useEffect(() => {
    const loadShareStatus = async () => {
      if (!id) return;
      
      try {
        const { data: tradeData, error } = await supabase
          .from('trades')
          .select('is_shared')
          .eq('trade_id', id)
          .single();
          
        if (error) {
          console.error('Error loading share status:', error);
          return;
        }
        
        if (tradeData) {
          setIsShared(tradeData.is_shared || false);
        }
      } catch (error) {
        console.error("Error loading share status:", error);
      }
    };
    
    loadShareStatus();
  }, [id]);

  // Update editValues when exit time is loaded
  useEffect(() => {
    const { exitDate, exitTime } = getExitDateTime();
    setEditValues(prev => ({
      ...prev,
      exitDate,
      exitTime
    }));
    
    // Update original values as well
    originalValuesRef.current.exitDate = exitDate;
    originalValuesRef.current.exitTime = exitTime;
  }, [actualExitTime, partialExits]);

  // FIXED: Improved change detection that prevents flickering during initialization
  useEffect(() => {
    // Don't run change detection until component is fully initialized AND loaded
    if (!isInitialized || !isFullyLoaded) {
      setHasChanges(false);
      return;
    }

    const checkForChanges = () => {
      const original = originalValuesRef.current;
      
      // Create normalized comparison objects
      const currentValues = {
        instrument: editValues.instrument,
        action: editValues.action,
        marketType: editValues.marketType,
        quantity: editValues.quantity,
        contractMultiplier: editValues.contractMultiplier,
        entryDate: editValues.entryDate,
        entryTime: editValues.entryTime,
        exitDate: editValues.exitDate,
        exitTime: editValues.exitTime,
        entryPrice: editValues.entryPrice,
        exitPrice: editValues.exitPrice,
        stopLoss: editValues.stopLoss,
        target: editValues.target,
        commission: editValues.commission,
        fees: editValues.fees,
        timeframe: selectedTimeframe,
        accountId: selectedAccount === "none" ? "none" : selectedAccount,
        strategy: selectedStrategy === "none" ? "none" : selectedStrategy,
        notes: tradeNotes,
        tags: selectedTags.sort(),
        tradeRating: tradeRating
      };
      
      const originalNormalized = {
        ...original,
        tags: (original.tags || []).sort()
      };
      
      // Deep comparison
      const hasActualChanges = JSON.stringify(originalNormalized) !== JSON.stringify(currentValues);
      
      setHasChanges(hasActualChanges);
    };
    
    checkForChanges();
  }, [
    editValues,
    selectedTimeframe,
    selectedAccount,
    selectedStrategy,
    tradeNotes,
    selectedTags,
    tradeRating,
    isInitialized,
    isFullyLoaded
  ]);

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) {
      toast({
        title: "Read-only mode",
        description: "You can't make changes on shared pages. This is for viewing only.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate timeframe before saving
      let validTimeframe = selectedTimeframe;
      if (!VALID_TRADE_TIMEFRAMES.includes(selectedTimeframe)) {
        validTimeframe = "15min";
        console.warn(`Invalid timeframe selected: ${selectedTimeframe}. Using default: 15min`);
        setSelectedTimeframe("15min");
      }
      
      if (onSave) {
        await onSave({
          id,
          symbol: editValues.instrument,
          action: editValues.action,
          marketType: editValues.marketType,
          quantity: editValues.quantity,
          contractMultiplier: editValues.contractMultiplier,
          entryPrice: editValues.entryPrice,
          exitPrice: editValues.exitPrice,
          stopLoss: editValues.stopLoss,
          target: editValues.target,
          commission: editValues.commission,
          fees: editValues.fees,
          timeframe: validTimeframe,
          accountId: selectedAccount === "none" ? null : selectedAccount,
          strategy: selectedStrategy === "none" ? null : selectedStrategy,
          notes: tradeNotes,
          tags: selectedTags,
          main_image: mainImage,
          additional_images: additionalImages,
          trade_rating: tradeRating
        });
        
        // Update original values after successful save
        originalValuesRef.current = {
          instrument: editValues.instrument,
          action: editValues.action,
          marketType: editValues.marketType,
          quantity: editValues.quantity,
          contractMultiplier: editValues.contractMultiplier,
          entryDate: editValues.entryDate,
          entryTime: editValues.entryTime,
          exitDate: editValues.exitDate,
          exitTime: editValues.exitTime,
          entryPrice: editValues.entryPrice,
          exitPrice: editValues.exitPrice,
          stopLoss: editValues.stopLoss,
          target: editValues.target,
          commission: editValues.commission,
          fees: editValues.fees,
          timeframe: selectedTimeframe,
          accountId: selectedAccount === "none" ? "none" : selectedAccount,
          strategy: selectedStrategy === "none" ? "none" : selectedStrategy,
          notes: tradeNotes,
          tags: [...selectedTags],
          tradeRating: tradeRating
        };
        
        setHasChanges(false);
        
        if (!isAutoSave) {
          toast({
            title: "Trade updated",
            description: "Your trade has been successfully updated"
          });
        }
        return;
      }
      
      // Validate market type as well
      let validMarketType = editValues.marketType;
      if (!VALID_MARKET_TYPES.includes(editValues.marketType)) {
        validMarketType = VALID_MARKET_TYPES[0];
        toast({
          title: "Invalid market type",
          description: `Using ${validMarketType} as the market type was not valid`,
          variant: "destructive"
        });
      }
      
      const tradeUpdateData = {
        trade_id: id,
        instrument: editValues.instrument,
        action: editValues.action,
        market_type: validMarketType,
        trade_time_frame: validTimeframe,
        quantity: editValues.quantity,
        contract_multiplier: editValues.contractMultiplier,
        entry_price: editValues.entryPrice,
        exit_price: editValues.exitPrice,
        sl: editValues.stopLoss,
        target: editValues.target,
        commission: editValues.commission,
        fees: editValues.fees,
        account_id: selectedAccount === "none" ? null : selectedAccount,
        strategy_id: selectedStrategy === "none" ? null : selectedStrategy,
        notes: tradeNotes,
        tags: selectedTags,
        main_image: mainImage,
        additional_images: additionalImages,
        trade_rating: tradeRating
      };
      
      console.log('Saving trade with data:', tradeUpdateData);
      await updateTrade(tradeUpdateData);
      
      // Update original values after successful save
      originalValuesRef.current = {
        instrument: editValues.instrument,
        action: editValues.action,
        marketType: editValues.marketType,
        quantity: editValues.quantity,
        contractMultiplier: editValues.contractMultiplier,
        entryDate: editValues.entryDate,
        entryTime: editValues.entryTime,
        exitDate: editValues.exitDate,
        exitTime: editValues.exitTime,
        entryPrice: editValues.entryPrice,
        exitPrice: editValues.exitPrice,
        stopLoss: editValues.stopLoss,
        target: editValues.target,
        commission: editValues.commission,
        fees: editValues.fees,
        timeframe: selectedTimeframe,
        accountId: selectedAccount === "none" ? "none" : selectedAccount,
        strategy: selectedStrategy === "none" ? "none" : selectedStrategy,
        notes: tradeNotes,
        tags: [...selectedTags],
        tradeRating: tradeRating
      };
      
      setHasChanges(false);
      
      if (!isAutoSave) {
        toast({
          title: "Trade updated",
          description: "Trade details have been saved successfully"
        });
      }
    } catch (error) {
      console.error('Error saving trade:', error);
      if (!isAutoSave) {
        toast({
          title: "Error saving trade",
          description: "There was a problem saving your changes",
          variant: "destructive"
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (isReadOnly) {
      toast({
        title: "Read-only mode",
        description: "You can't make changes on shared pages. This is for viewing only.",
        variant: "destructive"
      });
      return;
    }
    
    const original = originalValuesRef.current;
    
    // Reset all values to original
    setEditValues({
      instrument: original.instrument,
      action: original.action,
      marketType: original.marketType,
      quantity: original.quantity,
      contractMultiplier: original.contractMultiplier,
      entryDate: original.entryDate,
      entryTime: original.entryTime,
      exitDate: original.exitDate,
      exitTime: original.exitTime,
      entryPrice: original.entryPrice,
      exitPrice: original.exitPrice,
      stopLoss: original.stopLoss,
      target: original.target,
      commission: original.commission,
      fees: original.fees
    });
    
    setSelectedTimeframe(original.timeframe);
    setSelectedAccount(original.accountId);
    setSelectedStrategy(original.strategy);
    setTradeNotes(original.notes);
    setSelectedTags([...original.tags]);
    setTradeRating(original.tradeRating);
    setHasChanges(false);
    
    toast({
      title: "Changes discarded",
      description: "All unsaved changes have been discarded"
    });
  };

  const handleDeleteTrade = async () => {
    if (isReadOnly) {
      toast({
        title: "Read-only mode",
        description: "You can't make changes on shared pages. This is for viewing only.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteTrade(id);
      onBack();
      toast({
        title: "Trade deleted",
        description: "Trade has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({
        title: "Error deleting trade",
        description: "There was a problem deleting the trade",
        variant: "destructive"
      });
    }
  };

  const handleBackWithSavePrompt = () => {
    if (isReadOnly || !hasChanges) {
      onBack();
      return;
    }
    
    if (hasChanges) {
      // Show a toast notification instead of a popup
      toast({
        title: "Unsaved changes detected",
        description: "Use the Save button to save your changes before leaving",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    onBack();
  };

  const handleShareToggle = async (shared: boolean) => {
    if (isReadOnly) return;
    
    try {
      // Check if user profile is available
      if (!profile?.user_id) {
        console.error("User profile not found");
        toast({
          title: "Error",
          description: "User profile not found",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('trades')
        .update({
          is_shared: shared,
          shared_at: shared ? new Date().toISOString() : null,
          shared_by_user_id: shared ? profile.user_id : null
        })
        .eq('trade_id', id)
        .eq('user_id', profile.user_id);
        
      if (error) {
        console.error("Error updating share status:", error);
        toast({
          title: "Error",
          description: "Failed to update sharing status",
          variant: "destructive"
        });
        return;
      }
      
      setIsShared(shared);
      
      toast({
        title: shared ? "Trade shared" : "Sharing disabled",
        description: shared ? "Trade is now publicly accessible" : "Trade is no longer shared"
      });
    } catch (error) {
      console.error("Error updating share status:", error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive"
      });
    }
  };

  // Load trade tags, images, and rating
  useEffect(() => {
    const loadTradeMetadata = async () => {
      if (!id) return;
      
      try {
        // Load trade data to get tags, images, and rating
        const { data: tradeData, error } = await supabase
          .from('trades')
          .select('tags, main_image, additional_images, trade_rating')
          .eq('trade_id', id)
          .single();
          
        if (error) {
          console.error('Error loading trade metadata:', error);
          return;
        }
        
        if (tradeData) {
          // Parse and set tags
          if (tradeData.tags) {
            let parsedTags = [];
            try {
              if (typeof tradeData.tags === 'string') {
                parsedTags = JSON.parse(tradeData.tags);
              } else if (Array.isArray(tradeData.tags)) {
                parsedTags = tradeData.tags;
              }
            } catch (e) {
              console.error('Error parsing tags:', e);
              parsedTags = [];
            }
            
            console.log('Loaded trade tags:', parsedTags);
            setSelectedTags(parsedTags);
            originalValuesRef.current.tags = [...parsedTags];
          }
          
          // Set main image
          if (tradeData.main_image) {
            setMainImage(String(tradeData.main_image));
          }
          
          // Parse and set additional images
          if (tradeData.additional_images) {
            let parsedImages = [];
            try {
              if (typeof tradeData.additional_images === 'string') {
                parsedImages = JSON.parse(tradeData.additional_images);
              } else if (Array.isArray(tradeData.additional_images)) {
                parsedImages = tradeData.additional_images;
              }
            } catch (e) {
              console.error('Error parsing additional images:', e);
              parsedImages = [];
            }
            
            setAdditionalImages(parsedImages.map(String));
          }
          
          // Set trade rating
          if (tradeData.trade_rating !== null && tradeData.trade_rating !== undefined) {
            setTradeRating(tradeData.trade_rating);
            originalValuesRef.current.tradeRating = tradeData.trade_rating;
          }
        }
        
        // Mark as initialized after loading data
        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading trade metadata:", error);
        setIsInitialized(true);
      }
    };
    
    loadTradeMetadata();
  }, [id]);

  const handleEditValuesChange = (key: string, value: any) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (newImages: string[]) => {
    if (newImages.length > 0) {
      setMainImage(newImages[0]);
      setAdditionalImages(newImages.slice(1, 4));
    } else {
      setMainImage("");
      setAdditionalImages([]);
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <TradeDetailActions
        hasChanges={hasChanges && isFullyLoaded}
        isSaving={isSaving}
        onBack={handleBackWithSavePrompt}
        onSave={() => handleSave(false)}
        onDiscard={handleDiscardChanges}
        onDelete={() => setDeleteDialogOpen(true)}
        isReadOnly={isReadOnly}
        hideBackButton={hideBackButton}
        breadcrumbElement={breadcrumbElement}
      />
      
      <TradeDetailHeader
        instrument={editValues.instrument}
        action={editValues.action}
        pnl={pnl}
        pnlPercent={pnlPercent}
        entryDate={editValues.entryDate ? `${editValues.entryDate}T${editValues.entryTime || '09:00'}:00` : entryDate}
        tradeId={id}
        isShared={isShared}
        onShareToggle={handleShareToggle}
        isReadOnly={isReadOnly}
      />

      <TradeDetailContent
        entryDate={editValues.entryDate ? `${editValues.entryDate}T${editValues.entryTime || '09:00'}:00` : entryDate}
        exitDate={editValues.exitDate ? `${editValues.exitDate}T${editValues.exitTime || '16:00'}:00` : exitDate}
        entryPrice={editValues.entryPrice}
        exitPrice={editValues.exitPrice}
        action={editValues.action}
        quantity={editValues.quantity}
        target={editValues.target}
        stopLoss={editValues.stopLoss}
        partialExits={partialExits}
        editValues={editValues}
        accounts={effectiveAccounts}
        strategies={effectiveStrategies}
        allTags={effectiveTags}
        selectedTimeframe={selectedTimeframe}
        selectedAccount={selectedAccount}
        selectedStrategy={selectedStrategy}
        selectedTags={selectedTags}
        tradeId={id}
        tradeRating={tradeRating}
        tradeNotes={tradeNotes}
        images={[mainImage, ...additionalImages].filter(Boolean)}
        hasChanges={hasChanges}
        mainImage={mainImage}
        additionalImages={additionalImages}
        sharedTradeOwnerData={sharedTradeOwnerData}
        onEdit={handleEdit}
        onEditValuesChange={handleEditValuesChange}
        onSelectedTimeframeChange={setSelectedTimeframe}
        onSelectedAccountChange={setSelectedAccount}
        onSelectedStrategyChange={setSelectedStrategy}
        onSelectedTagsChange={setSelectedTags}
        onTradeRatingChange={setTradeRating}
        onTradeNotesChange={setTradeNotes}
        onImagesChange={handleImagesChange}
        onSave={() => handleSave(false)}
        isReadOnly={isReadOnly}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the trade
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrade} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trade Edit Modal */}
      <TradeEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        tradeData={{
          id: id,
          symbol: symbol,
          action: action,
          quantity: quantity,
          entryPrice: entryPrice,
          exitPrice: exitPrice,
          entryDate: entryDate,
          exitDate: exitDate,
          marketType: marketType,
          accountId: accountId,
          strategy: strategy,
          target: target,
          stopLoss: stopLoss,
          contractMultiplier: contractMultiplier,
          partialExits: partialExits
        }}
        onSave={async (updatedTrade) => {
          // Call the parent's onSave function which will trigger refetch and update all props
          if (onSave) {
            // Map the updated trade data to the format expected by handleTradeUpdate
            const mappedTradeData = {
              id: id,
              symbol: updatedTrade.instrument || symbol,
              action: updatedTrade.action || action,
              quantity: updatedTrade.quantity || quantity,
              entryPrice: updatedTrade.entry_price || entryPrice,
              exitPrice: updatedTrade.exit_price || exitPrice,
              marketType: updatedTrade.market_type || marketType,
              timeframe: updatedTrade.trade_time_frame || timeframe,
              notes: updatedTrade.notes || notes,
              strategy: updatedTrade.strategy_id || strategy,
              stopLoss: updatedTrade.sl || stopLoss,
              target: updatedTrade.target || target,
              accountId: updatedTrade.account_id || accountId,
              contractMultiplier: updatedTrade.contract_multiplier || contractMultiplier,
              commission: updatedTrade.commission || 0,
              fees: updatedTrade.fees || fees,
              tags: updatedTrade.tags || [],
              main_image: updatedTrade.main_image || null,
              additional_images: updatedTrade.additional_images || [],
              trade_rating: updatedTrade.trade_rating || null
            };
            
            await onSave(mappedTradeData);
          }
          
          setEditModalOpen(false);
        }}
      />
    </div>
  );
}
