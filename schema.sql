-- ICELL IMPORTS — Supabase schema
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text not null,
  storage text not null,
  color text not null,
  condition text not null default 'Novo' check (condition in ('Novo','Seminovo')),
  price numeric(12,2) not null check (price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= 0),
  installments int check (installments is null or installments between 1 and 24),
  battery_health int check (battery_health is null or battery_health between 1 and 100),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  featured boolean not null default false,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute procedure public.set_updated_at();

alter table public.products enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Catálogo público: somente itens publicados.
drop policy if exists "public can read published products" on public.products;
create policy "public can read published products"
on public.products for select
to anon, authenticated
using (status = 'published');

-- Administradores podem ver inclusive rascunhos.
drop policy if exists "admins can read all products" on public.products;
create policy "admins can read all products"
on public.products for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can insert products" on public.products;
create policy "admins can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can update products" on public.products;
create policy "admins can update products"
on public.products for update
to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can delete products" on public.products;
create policy "admins can delete products"
on public.products for delete
to authenticated
using (public.is_admin());

-- O usuário autenticado só consegue consultar se ele próprio é admin.
drop policy if exists "admin can read own admin row" on public.admins;
create policy "admin can read own admin row"
on public.admins for select
to authenticated
using (user_id = auth.uid());

-- Bucket público para fotos do catálogo.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('products','products',true,8388608,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true;

drop policy if exists "public can view product images" on storage.objects;
create policy "public can view product images"
on storage.objects for select
to public
using (bucket_id = 'products');

drop policy if exists "admins can upload product images" on storage.objects;
create policy "admins can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id='products' and public.is_admin());

drop policy if exists "admins can update product images" on storage.objects;
create policy "admins can update product images"
on storage.objects for update
to authenticated
using (bucket_id='products' and public.is_admin())
with check (bucket_id='products' and public.is_admin());

drop policy if exists "admins can delete product images" on storage.objects;
create policy "admins can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id='products' and public.is_admin());

-- Dados de exemplo opcionais. Apague ou altere após configurar.
insert into public.products (name,model,storage,color,condition,price,old_price,installments,battery_health,stock,featured,status,image_url)
select * from (values
('iPhone 15 Pro Max','15 Pro Max','256 GB','Titânio Natural','Novo',8299.00,8799.00,12,null,2,true,'published','https://mobileplanet.ua/uploads/product/2023-9-13/magazin-mobileplanet-apple-iphone-15-pro-max-1tb-natural-titanium-mu7j3-2853961.jpg'),
('iPhone 15 Pro','15 Pro','128 GB','Titânio Preto','Seminovo',6199.00,null,12,94,1,true,'published','https://multimedia.bbycastatic.ca/multimedia/products/1500x1500/172/17231/17231439.jpg'),
('iPhone 14 Pro Max','14 Pro Max','256 GB','Roxo Profundo','Seminovo',5599.00,5999.00,12,90,2,false,'published','https://content1.rozetka.com.ua/goods/images/original/284924170.jpg'),
('iPhone 13','13','128 GB','Meia-noite','Seminovo',3299.00,null,10,88,3,false,'published','https://content1.rozetka.com.ua/goods/images/original/221214139.jpg')
) as v(name,model,storage,color,condition,price,old_price,installments,battery_health,stock,featured,status,image_url)
where not exists (select 1 from public.products);

-- Se você já executou este schema anteriormente, rode também estas linhas uma vez
-- para preencher as imagens dos produtos de demonstração já existentes.
update public.products set image_url='https://mobileplanet.ua/uploads/product/2023-9-13/magazin-mobileplanet-apple-iphone-15-pro-max-1tb-natural-titanium-mu7j3-2853961.jpg' where model='15 Pro Max' and (image_url is null or image_url='');
update public.products set image_url='https://multimedia.bbycastatic.ca/multimedia/products/1500x1500/172/17231/17231439.jpg' where model='15 Pro' and (image_url is null or image_url='');
update public.products set image_url='https://content1.rozetka.com.ua/goods/images/original/284924170.jpg' where model='14 Pro Max' and (image_url is null or image_url='');
update public.products set image_url='https://content1.rozetka.com.ua/goods/images/original/221214139.jpg' where model='13' and (image_url is null or image_url='');
