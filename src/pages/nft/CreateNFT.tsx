import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Upload, Image, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';

type Step = 'form' | 'uploading' | 'minting' | 'done';

export default function CreateNFT() {
  const { isConnected } = useAccount();
  const [step,        setStep]        = useState<Step>('form');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [royalty,     setRoyalty]     = useState('5');
  const [supply,      setSupply]      = useState('1');
  const [previewUrl,  setPreviewUrl]  = useState<string|null>(null);
  const [traits, setTraits] = useState([{ key:'', value:'' }]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleMint() {
    if (!name || !previewUrl) return;
    setStep('uploading');
    await new Promise(r => setTimeout(r, 1800)); // simulate IPFS upload
    setStep('minting');
    await new Promise(r => setTimeout(r, 2200)); // simulate contract call
    setStep('done');
  }

  function addTrait() { setTraits(t => [...t, { key:'', value:'' }]); }
  function updateTrait(i: number, field: 'key'|'value', val: string) {
    setTraits(t => t.map((tr, idx) => idx===i ? { ...tr, [field]:val } : tr));
  }

  if (step === 'uploading' || step === 'minting') {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[#1A2540] border-t-[#00F5D4] animate-spin"/>
          <img src="/logo.png" alt="" className="absolute inset-0 m-auto w-8 h-8 object-contain opacity-60"/>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-[#E8F0FF] mb-1">
            {step === 'uploading' ? 'Uploading to IPFS…' : 'Minting on-chain…'}
          </div>
          <div className="text-sm text-[#4A6080] font-mono">
            {step === 'uploading' ? 'Pinning metadata and media to IPFS' : 'Calling ERC-721 contract'}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center">
          <Check size={36} className="text-emerald-400"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#E8F0FF] mb-2">NFT Minted!</h2>
          <p className="text-sm text-[#4A6080]">{name} has been minted to your wallet.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/my-nfts" className="px-6 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">View My NFTs</Link>
          <button onClick={()=>{setStep('form');setPreviewUrl(null);setName('');setDescription('');}}
            className="px-6 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">Mint Another</button>
        </div>
        <a href="https://etherscan.io" target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-[#4A6080] hover:text-[#00F5D4] transition-colors font-mono">
          View on Etherscan <ExternalLink size={11}/>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="border-b border-[#1A2540] px-5 py-3 flex items-center gap-3 bg-[#070B14]">
        <Link to="/nft" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
        <span className="font-semibold text-[#E8F0FF]">Create NFT</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        {/* Left: Media upload */}
        <div>
          <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-3">Media</label>
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-[#1A2540] hover:border-[#00F5D4]/40 cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden relative">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover"/>
            ) : (
              <>
                <Image size={32} className="text-[#3A4A6A] mb-3"/>
                <div className="text-sm text-[#4A6080]">Click to upload</div>
                <div className="text-[10px] text-[#3A4A6A] mt-1 font-mono">PNG, GIF, MP4, SVG · Max 100MB</div>
              </>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile}/>
          </div>
          {previewUrl && (
            <button onClick={()=>setPreviewUrl(null)} className="mt-2 w-full text-xs text-[#4A6080] hover:text-rose-400 font-mono transition-colors">Remove</button>
          )}
        </div>

        {/* Right: Details form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-1.5">Name *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="My NFT #1"
              className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2.5 text-sm text-[#E8F0FF] outline-none transition-colors"/>
          </div>
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-1.5">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Describe your NFT…"
              className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2.5 text-sm text-[#E8F0FF] outline-none resize-none transition-colors"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-1.5">Royalty %</label>
              <input value={royalty} onChange={e=>setRoyalty(e.target.value)} type="number" min="0" max="15"
                className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2.5 text-sm text-[#E8F0FF] outline-none font-mono"/>
            </div>
            <div>
              <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-1.5">Supply</label>
              <input value={supply} onChange={e=>setSupply(e.target.value)} type="number" min="1"
                className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2.5 text-sm text-[#E8F0FF] outline-none font-mono"/>
            </div>
          </div>

          {/* Traits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono">Traits</label>
              <button onClick={addTrait} className="text-[10px] text-[#00F5D4] hover:opacity-80 font-mono">+ Add trait</button>
            </div>
            <div className="space-y-2">
              {traits.map((tr, i) => (
                <div key={i} className="flex gap-2">
                  <input value={tr.key} onChange={e=>updateTrait(i,'key',e.target.value)} placeholder="Type"
                    className="flex-1 bg-[#0C1220] border border-[#1A2540] px-2.5 py-1.5 text-xs text-[#E8F0FF] outline-none font-mono"/>
                  <input value={tr.value} onChange={e=>updateTrait(i,'value',e.target.value)} placeholder="Value"
                    className="flex-1 bg-[#0C1220] border border-[#1A2540] px-2.5 py-1.5 text-xs text-[#E8F0FF] outline-none font-mono"/>
                </div>
              ))}
            </div>
          </div>

          {!isConnected && (
            <div className="flex items-center gap-2 p-3 bg-amber-400/5 border border-amber-400/20 text-xs text-amber-400 font-mono">
              <AlertTriangle size={12}/> Connect wallet to mint
            </div>
          )}

          <button onClick={handleMint} disabled={!name || !previewUrl || !isConnected}
            className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: name && previewUrl && isConnected ? '#00F5D4' : '#0C1220', color: name && previewUrl && isConnected ? '#04060C' : '#3A4A6A', border: name && previewUrl && isConnected ? 'none' : '1px solid #1A2540' }}>
            <Upload size={15}/> Mint NFT
          </button>
        </div>
      </div>
    </div>
  );
}
