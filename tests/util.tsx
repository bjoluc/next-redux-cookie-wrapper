import { AppContext } from "next/app";
import React, { Component } from "react";
import renderer from "react-test-renderer";
import { createStore } from "redux";

// Based on the next-redux-wrapper tests

export const reducer = (state = { reduxStatus: "init" }, action: any) => {
  switch (action.type) {
    case "ACTION":
      return { reduxStatus: action.payload };
    default:
      return state;
  }
};

export const makeStore = (initialState: any) => createStore(reducer, initialState);

class BaseApp extends Component<any> {
  public render() {
    const { store, ...props } = this.props;
    return (
      <div>
        {JSON.stringify(props)}
        {JSON.stringify(store.getState())}
      </div>
    );
  }
}

export class PlainApp extends BaseApp {
  public static async getInitialProps({ ctx }: AppContext) {
    return { custom: "custom" };
  }
}

export class StoreApp extends BaseApp {
  public static async getInitialProps({ ctx }: AppContext) {
    ctx.store.dispatch({ type: "ACTION", payload: "foo" });
    return { custom: "custom" };
  }
}

// Like StoreApp, but uses flushReduxStateToCookies
export class FlushStateStorePage extends BaseApp {
  public static async getInitialProps({ ctx }: AppContext) {
    ctx.store.dispatch({ type: "ACTION", payload: "foo" });
    await ctx.flushReduxStateToCookies();
    return { custom: "custom" };
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
