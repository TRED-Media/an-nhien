begin;
-- Existing merit/ranks remain intact. Existing XP receives a one-time currency opening balance.
alter table public.profiles add column wallet bigint not null default 0 check(wallet>=0),
 add column task_xp bigint not null default 0 check(task_xp>=0),
 add column trade_xp bigint not null default 0 check(trade_xp>=0),
 add column practice_xp bigint not null default 0 check(practice_xp>=0),
 add column demon bigint not null default 0 check(demon>=0),
 add column character jsonb,
 add column awakened boolean not null default false,
 add column inventory jsonb not null default '{}'::jsonb;
update public.profiles p set wallet=p.xp/10,task_xp=p.xp,
 character=case when u.raw_user_meta_data->'annhien_character'->>'gender' in ('male','female') and u.raw_user_meta_data->'annhien_character'->>'career' in ('photo','driver','boss','collector','tough','streamer','seller','office','broker','chef','designer') then u.raw_user_meta_data->'annhien_character' else null end,
 awakened=coalesce(u.raw_user_meta_data->'annhien_character'->>'awakened'='true',false)
 from auth.users u where p.id=u.id;
-- From now on, character/ordination authorization comes only from server-owned profiles.
create table public.market_slots (
 id integer primary key check(id between 1 and 10),
 owner uuid unique references public.profiles(id) on delete set null,
 item text, quantity integer not null default 0 check(quantity between 0 and 999),
 price integer not null default 1 check(price between 1 and 10000),
 listing uuid, expires_at timestamptz
);
insert into public.market_slots(id) select generate_series(1,10);
create table public.market_events (
 id uuid primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null, arguments jsonb not null, result jsonb not null, created_at timestamptz not null default now()
);
create index market_events_user on public.market_events(user_id,created_at desc);
alter table public.market_slots enable row level security;
alter table public.market_events enable row level security;
revoke all on public.market_slots,public.market_events from anon,authenticated;
grant select on public.market_slots,public.market_events to authenticated;
create policy market_read on public.market_slots for select to authenticated using(true);
create policy own_market_events on public.market_events for select to authenticated using(user_id=(select auth.uid()));
insert into public.activity_config(id,title,xp,min_seconds) values
 ('garden','Chăm vườn hoa',1,1),('pig','Nuôi heo tròn',1,1),('chicken','Cho gà ăn',1,1),('tarot','Tarot đầu ngõ',1,1),('live','Livestream chốt đơn',1,1),
 ('tea','Pha trà sen',1,1),('bake','Làm bánh chay',1,1),('paint','Vẽ tranh dạo',1,1),('sew','May túi vải',1,1),('recycle','Tái chế giấy',1,1);
update public.activity_config set title='Bắt cá' where id='fish';
create schema if not exists game_private;
revoke all on schema game_private from public,anon;
grant usage on schema game_private to authenticated;
-- One entry point validates all inputs. Only this private, authenticated function can mutate economy rows.
create function game_private.action(op text,a jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare u uuid:=auth.uid();p public.profiles;s public.market_slots;seller public.profiles;e public.market_events;
 item text;act text;qty integer;price integer;slot integer;ev uuid;earned bigint:=0;bill bigint;tick bigint;paid bigint;
 result jsonb;market jsonb;old_attempt public.activity_attempts;d date;cnt integer;
 goods jsonb:='{"fish":"fish","sweep":"leaf","beads":"bead","garden":"flower","pig":"compost","chicken":"egg","tarot":"fortune","live":"voucher","tea":"tea","bake":"cake","paint":"art","sew":"pouch","recycle":"paper"}';
begin
 if u is null then raise exception 'Bạn cần đăng nhập.';end if;
 if op not in ('status','activity','character','awaken','list','cancel','buy','daily') then raise exception 'Yêu cầu không hợp lệ.';end if;
 -- Serialize the ten scarce stalls; always acquire market lock before any profile lock.
 if op in ('status','awaken','list','cancel','buy') then
  perform pg_advisory_xact_lock(470501);
  perform 1 from public.profiles where id=u or id in (select owner from public.market_slots where owner is not null) order by id for update;
  for s in select * from public.market_slots where expires_at<=now() and owner is not null for update loop
   if s.item is not null and s.quantity>0 then
    update public.profiles set inventory=jsonb_set(inventory,array[s.item],to_jsonb(coalesce((inventory->>s.item)::bigint,0)+s.quantity)) where id=s.owner;
   end if;
   update public.market_slots set owner=null,item=null,quantity=0,listing=null,expires_at=null where id=s.id;
  end loop;
 end if;
 select * into p from public.profiles where id=u for update;
 if not found then raise exception 'Chưa có hồ sơ người chơi.';end if;
 if op in ('list','cancel','buy') then
  ev:=(a->>'event')::uuid;
  if ev is null then raise exception 'Thiếu mã giao dịch.';end if;
  select * into e from public.market_events where id=ev;
  if found then
   if e.user_id<>u or e.kind<>op or e.arguments<>a then raise exception 'Mã giao dịch không hợp lệ.';end if;
   return e.result||jsonb_build_object('profile',to_jsonb(p),'duplicate',true);
  end if;
 end if;
 if op='character' then
  if p.awakened then raise exception 'Nhân vật đã quy y không thể đổi nghề cũ.';end if;
  if a->>'gender' is null or a->>'gender' not in ('male','female') or a->>'career' is null or a->>'career' not in ('photo','driver','boss','collector','tough','streamer','seller','office','broker','chef','designer') then raise exception 'Nhân vật không hợp lệ.';end if;
  update public.profiles set character=jsonb_build_object('gender',a->>'gender','career',a->>'career','awakened',false) where id=u;
 elsif op='awaken' then
  if p.character is null then raise exception 'Hãy chọn nhân vật trước.';end if;
  for s in select * from public.market_slots where owner=u for update loop
   if s.item is not null and s.quantity>0 then p.inventory:=jsonb_set(p.inventory,array[s.item],to_jsonb(coalesce((p.inventory->>s.item)::bigint,0)+s.quantity));end if;
  end loop;
  update public.market_slots set owner=null,item=null,quantity=0,listing=null,expires_at=null where owner=u;
  update public.profiles set awakened=true,character=jsonb_set(character,'{awakened}','true'),inventory=p.inventory where id=u;
 elsif op='activity' then
  act:=a->>'activity';ev:=(a->>'event')::uuid;
  if ev is null then raise exception 'Thiếu mã thao tác.';end if;
  if act is null or not (goods?act or act in ('incense','chant','meditate','meal','prostrate','sermon')) then raise exception 'Hoạt động không hợp lệ.';end if;
  select * into old_attempt from public.activity_attempts where id=ev;
  if found then
   if old_attempt.user_id<>u or old_attempt.activity_id<>act or old_attempt.finished_at is null then raise exception 'Mã thao tác không hợp lệ.';end if;
   return to_jsonb(p)||jsonb_build_object('profile',to_jsonb(p),'earned',1,'duplicate',true);
  end if;
  if p.character is null then raise exception 'Hãy chọn nhân vật trước.';end if;
  if not p.awakened and not goods?act then raise exception 'Hãy quy y trước khi thực hiện hoạt động trong chùa.';end if;
  if not exists(select 1 from public.activity_config where id=act and enabled) then raise exception 'Hoạt động đang tạm nghỉ.';end if;
  insert into public.activity_attempts(id,user_id,activity_id,started_at,finished_at,earned_xp) values(ev,u,act,now(),now(),1);
  item:=goods->>act;
  if item is not null then p.inventory:=jsonb_set(p.inventory,array[item],to_jsonb(coalesce((p.inventory->>item)::bigint,0)+1));end if;
  tick:=case when p.awakened then (p.practice_xp+1)/10-p.practice_xp/10 else 0 end;paid:=least(p.demon,tick);
  update public.profiles set xp=xp+1,wallet=wallet+(task_xp+1)/10-task_xp/10,task_xp=task_xp+1,
   practice_xp=practice_xp+case when awakened then 1 else 0 end,demon=demon-paid,merit=merit+tick-paid,inventory=p.inventory where id=u;
  earned:=1;
 elsif op='list' then
  if p.awakened or p.character is null then raise exception 'Chỉ người chưa quy y được bán hàng.';end if;
  slot:=(a->>'slot')::int;item:=a->>'item';qty:=(a->>'quantity')::int;price:=(a->>'price')::int;
  if item is null or not exists(select 1 from jsonb_each_text(goods) g where g.value=item) or qty is null or qty<1 or qty>999 or price is null or price<1 or price>10000 then raise exception 'Số lượng hoặc giá không hợp lệ.';end if;
  select * into s from public.market_slots where id=slot for update;
  if not found then raise exception 'Sạp không tồn tại.';end if;
  if s.owner is not null and s.owner<>u then raise exception 'Sạp đã có chủ.';end if;
  if exists(select 1 from public.market_slots where owner=u and id<>slot) then raise exception 'Mỗi người chỉ giữ một sạp.';end if;
  if s.item is not null then p.inventory:=jsonb_set(p.inventory,array[s.item],to_jsonb(coalesce((p.inventory->>s.item)::bigint,0)+s.quantity));end if;
  if coalesce((p.inventory->>item)::bigint,0)<qty then raise exception 'Túi không đủ vật phẩm.';end if;
  update public.profiles set inventory=jsonb_set(p.inventory,array[item],to_jsonb((p.inventory->>item)::bigint-qty)) where id=u;
  update public.market_slots set owner=u,item=item,quantity=qty,price=price,listing=ev,expires_at=now()+interval '48 hours' where id=slot;
 elsif op='cancel' then
  slot:=(a->>'slot')::int;select * into s from public.market_slots where id=slot and owner=u for update;
  if not found then raise exception 'Bạn không sở hữu sạp này.';end if;
  if s.item is not null then p.inventory:=jsonb_set(p.inventory,array[s.item],to_jsonb(coalesce((p.inventory->>s.item)::bigint,0)+s.quantity));end if;
  update public.profiles set inventory=p.inventory where id=u;
  update public.market_slots set owner=null,item=null,quantity=0,listing=null,expires_at=null where id=slot;
 elsif op='buy' then
  slot:=(a->>'slot')::int;qty:=(a->>'quantity')::int;
  select * into s from public.market_slots where id=slot for update;
  if not found or s.owner is null or s.item is null or s.listing is distinct from (a->>'listing')::uuid then raise exception 'Hàng đã đổi hoặc hết. Hãy tải lại chợ.';end if;
  if s.owner=u then raise exception 'Không thể tự mua hàng của mình.';end if;
  if qty is null or qty<1 or qty>s.quantity then raise exception 'Số lượng mua không hợp lệ hoặc hàng đã hết.';end if;
  select * into seller from public.profiles where id=s.owner for update;
  if seller.awakened then raise exception 'Người bán đã quy y.';end if;
  bill:=s.price::bigint*qty;
  if p.wallet<bill then raise exception 'Ví chưa đủ Công Đức.';end if;
  update public.profiles set wallet=wallet-bill,inventory=jsonb_set(inventory,array[s.item],to_jsonb(coalesce((inventory->>s.item)::bigint,0)+qty)) where id=u;
  update public.profiles set wallet=wallet+bill,xp=xp+qty,demon=demon+(trade_xp+qty)/10-trade_xp/10,trade_xp=trade_xp+qty where id=s.owner;
  update public.market_slots set quantity=quantity-qty where id=slot;
  earned:=0;
 elsif op='daily' then
  if not p.awakened then raise exception 'Quà tu tập dành cho người đã quy y.';end if;
  d:=(now() at time zone 'Asia/Ho_Chi_Minh')::date;
  select count(distinct activity_id) into cnt from public.activity_attempts where user_id=u and activity_id in ('incense','chant','sweep') and (finished_at at time zone 'Asia/Ho_Chi_Minh')::date=d;
  if cnt<3 then raise exception 'Bạn chưa hoàn thành 3 việc lành hôm nay.';end if;
  insert into public.daily_rewards(user_id,day) values(u,d) on conflict do nothing;
  if not found then raise exception 'Đã nhận thưởng hôm nay.';end if;
  -- Daily bonus is XP only, not task XP: never mints currency or spiritual ranks.
  update public.profiles set xp=xp+50 where id=u;earned:=50;
 end if;
 select * into p from public.profiles where id=u;
 select coalesce(jsonb_agg(to_jsonb(m)||jsonb_build_object('seller_name',pr.display_name) order by m.id),'[]'::jsonb) into market from public.market_slots m left join public.profiles pr on pr.id=m.owner;
 result:=to_jsonb(p)||jsonb_build_object('profile',to_jsonb(p),'slots',market,'earned',earned,'item',item);
 if op in ('list','cancel','buy') then insert into public.market_events(id,user_id,kind,arguments,result) values(ev,u,op,a,result);end if;
 return result;
end;$$;
revoke all on function game_private.action(text,jsonb) from public,anon;
grant execute on function game_private.action(text,jsonb) to authenticated;
create function public.game_economy(p_op text,p_args jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$ select game_private.action(p_op,p_args); $$;
create or replace function public.record_activity(p_activity text,p_event uuid) returns jsonb language sql security invoker set search_path='' as $$ select game_private.action('activity',jsonb_build_object('activity',p_activity,'event',p_event)); $$;
create or replace function public.claim_daily_reward() returns jsonb language sql security invoker set search_path='' as $$ select game_private.action('daily'); $$;
revoke all on function public.game_economy(text,jsonb) from public,anon;
grant execute on function public.game_economy(text,jsonb) to authenticated;
-- Retire v2 reward writers so no endpoint can bypass the new currency and ordination rules.
revoke execute on function public.begin_activity(text),public.finish_activity(uuid) from public,anon,authenticated;
commit;
