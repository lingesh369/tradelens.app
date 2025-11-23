
/**
 * Handles opening the upgrade page with affiliate tracking
 * @returns {void}
 */
export const openUpgradePageWithAffiliate = (): void => {
  const affiliateRef = localStorage.getItem("affiliateRef");
  const baseUrl = "https://peakify.store/tradelens-pricing/";
  
  // If there's an affiliate ref, append it to the URL
  if (affiliateRef) {
    const url = new URL(baseUrl);
    url.searchParams.set("ref", affiliateRef);
    window.open(url.toString(), "_blank");
  } else {
    window.open(baseUrl, "_blank");
  }
};
