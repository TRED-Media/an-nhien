-- Chùa Online: profiles, server-managed XP, private wishes and authenticated room.
begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 24),
 xp bigint not null default 0 check(xp>=0), merit bigint not null default 0 check(merit>=0),
 role text not null default 'player' check(role in ('player','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.activity_config (
 id text primary key, title text not null, xp integer not null check(xp between 1 and 100),
 enabled boolean not null default true, min_seconds integer not null default 4 check(min_seconds between 1 and 120)
);
insert into public.activity_config(id,title,xp,min_seconds) values
 ('incense','Thắp hương',15,4),('fish','Thả cá',20,6),('chant','Tụng kinh',35,12),
 ('beads','Xoay chuỗi',25,8),('meditate','Ngồi thiền',30,24),('sweep','Quét sân',20,6)
on conflict(id) do nothing;
create table if not exists public.activity_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 activity_id text not null references public.activity_config(id),started_at timestamptz not null default now(),
 finished_at timestamptz, earned_xp integer
);
create index if not exists attempts_user_time on public.activity_attempts(user_id,started_at desc);
create table if not exists public.daily_rewards (
 user_id uuid not null references public.profiles(id) on delete cascade,day date not null,
 claimed_at timestamptz not null default now(),primary key(user_id,day)
);
create table if not exists public.wishes (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 180),created_at timestamptz not null default now()
);
create or replace function public.handle_new_player() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Sen Nhỏ'),24));return new;end;$$;
drop trigger if exists chua_new_user on auth.users;
create trigger chua_new_user after insert on auth.users for each row execute function public.handle_new_player();
insert into public.profiles(id,display_name) select id,left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'),''),'Sen Nhỏ'),24) from auth.users on conflict do nothing;
alter table public.profiles enable row level security;
alter table public.activity_config enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.daily_rewards enable row level security;
alter table public.wishes enable row level security;
revoke all on public.profiles,public.activity_config,public.activity_attempts,public.daily_rewards,public.wishes from anon,authenticated;
grant select on public.profiles,public.activity_config,public.activity_attempts,public.daily_rewards,public.wishes to authenticated;
grant insert,delete on public.wishes to authenticated;
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists read_activities on public.activity_config;
create policy read_activities on public.activity_config for select to authenticated using(true);
drop policy if exists own_attempts on public.activity_attempts;
create policy own_attempts on public.activity_attempts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists own_rewards on public.daily_rewards;
create policy own_rewards on public.daily_rewards for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists own_wishes_read on public.wishes;
create policy own_wishes_read on public.wishes for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists own_wishes_write on public.wishes;
create policy own_wishes_write on public.wishes for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists own_wishes_delete on public.wishes;
create policy own_wishes_delete on public.wishes for delete to authenticated using(user_id=(select auth.uid()));
create or replace function public.begin_activity(p_activity text) returns uuid language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); a public.activity_config; result uuid;
begin
 if u is null then raise exception 'Bạn cần đăng nhập.';end if;
 perform 1 from public.profiles where id=u for update;
 select * into a from public.activity_config where id=p_activity;
 if not found or not a.enabled then raise exception 'Hoạt động đang tạm nghỉ.';end if;
 if exists(select 1 from public.activity_attempts where user_id=u and finished_at>now()-interval '15 seconds' and activity_id=p_activity) then raise exception 'Hãy nghỉ 15 giây trước khi làm lại.';end if;
 if exists(select 1 from public.activity_attempts where user_id=u and started_at>now()-interval '2 seconds') then raise exception 'Bạn thao tác quá nhanh.';end if;
 -- One active attempt per player. Cancel prior unfinished sessions on a new start.
 delete from public.activity_attempts where user_id=u and finished_at is null;
 insert into public.activity_attempts(user_id,activity_id) values(u,p_activity) returning id into result;return result;
end;$$;
create or replace function public.finish_activity(p_attempt uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); a public.activity_attempts; cfg public.activity_config; p public.profiles;
begin
 if u is null then raise exception 'Bạn cần đăng nhập.';end if;
 perform 1 from public.profiles where id=u for update;
 select * into a from public.activity_attempts where id=p_attempt and user_id=u for update;
 if not found then raise exception 'Phiên hoạt động không tồn tại.';end if;
 if a.finished_at is not null then raise exception 'Phần thưởng đã được nhận.';end if;
 select * into cfg from public.activity_config where id=a.activity_id;
 if not cfg.enabled then raise exception 'Hoạt động đang tạm nghỉ.';end if;
 if now()-a.started_at<make_interval(secs=>cfg.min_seconds) then raise exception 'Hãy hoàn thành hoạt động chậm rãi hơn.';end if;
 if a.started_at<now()-interval '15 minutes' then raise exception 'Phiên hoạt động đã hết hạn.';end if;
 update public.activity_attempts set finished_at=now(),earned_xp=cfg.xp where id=p_attempt;
 update public.profiles set xp=xp+cfg.xp,merit=merit+cfg.xp where id=u returning * into p;
 return jsonb_build_object('xp',p.xp,'merit',p.merit,'earned',cfg.xp);
end;$$;
create or replace function public.daily_status() returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('completed',coalesce((select jsonb_agg(distinct activity_id) from public.activity_attempts where user_id=auth.uid() and finished_at is not null and (finished_at at time zone 'Asia/Ho_Chi_Minh')::date=(now() at time zone 'Asia/Ho_Chi_Minh')::date),'[]'::jsonb),'claimed',exists(select 1 from public.daily_rewards where user_id=auth.uid() and day=(now() at time zone 'Asia/Ho_Chi_Minh')::date));
$$;
create or replace function public.claim_daily_reward() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid();d date:=(now() at time zone 'Asia/Ho_Chi_Minh')::date;n int;p public.profiles;
begin
 if u is null then raise exception 'Bạn cần đăng nhập.';end if;
 perform 1 from public.profiles where id=u for update;
 select count(distinct activity_id) into n from public.activity_attempts where user_id=u and activity_id in ('incense','chant','sweep') and (finished_at at time zone 'Asia/Ho_Chi_Minh')::date=d;
 if n<3 then raise exception 'Bạn chưa hoàn thành 3 việc lành hôm nay.';end if;
 insert into public.daily_rewards(user_id,day) values(u,d) on conflict do nothing;
 if not found then raise exception 'Đã nhận thưởng hôm nay.';end if;
 update public.profiles set xp=xp+50,merit=merit+50 where id=u returning * into p;
 return jsonb_build_object('xp',p.xp,'merit',p.merit,'earned',50);
end;$$;
create or replace function public.leaderboard() returns table(display_name text,merit bigint,xp bigint) language sql security definer set search_path=public as $$
 select p.display_name,p.merit,p.xp from public.profiles p order by p.merit desc,p.created_at limit 20;
$$;
create or replace function public.admin_activity(p_id text,p_xp int,p_enabled boolean) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Chỉ chủ chùa được cấu hình.';end if;
 if p_xp<1 or p_xp>100 then raise exception 'XP phải từ 1 đến 100.';end if;
 update public.activity_config set xp=p_xp,enabled=p_enabled where id=p_id;
end;$$;
revoke all on function public.handle_new_player() from public,anon,authenticated;
revoke all on function public.begin_activity(text),public.finish_activity(uuid),public.daily_status(),public.claim_daily_reward(),public.leaderboard(),public.admin_activity(text,int,boolean) from public,anon;
grant execute on function public.begin_activity(text),public.finish_activity(uuid),public.daily_status(),public.claim_daily_reward(),public.leaderboard(),public.admin_activity(text,int,boolean) to authenticated;
-- Private Realtime channel: only authenticated game profiles can join this room.
drop policy if exists chua_room_read on realtime.messages;
create policy chua_room_read on realtime.messages for select to authenticated using((select realtime.topic())='temple:an-nhien' and exists(select 1 from public.profiles where id=(select auth.uid())));
drop policy if exists chua_room_write on realtime.messages;
create policy chua_room_write on realtime.messages for insert to authenticated with check((select realtime.topic())='temple:an-nhien' and exists(select 1 from public.profiles where id=(select auth.uid())));
commit;
