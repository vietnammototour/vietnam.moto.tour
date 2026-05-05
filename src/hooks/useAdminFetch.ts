import {useState, useEffect, useCallback, useReducer} from 'react';

type UseAdminFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type Action<T> =
  | {type: 'FETCH_START'}
  | {type: 'FETCH_SUCCESS'; payload: T}
  | {type: 'FETCH_ERROR'; payload: string}
  | {type: 'IDLE'};

function reducer<T>(_state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return {data: null, loading: true, error: null};
    case 'FETCH_SUCCESS':
      return {data: action.payload, loading: false, error: null};
    case 'FETCH_ERROR':
      return {data: null, loading: false, error: action.payload};
    case 'IDLE':
      return {data: null, loading: false, error: null};
  }
}

export function useAdminFetch<T>(url: string | null): UseAdminFetchResult<T> {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    loading: !!url,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!url) {
      return;
    }

    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          dispatch({type: 'FETCH_SUCCESS', payload: json});
        }
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({type: 'FETCH_ERROR', payload: err.message});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, fetchKey]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}
