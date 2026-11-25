-- =========================================================
-- 04. 시작 데이터 (상품 · 쿠폰 · 예약 슬롯)
-- 내 상품/쿠폰으로 바꿔서 실행하세요. 다시 실행해도 중복되지 않아요.
-- =========================================================

insert into public.products (id, name, price, emoji, descr) values
  ('g1', '1인 기업 시작 키트 (전자책)', 12000, '📘', '사업자 등록부터 첫 매출까지'),
  ('g2', 'AI 프롬프트 100선',           9900, '🤖', '바로 복사해서 쓰는 업무 프롬프트'),
  ('g3', '노션 업무 템플릿',            15000, '🗂️', '할 일·고객·콘텐츠 관리'),
  ('g4', '1:1 온라인 컨설팅 (60분)',    50000, '💬', '화상으로 진행하는 맞춤 상담'),
  ('g5', '로고 디자인 패키지',          39000, '🎨', '글자 로고 3종 + 색상 가이드'),
  ('g6', '홈페이지 점검 리포트',        29000, '🔍', '속도·SEO·모바일 점검')
on conflict (id) do update set name = excluded.name, price = excluded.price, emoji = excluded.emoji, descr = excluded.descr;

insert into public.coupons (code, type, amount, min_order, expires_at, label) values
  ('WELCOME10', 'rate',  10,   10000, '2027-12-31 23:59:59+09', '첫 구매 10% 할인'),
  ('SAVE3000',  'fixed', 3000, 30000, '2027-12-31 23:59:59+09', '3만원 이상 3,000원 할인')
on conflict (code) do nothing;

-- 예약 슬롯: 오늘부터 60일, 일요일 제외, 하루 8타임, 타임당 1명
insert into public.slots (date, time, capacity)
select d::date, t::time, 1
from generate_series(current_date, current_date + 60, interval '1 day') d
cross join unnest(array['10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00']) t
where extract(dow from d) <> 0
on conflict (date, time) do nothing;
-- 팁: 한 달에 한 번 이 마지막 insert 문만 다시 실행하면 슬롯이 계속 이어져요.
