begin;
do $$declare definition text;old_guard text:='if p_action=''create_salon'' and coalesce(char_length(btrim(p_data->>''address'')),0) not between 1 and 500 then';begin
 definition:=pg_get_functiondef('bookmyturn_private.manager_command(text,jsonb)'::regprocedure);
 if position(old_guard in definition)=0 then raise exception 'Expected create address guard';end if;
 execute replace(definition,old_guard,'if p_action=''create_salon'' and not exists(select 1 from public.salons where id=(p_data->>''id'')::uuid) and coalesce(char_length(btrim(p_data->>''address'')),0) not between 1 and 500 then');
end;$$;
notify pgrst,'reload schema';
commit;
