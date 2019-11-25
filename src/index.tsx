import ServerCookies from "cookies";
import ClientCookies from "cookies-js";
import { IncomingMessage, ServerResponse } from "http";
import { NextComponentType } from "next";
import {
  Config as NextReduxWrapperConfig,
  default as withRedux,
  MakeStore,
  MakeStoreOptions,
  NextJSContext,
  WrappedAppProps,
} from "next-redux-wrapper";
import { AppContext } from "next/app";
import * as React from "react";
import { createStore, Reducer, Store } from "redux";
import {
  createPersistoid,
  getStoredState,
  PersistConfig,
  Persistor,
  persistReducer,
  persistStore,
} from "redux-persist";
// @ts-ignore No type definitions and we do not want to create a global definition in this package
import { CookieStorage, NodeCookiesWrapper } from "redux-persist-cookie-storage";

export type CustomPersistConfig<S> = Omit<PersistConfig<S>, "storage" | "key"> &
  Partial<Pick<PersistConfig<S>, "key">>;

export type Config = NextReduxWrapperConfig & {
  persistConfig?: CustomPersistConfig<any>;
  cookieConfig?: any;
};

export type FlushReduxStateToCookies = (ctx: NextJSContext, rootReducer: Reducer) => Promise<void>;

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
  const { persistConfig, cookieConfig, ...reduxWrapperConfig } = config;

  const sharedPersistConfig = {
    ...defaultPersistConfig,
    ...persistConfig,
  };

  const sharedCookieConfig = {
    setCookieOptions: {},
    ...cookieConfig,
  };

  const debug = reduxWrapperConfig.debug || false;

  const extractStateFromCookies = async (req: IncomingMessage, res: ServerResponse) => {
    // @ts-ignore https://github.com/ScottHamper/Cookies/pull/83
    const cookies = new NodeCookiesWrapper(new ServerCookies(req, res));

    const persistConfig = {
      ...sharedPersistConfig,
      storage: new CookieStorage(cookies),
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
      const { _persist, ...cleanedState } = state;
      state = cleanedState;
    }

    return state;
  };

  // Used internally by flushReduxStateToCookies()
  const createPersistor = (store: Store): Promise<Persistor> =>
    new Promise(resolve => {
      const persistor = persistStore(store, {}, () => {
        resolve(persistor);
      });
    });

  const flushReduxStateToCookies: FlushReduxStateToCookies = async (ctx, rootReducer) => {
    /* istanbul ignore if */
    if (!(ctx.req && ctx.res)) {
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
    const cookies = new NodeCookiesWrapper(new ServerCookies(ctx.req, ctx.res));
    const persistConfig = {
      ...sharedPersistConfig,
      blacklist: sharedPersistConfig.blacklist!.concat(["_persist"]),
      storage: new CookieStorage(cookies, {
        ...sharedCookieConfig,
        setCookieOptions: {
          ...sharedCookieConfig.setCookieOptions,
          httpOnly: false, // Allow modifications on the client side
        },
      }),
      stateReconciler(inboundState: any, originalState: any) {
        // Ignore state from cookies, only use the store's current state
        return originalState;
      },
    };

    const reducer = persistReducer(persistConfig, rootReducer);
    const store = createStore(reducer, ctx.store.getState());
    const persistor = await createPersistor(store);

    // Set cookies
    await persistor.flush();

    /* istanbul ignore if */
    if (debug) {
      console.log("State flushed to cookies: ", store.getState());
    }
  };

  const wrappedMakeStore = (initialState: any, options: MakeStoreOptions) => {
    if (options.req && options.res) {
      initialState = (options.req as any).__initialReduxCookieState;
    }

    const store = makeStore(initialState, options);

    if (!options.isServer) {
      // Let's persist the store!
      const persistConfig = {
        ...sharedPersistConfig,
        storage: new CookieStorage(ClientCookies),
      };

      // Note: We do not create a persistor here because we need no rehydration.
      // See https://github.com/rt2zz/redux-persist/issues/457#issuecomment-362490893 for the idea
      const persistoid = createPersistoid(persistConfig);
      store.subscribe(() => persistoid.update(store.getState()));
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

        appCtx.flushReduxStateToCookies = flushReduxStateToCookies;

        return await WrappedApp.getInitialProps(appCtx);
      };

      public render() {
        return <WrappedApp {...this.props} />;
      }
    };
  };
};
