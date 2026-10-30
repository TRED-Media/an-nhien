-- One completed gesture = one XP and one merit. Repeat without daily cap or cooldown.
begin;
insert into public.activity_config(id,title,xp,min_seconds) values
 ('meal','Ăn cơm chay',1,1),('prostrate','Quỳ lạy Phật',1,1),('sermon','Thiền nghe pháp',1,1)
on conflict(id) do nothing;
update public.activity_config set xp=1,min_seconds=1 where id in
 ('incense','fish','chant','beads','meditate','sweep','meal','prostrate','sermon');
create or replace function public.record_activity(p_activity text,p_event uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid();p public.profiles;prior public.activity_attempts;cfg public.activity_config;
begin
 if u is null then raise exception 'Bạn cần đăng nhập.';end if;
 if p_event is null then raise exception 'Thiếu mã thao tác.';end if;
 select * into p from public.profiles where id=u for update;
 if not found then raise exception 'Chưa có hồ sơ người chơi.';end if;
 if p_activity not in ('incense','fish','chant','beads','meditate','sweep','meal','prostrate','sermon') then raise exception 'Hoạt động không hợp lệ.';end if;
 select * into cfg from public.activity_config where id=p_activity;
 if not found or not cfg.enabled then raise exception 'Hoạt động đang tạm nghỉ.';end if;
 select * into prior from public.activity_attempts where id=p_event;
 if found then
  if prior.user_id<>u or prior.activity_id<>p_activity or prior.finished_at is null then raise exception 'Mã thao tác không hợp lệ.';end if;
  return jsonb_build_object('xp',p.xp,'merit',p.merit,'earned',1,'duplicate',true);
 end if;
 insert into public.activity_attempts(id,user_id,activity_id,started_at,finished_at,earned_xp)
 values(p_event,u,p_activity,now(),now(),1);
 update public.profiles set xp=xp+1,merit=merit+1 where id=u returning * into p;
 return jsonb_build_object('xp',p.xp,'merit',p.merit,'earned',1,'duplicate',false);
end;$$;
revoke all on function public.record_activity(text,uuid) from public,anon;
grant execute on function public.record_activity(text,uuid) to authenticated;
commit;
