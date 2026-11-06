'use client';

import React, { createContext, useContext, forwardRef } from 'react';
import NextLink from 'next/link';
import {
  useRouter as useNextRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

export const OutletContext = createContext(null);

export const Link = forwardRef(function Link(
  { to, href, replace, children, className, style, onClick, ...props },
  ref
) {
  const target = to || href || '#';
  return (
    <NextLink
      ref={ref}
      href={target}
      replace={replace}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </NextLink>
  );
});

export function useNavigate() {
  const router = useNextRouter();
  return React.useCallback(
    (to, options) => {
      if (typeof to === 'number') {
        if (typeof window !== 'undefined') {
          window.history.go(to);
        }
      } else if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const searchParams = useNextSearchParams();
  const search = searchParams ? searchParams.toString() : '';
  const [hash, setHash] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setHash(window.location.hash || '');
    }
  }, [pathname, search]);

  return React.useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : '',
      hash,
      state: null,
      key: 'default',
    }),
    [pathname, search, hash]
  );
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function useSearchParams() {
  const nextSearchParams = useNextSearchParams();
  const router = useNextRouter();
  const pathname = usePathname();

  const searchParams = React.useMemo(() => {
    return new URLSearchParams(nextSearchParams ? nextSearchParams.toString() : '');
  }, [nextSearchParams]);

  const setSearchParams = React.useCallback(
    (nextInit, options) => {
      const sp =
        typeof nextInit === 'function' ? nextInit(new URLSearchParams(searchParams)) : nextInit;
      const str =
        sp instanceof URLSearchParams ? sp.toString() : new URLSearchParams(sp).toString();
      const url = str ? `${pathname}?${str}` : pathname;
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [pathname, router, searchParams]
  );

  return [searchParams, setSearchParams];
}

export function useNavigationType() {
  return 'POP';
}

export function Outlet() {
  const outlet = useContext(OutletContext);
  return outlet || null;
}

export function Navigate({ to, replace }) {
  const router = useNextRouter();
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}

export default {
  Link,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  useNavigationType,
  Outlet,
  Navigate,
};
