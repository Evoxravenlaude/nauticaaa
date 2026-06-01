import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, LayoutList, ChevronDown, TrendingUp, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCollections } from '@/lib/api';

type SortKey = 'volume' | 'floor_asc' | 'floor_desc' | 'change' | 'owners';
type RarityFilter = 'all' | 'legendary' | 'rare' | 'uncommon' | 'common';
type StatusFilter = 'all' | 'buy_now' | 'on_auction' | 'has_offers';

const SWEEP_FLOORS = [12.4, 8.2, 14.1, 2.8, 1.95, 18.4, 89.0, 11.2, 3.8, 4.4];

function rarityLabel(idx: number): RarityFilter {
  if (idx < 2) return 'legendary';
  if (idx < 5) return 'rare';
  if (idx < 8) return 'uncommon';
  return 'common';
}

const RARITY_STYLES: Record<RarityFilter, string> = {
  all: '', legendary: 'text-purple-400 bg-purple-400/10', rare: 'text-emerald-400 bg-emerald-400/10',
  uncommon: 'text-sky-400 bg-sky-400/10', common: 'text-slate-400 bg-slate-400/10',
};

const TRAIT_GROUPS = [
  { name: 'Background', values: ['Space', 'Aqua', 'Army', 'Blue', 'Gray', 'New Punk Blue', 'Orange', 'Purple', 'Yellow'] },
  { name: 'Eyes', values: ['3D', 'Angry', 'Bored', 'Coins', 'Eyepatch', 'Laser', 'Sad', 'Wide Eyed'] },
  { name: 'Fur', values: ['Black', 'Blue', 'Brown', 'Cheetah', 'Cream', 'Dark Brown', 'Golden', 'Gray', 'Noise', 'Pink', 'Red', 'Robot', 'Solid Gold', 'Tan', 'Trippy', 'White'] },
  { name: 'Hat', values: ['Army Hat', 'Bandana', 'Bayc Hat Black', 'Beanie', 'Cowboy Hat', 'Fisherman\'s Hat', 'Fez', 'Horns', 'King\'s Crown', 'Short Mohawk', 'S&m Hat', 'Spinner Hat', 'Stuntman Helmet', 'Trippy Captain\'s Hat', 'Vietnam Era Helmet'] },
];

export default function NFTMarketplace() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('volume');
  const [rarity, setRarity] = useState<RarityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [sweepCount, setSweepCount] = useState(3);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedTraits, setExpandedTraits] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'collections'|'items'>('collections');

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    staleTime: 60_000,
  });

  const filteredCollections = useMemo(() => {
    let list = [...collections];
    if (query) list = list.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'floor_asc') list.sort((a,b) => a.floor - b.floor);
    if (sort === 'floor_desc') list.sort((a,b) => b.floor - a.floor);
    return list;
  }, [collections, query, sort]);

  const sweepTotal = SWEEP_FLOORS.slice().sort((a,b)=>a-b).slice(0,sweepCount).reduce((s,p)=>s+p,0);

  const SORT_OPTIONS: {key: SortKey; label: string}[] = [
    {key:'volume',label:'Volume: High → Low'},{key:'floor_desc',label:'Floor: High → Low'},
    {key:'floor_asc',label:'Floor: Low → High'},{key:'change',label:'24H Change'},{key:'owners',label:'Owners'},
  ];

  function toggleTrait(name: string) {
    setExpandedTraits(prev => prev.includes(name) ? prev.filter(t=>t!==name) : [...prev, name]);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#04060C]" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* ── Stats Bar ── */}
      <div className="border-b border-[#1A2540] px-6 py-3 flex items-center gap-8 bg-[#070B14]">
        {[
          {label:'Total Volume',val:'$4.2B',icon:<TrendingUp size={12}/>},
          {label:'24H Volume',val:'$142M',icon:<Zap size={12}/>},
          {label:'Collections',val:'12,840',icon:null},
          {label:'NFTs Listed',val:'841K',icon:null},
          {label:'Floor ETH',val:'$2,847',icon:null},
        ].map(s=>(
          <div key={s.label} className="flex items-center gap-2">
            {s.icon && <span className="text-[#00F5D4]">{s.icon}</span>}
            <div>
              <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider">{s.label}</div>
              <div className="text-sm font-bold text-[#E8F0FF]">{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Filter Sidebar ── */}
        <div className="w-52 border-r border-[#1A2540] bg-[#070B14] flex flex-col overflow-y-auto" style={{fontFamily:"'JetBrains Mono',monospace"}}>

          {/* Status */}
          <div className="p-4 border-b border-[#1A2540]">
            <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-2">Status</div>
            {([
              {key:'all',label:'All'},{key:'buy_now',label:'Buy Now'},{key:'on_auction',label:'On Auction'},{key:'has_offers',label:'Has Offers'},
            ] as {key:StatusFilter;label:string}[]).map(s=>(
              <button key={s.key} onClick={()=>setStatus(s.key)}
                className={`w-full text-left px-3 py-1.5 text-xs mb-1 transition-colors border ${status===s.key?'border-[#00F5D4]/30 text-[#00F5D4] bg-[#00F5D4]/5':'border-transparent text-[#4A6080] hover:text-[#7A8BA8]'}`}>{s.label}</button>
            ))}
          </div>

          {/* Price Range */}
          <div className="p-4 border-b border-[#1A2540]">
            <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-2">Price (ETH)</div>
            <div className="flex gap-2">
              <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Min" type="number"
                className="w-full bg-[#0C1220] border border-[#1A2540] px-2 py-1.5 text-xs text-[#E8F0FF] outline-none focus:border-[#00F5D4]/30 placeholder:text-[#3A4A6A]"/>
              <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max" type="number"
                className="w-full bg-[#0C1220] border border-[#1A2540] px-2 py-1.5 text-xs text-[#E8F0FF] outline-none focus:border-[#00F5D4]/30 placeholder:text-[#3A4A6A]"/>
            </div>
          </div>

          {/* Rarity */}
          <div className="p-4 border-b border-[#1A2540]">
            <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-2">Rarity</div>
            {(['all','legendary','rare','uncommon','common'] as RarityFilter[]).map(r=>(
              <button key={r} onClick={()=>setRarity(r)}
                className={`w-full text-left px-3 py-1.5 text-xs mb-1 capitalize transition-colors border ${rarity===r?'border-[#00F5D4]/30 text-[#00F5D4] bg-[#00F5D4]/5':'border-transparent text-[#4A6080] hover:text-[#7A8BA8]'}`}>{r}</button>
            ))}
          </div>

          {/* Traits */}
          <div className="p-4">
            <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-2">Traits</div>
            {TRAIT_GROUPS.map(group=>(
              <div key={group.name} className="mb-2">
                <button onClick={()=>toggleTrait(group.name)} className="flex items-center justify-between w-full text-xs text-[#7A8BA8] hover:text-[#E8F0FF] mb-1">
                  <span>{group.name}</span><ChevronDown size={12} className={`transition-transform ${expandedTraits.includes(group.name)?'rotate-180':''}`}/>
                </button>
                {expandedTraits.includes(group.name) && (
                  <div className="max-h-28 overflow-y-auto space-y-0.5 pl-2">
                    {group.values.map(v=>(
                      <div key={v} className="flex items-center gap-2 text-[10px] text-[#4A6080] hover:text-[#7A8BA8] cursor-pointer">
                        <div className="w-3 h-3 border border-[#1A2540]"/>
                        {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A2540] bg-[#04060C]">
            <div className="flex gap-2 mr-2">
              <button onClick={()=>setActiveTab('collections')} className={`px-3 py-1.5 text-xs transition-colors ${activeTab==='collections'?'text-[#00F5D4] border-b-2 border-[#00F5D4]':'text-[#4A6080]'}`}>Collections</button>
              <button onClick={()=>setActiveTab('items')} className={`px-3 py-1.5 text-xs transition-colors ${activeTab==='items'?'text-[#00F5D4] border-b-2 border-[#00F5D4]':'text-[#4A6080]'}`}>Items</button>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[#0C1220] border border-[#1A2540] px-3 py-2 focus-within:border-[#00F5D4]/30 transition-colors">
              <Search size={14} className="text-[#3A4A6A]"/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search collections, items, addresses..."
                className="flex-1 bg-transparent text-xs text-[#E8F0FF] outline-none placeholder:text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}/>
            </div>
            <div className="relative">
              <button onClick={()=>setShowSortMenu(!showSortMenu)} className="flex items-center gap-2 px-3 py-2 bg-[#0C1220] border border-[#1A2540] text-xs text-[#7A8BA8] hover:border-[#243060] transition-colors" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                <SlidersHorizontal size={12}/>{SORT_OPTIONS.find(s=>s.key===sort)?.label}<ChevronDown size={11}/>
              </button>
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-1 bg-[#0C1220] border border-[#1A2540] z-50 min-w-[200px]">
                  {SORT_OPTIONS.map(s=>(
                    <button key={s.key} onClick={()=>{setSort(s.key);setShowSortMenu(false);}}
                      className={`block w-full text-left px-4 py-2 text-xs transition-colors ${s.key===sort?'text-[#00F5D4] bg-[#070B14]':'text-[#7A8BA8] hover:bg-[#0F1828]'}`} style={{fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex border border-[#1A2540]">
              <button onClick={()=>setViewMode('grid')} className={`p-2 transition-colors ${viewMode==='grid'?'bg-[#0C1220] text-[#00F5D4]':'text-[#3A4A6A]'}`}><Grid3X3 size={14}/></button>
              <button onClick={()=>setViewMode('list')} className={`p-2 transition-colors ${viewMode==='list'?'bg-[#0C1220] text-[#00F5D4]':'text-[#3A4A6A]'}`}><LayoutList size={14}/></button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className={`grid gap-3 ${viewMode==='grid'?'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5':'grid-cols-1'}`}>
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} className="bg-[#0C1220] border border-[#1A2540] animate-pulse">
                    <div className="aspect-square bg-[#1A2540]"/>
                    <div className="p-3 space-y-2"><div className="h-3 bg-[#1A2540] rounded w-3/4"/><div className="h-3 bg-[#1A2540]/60 rounded w-1/2"/></div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredCollections.map((col, idx)=>{
                  const rar = rarityLabel(idx);
                  if (rarity !== 'all' && rarity !== rar) return null;
                  return (
                    <Link key={col.id} to={`/collection/${col.id}`}
                      className="group bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/40 transition-all hover:-translate-y-1 duration-200 overflow-hidden block">
                      <div className="aspect-square relative overflow-hidden bg-[#070B14]">
                        {col.image ? (
                          <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl font-black text-[#00F5D4]/20">{col.name[0]}</span>
                          </div>
                        )}
                        {rar !== 'common' && (
                          <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold capitalize ${RARITY_STYLES[rar]}`} style={{fontFamily:"'JetBrains Mono',monospace"}}>{rar}</span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-semibold text-[#E8F0FF] truncate group-hover:text-[#00F5D4] transition-colors">{col.name}</div>
                        <div className="text-[10px] text-[#3A4A6A] mt-0.5" style={{fontFamily:"'JetBrains Mono',monospace"}}>{(col.totalSupply ?? 0).toLocaleString()} items</div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1A2540]">
                          <div>
                            <div className="text-[9px] text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}>FLOOR</div>
                            <div className="text-xs font-bold text-[#E8F0FF]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{col.floor > 0 ? `${col.floor.toFixed(2)} ETH` : '—'}</div>
                          </div>
                          <button onClick={e=>{e.preventDefault();}} className="px-2 py-1 bg-[#00F5D4] text-[#04060C] text-[9px] font-bold hover:brightness-110 transition-all" style={{fontFamily:"'JetBrains Mono',monospace"}}>BUY</button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-6 text-[9px] text-[#3A4A6A] uppercase tracking-wider px-4 py-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                  <span className="col-span-2">Collection</span><span>Floor</span><span>Volume</span><span>Items</span><span>Action</span>
                </div>
                {filteredCollections.map((col,idx)=>{
                  const rar = rarityLabel(idx);
                  if (rarity !== 'all' && rarity !== rar) return null;
                  return (
                    <Link key={col.id} to={`/collection/${col.id}`}
                      className="grid grid-cols-6 items-center px-4 py-3 bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/30 transition-all">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#070B14] overflow-hidden flex-shrink-0">
                          {col.image ? <img src={col.image} alt={col.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#00F5D4]/20 font-black">{col.name[0]}</div>}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#E8F0FF]">{col.name}</div>
                          {rar !== 'common' && <span className={`text-[9px] font-bold capitalize ${RARITY_STYLES[rar]}`}>{rar}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#E8F0FF]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{col.floor > 0 ? `${col.floor.toFixed(2)} ETH` : '—'}</span>
                      <span className="text-xs text-[#7A8BA8]" style={{fontFamily:"'JetBrains Mono',monospace"}}>—</span>
                      <span className="text-xs text-[#7A8BA8]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{(col.totalSupply ?? 0).toLocaleString()}</span>
                      <button onClick={e=>e.preventDefault()} className="px-3 py-1.5 bg-[#00F5D4] text-[#04060C] text-[9px] font-bold w-fit hover:brightness-110 transition-all" style={{fontFamily:"'JetBrains Mono',monospace"}}>BUY FLOOR</button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sweep Bar ── */}
          <div className="border-t border-[#1A2540] px-6 py-3 flex items-center gap-6 bg-[#070B14]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#4A6080]" style={{fontFamily:"'JetBrains Mono',monospace"}}>Sweep floor</span>
              <input type="range" min={1} max={10} value={sweepCount} onChange={e=>setSweepCount(+e.target.value)} className="w-32 accent-[#00F5D4]"/>
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider">Items</div>
              <div className="text-sm font-bold text-[#00F5D4]">{sweepCount} NFTs</div>
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider">Total Cost</div>
              <div className="text-sm font-bold text-[#E8F0FF]">≈ {sweepTotal.toFixed(2)} ETH</div>
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider">USD Value</div>
              <div className="text-sm font-bold text-[#7A8BA8]">≈ ${(sweepTotal * 2847.5).toLocaleString('en',{maximumFractionDigits:0})}</div>
            </div>
            <div className="ml-auto">
              <button className="px-6 py-2.5 bg-[#00F5D4] text-[#04060C] text-xs font-bold hover:brightness-110 transition-all" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                Sweep {sweepCount} NFTs →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
