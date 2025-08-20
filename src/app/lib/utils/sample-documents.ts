/**
 * Utility for loading sample documents for demo purposes
 */

export interface SampleDocument {
  name: string;
  path: string;
  description: string;
  type: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    name: 'Business Report',
    path: '/sample-documents/sample-report.txt',
    description: 'Quarterly business performance report with metrics and analysis',
    type: 'text/plain'
  },
  {
    name: 'Project Timeline',
    path: '/sample-documents/project-timeline.txt',
    description: 'Development project timeline with phases and milestones',
    type: 'text/plain'
  },
  {
    name: 'Meeting Notes',
    path: '/sample-documents/meeting-notes.txt',
    description: 'Team meeting notes with decisions and action items',
    type: 'text/plain'
  }
];

/**
 * Create a File object from a sample document for demo purposes
 */
export async function createSampleFile(sampleDoc: SampleDocument): Promise<File> {
  try {
    const response = await fetch(sampleDoc.path);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample document: ${response.statusText}`);
    }
    
    const content = await response.text();
    const blob = new Blob([content], { type: sampleDoc.type });
    
    return new File([blob], sampleDoc.name + '.txt', {
      type: sampleDoc.type,
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error creating sample file:', error);
    throw new Error(`Could not load sample document: ${sampleDoc.name}`);
  }
}

/**
 * Load all sample documents as File objects
 */
export async function loadAllSampleDocuments(): Promise<File[]> {
  const files: File[] = [];
  
  for (const sampleDoc of SAMPLE_DOCUMENTS) {
    try {
      const file = await createSampleFile(sampleDoc);
      files.push(file);
    } catch (error) {
      console.warn(`Skipping sample document ${sampleDoc.name}:`, error);
    }
  }
  
  return files;
}

/**
 * Get sample document metadata for UI display
 */
export function getSampleDocumentInfo(): SampleDocument[] {
  return SAMPLE_DOCUMENTS;
}