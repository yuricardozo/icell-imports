# iCell Imports — catálogo de iPhones + Supabase

Site estático premium para catálogo de iPhones da **iCell Imports**, com painel administrativo e banco de dados no **Supabase**.

## O que já está pronto

- Catálogo responsivo com busca, filtros e ordenação.
- Produtos carregados do Supabase em tempo real a cada visita.
- CTA de WhatsApp já configurado para `(65) 99991-3864` e inclui o nome do aparelho na mensagem.
- Painel em `/admin.html` para criar, editar e excluir aparelhos.
- Upload de fotos para Supabase Storage.
- Login via Supabase Auth.
- RLS: visitante só lê produtos publicados; somente administradores podem alterar o estoque.
- Animações, loading screen, layout mobile e identidade premium escura com verde inspirada na iCell.

## 1. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor** e execute todo o conteúdo do arquivo `schema.sql`.
3. Em **Authentication > Users**, crie o usuário que será administrador (e-mail e senha).
4. Copie o UUID desse usuário.
5. No SQL Editor, execute:

```sql
insert into public.admins (user_id)
values ('COLE-AQUI-O-UUID-DO-USUARIO');
```

> Recomendo manter o cadastro público de usuários desativado. O painel não possui botão de cadastro.

## 2. Conectar o site ao Supabase

No arquivo `supabase-config.js`, troque:

```js
window.ICELL_SUPABASE = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA-ANON-KEY'
};
```

pelos dados de **Project Settings > API** do Supabase.

A `anon key` pode ficar no front-end. A segurança vem das políticas RLS do `schema.sql`. Nunca coloque `service_role` no site.

## 3. Publicar na Vercel

Você pode arrastar a pasta para um repositório GitHub e importar na Vercel, ou usar Vercel CLI. Como é um site estático, não precisa build command.

Arquivos principais:

- `index.html` — site público.
- `admin.html` — painel administrativo.
- `app.js` — consulta e filtros do catálogo.
- `admin.js` — CRUD e upload de imagens.
- `schema.sql` — banco, RLS e Storage.
- `supabase-config.js` — conexão do Supabase.

## Observação importante sobre os produtos de exemplo

Antes do Supabase ser configurado, o site mostra quatro aparelhos demonstrativos apenas para visualizar o layout. Depois de preencher `supabase-config.js`, o catálogo passa a usar somente os dados do banco.

O `schema.sql` também inclui quatro registros de exemplo na primeira execução. Você pode editar ou excluir todos pelo painel.
