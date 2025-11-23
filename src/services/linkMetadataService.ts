interface LinkMetadata {
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  siteName: string;
}

export const fetchLinkMetadata = async (url: string): Promise<LinkMetadata> => {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // For development, we'll use a CORS proxy or implement basic metadata extraction
    // In production, you'd want to use a backend service for this
    
    // Try to fetch the page and extract metadata
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.contents) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Extract metadata
      const title = 
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        urlObj.hostname;
      
      const description = 
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        '';
      
      const thumbnail = 
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
        '';
      
      const favicon = 
        doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
        doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
        `${urlObj.origin}/favicon.ico`;
      
      const siteName = 
        doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
        urlObj.hostname;
      
      return {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail ? (thumbnail.startsWith('http') ? thumbnail : `${urlObj.origin}${thumbnail}`) : '',
        favicon: favicon ? (favicon.startsWith('http') ? favicon : `${urlObj.origin}${favicon}`) : '',
        siteName: siteName.trim()
      };
    }
  } catch (error) {
    console.error('Error fetching link metadata:', error);
  }
  
  // Fallback for when metadata fetching fails
  try {
    const urlObj = new URL(url);
    return {
      title: getDefaultTitle(urlObj),
      description: `Visit ${urlObj.hostname}`,
      thumbnail: '',
      favicon: `${urlObj.origin}/favicon.ico`,
      siteName: urlObj.hostname
    };
  } catch {
    return {
      title: url,
      description: '',
      thumbnail: '',
      favicon: '',
      siteName: ''
    };
  }
};

const getDefaultTitle = (urlObj: URL): string => {
  // Special handling for common sites
  const hostname = urlObj.hostname.toLowerCase();
  
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'YouTube Video';
  }
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'Twitter Post';
  }
  if (hostname.includes('github.com')) {
    return 'GitHub Repository';
  }
  if (hostname.includes('linkedin.com')) {
    return 'LinkedIn Post';
  }
  if (hostname.includes('medium.com')) {
    return 'Medium Article';
  }
  
  return urlObj.hostname.replace('www.', '');
};

// Simplified version for when CORS is an issue
export const getBasicLinkMetadata = (url: string): LinkMetadata => {
  try {
    const urlObj = new URL(url);
    return {
      title: getDefaultTitle(urlObj),
      description: `Visit ${urlObj.hostname}`,
      thumbnail: '',
      favicon: `${urlObj.origin}/favicon.ico`,
      siteName: urlObj.hostname.replace('www.', '')
    };
  } catch {
    return {
      title: url,
      description: '',
      thumbnail: '',
      favicon: '',
      siteName: ''
    };
  }
};