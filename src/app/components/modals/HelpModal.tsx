'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, ShieldCheckIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/app/stores/ui-store';
import { Button } from '@/app/components/ui/Button';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: DocumentTextIcon,
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-lg mb-3 text-foreground">How to merge documents:</h4>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              <strong>Upload your files:</strong> Drag and drop documents onto the upload area or click "Choose Files" to browse. You can upload multiple files at once.
            </li>
            <li>
              <strong>Review and organize:</strong> Use the document list to reorder, rename, or remove files as needed. The merge will follow the order shown.
            </li>
            <li>
              <strong>Configure merge options:</strong> Choose output format, formatting preferences, and other settings in the Merge section.
            </li>
            <li>
              <strong>Preview (optional):</strong> Check how your documents will look when merged using the Preview feature.
            </li>
            <li>
              <strong>Export and download:</strong> Generate the merged document and download it to your device.
            </li>
          </ol>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold text-base mb-2 text-foreground">Quick Tips:</h4>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Use the "Use Sample Documents" button to try the service without uploading your own files</li>
            <li>Large files are processed in chunks to prevent browser crashes</li>
            <li>You can mix different document formats in a single merge operation</li>
            <li>The service works entirely in your browser - no files are sent to servers</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'supported-formats',
    title: 'Supported Formats',
    icon: DocumentTextIcon,
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-base mb-3 text-foreground">Input Formats:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>PDF</strong> - Portable Document Format</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span><strong>DOCX</strong> - Microsoft Word documents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span><strong>XLSX</strong> - Microsoft Excel spreadsheets</span>
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>PPTX</strong> - PowerPoint presentations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span><strong>TXT</strong> - Plain text files</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span><strong>CSV</strong> - Comma-separated values</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold text-base mb-3 text-foreground">Output Formats:</h4>
          <ul className="space-y-2">
            <li><strong>PDF</strong> - Best for mixed document types, preserves formatting</li>
            <li><strong>DOCX</strong> - Ideal for text-heavy documents that need editing</li>
            <li><strong>TXT</strong> - Simple text format, removes all formatting</li>
          </ul>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-base mb-2 text-foreground">File Limits:</h4>
          <ul className="space-y-1 text-muted-foreground text-sm">
            <li>• Maximum file size: 50MB per file</li>
            <li>• Maximum files per session: 100 files</li>
            <li>• Supported file extensions are automatically detected</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: ShieldCheckIcon,
    content: (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <h4 className="font-semibold text-base mb-2 text-accent">🔒 100% Client-Side Processing</h4>
          <p className="text-muted-foreground">
            Your documents never leave your device. All processing happens locally in your browser using WebAssembly and JavaScript.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-base mb-3 text-foreground">Security Features:</h4>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>No server uploads:</strong> Files are processed entirely in your browser without any network transfers.
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Memory management:</strong> Temporary files are automatically cleaned up to prevent data leaks.
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Secure processing:</strong> Uses industry-standard libraries with security best practices.
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>No tracking:</strong> We don't collect any personal data or track document contents.
              </div>
            </li>
          </ul>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold text-base mb-3 text-foreground">Data Handling:</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Documents are only stored in browser memory during processing</li>
            <li>• All data is cleared when you close the browser tab</li>
            <li>• No cookies or persistent storage of document content</li>
            <li>• Service Worker only caches application code, not user data</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: ExclamationTriangleIcon,
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-base mb-3 text-foreground">Common Issues:</h4>
          
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-semibold text-foreground">Files won't upload</h5>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
                <li>Check file format is supported (PDF, DOCX, XLSX, PPTX, TXT, CSV)</li>
                <li>Ensure file size is under 50MB</li>
                <li>Try refreshing the page and uploading again</li>
                <li>Clear browser cache if problems persist</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-accent pl-4">
              <h5 className="font-semibold text-foreground">Processing is slow or fails</h5>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
                <li>Large files may take several minutes to process</li>
                <li>Try processing fewer files at once</li>
                <li>Close other browser tabs to free up memory</li>
                <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-secondary pl-4">
              <h5 className="font-semibold text-foreground">Merged document has formatting issues</h5>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
                <li>Try converting to PDF format for better formatting preservation</li>
                <li>Check that source documents aren't corrupted</li>
                <li>Some complex formatting may not transfer perfectly</li>
                <li>Use the preview feature to check results before downloading</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold text-base mb-3 text-foreground">Browser Requirements:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Modern browser with JavaScript enabled</li>
            <li>• WebAssembly support (available in all modern browsers)</li>
            <li>• At least 2GB available RAM for large file processing</li>
            <li>• Stable internet connection (for initial app loading)</li>
          </ul>
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold text-base mb-2 text-foreground">Still Need Help?</h4>
          <p className="text-muted-foreground">
            If you're experiencing issues not covered here, try using the sample documents to test if the problem is with your files or the application.
          </p>
        </div>
      </div>
    )
  }
];

export function HelpModal() {
  const { showHelp, closeHelp } = useUIStore();
  
  return (
    <Transition appear show={showHelp} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeHelp}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-background border border-border text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-primary" />
                    <Dialog.Title as="h3" className="text-xl font-semibold text-foreground">
                      Help & Documentation
                    </Dialog.Title>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeHelp}
                    aria-label="Close help modal"
                    className="rounded-full p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-8">
                    {helpSections.map((section, index) => (
                      <div key={section.id} className={index > 0 ? 'pt-8 border-t border-border' : ''}>
                        <div className="flex items-center space-x-3 mb-4">
                          <section.icon className="h-6 w-6 text-primary flex-shrink-0" />
                          <h2 className="text-xl font-semibold text-foreground">
                            {section.title}
                          </h2>
                        </div>
                        <div className="text-muted-foreground">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      DocMerger v1.0 - Free Document Processing Tool
                    </div>
                    <Button variant="primary" onClick={closeHelp}>
                      Got it
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}