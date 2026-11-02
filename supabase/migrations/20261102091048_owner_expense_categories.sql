begin;
-- Restore the reference catalogue after the earlier development data reset.
-- Preserve any existing/custom category codes or names; no business rows change.
insert into bookmyturn_private.expense_categories(code,name)values
 ('rent','Rent'),('electricity','Electricity'),('water','Water'),
 ('internet-phone','Internet and telephone'),('wages','Wages'),
 ('barber-commissions','Barber commissions'),('supplies','Hair products and supplies'),
 ('repairs','Repairs and maintenance'),('transport','Transport'),('other','Other')
 on conflict do nothing;
-- Keep the API shape valid even if an administrator later empties this catalogue.
do $$declare definition text;needle text:=
 $n$'categories',(select jsonb_agg(to_jsonb(c)order by c.name)from bookmyturn_private.expense_categories c),$n$;
begin
 definition:=pg_get_functiondef('bookmyturn_private.owner_finance(text,jsonb)'::regprocedure);
 if position(needle in definition)=0 then raise exception 'Expected owner category projection not found';end if;
 execute replace(definition,needle,
 $n$'categories',coalesce((select jsonb_agg(to_jsonb(c)order by c.name)from bookmyturn_private.expense_categories c),'[]'::jsonb),$n$);
end;$$;
commit;
