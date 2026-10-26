-- Independent already-expired notice: never mutate a frozen future notice to
-- simulate time travel. SQL trigger checks the real database clock after locking.
INSERT INTO public.housing_collaborations(id,housing_id,owner_profile_id,concierge_profile_id,status,collaboration_type,ends_on,scope)
VALUES('60000000-0000-4000-8000-000000000004',94003,
 '10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','active','regular','2010-01-31',
 '{"continuous_collaboration":true,"termination_request":{"schema_version":1,"state":"notice","requested_by":"10000000-0000-4000-8000-000000000001","requested_at":"2010-01-01T12:00:00.000Z","notice_days":30,"effective_date":"2010-01-31","effective_at":"2010-01-31T00:00:00.000Z"}}');
SELECT harness.expect_error($q$INSERT INTO public.missions(concierge_profile_id,owner_profile_id,title,metadata)
 VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Forbidden after expiry',
 '{"collaboration_id":"60000000-0000-4000-8000-000000000004","property_housing_id":94003}')$q$,'23514');
SELECT harness.assert_true((SELECT status='completed' AND metadata->>'sentinel'='preserve' FROM public.missions
 WHERE id='70000000-0000-4000-8000-000000000001'),'historical intervention retained');
SELECT harness.assert_true((SELECT status='active' FROM public.housing_collaborations WHERE id='60000000-0000-4000-8000-000000000004'),
 'physical status may remain active; application projection is a separate test');
