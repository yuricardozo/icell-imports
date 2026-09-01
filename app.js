const cfg = window.ICELL_SUPABASE || {};
const isConfigured = cfg.url && !cfg.url.includes('SEU-PROJETO') && cfg.anonKey && !cfg.anonKey.includes('SUA-ANON');
const sb = isConfigured ? supabase.createClient(cfg.url, cfg.anonKey) : null;

const $ = (s) => document.querySelector(s);
const grid = $('#productsGrid');
const resultCount = $('#resultCount');
const emptyState = $('#emptyState');
let products = [];

const demoProducts = [
  {id:'demo-1',name:'iPhone 15 Pro Max',model:'15 Pro Max',storage:'256 GB',color:'Titânio Natural',condition:'Novo',price:8299,old_price:8799,installments:12,battery_health:null,stock:2,featured:true,image_url:'https://mobileplanet.ua/uploads/product/2023-9-13/magazin-mobileplanet-apple-iphone-15-pro-max-1tb-natural-titanium-mu7j3-2853961.jpg',created_at:'2026-09-01'},
  {id:'demo-2',name:'iPhone 15 Pro',model:'15 Pro',storage:'128 GB',color:'Titânio Preto',condition:'Seminovo',price:6199,old_price:null,installments:12,battery_health:94,stock:1,featured:true,image_url:'https://multimedia.bbycastatic.ca/multimedia/products/1500x1500/172/17231/17231439.jpg',created_at:'2026-08-31'},
  {id:'demo-3',name:'iPhone 14 Pro Max',model:'14 Pro Max',storage:'256 GB',color:'Roxo Profundo',condition:'Seminovo',price:5599,old_price:5999,installments:12,battery_health:90,stock:2,featured:false,image_url:'https://content1.rozetka.com.ua/goods/images/original/284924170.jpg',created_at:'2026-08-30'},
  {id:'demo-4',name:'iPhone 13',model:'13',storage:'128 GB',color:'Meia-noite',condition:'Seminovo',price:3299,old_price:null,installments:10,battery_health:88,stock:3,featured:false,image_url:'https://content1.rozetka.com.ua/goods/images/original/221214139.jpg',created_at:'2026-08-28'}
];

function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function loadProducts(){
  grid.innerHTML='<div class="catalog-loading">'+Array(4).fill('<div class="skeleton"></div>').join('')+'</div>';
  if(!sb){
    products = demoProducts;
    resultCount.textContent='Modo demonstração — conecte o Supabase para exibir o estoque real';
    hydrateFilters(); render(); return;
  }
  const {data,error}=await sb.from('products').select('*').eq('status','published').gt('stock',0).order('featured',{ascending:false}).order('created_at',{ascending:false});
  if(error){console.error(error);products=[];grid.innerHTML='';resultCount.textContent='Não foi possível carregar o catálogo agora.';emptyState.classList.remove('hidden');return}
  products=data||[];hydrateFilters();render();
}

function hydrateFilters(){
  const models=[...new Set(products.map(p=>p.model).filter(Boolean))].sort();
  const storages=[...new Set(products.map(p=>p.storage).filter(Boolean))].sort((a,b)=>parseInt(a)-parseInt(b));
  $('#modelFilter').innerHTML='<option value="">Todos os modelos</option>'+models.map(v=>`<option value="${esc(v)}">iPhone ${esc(v)}</option>`).join('');
  $('#storageFilter').innerHTML='<option value="">Armazenamento</option>'+storages.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

function filtered(){
  const q=$('#searchInput').value.trim().toLowerCase();
  const model=$('#modelFilter').value, storage=$('#storageFilter').value, condition=$('#conditionFilter').value, sort=$('#sortFilter').value;
  let out=products.filter(p=>{
    const text=[p.name,p.model,p.storage,p.color,p.condition].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(!model||p.model===model)&&(!storage||p.storage===storage)&&(!condition||p.condition===condition)
  });
  out.sort((a,b)=>{
    if(sort==='price-asc') return Number(a.price)-Number(b.price);
    if(sort==='price-desc') return Number(b.price)-Number(a.price);
    if(sort==='newest') return new Date(b.created_at)-new Date(a.created_at);
    return Number(b.featured)-Number(a.featured)||new Date(b.created_at)-new Date(a.created_at)
  });
  return out;
}

function render(){
  const out=filtered();
  resultCount.textContent=`${out.length} aparelho${out.length===1?'':'s'} disponível${out.length===1?'':'eis'}`;
  emptyState.classList.toggle('hidden',out.length>0);
  grid.innerHTML=out.map(p=>{
    const specs=[p.storage,p.color,p.battery_health?`${p.battery_health}% bateria`:null].filter(Boolean);
    const msg=encodeURIComponent(`Olá iCell! Vi o ${p.name} ${p.storage||''} ${p.color||''} no site e quero saber mais.`);
    return `<article class="product-card">
      <div class="product-media">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')"><div class="product-placeholder hidden" aria-hidden="true"></div>`:'<div class="product-placeholder" aria-hidden="true"></div>'}
        <span class="product-badge ${p.featured?'featured':''}">${p.featured?'Destaque':esc(p.condition||'Disponível')}</span>
      </div>
      <div class="product-info">
        <div class="product-topline"><span>${esc(p.condition||'')}</span><span><i class="stock-dot"></i>${p.stock} em estoque</span></div>
        <h3>${esc(p.name)}</h3><div class="product-sub">${esc(p.color||'Consulte cores')}</div>
        <div class="spec-pills">${specs.map(s=>`<span>${esc(s)}</span>`).join('')}</div>
        <div class="price-old">${p.old_price?money(p.old_price):''}</div>
        <div class="price">${money(p.price)}</div>
        <div class="installment">${p.installments?`ou em até ${p.installments}x • consulte condições`: 'Consulte condições de pagamento'}</div>
        <a class="product-cta" target="_blank" rel="noopener" href="https://wa.me/5565999913864?text=${msg}">Tenho interesse <i data-lucide="message-circle"></i></a>
      </div>
    </article>`
  }).join('');
  lucide.createIcons();
}

['searchInput','modelFilter','storageFilter','conditionFilter','sortFilter'].forEach(id=>$('#'+id).addEventListener(id==='searchInput'?'input':'change',render));
$('#clearFilters').addEventListener('click',()=>{['searchInput','modelFilter','storageFilter','conditionFilter'].forEach(id=>$('#'+id).value='');$('#sortFilter').value='featured';render()});

window.addEventListener('load',()=>setTimeout(()=>$('#loader').classList.add('hide'),550));
$('#year').textContent=new Date().getFullYear();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in-view')}),{threshold:.13});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
lucide.createIcons();
loadProducts();
