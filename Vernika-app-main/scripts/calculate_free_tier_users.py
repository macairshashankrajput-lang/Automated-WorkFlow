import math

READ_QUOTA = 50_000
WRITE_QUOTA = 20_000
SAFETY = 0.80
LIVE_DOCUMENTS = 42
LISTENERS = 35
AUTH_READS = 4

# Firestore listeners incur the initial result set plus a minimum query read for empty queries.
initial_reads = LIVE_DOCUMENTS + LISTENERS + AUTH_READS
print(f'initial_reads_per_session={initial_reads}')
for updates in (0, 5, 20, 50):
    reads_per_user_day = initial_reads + updates
    safe_reads = READ_QUOTA * SAFETY
    users = math.floor(safe_reads / reads_per_user_day)
    print(f'updates={updates} reads_per_user_day={reads_per_user_day} safe_daily_users={users}')

# A conservative operating target leaves headroom for retries, reconnects, and admin activity.
conservative = math.floor((READ_QUOTA * SAFETY) / (initial_reads + 20))
print(f'conservative_daily_active_users={conservative}')
print(f'conservative_concurrent_target={math.floor(conservative * 0.25)}')
