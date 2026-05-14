/**
 * Web globals type declarations for React Native Web compatibility
 * These types are only available when Platform.OS === 'web'
 */

// Declare document for web platform
declare const document: Document | undefined;

// Declare URL for web platform
declare const URL: {
  createObjectURL(blob: Blob | File): string;
  revokeObjectURL(url: string): void;
} | undefined;

// HTMLInputElement for file input
interface HTMLInputElement extends HTMLElement {
  type: string;
  accept: string;
  files: FileList | null;
  click(): void;
  onchange: ((event: Event) => void) | null;
}

// Document interface
interface Document {
  createElement(tagName: 'input'): HTMLInputElement;
}

// FileList interface
interface FileList {
  length: number;
  item(index: number): File | null;
  [index: number]: File;
}

// File interface (already in lib.dom.d.ts but we need it here)
interface File extends Blob {
  readonly name: string;
  readonly lastModified: number;
}
