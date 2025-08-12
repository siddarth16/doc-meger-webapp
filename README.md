# DocMerger - Document Merging Webapp

Advanced document merging platform built with Next.js 14, supporting bulk processing of PDFs, Word docs, Excel sheets, and PowerPoint presentations with a sleek dark theme and neon accents.

## 🚀 Features

- **Multi-format Support**: PDF, DOCX, XLSX, PPTX, TXT, CSV
- **Bulk Processing**: Handle 100+ documents efficiently
- **Dark Theme**: Modern UI with neon accent colors
- **Real-time Processing**: Web Workers for non-blocking operations
- **Flexible Merge Options**: Sequential, smart, and custom merging
- **Output Customization**: Multiple formats and quality settings

## 🛠 Tech Stack

### Core Framework
- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling

### Document Processing (100% Free & Open Source)
- **PDF-lib** (MIT) - PDF creation and manipulation
- **SheetJS** (Apache 2.0) - Excel/CSV processing  
- **docx** (MIT) - Word document processing
- **JSZip** (MIT) - ZIP-based formats (PPTX)
- **Mammoth.js** (BSD) - DOCX to HTML conversion

### UI & State Management
- **React Hook Form** + **Zod** - Form validation
- **Zustand** - State management
- **Framer Motion** - Animations
- **Headless UI** - Accessible components
- **React Dropzone** - File uploads

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd doc-merger-webapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── process/      # Document processing
│   │   ├── merge/        # Merge operations  
│   │   └── download/     # File downloads
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── upload/      # File upload components
│   │   ├── preview/     # Document previews
│   │   ├── merge/       # Merge interface
│   │   └── export/      # Export options
│   ├── lib/             # Utilities and processors
│   │   ├── document-processors/
│   │   ├── utils/
│   │   └── hooks/
│   ├── stores/          # Zustand state stores
│   └── types/           # TypeScript definitions
├── workers/             # Web Workers for processing
└── public/              # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: `#00ff88` (Neon Green)
- **Accent**: `#00d4ff` (Cyan Blue)  
- **Secondary**: `#ff0080` (Hot Pink)
- **Background**: `#000000` (Pure Black)
- **Muted**: `#1a1a1a` (Dark Gray)
- **Border**: `#333333` (Medium Gray)

### Typography
- **Font**: System UI with fallbacks
- **Mono**: Fira Code for code elements

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically with optimized settings

The project includes `vercel.json` with optimized configuration:
- Edge Functions with 300s timeout
- Automatic region selection
- Build optimizations

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy the .next folder to your hosting provider
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:

```env
# Add your environment variables here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Configuration

The `vercel.json` file is pre-configured with:
- Function timeouts optimized for document processing
- Edge function settings
- Build and deployment commands

## 📚 Development Workflow

1. **Feature Development**: Create components in appropriate directories
2. **Document Processors**: Add new format support in `lib/document-processors/`
3. **API Routes**: Add processing endpoints in `app/api/`
4. **State Management**: Use Zustand stores for global state
5. **Testing**: Test locally before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project uses only MIT and Apache 2.0 licensed dependencies, ensuring complete freedom for commercial and personal use.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

---

Built with ❤️ using modern web technologies and 100% free, open-source libraries.
