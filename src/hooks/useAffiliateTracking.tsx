
import { useEffect } from "react";

/**
 * Hook for handling affiliate tracking and link modification
 * This automatically appends affiliate ref codes to peakify.store links
 */
export const useAffiliateTracking = () => {
  useEffect(() => {
    // Function to append ref parameter to peakify.store links
    const appendAffiliateRef = () => {
      const ref = localStorage.getItem("affiliateRef");

      if (ref) {
        document.querySelectorAll("a").forEach(link => {
          const href = link.getAttribute("href");
  
          if (href && href.includes("peakify.store")) {
            try {
              const url = new URL(href);
              url.searchParams.set("ref", ref);
              link.setAttribute("href", url.toString());
            } catch (error) {
              console.error("Error processing URL:", href, error);
            }
          }
        });
      }
    };

    // Run once on mount
    appendAffiliateRef();

    // Set up a MutationObserver to handle dynamically added links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          appendAffiliateRef();
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });

    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};
