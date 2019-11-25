/**
 * @jest-environment jsdom
 **/

import { makeStore, PlainApp, StoreApp, verifyComponent } from "./util";
import { withReduxCookiePersist } from "..";
import Cookies from "cookies-js";
import delay from "delay";

const expectPersistCookies = (expectedReduxStatus: string) => {
  expect(Cookies.get("reduxPersistIndex")).toBe('["persist:root"]');
  expect(Cookies.get("persist:root")).toBe('{"reduxStatus":"\\"' + expectedReduxStatus + '\\""}');
};

const appCtx: any = { ctx: {} };

describe("withReduxCookiePersist", () => {
  it("should integrate the store using next-redux-wrapper", async () => {
    let WrappedApp = withReduxCookiePersist(makeStore)(PlainApp);
    await verifyComponent(WrappedApp, appCtx, "init");

    WrappedApp = withReduxCookiePersist(makeStore)(StoreApp);
    await verifyComponent(WrappedApp, appCtx, "foo");
  });

  it("should persist actions dispatched during getInitialProps to cookies", async () => {
    expect(Cookies.get("reduxPersistIndex")).toBeUndefined();
    expect(Cookies.get("persist:root")).toBeUndefined();

    const WrappedApp = withReduxCookiePersist(makeStore)(StoreApp);
    await verifyComponent(WrappedApp, appCtx, "foo");

    await delay(100); // Found no better way to wait for the rehydration to happen :/

    expectPersistCookies("foo");
  });
});
