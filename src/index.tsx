import {IncomingMessage, ServerResponse} from "http";

import ServerCookies from "cookies";
import {NextComponentType, NextPageContext} from "next";
import withRedux, {
  MakeStore,
  MakeStoreOptions,
  Config as NextReduxWrapperConfig,
  WrappedAppProps,
} from "next-redux-wrapper";
import {AppContext} from "next/app";
import * as React from "react";
import {Action, AnyAction, Store, createStore} from "redux";
import {
  PersistConfig,
  Persistor,
  createPersistoid,
  getStoredState,
  persistReducer,
  persistStore,
} from "redux-persist";
// @ts-expect-error No type definitions and we do not want to create a global definition in this package
import {CookieStorage, NodeCookiesWrapper} from "redux-persist-cookie-storage";
import {Except} from "type-fest";

export type CustomPersistConfig<S> = Except<PersistConfig<S>, "storage" | "key"> &
  Partial<Pick<PersistConfig<S>, "key">>;

export type Config = NextReduxWrapperConfig & {
  persistConfig?: CustomPersistConfig<any>;
  cookieConfig?: any;
};

export type FlushReduxStateToCookies = () => Promise<void>;

const defaultPersistConfig = {
  key: "root",
  blacklist: [] as string[],
};

const defaultConfig: Config = {
  persistConfig: defaultPersistConfig,
  cookieConfig: {},
};

export const withReduxCookiePersist = (makeStore: MakeStore, config?: Config) => {
  config = {
    ...defaultConfig,
    ...config,
  };
  const {persistConfig, cookieConfig, ...reduxWrapperConfig} = config;

  const sharedPersistConfig = {
    ...defaultPersistConfig,
    ...persistConfig,
  };

  const sharedCookieConfig = {
    setCookieOptions: {},
    ...cookieConfig,
  };

  const debug = reduxWrapperConfig.debug ?? false;

  const extractStateFromCookies = async (req: IncomingMessage, res: ServerResponse) => {
    // @ts-ignore https://github.com/ScottHamper/Cookies/pull/83
    const cookies = new NodeCookiesWrapper(new ServerCookies(req, res));

    const persistConfig = {
      ...sharedPersistConfig,
      storage: new CookieStorage(cookies, sharedCookieConfig),
    };

    let state: any | undefined;
    try {
      state = await getStoredState(persistConfig);
    } catch (error) {
      /* istanbul ignore if */
      if (debug) {
        console.log(
          "getStoredState() failed (this happens when the index storage item is not set):\n",
          error
        );
      }
    }

    // Removing the state's _persist key for the server-side (non-persisted) redux store
    if (state && typeof state._persist !== "undefined") {
      const {_persist, ...cleanedState} = state;
      state = cleanedState;
    }

    return state;
  };

  // Used internally by flushReduxStateToCookies()
  const createPersistor = async (store: Store): Promise<Persistor> =>
    new Promise((resolve) => {
      const persistor = persistStore(store, {}, () => {
        resolve(persistor);
      });
    });

  async function flushReduxStateToCookies(this: NextPageContext) {
    /* istanbul ignore if */
    if (!(this.req && this.res)) {
      if (debug) {
        console.log(
          "flushReduxStateToCookies only works on the server " +
            "in your app's getInitialProps() method. Ignoring the call."
        );
      }

      return;
    }

    /* istanbul ignore if */
    if (debug) {
      console.log("Flushing the store's current state to cookies via flushReduxStateToCookies...");
    }

    // @ts-ignore https://github.com/ScottHamper/Cookies/pull/83
    const cookies = new NodeCookiesWrapper(new ServerCookies(this.req, this.res));
    const persistConfig = {
      ...sharedPersistConfig,
      blacklist: [...sharedPersistConfig.blacklist, "_persist"],
      storage: new CookieStorage(cookies, {
        ...sharedCookieConfig,
        setCookieOptions: {
          ...sharedCookieConfig.setCookieOptions,
          httpOnly: false, // Allow modifications on the client side
        },
      }),
      stateReconciler(_inboundState: any, originalState: any) {
        // Ignore state from cookies, only use the store's current state
        return originalState;
      },
    };

    // Using a dummy reducer here as we do not dispatch actions to this store
    const reducer = persistReducer(persistConfig, (state, _action) => state);
    const store = createStore(reducer, this.store.getState());
    const persistor = await createPersistor(store);

    // Set cookies
    await persistor.flush();

    /* istanbul ignore if */
    if (debug) {
      console.log("State flushed to cookies:", store.getState());
    }
  }

  const wrappedMakeStore = (initialState: any, options: MakeStoreOptions) => {
    if (options.req && options.res) {
      initialState = (options.req as any).__initialReduxCookieState;
    }

    const store = makeStore(initialState, options);

    if (!options.isServer) {
      // Let's persist the store!
      const persistConfig = {
        ...sharedPersistConfig,
        storage: new CookieStorage(require("cookies-js"), sharedCookieConfig),
      };

      // Note: We do not create a persistor here because we need no rehydration.
      // See https://github.com/rt2zz/redux-persist/issues/457#issuecomment-362490893 for the idea
      const persistoid = createPersistoid(persistConfig);
      store.subscribe(() => {
        persistoid.update(store.getState());
      });
    }

    return store;
  };

  return (App: NextComponentType | any) => {
    // Wrap the provided App with next-redux-wrapper
    const WrappedApp = withRedux(wrappedMakeStore, reduxWrapperConfig)(App);

    return class CookiePersistedWrappedApp extends React.Component<WrappedAppProps> {
      public static displayName = `withReduxCookiePersist(${WrappedApp.displayName})`;

      public static getInitialProps = async (appCtx: AppContext) => {
        if (appCtx.ctx.req && appCtx.ctx.res) {
          /* istanbul ignore if */
          if (debug) {
            console.log("0. Extracting state from cookies (if any)");
          }

          const state = await extractStateFromCookies(appCtx.ctx.req, appCtx.ctx.res);
          /* istanbul ignore if */
          if (debug) {
            console.log("0. Got state", state);
          }

          // Illegally attaching the extracted state to the request object so we can access it later
          // on in our makeStore wrapper
          (appCtx.ctx.req as any).__initialReduxCookieState = state;
        }

        appCtx.ctx.flushReduxStateToCookies = flushReduxStateToCookies;

        return WrappedApp.getInitialProps(appCtx);
      };

      public render() {
        return <WrappedApp {...this.props} />;
      }
    };
  };
};

// Augment Next.js NextPageContext
declare module "next/dist/next-server/lib/utils" {
  export interface NextPageContext<S = any, A extends Action = AnyAction> {
    /**
     * Provided by next-redux-cookie-wrapper: If the code is executed on the server and `ctx.req`
     * and `ctx.res` are set, this method will add a cookies header with the redux store's current
     * state to `ctx.res`.
     *
     * Note: This will only take effect if you redirect the client afterwards. Otherwise, do not
     * call this function – the client will use the up-to-date serialized state contained in the
     * HTML response anyway and overwrite the cookies with it.
     */
    flushReduxStateToCookies: FlushReduxStateToCookies;
  }
}
