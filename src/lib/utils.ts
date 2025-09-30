import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.substring(filename.lastIndexOf('.'));
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  
  // Calculate how many characters to show from start and end
  const charsToShow = maxLength - extension.length - 3; // 3 for "..."
  const startChars = Math.ceil(charsToShow * 0.6); // Show more at start
  const endChars = Math.floor(charsToShow * 0.4);
  
  return `${nameWithoutExt.substring(0, startChars)}...${nameWithoutExt.substring(nameWithoutExt.length - endChars)}${extension}`;
}
