-- Transaction fixtures: no real users, goods or currency persist.
begin;
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000051','authenticated','authenticated','seller-v5@example.invalid','{"display_name":"QA Seller"}'),
('00000000-0000-4000-8000-000000000052','authenticated','authenticated','buyer-v5@example.invalid','{"display_name":"QA Buyer"}');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000051',true);
set local role authenticated;
select public.game_economy('character','{"gender":"female","career":"designer"}');
do $$ declare r jsonb;ev uuid:=gen_random_uuid();begin
 begin perform public.record_activity('meal',gen_random_uuid());raise exception 'Lay person entered sacred task';exception when others then if sqlerrm<>'Hãy quy y trước khi thực hiện hoạt động trong chùa.' then raise;end if;end;
 for i in 1..10 loop perform public.record_activity('fish',gen_random_uuid());end loop;
 r:=public.record_activity('sweep',ev);r:=public.record_activity('sweep',ev);
 if (r->>'xp')::int<>11 or (r->>'wallet')::int<>1 or (r->'inventory'->>'fish')::int<>10 or (r->'inventory'->>'leaf')::int<>1 then raise exception 'Incorrect loot, currency or replay award';end if;
 begin update public.profiles set wallet=999 where id=auth.uid();raise exception 'Direct wallet mutation allowed';exception when insufficient_privilege then null;end;
 begin update public.market_slots set quantity=999 where id=1;raise exception 'Direct stall mutation allowed';exception when insufficient_privilege then null;end;
 perform public.game_economy('list',jsonb_build_object('slot',1,'item','fish','quantity',10,'price',2,'event','00000000-0000-4000-8000-000000000151'));
 begin perform public.game_economy('list',jsonb_build_object('slot',2,'item','leaf','quantity',1,'price',1,'event',gen_random_uuid()));raise exception 'Second stall allowed';exception when others then if sqlerrm<>'Mỗi người chỉ giữ một sạp.' then raise;end if;end;
 begin perform public.game_economy('buy',jsonb_build_object('slot',1,'listing','00000000-0000-4000-8000-000000000151','quantity',1,'event',gen_random_uuid()));raise exception 'Self purchase allowed';exception when others then if sqlerrm<>'Không thể tự mua hàng của mình.' then raise;end if;end;
end;$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000052',true);
select public.game_economy('character','{"gender":"male","career":"chef"}');
do $$ declare r jsonb;args jsonb;begin
 begin perform public.game_economy('buy',jsonb_build_object('slot',1,'listing','00000000-0000-4000-8000-000000000151','quantity',10,'event',gen_random_uuid()));raise exception 'Overspend allowed';exception when others then if sqlerrm<>'Ví chưa đủ Công Đức.' then raise;end if;end;
 for i in 1..200 loop perform public.record_activity('garden',gen_random_uuid());end loop;
 perform public.game_economy('awaken');
 args:=jsonb_build_object('slot',1,'listing','00000000-0000-4000-8000-000000000151','quantity',10,'event',gen_random_uuid());
 r:=public.game_economy('buy',args);r:=public.game_economy('buy',args);
 if (r->'profile'->>'wallet')::int<>0 or (r->'profile'->'inventory'->>'fish')::int<>10 then raise exception 'Buy or idempotent replay failed';end if;
 begin perform public.game_economy('list',jsonb_build_object('slot',2,'item','fish','quantity',1,'price',1,'event',gen_random_uuid()));raise exception 'Ordained seller allowed';exception when others then if sqlerrm<>'Chỉ người chưa quy y được bán hàng.' then raise;end if;end;
 begin perform public.game_economy('buy',jsonb_build_object('slot',1,'listing',gen_random_uuid(),'quantity',1,'event',gen_random_uuid()));raise exception 'Stale listing allowed';exception when others then if sqlerrm<>'Hàng đã đổi hoặc hết. Hãy tải lại chợ.' then raise;end if;end;
end;$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000051',true);
do $$ declare r jsonb;begin
 r:=public.game_economy('status');
 if (r->>'wallet')::int<>21 or (r->>'xp')::int<>21 or (r->>'demon')::int<>1 or (r->>'task_xp')::int<>11 then raise exception 'Seller proceeds, trade XP or demon failed';end if;
 perform public.game_economy('list',jsonb_build_object('slot',1,'item','leaf','quantity',1,'price',3,'event',gen_random_uuid()));
 r:=public.game_economy('awaken');
 if (r->'inventory'->>'leaf')::int<>1 or exists(select 1 from public.market_slots where owner=auth.uid()) then raise exception 'Ordination did not return stock/release slot';end if;
 for i in 1..10 loop r:=public.record_activity('chant',gen_random_uuid());end loop;
 if (r->>'demon')::int<>0 or (r->>'merit')::int<>0 then raise exception 'Practice must remove demon before merit';end if;
 for i in 1..10 loop r:=public.record_activity('chant',gen_random_uuid());end loop;
 if (r->>'merit')::int<>1 then raise exception 'Practice merit threshold incorrect';end if;
 if has_function_privilege('authenticated','public.finish_activity(uuid)','execute') then raise exception 'Legacy reward bypass remains open';end if;
end;$$;
select 'PASS: loot, currency, replay safety, stock escrow, access gates, wallet ownership, two-party sale, demon, ordination, practice and legacy writer revocation' as verification;
rollback;
