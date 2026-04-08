import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Heart, Sparkles, RefreshCw, Download, Camera, History, Share2, Twitter, Facebook, ZoomIn, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateTimeTravelHug, generateHeartfeltMessage } from './services/gemini';

type Step = 'upload' | 'generating' | 'result';

const FILTERS = [
  { name: 'Original', class: '', filter: 'none' },
  { name: 'Vintage', class: 'sepia-[0.5] contrast-[1.2] brightness-[0.9] hue-rotate-[-10deg]', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) hue-rotate(-10deg)' },
  { name: 'Grayscale', class: 'grayscale', filter: 'grayscale(1)' },
  { name: 'Sepia', class: 'sepia', filter: 'sepia(1)' },
  { name: 'Vibrant', class: 'saturate-[1.5] contrast-[1.1]', filter: 'saturate(1.5) contrast(1.1)' },
];

export default function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [youngerImage, setYoungerImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('Whispering to the past...');
  const [isZoomed, setIsZoomed] = useState(false);
  const resultImgRef = useRef<HTMLImageElement>(null);

  const onDropCurrent = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setCurrentImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDropYounger = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setYoungerImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getRootPropsCurrent, getInputProps: getInputPropsCurrent, isDragActive: isDragActiveCurrent } = useDropzone({
    onDrop: onDropCurrent,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const { getRootProps: getRootPropsYounger, getInputProps: getInputPropsYounger, isDragActive: isDragActiveYounger } = useDropzone({
    onDrop: onDropYounger,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleGenerate = async () => {
    if (!currentImage || !youngerImage) return;

    setStep('generating');
    const loadingTexts = [
      'Finding the common threads...',
      'Bridging the years...',
      'Capturing the essence of growth...',
      'Preparing the embrace...',
      'Almost there, hold on to the memory...'
    ];

    let textIdx = 0;
    const interval = setInterval(() => {
      textIdx = (textIdx + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[textIdx]);
    }, 3000);

    try {
      const [hugImg, msg] = await Promise.all([
        generateTimeTravelHug(currentImage, youngerImage),
        generateHeartfeltMessage(currentImage, youngerImage)
      ]);

      setResultImage(hugImg);
      setMessage(msg || '');
      setStep('result');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff4e00', '#ffffff', '#3a1510']
      });
    } catch (error) {
      console.error(error);
      alert('The magic took a little too long. Please try again.');
      setStep('upload');
    } finally {
      clearInterval(interval);
    }
  };

  const handleReset = () => {
    setCurrentImage(null);
    setYoungerImage(null);
    setResultImage(null);
    setMessage(null);
    setActiveFilter(FILTERS[0]);
    setStep('upload');
  };

  const getFilteredImage = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!resultImgRef.current || activeFilter.filter === 'none') {
        resolve(resultImage || '');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = resultImgRef.current;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (ctx) {
        ctx.filter = activeFilter.filter;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(resultImage || '');
      }
    });
  };

  const downloadImage = async () => {
    const filteredData = await getFilteredImage();
    const link = document.createElement('a');
    link.href = filteredData;
    link.download = `adam-embrace-${activeFilter.name.toLowerCase()}.png`;
    link.click();
  };

  const handleShare = async (platform?: string) => {
    const filteredData = await getFilteredImage();
    const shareUrl = window.location.href;
    const shareText = "Witnessing a moment across time with adam. #adam #AI #GenerationsEmbrace";

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      return;
    }

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      return;
    }

    if (navigator.share) {
      try {
        const res = await fetch(filteredData);
        const blob = await res.blob();
        const file = new File([blob], 'adam-embrace.png', { type: 'image/png' });

        await navigator.share({
          title: 'adam',
          text: shareText,
          files: [file],
        });
      } catch (err) {
        console.log('Share failed:', err);
        navigator.share({
          title: 'adam',
          text: shareText,
          url: shareUrl,
        }).catch(() => {});
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard! Share it with your friends.');
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500/30">
      <div className="atmosphere" />
      
      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-12 text-center"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4"
                >
                  Introducing
                </motion.div>
                <motion.h1 
                  className="text-7xl md:text-9xl font-serif italic tracking-tighter text-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  adam
                </motion.h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto font-light tracking-wide">
                  A bridge across time. Upload two photos of yourself to witness a moment that never was, but always should have been.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-white/40 uppercase text-xs tracking-[0.2em] font-medium">
                    <Camera size={14} />
                    <span>Current Self</span>
                  </div>
                  <div 
                    {...getRootPropsCurrent()} 
                    className={`glass-card aspect-[4/5] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden group ${
                      isDragActiveCurrent ? 'border-orange-500/50 bg-orange-500/5' : 'hover:border-white/30'
                    }`}
                  >
                    <input {...getInputPropsCurrent()} />
                    {currentImage ? (
                      <img src={currentImage} alt="Current" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-white/30 group-hover:text-white/50 transition-colors">
                        <div className="p-6 rounded-full border border-dashed border-white/20 group-hover:scale-110 transition-transform duration-500">
                          <Upload size={32} strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-light">Drop your current photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-white/40 uppercase text-xs tracking-[0.2em] font-medium">
                    <History size={14} />
                    <span>Younger Self</span>
                  </div>
                  <div 
                    {...getRootPropsYounger()} 
                    className={`glass-card aspect-[4/5] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden group ${
                      isDragActiveYounger ? 'border-orange-500/50 bg-orange-500/5' : 'hover:border-white/30'
                    }`}
                  >
                    <input {...getInputPropsYounger()} />
                    {youngerImage ? (
                      <img src={youngerImage} alt="Younger" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-white/30 group-hover:text-white/50 transition-colors">
                        <div className="p-6 rounded-full border border-dashed border-white/20 group-hover:scale-110 transition-transform duration-500">
                          <Upload size={32} strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-light">Drop your younger photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={!currentImage || !youngerImage}
                className={`px-12 py-4 rounded-full font-medium tracking-widest uppercase text-sm transition-all duration-500 flex items-center gap-3 mx-auto ${
                  currentImage && youngerImage 
                    ? 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <Sparkles size={18} />
                Generate Magic
              </motion.button>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-t-2 border-orange-500/50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="text-orange-500 animate-pulse" size={32} />
                </div>
              </div>
              <motion.p 
                key={loadingText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-serif italic text-white/80"
              >
                {loadingText}
              </motion.p>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-6xl grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start"
            >
              <div className="space-y-8">
                <div className="relative group">
                  <div className="glass-card aspect-square overflow-hidden shadow-2xl relative">
                    {resultImage ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <img 
                          ref={resultImgRef}
                          src={resultImage} 
                          alt="The Embrace" 
                          className={`w-full h-full object-cover transition-all duration-500 ${activeFilter.class}`} 
                          referrerPolicy="no-referrer" 
                        />
                        <button 
                          onClick={() => setIsZoomed(true)}
                          className="absolute top-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ZoomIn size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <p className="text-white/20">Processing image...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-2 glass-card bg-black/40 backdrop-blur-xl">
                    {FILTERS.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setActiveFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${
                          activeFilter.name === f.name 
                            ? 'bg-white text-black' 
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={downloadImage}
                    className="flex-1 min-w-[140px] py-4 glass-card hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button 
                    onClick={() => handleShare()}
                    className="flex-1 min-w-[140px] py-4 glass-card hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleShare('twitter')} className="p-4 glass-card hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                      <Twitter size={18} />
                    </button>
                    <button onClick={() => handleShare('facebook')} className="p-4 glass-card hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                      <Facebook size={18} />
                    </button>
                    <button onClick={handleReset} className="p-4 glass-card hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-left lg:pt-4">
                <div className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-glow">A Letter Across Time</h2>
                  <div className="w-12 h-px bg-orange-500/50" />
                </div>
                <div className="text-white/80 leading-relaxed font-light text-lg italic font-serif space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {message?.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <div className="pt-4 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                      <img src={currentImage || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                      <img src={youngerImage || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <p className="text-white/40 text-xs uppercase tracking-[0.3em]">Forever connected • adam</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12"
            onClick={() => setIsZoomed(false)}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              onClick={() => setIsZoomed(false)}
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-full max-h-full overflow-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={resultImage} 
                alt="Zoomed Embrace" 
                className={`max-w-none w-[150%] md:w-[200%] h-auto shadow-2xl ${activeFilter.class}`}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-8 left-0 w-full text-center pointer-events-none">
        <p className="text-white/10 text-[10px] uppercase tracking-[0.5em]">
          Powered by Gemini AI • adam
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 78, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
