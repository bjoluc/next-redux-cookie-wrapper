import {ReduxWrapperAppProps} from "next-redux-wrapper";
import App, {AppContext} from "next/app";
import React from "react";
import renderer from "react-test-renderer";
import {Reducer, createStore} from "redux";

// Based on the next-redux-wrapper tests

export interface State {
  reduxStatus: string;
}

export const reducer: Reducer<State> = (state, action) => {
  if (typeof state === "undefined") {
    state = {reduxStatus: "init"};
  }

  switch (action.type) {
    case "ACTION":
      return {reduxStatus: action.payload as string};
    default:
      return state;
  }
};

export const makeStore = (initialState: State) => createStore(reducer, initialState);

class BaseApp extends App<ReduxWrapperAppProps<State>> {
  public render() {
    const {store, ...props} = this.props;
    return (
      <div>
        {JSON.stringify(props)}
        {JSON.stringify(store.getState())}
      </div>
    );
  }
}

export class PlainApp extends BaseApp {
  public static async getInitialProps({ctx: _ctx}: AppContext) {
    return {custom: "custom", pageProps: {}};
  }
}

export class StoreApp extends BaseApp {
  public static async getInitialProps({ctx}: AppContext) {
    ctx.store.dispatch({type: "ACTION", payload: "foo"});
    return {custom: "custom", pageProps: {}};
  }
}

// Like StoreApp, but uses flushReduxStateToCookies
export class FlushStateStorePage extends BaseApp {
  public static async getInitialProps({ctx}: AppContext) {
    ctx.store.dispatch({type: "ACTION", payload: "foo"});
    await ctx.flushReduxStateToCookies();
    return {custom: "custom", pageProps: {}};
  }
}

export async function verifyComponent(
  WrappedApp: any,
  appCtx: AppContext,
  initialStateReduxStatus: string
) {
  const props = await WrappedApp.getInitialProps(appCtx); // Simulating Next.js

  expect(props.initialProps.custom).toBe("custom");
  expect(props.initialState.reduxStatus).toBe(initialStateReduxStatus);

  const component = renderer.create(<WrappedApp {...props} />); // Simulating Next.js

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
}
