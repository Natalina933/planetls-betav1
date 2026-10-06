-- Rollback cible du lot city cleanup 2026-10-05.
-- Ancienne valeur constatee pendant le dry run : city = null pour ces 33 profils.
update public.profiles
set city = null
where id in (
  '69025f03-1906-4bb2-ba6f-98b0ae1e1659',
  '34b77224-eef9-4fb2-bc70-68e981b2aaf7',
  '7e6db1c2-d6bb-4e46-82c3-971d22295062',
  '7af423b9-0dc2-4b04-89a3-58c082fa5434',
  'fa1ff305-6c12-4cf1-9de3-07a49f29875a',
  '22576e18-3e1f-40b9-b178-a89089d949d7',
  '9646cb0d-f466-4a5f-96de-06571889d140',
  '9eec48a6-59b4-49fd-920c-483ec5b0351c',
  '03e64296-1c55-4d76-aa8d-e462d0357b0c',
  'fd4fbe34-6d67-43ff-89d5-7d3f2acf8aa0',
  '0f9ee2b7-dc1a-47aa-8a62-1de4de510a96',
  '3949062f-7ba0-4029-8a58-cb4eb82b95aa',
  '44183b2d-3cfe-41b0-85ae-860443fd52fa',
  '4c79f4cb-08a1-4412-8ba7-81bd92dd36cc',
  'f0a23fb0-8123-4885-bd45-441908dd114c',
  '287a108e-c614-4ced-8314-f328d05382b4',
  '1d9d3819-d038-4ace-a493-50613e07d22b',
  '8d876d9e-9ef0-4e98-be13-d6b3a8c46b8d',
  '04bbb3ec-d0f4-42cb-9b69-539242545dfd',
  'd2dd9bbb-2c72-4399-8655-4dd7d82c7c8a',
  'd6ef3331-b4c6-404f-9c04-8fa74dc307a0',
  '552bc3ce-9596-4ed7-a584-1649dac9fc67',
  '6259232c-6356-4184-b812-4da3bfb38e7b',
  'd14063cf-a6ed-4c85-896b-15ce5b6ff533',
  '48e1c374-fe4a-494c-a679-b152e9331121',
  '76be7d6f-b150-461d-8bbd-ff6f0cb1a6d3',
  '9b359e4e-e976-4ada-97ef-b561ea2e4405',
  '8776e323-0e9d-44f7-9b62-a1df2779a06c',
  '2d8365a2-3f32-446b-8a0d-a05b3d529fec',
  'c8b7c6f4-ec5a-4e71-97e0-6c20ab84be84',
  '24e1ebf8-181b-4ea2-b7b8-6d12f9a2ea6b',
  '39306b30-d4b4-4648-986b-9747b7bef076',
  '4881006f-6765-40cd-b133-9ec04e912794'
);
