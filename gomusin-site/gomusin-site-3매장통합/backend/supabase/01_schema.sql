-- =========================================================
-- 01. 테이블 만들기
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여넣고 [Run]
-- 여러 번 실행해도 괜찮도록 "if not exists"를 붙였어요.
-- =========================================================

-- ---------- 회원 (2-3 마이페이지, 2-4 회원가입) ----------
-- 이메일·비밀번호는 Supabase Auth가 auth.users 에 안전하게 보관해요. (레시피의 users 테이블 역할)
-- 화면에 보여줄 공개 정보(닉네임·사진·소개)는 profiles 에 둬요. (레시피의 profiles 테이블)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,  -- = user_id
  email       text,
  nickname    text not null default '회원',
  avatar_url  text,
  bio         text default '',
  created_at  timestamptz not null default now()
);

-- 회원가입하면 profiles 한 줄이 자동으로 생기게 하는 장치
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'nickname', ''),
                   new.raw_user_meta_data->>'name',
                   split_part(new.email, '@', 1)));
  insert into public.notifications (user_id, type, message, link)
  values (new.id, 'system', '회원가입을 환영해요! 첫 구매 쿠폰 WELCOME10 을 써 보세요.', '#/shop');
  return new;
end $$;

-- ---------- 문의 (2-1) ----------
create table if not exists public.inquiries (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 20),
  phone       text not null check (phone ~ '^01[016789]-?[0-9]{3,4}-?[0-9]{4}$'),
  message     text not null check (char_length(message) between 10 and 1000),
  status      text not null default '접수',
  created_at  timestamptz not null default now()
);

-- ---------- 알림 (2-5) ----------
create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'system',     -- system / like / order / booking / coupon
  message     text not null,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- 트리거는 notifications 테이블이 생긴 뒤에 연결해요
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 게시판 (2-6) ----------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 80),
  body        text not null check (char_length(body) between 5 and 5000),
  images      text[] not null default '{}',        -- 2-7 이미지 업로드 후 공개 URL 목록
  views       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

-- 좋아요 (마이페이지 '좋아요' 탭용)
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 조회수 +1 (누구나 호출 가능, 조회수만 바꿀 수 있어요)
create or replace function public.increment_post_views(p_post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set views = views + 1 where id = p_post_id;
$$;

-- 좋아요 받으면 글쓴이에게 알림
create or replace function public.notify_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_title text; v_nick text;
begin
  select user_id, title into v_owner, v_title from public.posts where id = new.post_id;
  if v_owner is not null and v_owner <> new.user_id then
    select nickname into v_nick from public.profiles where id = new.user_id;
    insert into public.notifications (user_id, type, message, link)
    values (v_owner, 'like', coalesce(v_nick, '누군가') || '님이 내 글을 좋아해요: ' || left(v_title, 20), '#/board/' || new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists on_post_like on public.post_likes;
create trigger on_post_like after insert on public.post_likes for each row execute function public.notify_like();

-- ---------- 상품·장바구니·주문 (2-10) ----------
create table if not exists public.products (
  id          text primary key,                    -- 예: g1
  name        text not null,
  price       integer not null check (price >= 0),
  emoji       text default '📦',
  descr       text default '',
  active      boolean not null default true
);

create table if not exists public.carts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  text not null references public.products(id),
  qty         integer not null check (qty between 1 and 99),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),
  subtotal     integer not null,
  discount     integer not null default 0,
  total        integer not null check (total >= 0),
  coupon_code  text,
  shipping     jsonb not null default '{}',
  method       text,
  status       text not null default '결제대기',   -- 결제대기 / 결제완료 / 결제실패 / 취소
  payment_key  text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create table if not exists public.order_items (
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text not null references public.products(id),
  name        text not null,
  qty         integer not null check (qty > 0),
  price       integer not null,                     -- 주문 당시 가격 (나중에 가격이 바뀌어도 그대로)
  primary key (order_id, product_id)
);

-- ---------- 쿠폰 (2-9) ----------
create table if not exists public.coupons (
  code        text primary key,
  type        text not null check (type in ('fixed', 'rate')),   -- 정액 / 정률
  amount      integer not null check (amount > 0),
  min_order   integer not null default 0,
  expires_at  timestamptz not null,
  label       text
);
create table if not exists public.coupon_uses (               -- 사용 이력: 같은 쿠폰 두 번 사용 방지
  code        text not null references public.coupons(code),
  user_id     uuid not null references auth.users(id),
  order_id    uuid references public.orders(id),
  used_at     timestamptz not null default now(),
  primary key (code, user_id)                                   -- ← 1인 1회를 DB가 막아줘요
);

-- 쿠폰 검사: 할인 금액을 돌려주거나, 한국어 에러를 내요
create or replace function public.validate_coupon(p_code text, p_subtotal integer)
returns table (code text, label text, discount integer)
language plpgsql security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from public.coupons where coupons.code = upper(trim(p_code));
  if not found then raise exception '존재하지 않는 쿠폰 코드예요.'; end if;
  if c.expires_at < now() then raise exception '기간이 만료된 쿠폰이에요.'; end if;
  if p_subtotal < c.min_order then raise exception '%원 이상 주문할 때 쓸 수 있어요.', to_char(c.min_order, 'FM999,999,999'); end if;
  if exists (select 1 from public.coupon_uses u where u.code = c.code and u.user_id = auth.uid()) then
    raise exception '이미 사용한 쿠폰이에요.';
  end if;
  return query select c.code, c.label,
    case when c.type = 'rate' then floor(p_subtotal * c.amount / 100.0)::int else least(c.amount, p_subtotal) end;
end $$;

-- 주문 만들기: 가격은 화면이 아니라 DB의 products 가격으로 계산해요 (금액 조작 방지)
-- p_items 예: '[{"product_id":"g1","qty":2}]'
create or replace function public.create_order(p_items jsonb, p_coupon text, p_shipping jsonb, p_method text)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_sub int; v_disc int := 0; o public.orders;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  select sum(p.price * (i->>'qty')::int) into v_sub
    from jsonb_array_elements(p_items) i join public.products p on p.id = i->>'product_id' and p.active;
  if v_sub is null or v_sub <= 0 then raise exception '결제할 상품을 선택해 주세요.'; end if;
  if coalesce(p_coupon, '') <> '' then
    select discount into v_disc from public.validate_coupon(p_coupon, v_sub);
  end if;
  insert into public.orders (user_id, subtotal, discount, total, coupon_code, shipping, method)
  values (auth.uid(), v_sub, v_disc, v_sub - v_disc, nullif(upper(trim(p_coupon)), ''), p_shipping, p_method)
  returning * into o;
  insert into public.order_items (order_id, product_id, name, qty, price)
  select o.id, p.id, p.name, (i->>'qty')::int, p.price
    from jsonb_array_elements(p_items) i join public.products p on p.id = i->>'product_id';
  return o;
end $$;

-- ---------- 예약 (2-11) ----------
create table if not exists public.slots (
  id          bigint generated always as identity primary key,
  date        date not null,
  time        time not null,
  capacity    integer not null default 1 check (capacity > 0),
  unique (date, time)
);
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  slot_id     bigint not null references public.slots(id),
  name        text not null,
  phone       text not null,
  memo        text,
  status      text not null default '확정',      -- 확정 / 취소
  created_at  timestamptz not null default now()
);
-- 같은 사람(전화번호)이 같은 슬롯을 두 번 예약하지 못하게
create unique index if not exists bookings_once_per_phone on public.bookings (slot_id, phone) where status = '확정';

-- 정원 초과 예약을 DB가 막는 장치 (동시에 눌러도 한 명만 성공해요)
create or replace function public.check_slot_capacity()
returns trigger language plpgsql as $$
declare v_cap int; v_used int;
begin
  select capacity into v_cap from public.slots where id = new.slot_id for update;  -- 슬롯 잠금
  select count(*) into v_used from public.bookings where slot_id = new.slot_id and status = '확정';
  if v_used >= v_cap then raise exception '방금 다른 분이 예약했어요. 다른 시간을 골라 주세요.'; end if;
  return new;
end $$;
drop trigger if exists bookings_capacity on public.bookings;
create trigger bookings_capacity before insert on public.bookings for each row execute function public.check_slot_capacity();

-- 날짜별 남은 자리 (다른 사람 예약 내용은 안 보여주고 숫자만)
create or replace function public.get_slots(p_date date)
returns table ("time" text, "left" int)
language sql security definer set search_path = public as $$
  select to_char(s.time, 'HH24:MI'),
         greatest(0, s.capacity - (select count(*) from public.bookings b where b.slot_id = s.id and b.status = '확정'))::int
  from public.slots s where s.date = p_date order by s.time;
$$;

-- 예약하기 (로그인 안 해도 예약 가능)
create or replace function public.create_booking(p_date date, p_time text, p_name text, p_phone text, p_memo text)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare v_slot bigint; b public.bookings;
begin
  select id into v_slot from public.slots where date = p_date and time = p_time::time;
  if v_slot is null then raise exception '예약할 수 없는 시간이에요.'; end if;
  if p_date < current_date then raise exception '지난 날짜는 예약할 수 없어요.'; end if;
  insert into public.bookings (user_id, slot_id, name, phone, memo)
  values (auth.uid(), v_slot, p_name, p_phone, p_memo) returning * into b;
  if auth.uid() is not null then
    insert into public.notifications (user_id, type, message, link)
    values (auth.uid(), 'booking', '예약이 확정됐어요: ' || p_date || ' ' || p_time, '#/me?tab=bookings');
  end if;
  return b;
exception when unique_violation then
  raise exception '이미 같은 시간에 예약하셨어요.';
end $$;

-- 실시간 알림(2-5): notifications 테이블 변경을 화면으로 바로 보내요
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
