import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AggregateField,
  collection,
  count,
  documentId,
  getAggregateFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  sum,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaginatedQueryOptions<T> {
  collectionName: string;
  /**
   * A stable string describing the current scope. Change it when filters or identity change.
   * It intentionally avoids React dependency churn from Firestore QueryConstraint objects.
   */
  queryKey: string;
  constraints?: QueryConstraint[];
  pageSize?: number;
  enabled?: boolean;
  realtime?: boolean;
  mapDocument?: (id: string, data: DocumentData) => T;
}

export interface PaginatedQueryResult<T> {
  items: T[];
  initialLoading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error || 'Firestore read failed.'));

const EMPTY_QUERY_CONSTRAINTS: QueryConstraint[] = [];

const defaultMapDocument = <T,>(id: string, data: DocumentData): T => ({ id, ...data } as T);

/**
 * Keeps only the first page hot with onSnapshot. Older pages are fetched on demand
 * via cursor reads, preventing one changed record from re-reading an entire history.
 */
export function usePaginatedQuery<T extends { id: string }>({
  collectionName,
  queryKey,
  constraints = EMPTY_QUERY_CONSTRAINTS,
  pageSize = 20,
  enabled = true,
  realtime = true,
  mapDocument = defaultMapDocument<T>,
}: PaginatedQueryOptions<T>): PaginatedQueryResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [initialLoading, setInitialLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const mountedRef = useRef(true);

  const buildFirstPage = useCallback(() => {
    return query(
      collection(db, collectionName),
      ...constraints,
      orderBy(documentId()),
      limit(pageSize),
    );
  }, [collectionName, constraints, pageSize]);

  const mergeFirstPage = useCallback((nextItems: T[]) => {
    setItems((current) => {
      const nextIds = new Set(nextItems.map((item) => item.id));
      const previousTail = current.filter((item) => !nextIds.has(item.id));
      return [...nextItems, ...previousTail];
    });
  }, []);

  const fetchFirstPage = useCallback(async () => {
    if (!enabled) return;
    setInitialLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(buildFirstPage());
      if (!mountedRef.current) return;
      const nextItems = snapshot.docs.map((docSnapshot) => mapDocument(docSnapshot.id, docSnapshot.data()));
      cursorRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setItems(nextItems);
      setHasMore(snapshot.size === pageSize);
    } catch (readError) {
      if (mountedRef.current) setError(normalizeError(readError));
    } finally {
      if (mountedRef.current) setInitialLoading(false);
    }
  }, [buildFirstPage, enabled, mapDocument, pageSize]);

  const refresh = useCallback(async () => {
    await fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || loadingMore || !cursorRef.current) return;
    setLoadingMore(true);
    setError(null);
    try {
      const pageQuery = query(
        collection(db, collectionName),
        ...constraints,
        orderBy(documentId()),
        startAfter(cursorRef.current),
        limit(pageSize),
      );
      const snapshot = await getDocs(pageQuery);
      if (!mountedRef.current) return;
      const nextItems = snapshot.docs.map((docSnapshot) => mapDocument(docSnapshot.id, docSnapshot.data()));
      cursorRef.current = snapshot.docs[snapshot.docs.length - 1] || cursorRef.current;
      setItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...nextItems.filter((item) => !knownIds.has(item.id))];
      });
      setHasMore(snapshot.size === pageSize);
    } catch (readError) {
      if (mountedRef.current) setError(normalizeError(readError));
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [collectionName, constraints, enabled, hasMore, loadingMore, mapDocument, pageSize]);

  useEffect(() => {
    mountedRef.current = true;
    cursorRef.current = null;
    setItems([]);
    setHasMore(false);
    setError(null);

    if (!enabled) {
      setInitialLoading(false);
      return () => { mountedRef.current = false; };
    }

    if (!realtime) {
      void fetchFirstPage();
      const onDashboardRefresh = () => { void fetchFirstPage(); };
      window.addEventListener('vernika:dashboard-refresh', onDashboardRefresh);
      return () => {
        mountedRef.current = false;
        window.removeEventListener('vernika:dashboard-refresh', onDashboardRefresh);
      };
    }

    setInitialLoading(true);
    const unsubscribe = onSnapshot(
      buildFirstPage(),
      (snapshot) => {
        if (!mountedRef.current) return;
        const nextItems = snapshot.docs.map((docSnapshot) => mapDocument(docSnapshot.id, docSnapshot.data()));
        cursorRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        mergeFirstPage(nextItems);
        setHasMore(snapshot.size === pageSize);
        setInitialLoading(false);
        setError(null);
      },
      (listenerError: FirestoreError) => {
        if (!mountedRef.current) return;
        setError(normalizeError(listenerError));
        setInitialLoading(false);
      },
    );

    const onDashboardRefresh = () => { void fetchFirstPage(); };
    window.addEventListener('vernika:dashboard-refresh', onDashboardRefresh);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('vernika:dashboard-refresh', onDashboardRefresh);
      unsubscribe();
    };
  }, [buildFirstPage, enabled, fetchFirstPage, mapDocument, mergeFirstPage, pageSize, queryKey, realtime]);

  return { items, initialLoading, loadingMore, error, hasMore, refresh, loadMore };
}

export interface AggregateQuerySpec {
  key: string;
  collectionName: string;
  constraints?: QueryConstraint[];
  /** Numeric Firestore fields to sum. Missing values are safely treated as zero. */
  sumFields?: string[];
}

export interface AggregateValue {
  count: number;
  sums: Record<string, number>;
}

export interface AggregateStatsResult {
  values: Record<string, AggregateValue>;
  loading: boolean;
  error: Error | null;
  refreshedAt: Date | null;
  refresh: () => Promise<void>;
}

const emptyAggregate = (sumFields: string[] = []): AggregateValue => ({
  count: 0,
  sums: Object.fromEntries(sumFields.map((field) => [field, 0])),
});

/**
 * Fetches dashboard count and sum cards from Firestore aggregation indexes instead
 * of downloading every matching document. Aggregate queries are refreshed when a
 * local write completes, when the tab becomes visible, and at a conservative cadence.
 */
export function useAggregateStats(
  specs: AggregateQuerySpec[],
  queryKey: string,
  options: { enabled?: boolean; refreshIntervalMs?: number } = {},
): AggregateStatsResult {
  const { enabled = true, refreshIntervalMs = 60_000 } = options;
  const [values, setValues] = useState<Record<string, AggregateValue>>({});
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const nextValues = await Promise.all(specs.map(async (spec) => {
        const aggregateFields: Record<string, AggregateField<number>> = { count: count() };
        for (const field of spec.sumFields || []) {
          aggregateFields[`sum:${field}`] = sum(field);
        }
        const aggregateSnapshot = await getAggregateFromServer(
          query(collection(db, spec.collectionName), ...(spec.constraints || [])),
          aggregateFields,
        );
        const data = aggregateSnapshot.data() as Record<string, number>;
        return [spec.key, {
          count: Number(data.count || 0),
          sums: Object.fromEntries((spec.sumFields || []).map((field) => [field, Number(data[`sum:${field}`] || 0)])),
        } satisfies AggregateValue] as const;
      }));
      if (!mountedRef.current) return;
      setValues(Object.fromEntries(nextValues));
      setRefreshedAt(new Date());
    } catch (readError) {
      if (mountedRef.current) setError(normalizeError(readError));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, specs]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setValues(Object.fromEntries(specs.map((spec) => [spec.key, emptyAggregate(spec.sumFields)])));
      setLoading(false);
      return () => { mountedRef.current = false; };
    }

    void refresh();
    const onMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ collectionName?: string }>).detail;
      if (!detail?.collectionName || specs.some((spec) => spec.collectionName === detail.collectionName)) {
        void refresh();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onDashboardRefresh = () => { void refresh(); };
    window.addEventListener('vernika:firestore-mutation', onMutation);
    window.addEventListener('vernika:dashboard-refresh', onDashboardRefresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = refreshIntervalMs > 0 ? window.setInterval(() => void refresh(), refreshIntervalMs) : undefined;

    return () => {
      mountedRef.current = false;
      window.removeEventListener('vernika:firestore-mutation', onMutation);
      window.removeEventListener('vernika:dashboard-refresh', onDashboardRefresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (interval) window.clearInterval(interval);
    };
  }, [enabled, queryKey, refresh, refreshIntervalMs, specs]);

  return { values, loading, error, refreshedAt, refresh };
}

export const aggregateOrEmpty = (
  values: Record<string, AggregateValue>,
  key: string,
  sumFields: string[] = [],
): AggregateValue => values[key] || emptyAggregate(sumFields);
