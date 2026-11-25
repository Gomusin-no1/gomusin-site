-- =========================================================
-- 02. 행 단위 보안(RLS) 정책
-- "누가 어떤 줄을 읽고/쓰고/고치고/지울 수 있는지" 정하는 규칙이에요.
-- RLS를 켜면 규칙에 없는 동작은 전부 막혀요. (안전한 기본값)
-- auth.uid() = 지금 로그인한 사람의 id
-- =========================================================

alter table public.profiles      enable row level security;
alter table public.inquiries     enable row level security;
alter table public.notifications enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.products      enable row level security;
alter table public.carts         enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.coupons       enable row level security;
alter table public.coupon_uses   enable row level security;
alter table public.slots         enable row level security;
alter table public.bookings      enable row level security;

-- ---------- profiles: 누구나 닉네임을 볼 수 있고, 본인만 수정 ----------
drop policy if exists "프로필 공개 읽기" on public.profiles;
create policy "프로필 공개 읽기" on public.profiles for select using (true);
drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- (insert는 회원가입 트리거가 대신 해요. delete는 계정 삭제 시 자동)

-- ---------- inquiries: 화면에서는 아무도 직접 못 읽고/못 써요 ----------
-- 문의는 Vercel 서버 함수(api/inquiry.js)가 service_role 키로 저장해요.
-- 관리자는 Supabase 대시보드 Table Editor 에서 확인해요. → 정책 없음 = 전부 차단

-- ---------- notifications: 본인 알림만 보기·읽음 처리 ----------
drop policy if exists "본인 알림 읽기" on public.notifications;
create policy "본인 알림 읽기" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "본인 알림 읽음 처리" on public.notifications;
create policy "본인 알림 읽음 처리" on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- 알림 만들기는 DB 트리거·함수와 서버만 해요

-- ---------- posts: 누구나 읽기, 로그인하면 쓰기, 작성자만 수정·삭제 ----------
drop policy if exists "글 공개 읽기" on public.posts;
create policy "글 공개 읽기" on public.posts for select using (true);
drop policy if exists "로그인 사용자 글쓰기" on public.posts;
create policy "로그인 사용자 글쓰기" on public.posts for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "작성자만 수정" on public.posts;
create policy "작성자만 수정" on public.posts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "작성자만 삭제" on public.posts;
create policy "작성자만 삭제" on public.posts for delete using (auth.uid() = user_id);

-- 조회수는 함수로만 올려요 (글 수정 권한 없이도 +1 가능)
revoke all on function public.increment_post_views(uuid) from public;
grant execute on function public.increment_post_views(uuid) to anon, authenticated;

-- ---------- post_likes: 누구나 개수 보기, 본인 좋아요만 누르고 취소 ----------
drop policy if exists "좋아요 공개 읽기" on public.post_likes;
create policy "좋아요 공개 읽기" on public.post_likes for select using (true);
drop policy if exists "본인 좋아요 추가" on public.post_likes;
create policy "본인 좋아요 추가" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "본인 좋아요 취소" on public.post_likes;
create policy "본인 좋아요 취소" on public.post_likes for delete using (auth.uid() = user_id);

-- ---------- products: 판매 중인 상품만 누구나 읽기 ----------
drop policy if exists "상품 공개 읽기" on public.products;
create policy "상품 공개 읽기" on public.products for select using (active);

-- ---------- carts: 본인 장바구니만 ----------
drop policy if exists "본인 장바구니 전부" on public.carts;
create policy "본인 장바구니 전부" on public.carts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- orders / order_items: 본인 주문만 읽기 ----------
-- 주문 생성은 create_order 함수, 결제 승인은 서버(api/payments/confirm.js)만 해요.
-- → 화면에서 금액이나 상태(결제완료)를 직접 바꿀 수 없어요.
drop policy if exists "본인 주문 읽기" on public.orders;
create policy "본인 주문 읽기" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "본인 주문 상품 읽기" on public.order_items;
create policy "본인 주문 상품 읽기" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ---------- coupons / coupon_uses ----------
-- 쿠폰 목록은 숨겨요 (코드를 몰래 알아내지 못하게). 검사는 validate_coupon 함수로만.
-- 사용 이력은 본인 것만 볼 수 있어요.
drop policy if exists "본인 쿠폰 사용 이력" on public.coupon_uses;
create policy "본인 쿠폰 사용 이력" on public.coupon_uses for select using (auth.uid() = user_id);

-- ---------- slots / bookings ----------
drop policy if exists "슬롯 공개 읽기" on public.slots;
create policy "슬롯 공개 읽기" on public.slots for select using (true);
drop policy if exists "본인 예약 읽기" on public.bookings;
create policy "본인 예약 읽기" on public.bookings for select using (auth.uid() = user_id);
-- 예약 생성은 create_booking 함수로만 (정원 검사 포함)

-- ---------- 함수 실행 권한 ----------
revoke all on function public.validate_coupon(text, integer) from public;
grant execute on function public.validate_coupon(text, integer) to authenticated;
revoke all on function public.create_order(jsonb, text, jsonb, text) from public;
grant execute on function public.create_order(jsonb, text, jsonb, text) to authenticated;
revoke all on function public.get_slots(date) from public;
grant execute on function public.get_slots(date) to anon, authenticated;
revoke all on function public.create_booking(date, text, text, text, text) from public;
grant execute on function public.create_booking(date, text, text, text, text) to anon, authenticated;
