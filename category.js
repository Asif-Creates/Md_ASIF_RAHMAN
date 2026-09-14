(function(){
let categories=[];
const $=s=>document.querySelector(s);
const escCat=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

function addCategoryNavigation(){
 const nav=document.querySelector('.sidebar nav');
 if(nav&&!nav.querySelector('[data-section="category"]')){
  const btn=document.createElement('button');btn.className='side-link';btn.dataset.section='category';btn.textContent='Category';nav.appendChild(btn);btn.addEventListener('click',()=>window.showSection('category'));
 }
 const main=document.querySelector('.main');
 if(main&&!document.getElementById('category')){
  const section=document.createElement('section');section.id='category';section.className='panel';
  section.innerHTML='<div class="card"><div class="section-head"><div><p class="eyebrow">BLOG CONTENT</p><h2>Categories</h2></div><button class="primary" id="addCategory">+ Add category</button></div><div id="categoriesList" class="list"></div></div>';
  const project=document.getElementById('project');main.insertBefore(section,project||null);
 }
 const addBtn=$('#addCategory');
 if(addBtn&&!addBtn.dataset.categoryHandler){
  addBtn.dataset.categoryHandler='true';
  addBtn.addEventListener('click',addCategory);
 }
}

async function loadCategories(){
 const {data,error}=await supabaseClient.from('blog_categories').select('id,name,created_at').order('created_at',{ascending:true});
 if(error){console.error('Could not load categories:',error);return []}
 categories=data||[];
 const list=$('#categoriesList');
 if(list)list.innerHTML=categories.length?categories.map(c=>`<div class="item"><div class="item-copy"><h3>${escCat(c.name)}</h3><p>Available for blog posts</p></div><div class="actions"><button class="small-btn danger" onclick="deleteCategory('${c.id}','${escCat(c.name)}')">Delete</button></div></div>`).join(''):'<div class="empty">No categories yet.</div>';
 return categories;
}

async function addCategory(){
 window.openModal({title:'Add category',eyebrow:'BLOG CATEGORY',submitText:'Create category',fields:[{name:'name',label:'Category name',placeholder:'e.g. Marketing'}],onSubmit:async v=>{
  const name=v.name.trim();if(!name)throw new Error('Category name is required');
  const {error}=await supabaseClient.from('blog_categories').insert({name});
  if(error){if(error.code==='23505')throw new Error('This category already exists.');throw error}
  await loadCategories();await refreshCategoryAwareUI();
 }});
}

window.deleteCategory=async function(id,name){
 if(!confirm(`Delete category “${name}”?`))return;
 const {error}=await supabaseClient.from('blog_categories').delete().eq('id',id);
 if(error){alert('This category cannot be deleted while it is used by a blog post.');console.error(error);return}
 await loadCategories();await refreshCategoryAwareUI();
};

async function refreshCategoryAwareUI(){
 if(typeof window.loadBlogs==='function')await window.loadBlogs();
}

window.openModal=function(opts){
 const fields=(opts.fields||[]).map(f=>{
  if(f.name!=='category')return f;
  return Object.assign({},f,{type:'select',options:categories.map(c=>({value:c.name,label:c.name})),value:f.value||categories[0]?.name||''});
 });
 const old=$('#editorModal');if(old)old.remove();
 const modal=document.createElement('div');modal.id='editorModal';modal.className='modal-backdrop';
 modal.innerHTML=`<div class="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><button class="modal-close" type="button" aria-label="Close">×</button><div class="modal-eyebrow">${escCat(opts.eyebrow||'CONTENT')}</div><h2 id="editor-title">${escCat(opts.title||'Edit')}</h2><p class="modal-subtitle">Make your changes below and save when you're ready.</p><form id="editorForm" class="editor-form">${fields.map(f=>{if(f.type==='textarea')return `<label>${escCat(f.label)}<textarea name="${escCat(f.name)}" rows="${f.rows||7}" placeholder="${escCat(f.placeholder||'')}">${escCat(f.value||'')}</textarea></label>`;if(f.type==='select')return `<label>${escCat(f.label)}<select name="${escCat(f.name)}" required>${f.options.map(o=>`<option value="${escCat(o.value)}" ${o.value===f.value?'selected':''}>${escCat(o.label)}</option>`).join('')}</select></label>`;return `<label>${escCat(f.label)}<input name="${escCat(f.name)}" type="${escCat(f.type||'text')}" value="${escCat(f.value||'')}" placeholder="${escCat(f.placeholder||'')}" ${f.required===false?'':'required'}></label>`}).join('')}<div class="modal-actions"><button class="modal-cancel" type="button">Cancel</button><button class="primary modal-save" type="submit">${escCat(opts.submitText||'Save changes')}</button></div></form></div>`;
 document.body.appendChild(modal);const close=()=>modal.remove();modal.querySelector('.modal-close').onclick=close;modal.querySelector('.modal-cancel').onclick=close;modal.addEventListener('mousedown',e=>{if(e.target===modal)close()});
 modal.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const save=modal.querySelector('.modal-save');save.disabled=true;save.textContent='Saving...';try{const values=Object.fromEntries(new FormData(e.currentTarget).entries());await opts.onSubmit(values);close()}catch(err){console.error(err);alert(err.message||'Could not save changes. Please try again.')}finally{save.disabled=false;save.textContent=opts.submitText||'Save changes'}});
 setTimeout(()=>modal.querySelector('input,textarea,select')?.focus(),40);
};

const oldShowSection=window.showSection;
window.showSection=function(id){if(typeof oldShowSection==='function')oldShowSection(id);if(id==='category')loadCategories()};

addCategoryNavigation();
loadCategories();
})();
