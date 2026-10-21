# AURUM Team Office

Remote, sign-in-protected view of the AURUM agent team (GitHub Pages + Supabase).
The page holds no data: the owner signs in with an emailed link, and Supabase row-level security lets only
that account read the snapshot that the AURUM PC pushes every 20 seconds (`setup/office_sync.py` in the private repo).
